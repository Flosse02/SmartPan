import AsyncStorage from '@react-native-async-storage/async-storage'

const KEY = 'recipes'

export const localStore = {
  getAll: async () => {
    const data = await AsyncStorage.getItem(KEY)
    return data ? JSON.parse(data) : []
  },

  saveAll: async (incoming: any[]) => {
    const current = await localStore.getAll();

    const map = new Map();

    // keep local first
    for (const r of current) {
      map.set(r.id, r);
    }

    // merge server data on top
    for (const r of incoming) {
      map.set(r.id, r);
    }

    const merged = Array.from(map.values());

    await AsyncStorage.setItem(KEY, JSON.stringify(merged));
    return merged;
  },

  add: async (recipe: any) => {
    const all = await localStore.getAll();

    const exists = all.some(r => r.id === recipe.id);
    if (!exists) {
      all.push(recipe);
    }

    await localStore.saveAll(all);
    return recipe;
  },

  update: async (recipe: any) => {
    const all = await localStore.getAll();

    const idx = all.findIndex(r => r.id === recipe.id);

    if (idx !== -1) {
      all[idx] = { ...all[idx], ...recipe };
    } else {
      all.push(recipe);
    }

    await localStore.saveAll(all);
    return recipe;
  },

  remove: async (id: string) => {
    const all = await localStore.getAll()
    const filtered = all.filter(r => r.id !== id)
    await localStore.saveAll(filtered)
  },
}