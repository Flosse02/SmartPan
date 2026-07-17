import React from 'react';
import { useRecipes } from '../context/RecipesContext';
import { RecipeGrid } from '../util/recipeGrid';

export default function FavouritesScreen({ navigation }: any) {
  const { recipes } = useRecipes();
  const favourites = recipes.filter(r => r.favourite);

  return (
    <RecipeGrid
      navigation={navigation}
      title="Favourites"
      subtitle="Your favourite recipes"
      recipes={favourites}
      emptyText="No favourites yet — tap the heart on a recipe to add one"
    />
  );
}
