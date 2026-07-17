import { Recipe } from './types';
import { localStore } from './localStore';
import ENV from './constants/ENV';
import { getApiBaseUrl } from './config/apiConfig';
import { normaliseUnit } from './util/cleanIngridents';

const RETRY_BASE_DELAY_MS = 5_000;
const RETRY_MAX_DELAY_MS = 5 * 60_000;

async function req(path: string, options?: RequestInit) {
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
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
      const whole = parseInt(input.replace(k, '').trim(), 10) || 0;
      return whole + v;
    }
  }

  if (input.includes('and')) {
    const parts = input.split('and').map(p => p.trim());
    const whole = parseFloat(parts[0]) || 0;

    if (parts[1]?.includes('/')) {
      const [n, d] = parts[1].split('/');
      return whole + parseInt(n, 10) / parseInt(d, 10);
    }

    return whole;
  }

  if (input.includes('/')) {
    const [n, d] = input.split('/');
    return parseInt(n, 10) / parseInt(d, 10);
  }

  return parseFloat(input);
}


/** Cleans and parses ingredient strings safely (works for both JSON-LD and Spoonacular text) */
function parseIngredient(raw: string) {
  if (!raw) return { amount: null, unit: '', name: '' };

  let cleaned = raw;
  cleaned = cleaned.replace(/\([^)]*\b(g|ml|kg|l|oz)\b[^)]*\)/gi, '');
  cleaned = decodeEntities(cleaned).replace(/\s+/g, ' ').trim();

  const match = cleaned.match(
    /^([\d\s/.½¼¾⅓⅔⅛]+)?\s*([A-Za-z-]+)?\s+(.*)$/
  );

  if (!match) {
    return { amount: null, unit: '', name: cleaned };
  }

  return {
    amount: parseFraction(match[1]?.trim() || ''),
    unit: normaliseUnit(match[2] || ''),
    name: match[3]?.trim() || cleaned,
  };
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/&rsquo;/g, '\u2019')
    .replace(/&lsquo;/g, '\u2018')
    .replace(/&ldquo;/g, '\u201c')
    .replace(/&rdquo;/g, '\u201d')
    // Hex numeric entities, e.g. &#x27; → '
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    // Decimal numeric entities, e.g. &#39; → '
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    // &lt; and &gt; last, so they don't accidentally re-open tag-like text mid-decode
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

const NOTE_PATTERNS = [
  /note/i,
  /make ahead/i,
  /storage/i,
  /freez/i,
  /\btip\b/i,
  /special tools/i,
  /substitut/i,
  /pro tip/i,
  /leftover/i,
];

/** Splits raw instruction lines into steps vs. note-like asides */
function classifySteps(rawLines: string[]): { steps: { text: string }[]; notes: { text: string }[] } {
  const steps: { text: string }[] = [];
  const notes: { text: string }[] = [];

  for (const line of rawLines) {
    const clean = decodeEntities(line).trim();
    if (!clean) continue;

    if (NOTE_PATTERNS.some(p => p.test(clean))) {
      notes.push({ text: clean });
    } else {
      steps.push({ text: clean });
    }
  }

  return { steps, notes };
}

