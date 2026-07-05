import React, { useState } from 'react';
import {
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  StyleSheet,
  Image, 
  TextInput, 
  ActivityIndicator,
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

function StatCard({ value, label, accent }: { value: string | number; label: string; accent?: string }) {
  const { colours } = useTheme();
  const s = createStyles(colours);
  return (
    <View style={s.statCard}>
      <Text style={[s.statVal, accent ? { color: accent } : {}]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function FeaturedCard({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
  const { colours } = useTheme();
  const s = createStyles(colours);
  const {as: ImagePlaceholderIcon, name: imagePlaceholderIcon} = ICONS.IMAGE_PLACEHOLDER;
  const {as: HeadIcon, name: headIcon} = ICONS.HEAD;
  const {as: TimerIcon, name: timerIcon} = ICONS.TIMER;

  const total = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);
  return (
    <TouchableOpacity style={s.featured} onPress={onPress} activeOpacity={0.8}>
      {recipe.image
        ? <Image source={{ uri: recipe.image }} style={s.featuredImg} />
        : <View style={[s.featuredImg, s.featuredImgPlaceholder]}><Text style={s.featuredEmoji}><ImagePlaceholderIcon name={imagePlaceholderIcon} size={40} /></Text></View>
      }
      <View style={s.featuredBody}>
        <Text style={s.featuredTitle} numberOfLines={1}>{recipe.title}</Text>
        <Text style={s.featuredMeta}>
          {[fmtTime(total) && ( <Text key="time"><TimerIcon name={timerIcon} size={10} />{fmtTime(total)} </Text>),
            (
              <Text key="servings"> <HeadIcon name={headIcon} size={10} /> {recipe.servings}  </Text>
            ),

            ...recipe.tags.slice(0, 2).map((tag, i) => ( <Text key={`tag-${i}`}>{tag}</Text> )),
          ]
            .filter(Boolean)
            .reduce((acc: any[], item, i) => {
              if (i > 0) acc.push(<Text key={`dot-${i}`}> · </Text>);
              acc.push(item);
              return acc;
            }, [])}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function MiniCard({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
  const { colours } = useTheme();
  const s = createStyles(colours);
  const {as: ImagePlaceholderIcon, name: imagePlaceholderIcon} = ICONS.IMAGE_PLACEHOLDER;
  const {as: TimerIcon, name: timerIcon} = ICONS.TIMER;

  const total = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);
  return (
    <TouchableOpacity style={s.miniCard} onPress={onPress} activeOpacity={0.8}>
      {recipe.image
        ? <Image source={{ uri: recipe.image }} style={s.miniImg} />
        : <View style={[s.miniImg, s.miniImgPlaceholder]}><Text style={s.miniEmoji}><ImagePlaceholderIcon name={imagePlaceholderIcon} size={24} /></Text></View>
      }
      <View style={s.miniBody}>
        <Text style={s.miniTitle} numberOfLines={2}>{recipe.title}</Text>
        {total > 0 && <Text style={s.miniMeta}><TimerIcon name={timerIcon} size={10} />{fmtTime(total)}</Text>}
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }: any) {
  const { colours } = useTheme();
  const s = createStyles(colours);

  const { recipes, remove, save, update, connected, loading, refresh } = useRecipes();
  const [query, setQuery] = useState('');

  const allTags   = Array.from(new Set(recipes.flatMap(r => r.tags)));
  const featured  = recipes[0] ?? null;
  const recent    = recipes.slice(1, 6);

  const handleSearch = () => {
    if (query.trim()) navigation.navigate('RecipeList', { query });
  };

  const {as: ArrowRightIcon, name: arrowRightIcon} = ICONS.ARROW_RIGHT;
  const {as: ImagePlaceholderIcon, name: imagePlaceholderIcon} = ICONS.IMAGE_PLACEHOLDER;
  const {as: AddIcon, name: addIcon} = ICONS.ADD;
  const {as: RefreshIcon, name: refreshIcon} = ICONS.REFRESH;

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Header 
          title="SmartPan"
          subtitle="What are we cooking today?"
          connected={connected}
          onPress={() => refresh()}
          buttonIcon={{ as: RefreshIcon, name: refreshIcon }}
          buttonText="Sync"
          loading={loading}
        />

        <SearchBar
          placeholder="Search recipes…"
          query={query}
          setQuery={setQuery}
          handleSearch={handleSearch}
        />

        {/* Stats */}
        <View style={s.statsRow}>
            <StatCard value={recipes.length} label="Recipes" />
            <StatCard value={allTags.length} label="Tags" />
        </View>

        {loading && recipes.length === 0 && (
            <ActivityIndicator color={colours.accent} style={{ marginTop: 40 }} />
        )}

        {/* Featured */}
        {featured && (
            <>
            <Text style={s.sectionTitle}>Featured</Text>
            <FeaturedCard
                recipe={featured}
                onPress={() => navigation.navigate('RecipeDetail', { id: featured.id })}
            />
            </>
        )}

        {/* Recent */}
        {recent.length > 0 && (
            <>
            <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Recent</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Recipes')}>
                <Text style={s.sectionMore}>See all <ArrowRightIcon name={arrowRightIcon} size={12} /></Text>
                </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.recentRow}>
                {recent.map(r => (
                <MiniCard
                    key={r.id}
                    recipe={r}
                    onPress={() => navigation.navigate('RecipeDetail', { id: r.id })}
                />
                ))}
            </ScrollView>
            </>
        )}

        {!loading && recipes.length === 0 && (
            <View style={s.empty}>
            <Text style={s.emptyEmoji}><ImagePlaceholderIcon name={imagePlaceholderIcon} size={40} /></Text>
            <Text style={s.emptyTitle}>No recipes yet</Text>
            <Text style={s.emptyText}>Add your first recipe or import from a URL</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('AddRecipe')}>
                <Text style={s.emptyBtnText}><AddIcon name={addIcon} size={16} /> Add recipe</Text>
            </TouchableOpacity>
            </View>
        )}

        <View style={{ height: 32 }} />
        </ScrollView>

        {/* FAB */}
        <TouchableOpacity style={s.fab} onPress={() => navigation.navigate('AddRecipe')}>
            <Text style={s.fabText}><AddIcon name={addIcon} size={24} /></Text>
        </TouchableOpacity>
    </View>
  );
}

const createStyles = (colours: ReturnType<typeof useTheme>['colours']) => StyleSheet.create({
  container:            { flex: 1, backgroundColor: colours.bg },
  scroll:               { paddingBottom: 80 },
  searchWrap:           { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 14, backgroundColor: colours.surface, borderRadius: 10, borderWidth: 0.5, borderColor: colours.border, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  searchIcon:           { fontSize: 14 },
  searchInput:          { flex: 1, fontSize: 14, color: colours.text },
  statsRow:             { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginBottom: 20 },
  statCard:             { flex: 1, backgroundColor: colours.surface, borderRadius: 10, borderWidth: 0.5, borderColor: colours.border, padding: 12, alignItems: 'center' },
  statVal:              { fontSize: 20, fontWeight: '600', color: colours.accent },
  statLabel:            { fontSize: 9, color: colours.textGhost, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
  sectionHeader:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 10 },
  sectionTitle:         { fontSize: 10, color: colours.textGhost, textTransform: 'uppercase', letterSpacing: 1.5, paddingHorizontal: 16, marginBottom: 10 },
  sectionMore:          { fontSize: 12, color: colours.accent },
  featured:             { marginHorizontal: 16, marginBottom: 20, backgroundColor: colours.surface, borderRadius: 12, overflow: 'hidden', borderWidth: 0.5, borderColor: colours.border },
  featuredImg:          { width: '100%', height: 140 },
  featuredImgPlaceholder:{ backgroundColor: colours.surface, alignItems: 'center', justifyContent: 'center' },
  featuredEmoji:        { fontSize: 48 },
  featuredBody:         { padding: 12 },
  featuredTitle:        { fontSize: 16, fontWeight: '600', color: colours.text },
  featuredMeta:         { fontSize: 12, color: colours.textGhost, marginTop: 4 },
  recentRow:            { paddingLeft: 16, paddingRight: 8, gap: 10 },
  miniCard:             { width: 130, backgroundColor: colours.surface, borderRadius: 10, overflow: 'hidden', borderWidth: 0.5, borderColor: colours.border },
  miniImg:              { width: '100%', height: 80 },
  miniImgPlaceholder:   { backgroundColor: colours.surface, alignItems: 'center', justifyContent: 'center' },
  miniEmoji:            { fontSize: 28 },
  miniBody:             { padding: 8 },
  miniTitle:            { fontSize: 12, fontWeight: '500', color: colours.text, lineHeight: 16 },
  miniMeta:             { fontSize: 10, color: colours.textGhost, marginTop: 3 },
  empty:                { alignItems: 'center', paddingTop: 40, paddingHorizontal: 32 },
  emptyEmoji:           { fontSize: 48, marginBottom: 12 },
  emptyTitle:           { fontSize: 16, fontWeight: '600', color: colours.text, marginBottom: 6 },
  emptyText:            { fontSize: 13, color: colours.textGhost, textAlign: 'center', lineHeight: 20 },
  emptyBtn:             { marginTop: 20, backgroundColor: colours.accent, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  emptyBtnText:         { color: '#fff', fontSize: 14, fontWeight: '600' },
  fab:                  { position: 'absolute', bottom: 24, right: 20, width: 52, height: 52, borderRadius: 26, backgroundColor: colours.accent, alignItems: 'center', justifyContent: 'center' },
  fabText:              { color: '#fff', fontSize: 28, lineHeight: 32 },
});