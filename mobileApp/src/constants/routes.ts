// All navigation routing names:

export const ROUTES = {
  // Home screens:
  MAIN: 'Main Screen',
  HOME: 'Home Screen',
  RECIPES: 'Recipes',
  FAVOURITES: 'Favourites',
  SHOPPING_LIST: 'Shopping List',
  SETTINGS: 'Settings Screen',

  // Recipe Screens:
  RECIPE_DETAIL: 'RecipeDetail',
  ADD_RECIPE: 'AddRecipe',
  COOKING_MODE: 'CookingMode'

};

export type RoutesKey = keyof typeof ROUTES;
export type RoutesValue = RoutesKey[keyof RoutesKey];
