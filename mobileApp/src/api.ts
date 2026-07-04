import { Recipe } from './types';
import { localStore } from './localStore';
import ENV from './constants/ENV';

async function req(path: string, options?: RequestInit) {
  const res = await fetch(`${ENV.BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

/**
 * Converts:
 * "1 1/2" → 1.5
 * "1/4" → 0.25
 * "½" → 0.5
 */
function parseFraction(input: string): number | null {
  if (!input) return null;

  input = input.trim();

  const unicodeFractions: Record<string, number> = {
    '½': 0.5,
    '¼': 0.25,
    '¾': 0.75,
    '⅓': 0.333,
    '⅔': 0.667,
    '⅛': 0.125,
  };

  for (const [k, v] of Object.entries(unicodeFractions)) {
    if (input.includes(k)) {
      const whole = parseInt(input.replace(k, '').trim()) || 0;
      return whole + v;
    }
  }

  // "1 and 1/2"
  if (input.includes('and')) {
    const parts = input.split('and').map(p => p.trim());
    const whole = parseFloat(parts[0]) || 0;

    if (parts[1]?.includes('/')) {
      const [n, d] = parts[1].split('/');
      return whole + parseInt(n) / parseInt(d);
    }

    return whole;
  }

  // "1/2"
  if (input.includes('/')) {
    const [n, d] = input.split('/');
    return parseInt(n) / parseInt(d);
  }

  return parseFloat(input);
}

/**
 * Cleans and parses ingredient strings safely
 */
function parseIngredient(raw: string) {
  if (!raw) return { amount: null, unit: '', name: '' };

  let cleaned = raw;

  // remove metric conversions like (16g), (500g), (360ml)
  cleaned = cleaned.replace(/\([^)]*\b(g|ml|kg|l|oz)\b[^)]*\)/gi, '');

  // normalize spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  const match = cleaned.match(
    /^([\d\s\/.½¼¾⅓⅔⅛]+)?\s*([A-Za-z-]+)?\s+(.*)$/
  );

  if (!match) {
    return {
      amount: null,
      unit: '',
      name: cleaned,
    };
  }

  return {
    amount: parseFraction(match[1]?.trim() || ''),
    unit: match[2] || '',
    name: match[3]?.trim() || cleaned,
  };
}

export const api = {
  getRecipes: async (q?: string) => {
    try {
      const remote = await req(
        `/api/recipes${q ? `?q=${encodeURIComponent(q)}` : ''}`
      );

      await localStore.saveAll(remote);
      return remote;
    } catch (e) {
      console.log('Server unreachable, falling back to local cache');

      const all = await localStore.getAll();
      if (!q) return all;

      return all.filter((r: Recipe) =>
        r.title.toLowerCase().includes(q.toLowerCase())
      );
    }
  },

  saveRecipe: async (data: any) => {
    const tempId = Date.now().toString();
    const localRecipe = {
      ...data,
      id: tempId,
      createdAt: new Date().toISOString(),
    };

    await localStore.add(localRecipe);

    try {
      const real = await req('/api/recipes', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      await localStore.remove(tempId);
      await localStore.add(real);

      return real;
    } catch (e) {
      console.log('Server sync failed (offline?)');
      return localRecipe;
    }
  },

  updateRecipe: async (data: any) => {
    await localStore.update(data);

    try {
      await req('/api/recipes', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch {
      console.log('Server offline');
    }

    return data;
  },

  deleteRecipe: async (id: string) => {
    await localStore.remove(id);

    try {
      await req(`/api/recipes?id=${id}`, {
        method: 'DELETE',
      });
    } catch {
      console.log('Server offline');
    }
  },

  importUrl: async (url: string) => {
    const res = await fetch(
      `https://api.spoonacular.com/recipes/extract?url=${encodeURIComponent(
        url
      )}&apiKey=${ENV.API_KEY}`
    );

    if (!res.ok) throw new Error('Failed to import recipe');

    const data = await res.json();

    console.log('RAW SPOONACULAR DATA ==================');
    console.log(JSON.stringify(data, null, 2));

    console.log('EXT INGREDIENTS ==================');
    console.log(data.extendedIngredients);

    console.log('INSTRUCTIONS ==================');
    console.log(data.analyzedInstructions);

    const notePatterns = [
      /^note/i,
      /^recipe note/i,
      /^make ahead/i,
      /^storage/i,
      /^freezing/i,
      /^tip/i,
      /^special tools/i,
      /^substitution/i,
      /^cook mode/i,
      /^pro tip/i,
    ];

    // Pick only first real instruction set
    const instructionSet =
      data.analyzedInstructions?.find((g: any) => g.steps?.length > 1) ??
      data.analyzedInstructions?.[0];

    const steps =
      instructionSet?.steps
        ?.map((s: any) => ({
          text: (s.step || '').trim(),
        }))
        .filter((s: any) => {
          if (!s.text) return false;
          return !notePatterns.some(p =>
            p.test(s.text.toLowerCase())
          );
        }) ?? [];

    return {
      title: data.title,
      description: data.summary?.replace(/<[^>]+>/g, ''),
      image: data.image,
      servings: data.servings,
      prepTime: data.preparationMinutes,
      cookTime: data.cookingMinutes,

      ingredients:
        data.extendedIngredients?.map((i: any) => {
          const original =
            i.original ||
            i.originalString ||
            '';

          return parseIngredient(original);
        }) ?? [],

      steps,

      tags: data.dishTypes ?? [],
    };
  },
};