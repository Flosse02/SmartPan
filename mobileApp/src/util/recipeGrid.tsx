import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { useRecipes } from '../context/RecipesContext';
import { Recipe } from '../types';
import { ICONS } from '../constants/icons';
import { CATEGORIES } from '../constants/categories';
import { Header } from './header';
import { SearchBar } from './searchBar';
import { RecipeCard } from './recipeCard';
import { useTheme } from '../theme/Themecontext';
import { ROUTES } from '../constants/routes';

type RecipeGridProps = {
  navigation: any;
  title: string;
  subtitle: string;
  recipes: Recipe[];
  emptyText: string;
  initialQuery?: string;
  showAddButton?: boolean;
};

/** Shared search + category filter + card grid, used by both the Recipes and Favourites tabs. */
export function RecipeGrid({ navigation, title, subtitle, recipes, emptyText, initialQuery, showAddButton }: RecipeGridProps) {
  const { colours } = useTheme();
  const s = createStyles(colours);
  const { refresh, loading, error, connected } = useRecipes();
  const [query, setQuery] = useState(initialQuery ?? '');
  const [category, setCategory] = useState<string | null>(null);

  useEffect(() => {
    if (initialQuery != null) setQuery(initialQuery);
  }, [initialQuery]);

  const {as: AddIcon, name: addIcon} = ICONS.ADD;

  const q = query.toLowerCase();
  const filtered = recipes.filter(r => {
    const matchesQuery =
      !q ||
      r.title.toLowerCase().includes(q) ||
      r.tags.some(t => t.toLowerCase().includes(q)) ||
      r.ingredients.some(i => i.name.toLowerCase().includes(q));
    const matchesCategory = !category || r.tags.some(t => t.toLowerCase() === category.toLowerCase());
    return matchesQuery && matchesCategory;
  });

  return (
    <View style={s.container}>
      <Header
        title={title}
        subtitle={subtitle}
        connected={connected}
        onPress={showAddButton ? () => navigation.navigate(ROUTES.ADD_RECIPE) : undefined}
        buttonIcon={showAddButton ? { as: AddIcon, name: addIcon } : undefined}
        buttonText={showAddButton ? 'Add' : undefined}
        loading={loading}
      />

      <SearchBar
        placeholder="Search by name, ingredient, or tag…"
        query={query}
        setQuery={setQuery}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll} contentContainerStyle={s.chipRow}>
        {CATEGORIES.map(c => {
          const active = category === c;
          return (
            <TouchableOpacity
              key={c}
              style={[s.chip, active && s.chipActive]}
              onPress={() => setCategory(active ? null : c)}
            >
              <Text style={[s.chipText, active && s.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {error && <Text style={s.error}>{error}</Text>}

      {loading && recipes.length === 0
        ? <ActivityIndicator style={{ marginTop: 40 }} color={colours.accent} />
        : filtered.length === 0
        ? <Text style={s.empty}>{query || category ? 'No recipes match your search' : emptyText}</Text>
        : (
          <FlatList
            data={filtered}
            extraData={recipes}
            keyExtractor={r => r.id}
            numColumns={2}
            columnWrapperStyle={s.row}
            contentContainerStyle={s.list}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={() => refresh()} tintColor={colours.accent} />}
            renderItem={({ item }) => (
              <RecipeCard recipe={item} onPress={() => navigation.navigate(ROUTES.RECIPE_DETAIL, { id: item.id })} />
            )}
          />
        )
      }
    </View>
  );
}

const createStyles = (colours: ReturnType<typeof useTheme>['colours']) => StyleSheet.create({
  container:    { flex: 1, backgroundColor: colours.bg },
  chipScroll:   { flexGrow: 0, flexShrink: 0 },
  chipRow:      { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  chip:         { backgroundColor: colours.surface, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 0.5, borderColor: colours.border },
  chipActive:   { backgroundColor: colours.accent, borderColor: colours.accent },
  chipText:     { fontSize: 12, color: colours.textGhost, fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  list:         { paddingHorizontal: 12, paddingBottom: 32 },
  row:          { gap: 10, marginBottom: 10 },
  empty:        { textAlign: 'center', color: colours.textGhost, fontSize: 13, marginTop: 60 },
  error:        { color: colours.error, fontSize: 12, textAlign: 'center', marginHorizontal: 16, marginBottom: 8 },
});
