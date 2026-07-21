import AsyncStorage from '@react-native-async-storage/async-storage';
import { normaliseUnit, capitalise, cleanIngredientName } from './util/cleanIngridents';
import { pushShoppingListWidgetUpdate } from './widgets/shoppingListWidgetSync';
// Value import — safe because api.ts only imports ShoppingListItem back as a
// type (erased at compile time), so this doesn't form a real circular require.
import { api } from './api';

const KEY = 'shopping_list';

export interface ShoppingListItem {
  id: string;
  name: string;
  amount: number | null;
  unit: string | null;
  checked: boolean;
  recipeTitles: string[];
}

export interface ShoppingListIngredient {
  amount: number | null;
  unit: string | null;
  name: string;
}

interface ShoppingListState {
  items: ShoppingListItem[];
  updatedAt: string;
}

// Epoch — used for storage that predates server sync (or was never synced),
// so a real server updatedAt always wins the first reconcile.
const NEVER_SYNCED = new Date(0).toISOString();

async function readState(): Promise<ShoppingListState> {
  const data = await AsyncStorage.getItem(KEY);
  if (!data) return { items: [], updatedAt: NEVER_SYNCED };
  const parsed = JSON.parse(data);
  // Pre-sync storage shape was a bare array — treat it as never-synced.
  if (Array.isArray(parsed)) return { items: parsed, updatedAt: NEVER_SYNCED };
  return parsed;
}

async function readAll(): Promise<ShoppingListItem[]> {
  return (await readState()).items;
}

interface WriteOptions {
  // The widget's own click handler re-renders itself with the fresh state
  // right after calling this — pushing another update on top of that would
  // rebuild the widget's RemoteViews tree twice for one tap, which is what
  // caused the visible flash. Only the widget task handler passes this.
  skipWidgetSync?: boolean;
  // Set when writing data that already came from the server (a reconcile
  // GET or a shopping_note_updated broadcast) — PUTing it straight back
  // would just be a wasted round trip.
  skipServerSync?: boolean;
  // Preserves the server's own updatedAt when writing server-origin data,
  // instead of stamping "now" as if this were a fresh local edit.
  updatedAt?: string;
}

async function writeAll(items: ShoppingListItem[], options?: WriteOptions): Promise<ShoppingListItem[]> {
  const updatedAt = options?.updatedAt ?? new Date().toISOString();
  await AsyncStorage.setItem(KEY, JSON.stringify({ items, updatedAt }));
  if (!options?.skipWidgetSync) pushShoppingListWidgetUpdate(items);
  if (!options?.skipServerSync) {
    api.putShoppingNote({ items, updatedAt }).catch(() => {
      console.log('Shopping list sync failed (offline?)');
    });
  }
  return items;
}

// Names/units come from free-typed entry or three different importer paths
// (JSON-LD, Spoonacular, manual), so "cup" vs "Cups" vs " cup " are all the
// same ingredient in practice — normalize both before comparing, or every
// spelling variant becomes its own duplicate line.
const normalizeName = (name: string) => name.trim().toLowerCase().replace(/\s+/g, ' ');
const matchKey = (name: string, unit: string | null) => `${normalizeName(name)}|${unit ? normaliseUnit(unit).toLowerCase() : ''}`;

/**
 * Running shopping list, built by appending recipe ingredients one recipe at
 * a time. Backed by a local AsyncStorage cache (read/written synchronously
 * with every mutation, so the UI and the widget always have something to
 * show offline) that's kept in sync with the server's shopping-note via
 * `sync`/`applyRemote` — see ShoppingListContext for the WS/reconnect wiring.
 */
export const shoppingList = {
  getAll: readAll,

  /**
   * Appends a recipe's ingredients to the list. An unchecked line with the
   * same name+unit gets its amount summed instead of duplicated (checked
   * lines are left alone — re-adding after ticking something off starts a
   * fresh line rather than silently un-ticking it). Amounts that can't be
   * summed (e.g. one recipe gives "to taste", null amount) just keep the
   * line without a quantity rather than dropping it.
   */
  addIngredients: async (ingredients: ShoppingListIngredient[], recipeTitle: string): Promise<ShoppingListItem[]> => {
    const list = await readAll();

    for (const ing of ingredients) {
      const name = cleanIngredientName(ing.name);
      if (!name) continue;
      const unit = ing.unit?.trim() ? normaliseUnit(ing.unit.trim()) : null;
      const key = matchKey(name, unit);

      const existing = list.find(i => !i.checked && matchKey(i.name, i.unit) === key);
      if (existing) {
        existing.amount = existing.amount != null && ing.amount != null ? existing.amount + ing.amount : null;
        if (!existing.recipeTitles.includes(recipeTitle)) existing.recipeTitles.push(recipeTitle);
      } else {
        list.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: capitalise(name),
          amount: ing.amount,
          unit,
          checked: false,
          recipeTitles: [recipeTitle],
        });
      }
    }

    return writeAll(list);
  },

  toggleChecked: async (id: string, options?: WriteOptions): Promise<ShoppingListItem[]> => {
    const list = await readAll();
    const item = list.find(i => i.id === id);
    if (item) item.checked = !item.checked;
    return writeAll(list, options);
  },

  removeItem: async (id: string): Promise<ShoppingListItem[]> => {
    const list = await readAll();
    return writeAll(list.filter(i => i.id !== id));
  },

  clearChecked: async (): Promise<ShoppingListItem[]> => {
    const list = await readAll();
    return writeAll(list.filter(i => !i.checked));
  },

  clearAll: async (): Promise<ShoppingListItem[]> => writeAll([]),

  /** Adopts a { items, updatedAt } snapshot from the server without re-PUTing it back. */
  applyRemote: async (items: ShoppingListItem[], updatedAt: string): Promise<ShoppingListItem[]> =>
    writeAll(items, { skipServerSync: true, updatedAt }),

  /**
   * Reconciles local state against the server: called on mount and on every
   * WS reconnect. Whichever side's updatedAt is newer wins — same
   * last-writer-wins rule as recipe edit conflicts elsewhere in this app. A
   * local change made while offline has a newer updatedAt than the stale
   * server copy, so this pushes it instead of discarding it; a change made
   * elsewhere (dashboard) while the phone was offline has a newer server
   * updatedAt, so this adopts it instead.
   */
  sync: async (): Promise<ShoppingListItem[]> => {
    const local = await readState();
    try {
      const remote = await api.getShoppingNote();
      const remoteTime = new Date(remote.updatedAt).getTime();
      const localTime = new Date(local.updatedAt).getTime();

      if (remoteTime > localTime) {
        return writeAll(remote.items, { skipServerSync: true, updatedAt: remote.updatedAt });
      }
      if (localTime > remoteTime) {
        api.putShoppingNote(local).catch(() => {});
      }
      return local.items;
    } catch {
      console.log('Shopping list server unreachable, using local cache');
      return local.items;
    }
  },
};