/** Parses ISO 8601 durations like "PT15M", "PT1H30M" into whole minutes */
function parseISODuration(iso?: string): number | undefined {
  if (!iso || typeof iso !== 'string') return undefined;
  const match = iso.match(/P(?:\d+D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
  if (!match) return undefined;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const total = hours * 60 + minutes;
  return total > 0 ? total : undefined;
}

/** recipeYield can be "4", "4 servings", 4, or an array — normalize to a number */
function parseYield(y: any): number {
  if (Array.isArray(y)) y = y[0];
  if (typeof y === 'number') return y;
  if (typeof y === 'string') {
    const m = y.match(/\d+/);
    return m ? parseInt(m[0], 10) : 4;
  }
  return 4;
}

/** image can be a string, an ImageObject, or an array of either — normalize to one URL */
function parseImage(img: any): string | undefined {
  if (!img) return undefined;
  if (Array.isArray(img)) img = img[0];
  if (typeof img === 'string') return img;
  if (typeof img === 'object' && img.url) return img.url;
  return undefined;
}

/** recipeInstructions can be a plain string, an array of strings, or HowToStep/HowToSection objects */
function flattenInstructions(instr: any): string[] {
  if (!instr) return [];

  if (typeof instr === 'string') {
    return instr
      .replace(/<[^>]+>/g, '\n')
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);
  }

  if (Array.isArray(instr)) {
    return instr.flatMap((item: any) => {
      if (typeof item === 'string') return [item];
      if (item && typeof item === 'object') {
        if (item.itemListElement) return flattenInstructions(item.itemListElement);
        if (item.text) return [item.text];
        if (item.name) return [item.name];
      }
      return [];
    });
  }

  return [];
}

/** Recursively searches parsed JSON-LD for a node with @type "Recipe" */
function findRecipeNode(node: any): any | null {
  if (!node) return null;

  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findRecipeNode(item);
      if (found) return found;
    }
    return null;
  }

  if (typeof node === 'object') {
    const type = node['@type'];
    const isRecipe = Array.isArray(type)
      ? type.some((t: string) => typeof t === 'string' && t.toLowerCase() === 'recipe')
      : typeof type === 'string' && type.toLowerCase() === 'recipe';

    if (isRecipe) return node;
    if (node['@graph']) return findRecipeNode(node['@graph']);
    if (node.mainEntity) return findRecipeNode(node.mainEntity);
  }

  return null;
}

/** Pulls out every <script type="application/ld+json"> block and looks for a Recipe */
function extractJsonLdRecipe(html: string): any | null {
  const scriptRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = scriptRegex.exec(html))) {
    try {
      const json = JSON.parse(match[1].trim());
      const found = findRecipeNode(json);
      if (found) return found;
    } catch {
      // malformed JSON-LD block on this page, skip it and keep looking
    }
  }

  return null;
}

/** Best-effort scrape for a site's "Notes" section, which schema.org has no field for */
function scrapeNotesFromHtml(html: string): { text: string }[] {
  const containerPatterns = [
    /class="[^"]*tasty-recipes-notes-body[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /class="[^"]*wprm-recipe-notes[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /class="[^"]*recipe-notes[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
  ];

  for (const pattern of containerPatterns) {
    const match = html.match(pattern);
    if (!match) continue;

    const items = match[1]
      .split(/<\/(?:li|p)>/i)
      .map(chunk => decodeEntities(chunk.replace(/<[^>]+>/g, '')).trim())
      .filter(Boolean);

    if (items.length) return items.map(text => ({ text }));
  }

  return [];
}

async function fetchPageHtml(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SmartPanBot/1.0)' },
    });
    if (!res.ok) return '';
    return await res.text();
  } catch (e) {
    console.log('Failed to fetch page HTML:', e);
    return '';
  }
}

/**
 * Uploads a data: URI (from the image picker) to the server and returns the
 * absolute URL of the stored image — recipe.image is always expected to be
 * a fully-qualified URL (matching what the JSON-LD/Spoonacular import paths
 * already produce), never a relative path.
 */
async function uploadImage(dataUri: string): Promise<string> {
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error('Invalid image data URI');
  const [, mimeType, data] = match;
  const res = await req('/api/recipes/images', {
    method: 'POST',
    body: JSON.stringify({ data, mimeType }),
  });
  return `${getApiBaseUrl()}${res.url}`;
}

/**
 * If `image` is a data: URI — a picked-but-not-yet-uploaded photo (see
 * addRecipeScreen.tsx) — tries to upload it and swaps in the real URL.
 * Never throws: if the upload fails (offline), returns the data unchanged,
 * since the data: URI still renders fine locally, and every retry path
 * (saveRecipe, updateRecipe, pushUnsyncedRecipes, pushPendingEdits) calls
 * this again on its next attempt.
 */
async function resolveImage(data: any): Promise<any> {
  if (typeof data.image !== 'string' || !data.image.startsWith('data:')) return data;
  try {
    const image = await uploadImage(data.image);
    return { ...data, image };
  } catch {
    return data;
  }
}

