export interface Ingredient {
  amount: number | null;
  unit:   string | null;
  name:   string;
}

export interface Step {
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
  source?:      string;
  createdAt:    string;
}