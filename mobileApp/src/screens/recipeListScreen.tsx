import React, { useEffect, useState } from 'react';
import {
  View, 
  Text, 
  FlatList, 
  TouchableOpacity,
  StyleSheet, 
  ActivityIndicator, 
  Image, 
  RefreshControl,
} from 'react-native';
import { useRecipes } from '../context/RecipesContext';
import { Recipe } from '../types';
import { ICONS } from '../constants/icons';
import { Header } from '../util/header';
import { SearchBar } from '../util/searchBar';
import { useTheme } from '../theme/Themecontext';

function fmtTime(min?: number) {
  if (!min) return null;
  if (min < 60) return `${min}m`;
  return `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}m` : ''}`;
}

function RecipeCard({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
  const { colours } = useTheme();
  const s = createStyles(colours);
  const {as: HeadIcon, name: headIcon} = ICONS.HEAD;
  const {as: TimerIcon, name: timerIcon} = ICONS.TIMER;
  const {as: ImagePlaceholderIcon, name: imagePlaceholderIcon} = ICONS.IMAGE_PLACEHOLDER;
  const {as: SyncPendingIcon, name: syncPendingIcon} = ICONS.SYNC_PENDING;

  const total = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);
  const pendingSync = recipe.id.startsWith('temp-');
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.7}>
      {recipe.image
        ? <Image source={{ uri: recipe.image }} style={s.cardImage} />
        : <View style={[s.cardImage, s.cardImagePlaceholder]}><Text style={s.cardImageEmoji}><ImagePlaceholderIcon name={imagePlaceholderIcon} size={40} /></Text></View>
      }
      {pendingSync && (
        <View style={s.syncBadge}>
          <SyncPendingIcon name={syncPendingIcon} size={11} color={colours.accent} />
          <Text style={s.syncBadgeText}>Pending sync</Text>
        </View>
      )}
      <View style={s.cardBody}>
        <Text style={s.cardTitle} numberOfLines={2}>{recipe.title}</Text>
        <View style={s.cardMeta}>
          {total > 0 && <Text style={s.cardMetaText}><TimerIcon name={timerIcon} size={10} /> {fmtTime(total)}</Text>}
          <Text style={s.cardMetaText}><HeadIcon name={headIcon} size={10} /> {recipe.servings}</Text>
        </View>
        {recipe.tags.length > 0 && (
          <View style={s.tagRow}>
            {recipe.tags.slice(0, 3).map(t => (
              <View key={t} style={s.tag}><Text style={s.tagText}>{t}</Text></View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function RecipeListScreen({ navigation, route }: any) {
  const { colours } = useTheme();
  const s = createStyles(colours);

  const { recipes, remove, refresh, loading, error, connected } = useRecipes()
  const [query, setQuery] = useState(route.params?.query ?? '');

  // homeScreen's search bar navigates here with a query param (e.g. tapping
  // search again with a different term) — pick up changes after mount too,
  // not just the initial value.
  useEffect(() => {
    if (route.params?.query != null) setQuery(route.params.query);
  }, [route.params?.query]);

  const {as: AddIcon, name: addIcon} = ICONS.ADD;

  const filtered = query
    ? recipes.filter(r => r.title.toLowerCase().includes(query.toLowerCase()) || r.tags.some(t => t.toLowerCase().includes(query.toLowerCase())))
    : recipes;

  return (
    <View style={s.container}>
      <Header 
        title="Recipes"
        subtitle="Search all recipes"
        connected={connected}
        onPress={() => navigation.navigate('AddRecipe')}
        buttonIcon={{ as: AddIcon, name: addIcon }}
        buttonText="Add"
        loading={loading}
      />

      <SearchBar
        placeholder="Search recipes…"
        query={query}
        setQuery={setQuery}
      />

      {error && <Text style={s.error}>{error}</Text>}

      {loading && recipes.length === 0
        ? <ActivityIndicator style={{ marginTop: 40 }} color={colours.accent} />
        : filtered.length === 0
        ? <Text style={s.empty}>{query ? 'No recipes match your search' : 'No recipes yet — add one!'}</Text>
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
              <RecipeCard recipe={item} onPress={() => navigation.navigate('RecipeDetail', { id: item.id })} />
            )}
          />
        )
      }
    </View>
  );
}

const createStyles = (colours: ReturnType<typeof useTheme>['colours']) => StyleSheet.create({
  container:            { flex: 1, backgroundColor: colours.bg },
  list:                 { paddingHorizontal: 12, paddingBottom: 32 },
  row:                  { gap: 10, marginBottom: 10 },
  card:                 { flex: 1, backgroundColor: colours.surface, borderRadius: 10, overflow: 'hidden', borderWidth: 0.5, borderColor: colours.border },
  cardImage:            { width: '100%', height: 110 },
  cardImagePlaceholder: { backgroundColor: colours.accentBg, alignItems: 'center', justifyContent: 'center' },
  cardImageEmoji:       { fontSize: 36 },
  syncBadge:            { position: 'absolute', top: 6, left: 6, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colours.surface, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  syncBadgeText:        { fontSize: 9, color: colours.accent, fontWeight: '600' },
  cardBody:             { padding: 10, gap: 5 },
  cardTitle:            { fontSize: 13, fontWeight: '600', color: colours.text, lineHeight: 18 },
  cardMeta:             { flexDirection: 'row', gap: 10 },
  cardMetaText:         { fontSize: 11, color: colours.textGhost },
  tagRow:               { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  tag:                  { backgroundColor: 'rgba(99,102,241,0.15)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  tagText:              { fontSize: 10, color: colours.accent },
  empty:                { textAlign: 'center', color: colours.textGhost, fontSize: 13, marginTop: 60 },
  error:                { color: colours.error, fontSize: 12, textAlign: 'center', marginHorizontal: 16, marginBottom: 8 },
});