export const api = {
  getRecipes: async (q?: string) => {
    try {
      const remote = await req(`/api/recipes${q ? `?q=${encodeURIComponent(q)}` : ''}`);
      const local = await localStore.getAll();
      const remoteIds = new Set(remote.map((r: any) => r.id));

      const map = new Map<string, Recipe>();

      for (const r of local as any[]) {
        const isUnsynced = typeof r.id === 'string' && r.id.startsWith('temp-');
        // A local recipe with a real (non-temp) id that's no longer on the
        // server was deleted server-side (e.g. by a dedupe cleanup) — drop
        // it instead of keeping it forever. Only genuinely unsynced,
        // offline-created recipes (temp- ids) are kept unconditionally.
        if (isUnsynced || remoteIds.has(r.id)) {
          map.set(r.id, r);
        }
      }

      for (const r of remote) {
        const existing = map.get(r.id);
        if (!existing) {
          map.set(r.id, r);
          continue;
        }
        const remoteTime = new Date((r as any).updatedAt ?? 0).getTime();
        const localTime = new Date((existing as any).updatedAt ?? 0).getTime();
        map.set(r.id, remoteTime >= localTime ? r : existing);
      }

      const merged = Array.from(map.values());
      await localStore.saveAll(merged, true); // true = full overwrite, see localStore.ts
      return merged;
    } catch {
      console.log('Server unreachable, falling back to local cache');
      const all = await localStore.getAll();
      if (!q) return all;
      return all.filter((r: Recipe) => r.title.toLowerCase().includes(q.toLowerCase()));
    }
  },

  saveRecipe: async (data: any) => {
    data = await resolveImage(data);

    // Must be prefixed with "temp-" — pushUnsyncedRecipes() and getRecipes()
    // both use that prefix as the structural signal for "genuinely
    // unsynced, created offline". A bare id here would cause this recipe
    // to look identical to a stale, server-deleted entry and get silently
    // dropped the next time getRecipes() runs after reconnecting.
    const tempId = `temp-${Date.now()}`;
    const localRecipe = {
      ...data,
      id: tempId,
      source: 'local',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
    } catch {
      console.log('Server sync failed (offline?)');
      return localRecipe;
    }
  },

  updateRecipe: async (data: any) => {
    // Bump updatedAt locally before the server ever sees it. Without this,
    // an edit made offline keeps its pre-edit timestamp, so getRecipes()'s
    // `remoteTime >= localTime` merge picks the untouched server copy and
    // silently discards the edit on reconnect. Bumping it here means the
    // edit's timestamp already reflects "now" and wins that comparison
    // until a successful PUT lets the server's own updatedAt take over.
    // editPending/editSyncAttempts/editNextRetryAt are this function's own
    // retry bookkeeping (see pushPendingEdits below) — strip them from the
    // incoming payload so a retry doesn't send stale markers back to the
    // server as if they were real recipe fields.
    const { editPending, editSyncAttempts, editNextRetryAt, ...cleanData } = data;
    const resolved = await resolveImage(cleanData);
    const updated = { ...resolved, updatedAt: new Date().toISOString() };
    await localStore.update(updated);
    try {
      const real = await req('/api/recipes', { method: 'PUT', body: JSON.stringify(updated) });
      // Clear any pending-edit retry state now that the server has the latest.
      await localStore.update({ ...real, editPending: false, editSyncAttempts: undefined, editNextRetryAt: undefined });
      return real;
    } catch {
      console.log('Server offline');
      const pending = { ...updated, editPending: true };
      await localStore.update(pending);
      return pending;
    }
  },

  deleteRecipe: async (id: string) => {
    await localStore.remove(id);
    try {
      await req(`/api/recipes?id=${id}`, { method: 'DELETE' });
    } catch {
      console.log('Server offline');
    }
  },

  /**
   * Pushes any recipes still sitting under a temp- id (created via save()
   * while offline, never successfully POSTed) to the server. Scoped
   * strictly to the temp- prefix — an unambiguous, structural signal of
   * "genuinely unsynced" — rather than a loosely-tracked source flag,
   * which is what caused the original duplication bugs. Safe to call
   * repeatedly; already-synced recipes have no temp- id left to match.
   *
   * Retries are backed off per-record (syncAttempts/nextRetryAt on the
   * local cache entry) rather than left to fire on every WS reconnect —
   * with the flat 3s reconnect timer in RecipesContext, an unreachable
   * server would otherwise mean a POST attempt every 3 seconds forever.
   * The interval doubles per failed attempt, capped at RETRY_MAX_DELAY_MS;
   * there's no attempt cap, since these are real unsynced user recipes and
   * dropping them would be data loss, not just a skipped retry.
   */
  pushUnsyncedRecipes: async (): Promise<void> => {
    const local = await localStore.getAll();
    const now = Date.now();
    const unsynced = local.filter((r: any) =>
      typeof r.id === 'string' &&
      r.id.startsWith('temp-') &&
      (!r.nextRetryAt || new Date(r.nextRetryAt).getTime() <= now)
    );

    for (const localRecipe of unsynced) {
      try {
        const { id, createdAt, updatedAt, source, syncAttempts, nextRetryAt, ...data } = localRecipe as any;
        const resolved = await resolveImage(data);
        const real = await req('/api/recipes', {
          method: 'POST',
          body: JSON.stringify(resolved),
        });
        await localStore.remove(localRecipe.id);
        await localStore.add(real);
        console.log('Pushed offline recipe to server:', real.title);
      } catch {
        const attempts = ((localRecipe as any).syncAttempts ?? 0) + 1;
        const delayMs = Math.min(RETRY_BASE_DELAY_MS * 2 ** (attempts - 1), RETRY_MAX_DELAY_MS);
        await localStore.update({
          ...localRecipe,
          syncAttempts: attempts,
          nextRetryAt: new Date(now + delayMs).toISOString(),
        });
        console.log(
          `Failed to push offline recipe (attempt ${attempts}), retrying in ${Math.round(delayMs / 1000)}s:`,
          (localRecipe as any).title
        );
      }
    }
  },

  /**
   * Retries recipes whose edit failed to PUT while offline. updateRecipe
   * marks a record editPending=true when the PUT fails; that's a real,
   * non-temp server id, so it can't reuse the temp- prefix pushUnsyncedRecipes
   * relies on — hence a separate flag and its own editSyncAttempts/
   * editNextRetryAt backoff, mirroring pushUnsyncedRecipes exactly. Without
   * this, an offline edit's bumped updatedAt lets it win the local merge
   * (see updateRecipe) but never actually reaches the server or dashboard.
   */
  pushPendingEdits: async (): Promise<void> => {
    const local = await localStore.getAll();
    const now = Date.now();
    const pending = local.filter((r: any) =>
      r.editPending &&
      (!r.editNextRetryAt || new Date(r.editNextRetryAt).getTime() <= now)
    );

    for (const localRecipe of pending) {
      try {
        const { editPending, editSyncAttempts, editNextRetryAt, ...data } = localRecipe as any;
        const resolved = await resolveImage(data);
        const real = await req('/api/recipes', { method: 'PUT', body: JSON.stringify(resolved) });
        await localStore.update({ ...real, editPending: false, editSyncAttempts: undefined, editNextRetryAt: undefined });
        console.log('Pushed pending edit to server:', real.title);
      } catch {
        const attempts = ((localRecipe as any).editSyncAttempts ?? 0) + 1;
        const delayMs = Math.min(RETRY_BASE_DELAY_MS * 2 ** (attempts - 1), RETRY_MAX_DELAY_MS);
        await localStore.update({
          ...localRecipe,
          editSyncAttempts: attempts,
          editNextRetryAt: new Date(now + delayMs).toISOString(),
        });
        console.log(
          `Failed to push pending edit (attempt ${attempts}), retrying in ${Math.round(delayMs / 1000)}s:`,
          (localRecipe as any).title
        );
      }
    }
  },

  /**
   * Finds recipes with duplicate titles on the server and deletes every
   * copy except the oldest one for each title. Titles are normalized
   * (HTML entities decoded, whitespace collapsed, case-insensitive) before
   * comparing, since the same recipe can end up saved under slightly
   * different string encodings (e.g. "Don't" vs "Don&#x27;t" vs "Don't").
   * Returns the number of duplicates removed.
   */
  dedupeRecipes: async (): Promise<number> => {
    const remote = await req('/api/recipes');

    const normalize = (title: string) =>
      decodeEntities(title || '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

    const groups = new Map<string, any[]>();
    for (const r of remote) {
      const key = normalize(r.title);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(r);
    }

    const toDelete: string[] = [];
    for (const group of groups.values()) {
      if (group.length <= 1) continue;
      group.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      // keep the oldest (index 0), delete the rest
      for (let i = 1; i < group.length; i++) {
        toDelete.push(group[i].id);
      }
    }

    for (const id of toDelete) {
      try {
        await req(`/api/recipes?id=${id}`, { method: 'DELETE' });
      } catch {
        console.log('Failed to delete duplicate:', id);
      }
    }

    // resync local cache to match the now-cleaned server list
    const cleaned = await req('/api/recipes');
    await localStore.saveAll(cleaned);

    return toDelete.length;
  },

  importUrl: async (url: string) => {
    const html = await fetchPageHtml(url);

    // ── Primary path: read the site's own JSON-LD Recipe schema directly ──
    const jsonLdRecipe = html ? extractJsonLdRecipe(html) : null;

    if (jsonLdRecipe) {
      console.log('Found JSON-LD Recipe schema — using the site\'s own data directly');

      const rawLines = flattenInstructions(jsonLdRecipe.recipeInstructions);
      const { steps, notes } = classifySteps(rawLines);

      let finalNotes = notes;
      if (finalNotes.length === 0 && html) {
        finalNotes = scrapeNotesFromHtml(html);
      }

      console.log('PARSED STEPS ==================', steps);
      console.log('PARSED NOTES ==================', finalNotes);

      const rawTags = jsonLdRecipe.recipeCategory ?? jsonLdRecipe.keywords;
      const tags = Array.isArray(rawTags)
        ? rawTags
        : typeof rawTags === 'string'
        ? rawTags.split(',').map((t: string) => t.trim()).filter(Boolean)
        : [];

      return {
        title: decodeEntities(jsonLdRecipe.name ?? ''),
        description: typeof jsonLdRecipe.description === 'string'
          ? decodeEntities(jsonLdRecipe.description.replace(/<[^>]+>/g, ''))
          : undefined,
        image: parseImage(jsonLdRecipe.image),
        servings: parseYield(jsonLdRecipe.recipeYield),
        prepTime: parseISODuration(jsonLdRecipe.prepTime),
        cookTime: parseISODuration(jsonLdRecipe.cookTime),
        ingredients: (jsonLdRecipe.recipeIngredient ?? []).map((i: string) => parseIngredient(i)),
        steps,
        notes: finalNotes,
        tags,
      };
    }

    // ── Fallback: no schema found on the page, ask Spoonacular instead ──
    console.log('No JSON-LD Recipe schema found — falling back to Spoonacular');

    const res = await fetch(
      `https://api.spoonacular.com/recipes/extract?url=${encodeURIComponent(url)}&apiKey=${ENV.API_KEY}`
    );
    if (!res.ok) throw new Error('Failed to import recipe');
    const data = await res.json();

    const hasAnalyzed = data.analyzedInstructions?.some((g: any) => (g.steps ?? []).length > 0);
    let rawLines: string[] = [];

    if (hasAnalyzed) {
      data.analyzedInstructions.forEach((group: any) => {
        (group.steps ?? []).forEach((s: any) => rawLines.push(s.step || ''));
      });
    } else if (data.instructions) {
      rawLines = data.instructions
        .replace(/<\/?(li|p|br)[^>]*>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .split('\n')
        .map((line: string) => line.trim())
        .filter(Boolean);
    }

    const { steps, notes } = classifySteps(rawLines);
    let finalNotes = notes;
    if (finalNotes.length === 0 && html) {
      finalNotes = scrapeNotesFromHtml(html);
    }

    console.log('PARSED STEPS (Spoonacular) ==================', steps);
    console.log('PARSED NOTES ==================', finalNotes);

    return {
      title: data.title,
      description: data.summary?.replace(/<[^>]+>/g, ''),
      image: data.image,
      servings: data.servings,
      prepTime: data.preparationMinutes,
      cookTime: data.cookingMinutes,
      ingredients: data.extendedIngredients?.map((i: any) => parseIngredient(i.original || i.originalString || '')) ?? [],
      steps,
      notes: finalNotes,
      tags: data.dishTypes ?? [],
    };
  },
};