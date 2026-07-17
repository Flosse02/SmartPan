import React from 'react';
import { useRecipes } from '../context/RecipesContext';
import { RecipeGrid } from '../util/recipeGrid';

export default function RecipeListScreen({ navigation, route }: any) {
  const { recipes } = useRecipes();

  return (
    <RecipeGrid
      navigation={navigation}
      title="Recipes"
      subtitle="Search all recipes"
      recipes={recipes}
      emptyText="No recipes yet — add one!"
      initialQuery={route.params?.query}
      showAddButton
    />
  );
}
