// All navigation routing names:

export const ROUTES = {
  // Home screens:
  MAIN: 'Main Screen',
  HOME: 'Home Screen',
  RECIPES: 'Recipes',
};

export type RoutesKey = keyof typeof ROUTES;
export type RoutesValue = RoutesKey[keyof RoutesKey];
