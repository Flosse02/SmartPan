import AsyncStorage from '@react-native-async-storage/async-storage'

const KEY = 'recipes'

export const localStore = {
  getAll: async () => {
    const data = await AsyncStorage.getItem(KEY)
    return data ? JSON.parse(data) : []
  },

  saveAll: async (recipes: any[]) => {
    await AsyncStorage.setItem(KEY, JSON.stringify(recipes))
  },

  add: async (recipe: any) => {
    const all = await localStore.getAll()
    all.push(recipe)
    await localStore.saveAll(all)
    return recipe
  },

  update: async (recipe: any) => {
    const all = await localStore.getAll()
    const idx = all.findIndex(r => r.id === recipe.id)
    if (idx !== -1) all[idx] = recipe
    await localStore.saveAll(all)
    return recipe
  },

  remove: async (id: string) => {
    const all = await localStore.getAll()
    const filtered = all.filter(r => r.id !== id)
    await localStore.saveAll(filtered)
  },
}