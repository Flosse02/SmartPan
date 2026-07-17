import AsyncStorage from '@react-native-async-storage/async-storage';
import { normaliseUnit, capitalise, cleanIngredientName } from './util/cleanIngridents';
import { pushShoppingListWidgetUpdate } from './widgets/shoppingListWidgetSync';

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

async function readAll(): Promise<ShoppingListItem[]> {
  const data = await AsyncStorage.getItem(KEY);
  return data ? JSON.parse(data) : [];
}

interface WriteOptions {
  // The widget's own click handler re-renders itself with the fresh state
  // right after calling this — pushing another update on top of that would
  // rebuild the widget's RemoteViews tree twice for one tap, which is what
  // caused the visible flash. Only the widget task handler passes this.
  skipWidgetSync?: boolean;
}

async function writeAll(items: ShoppingListItem[], options?: WriteOptions) {
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
  if (!options?.skipWidgetSync) pushShoppingListWidgetUpdate(items);
  return items;
}

// Names/units come from free-typed entry or three different importer paths
// (JSON-LD, Spoonacular, manual), so "cup" vs "Cups" vs " cup " are all the
// same ingredient in practice — normalize both before comparing, or every
// spelling variant becomes its own duplicate line.
const normalizeName = (name: string) => name.trim().toLowerCase().replace(/\s+/g, ' ');
const matchKey = (name: string, unit: string | null) => `${normalizeName(name)}|${unit ? normaliseUnit(unit).toLowerCase() : ''}`;

/** Local-only running shopping list, built by appending recipe ingredients one recipe at a time. */
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
};
