import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'recipe_prefs';

export interface RecipePrefs {
  favourite?: boolean;
}

type PrefsMap = Record<string, RecipePrefs>;

async function readAll(): Promise<PrefsMap> {
  const data = await AsyncStorage.getItem(KEY);
  return data ? JSON.parse(data) : {};
}

async function writeAll(prefs: PrefsMap) {
  await AsyncStorage.setItem(KEY, JSON.stringify(prefs));
}

/**
 * Favourite state, purely device-local — the server has no concept of it,
 * so this deliberately never rides along with api.updateRecipe's PUT body.
 * Keyed by recipe id.
 */
export const recipePrefs = {
  getAll: readAll,

  set: async (id: string, patch: RecipePrefs): Promise<PrefsMap> => {
    const prefs = await readAll();
    prefs[id] = { ...prefs[id], ...patch };
    await writeAll(prefs);
    return prefs;
  },

  /**
   * Carries prefs over when a temp- id recipe is swapped for its
   * server-issued id (see RecipesContext.save), so favouriting a recipe
   * before it's finished syncing isn't lost.
   */
  rekey: async (oldId: string, newId: string): Promise<PrefsMap> => {
    const prefs = await readAll();
    if (prefs[oldId]) {
      prefs[newId] = prefs[oldId];
      delete prefs[oldId];
      await writeAll(prefs);
    }
    return prefs;
  },
};
