import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image, RefreshControl,
} from 'react-native';
import { useRecipes } from '../context/RecipesContext';
import { Recipe } from '../types';
import { ICONS } from '../constants/icons';

function fmtTime(min?: number) {
  if (!min) return null;
  if (min < 60) return `${min}m`;
  return `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}m` : ''}`;
}

function RecipeCard({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
  const {as: HeadIcon, name: headIcon} = ICONS.HEAD;
  const {as: TimerIcon, name: timerIcon} = ICONS.TIMER;
  const {as: ImagePlaceholderIcon, name: imagePlaceholderIcon} = ICONS.IMAGE_PLACEHOLDER;

  const total = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.7}>
      {recipe.image
        ? <Image source={{ uri: recipe.image }} style={s.cardImage} />
        : <View style={[s.cardImage, s.cardImagePlaceholder]}><Text style={s.cardImageEmoji}><ImagePlaceholderIcon name={imagePlaceholderIcon} size={40} /></Text></View>
      }
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

export default function RecipeListScreen({ navigation }: any) {
  const { recipes, remove, fetch, loading, error, connected } = useRecipes()
  const [query, setQuery] = useState('');

  const {as: AddIcon, name: addIcon} = ICONS.ADD;
  const {as: SearchIcon, name: searchIcon} = ICONS.SEARCH;
  const {as: CloseIcon, name: closeIcon} = ICONS.CLOSE;

  const filtered = query
    ? recipes.filter(r => r.title.toLowerCase().includes(query.toLowerCase()) || r.tags.some(t => t.toLowerCase().includes(query.toLowerCase())))
    : recipes;

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>SmartPan</Text>
        <View style={s.headerRight}>
          <View style={[s.dot, connected ? s.dotOn : s.dotOff]} />
          <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('AddRecipe')}>
            <Text style={s.addBtnText}><AddIcon name={addIcon} size={16} /> Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <Text style={s.searchIcon}><SearchIcon name={searchIcon} size={24} color={"#444"} /></Text>
        <TextInput
          style={s.searchInput}
          placeholder="Search recipes…"
          placeholderTextColor="#666"
          value={query}
          onChangeText={setQuery}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Text style={s.searchClear}><CloseIcon name={closeIcon} size={24} color={"#444"} /></Text>
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={s.error}>{error}</Text>}

      {loading && recipes.length === 0
        ? <ActivityIndicator style={{ marginTop: 40 }} color="#6366f1" />
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
            refreshControl={<RefreshControl refreshing={loading} onRefresh={() => fetch()} tintColor="#6366f1" />}
            renderItem={({ item }) => (
              <RecipeCard recipe={item} onPress={() => navigation.navigate('RecipeDetail', { recipe: item })} />
            )}
          />
        )
      }
    </View>
  );
}

const s = StyleSheet.create({
  container:            { flex: 1, backgroundColor: '#0f0f13' },
  header:               { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  headerTitle:          { fontSize: 22, fontWeight: '700', color: '#f0f0f0', letterSpacing: -0.5 },
  headerRight:          { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot:                  { width: 7, height: 7, borderRadius: 4 },
  dotOn:                { backgroundColor: '#4caf7d' },
  dotOff:               { backgroundColor: '#444' },
  addBtn:               { backgroundColor: '#6366f1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  addBtnText:           { color: '#fff', fontSize: 13, fontWeight: '600' },
  searchWrap:           { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 12, backgroundColor: '#1a1a1f', borderRadius: 10, borderWidth: 0.5, borderColor: '#2a2a2f', paddingHorizontal: 12, paddingVertical: 8 },
  searchIcon:           { fontSize: 14, marginRight: 8 },
  searchInput:          { flex: 1, fontSize: 14, color: '#f0f0f0' },
  searchClear:          { fontSize: 14, color: '#666', paddingLeft: 8 },
  list:                 { paddingHorizontal: 12, paddingBottom: 32 },
  row:                  { gap: 10, marginBottom: 10 },
  card:                 { flex: 1, backgroundColor: '#1a1a1f', borderRadius: 10, overflow: 'hidden', borderWidth: 0.5, borderColor: '#2a2a2f' },
  cardImage:            { width: '100%', height: 110 },
  cardImagePlaceholder: { backgroundColor: '#222', alignItems: 'center', justifyContent: 'center' },
  cardImageEmoji:       { fontSize: 36 },
  cardBody:             { padding: 10, gap: 5 },
  cardTitle:            { fontSize: 13, fontWeight: '600', color: '#f0f0f0', lineHeight: 18 },
  cardMeta:             { flexDirection: 'row', gap: 10 },
  cardMetaText:         { fontSize: 11, color: '#666' },
  tagRow:               { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  tag:                  { backgroundColor: 'rgba(99,102,241,0.15)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  tagText:              { fontSize: 10, color: '#6366f1' },
  empty:                { textAlign: 'center', color: '#555', fontSize: 13, marginTop: 60 },
  error:                { color: '#e05858', fontSize: 12, textAlign: 'center', marginHorizontal: 16, marginBottom: 8 },
});