/** Maps common unit spellings/plurals to a consistent abbreviated form */
const UNIT_ALIASES: Record<string, string> = {
  teaspoon: 'tsp', teaspoons: 'tsp', tsp: 'tsp', tsps: 'tsp',
  tablespoon: 'tbsp', tablespoons: 'tbsp', tbsp: 'tbsp', tbsps: 'tbsp', tbs: 'tbsp',
  cup: 'cup', cups: 'cup',
  ounce: 'oz', ounces: 'oz', oz: 'oz',
  pound: 'lb', pounds: 'lb', lb: 'lb', lbs: 'lb',
  gram: 'g', grams: 'g', g: 'g',
  kilogram: 'kg', kilograms: 'kg', kg: 'kg',
  milliliter: 'ml', milliliters: 'ml', millilitre: 'ml', millilitres: 'ml', ml: 'ml',
  liter: 'L', liters: 'L', litre: 'L', litres: 'L', l: 'L',
  pinch: 'pinch', pinches: 'pinch',
  clove: 'clove', cloves: 'clove',
  can: 'can', cans: 'can',
  slice: 'slice', slices: 'slice',
};

export function normaliseUnit(raw: string): string {
  if (!raw) return raw;
  const key = raw.toLowerCase().trim();
  return UNIT_ALIASES[key] ?? raw;
}

export function capitalise(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Strips parenthetical asides from an ingredient name — leftover amount
 * annotations the importer couldn't fully separate out (e.g. "(50g)
 * granulated sugar") and prep notes (e.g. "Apple (cored and cut in
 * cubes)") both just clutter a shopping list entry, since the actual
 * amount/unit are already tracked as separate fields.
 */
export function cleanIngredientName(name: string): string {
  if (!name) return name;
  return name
    .replace(/\([^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function formatFraction(value: number) {
  const fractions: Record<number, string> = {
    0.125: '1/8',
    0.25: '1/4',
    0.333: '1/3',
    0.5: '1/2',
    0.667: '2/3',
    0.75: '3/4',
  };

  const whole = Math.floor(value);
  const decimal = Number((value - whole).toFixed(3));

  let fraction = '';

  for (const [k, v] of Object.entries(fractions)) {
    if (Math.abs(decimal - Number(k)) < 0.02) {
      fraction = v;
      break;
    }
  }

  if (whole && fraction) return `${whole} ${fraction}`;
  if (fraction) return fraction;
  return value.toString();
}

export function scaleAmount(
  amount: number | null,
  base: number,
  current: number
) {
  if (amount == null) return '';

  const scaled = (amount * current) / base;

  // integers
  if (Number.isInteger(scaled)) {
    return String(scaled);
  }

  return formatFraction(Number(scaled.toFixed(3)));
}