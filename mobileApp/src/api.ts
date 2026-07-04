import { DASHBOARD_URL } from './config';
import { Recipe } from './types';
import { localStore } from './localStore';
import ENV from './constants/ENV';

async function req(path: string, options?: RequestInit) {
  const res = await fetch(`${DASHBOARD_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  getRecipes: async (q?: string) => {
    const all = await localStore.getAll()

    if (!q) return all

    return all.filter(r =>
      r.title.toLowerCase().includes(q.toLowerCase())
    )
  },

  saveRecipe: async (data: any) => {
    const recipe = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }

    // 1. Always save locally first
    await localStore.add(recipe)
    console.log('Saved locally:', recipe)

    // 2. Try sync to Pi (don’t block UI)
    try {
      await fetch(`${ENV.BASE_URL}/api/recipes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipe),
      })
    } catch (e) {
      console.log('Pi sync failed (offline?)')
    }

    return recipe
  },

  updateRecipe: async (data: any) => {
    await localStore.update(data)

    try {
      await fetch(`${ENV.BASE_URL}/api/recipes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    } catch (e) {
      console.log('Pi offline')
    }

    return data
  },

  deleteRecipe: async (id: string) => {
    await localStore.remove(id)

    try {
      await fetch(`${ENV.BASE_URL}/api/recipes?id=${id}`, {
        method: 'DELETE',
      })
    } catch (e) {
      console.log('Pi offline')
    }
  },

  importUrl: async (url: string) => {
    const res = await fetch(
      `https://api.spoonacular.com/recipes/extract?url=${encodeURIComponent(url)}&apiKey=${ENV.API_KEY}`
    )

    if (!res.ok) {
      throw new Error("Failed to import recipe")
    }

    const data = await res.json()

    return {
      title: data.title,
      description: data.summary?.replace(/<[^>]+>/g, ''),
      image: data.image,
      servings: data.servings,
      prepTime: data.preparationMinutes,
      cookTime: data.cookingMinutes,
      ingredients: data.extendedIngredients?.map((i: any) => ({
        amount: i.amount,
        unit: i.unit,
        name: i.original || i.name,
      })) ?? [],
      steps:
        data.analyzedInstructions?.[0]?.steps?.map((s: any) => ({
          text: s.step,
        })) ?? [],
      tags: data.dishTypes ?? [],
    }
  },
}