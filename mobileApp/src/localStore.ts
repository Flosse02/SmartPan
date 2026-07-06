import AsyncStorage from '@react-native-async-storage/async-storage'

const KEY = 'recipes'

export const localStore = {
  getAll: async () => {
    const data = await AsyncStorage.getItem(KEY)
    return data ? JSON.parse(data) : []
  },

  /**
   * By default, unions `incoming` with whatever is already in storage —
   * this is what add/update/remove rely on, since they each already pass
   * a fully-reconstructed list built from getAll().
   *
   * Pass `overwrite = true` when the caller has already computed the
   * complete, authoritative list itself (e.g. api.ts's getRecipes merge).
   * This is required for that case specifically — unioning would silently
   * resurrect entries that were deliberately dropped (e.g. recipes
   * deleted server-side, or duplicates removed by dedupeRecipes), since
   * they'd still be sitting in the "current" cache being merged against.
   */
  saveAll: async (incoming: any[], overwrite = false) => {
    if (overwrite) {
      await AsyncStorage.setItem(KEY, JSON.stringify(incoming));
      return incoming;
    }

    const current = await localStore.getAll();
    const map = new Map();

    for (const r of current) {
      map.set(r.id, r);
    }
    for (const r of incoming) {
      map.set(r.id, r);
    }

    const merged = Array.from(map.values());
    await AsyncStorage.setItem(KEY, JSON.stringify(merged));
    return merged;
  },

  /** Wipes the local cache completely. Used to recover from a corrupted
   * or duplicate-riddled local cache — the next getRecipes() call will
   * repopulate purely from the server. */
  clearAll: async () => {
    await AsyncStorage.removeItem(KEY);
  },

  add: async (recipe: any) => {
    const all = await localStore.getAll();

    const exists = all.some((r: any) => r.id === recipe.id);
    if (!exists) {
      all.push(recipe);
    }

    await localStore.saveAll(all, true);
    return recipe;
  },

  update: async (recipe: any) => {
    const all = await localStore.getAll();

    const idx = all.findIndex((r: any) => r.id === recipe.id);

    if (idx !== -1) {
      all[idx] = { ...all[idx], ...recipe };
    } else {
      all.push(recipe);
    }

    await localStore.saveAll(all, true);
    return recipe;
  },

  remove: async (id: string) => {
    const all = await localStore.getAll()
    const filtered = all.filter((r: any) => r.id !== id)
    await localStore.saveAll(filtered, true)
  },
}