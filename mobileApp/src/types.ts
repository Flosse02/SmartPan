export interface Ingredient {
  amount: number | null;
  unit:   string | null;
  name:   string;
}

export interface Step {
  text: string;
}

export interface Note {
  text: string;
}

export interface Recipe {
  id:           string;
  title:        string;
  description?: string;
  image?:       string;
  servings:     number;
  prepTime?:    number;
  cookTime?:    number;
  tags:         string[];
  ingredients:  Ingredient[];
  steps:        Step[];
  notes:        Note[];
  source:       'local' | 'server';
  createdAt:    string;
  updatedAt:    string;
  // Device-local preference, merged in by RecipesContext from recipePrefs
  // storage — never sent to the server, since the Pi server/dashboard has
  // no concept of per-device favourite state.
  favourite?:   boolean;
}