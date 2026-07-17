import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Recipe } from '../types';
import { ICONS } from '../constants/icons';
import { useTheme } from '../theme/Themecontext';
import { useRecipes } from '../context/RecipesContext';

function fmtTime(min?: number) {
  if (!min) return null;
  if (min < 60) return `${min}m`;
  return `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}m` : ''}`;
}

export function RecipeCard({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
  const { colours } = useTheme();
  const { toggleFavourite } = useRecipes();
  const s = createStyles(colours);
  const {as: HeadIcon, name: headIcon} = ICONS.HEAD;
  const {as: TimerIcon, name: timerIcon} = ICONS.TIMER;
  const {as: ImagePlaceholderIcon, name: imagePlaceholderIcon} = ICONS.IMAGE_PLACEHOLDER;
  const {as: SyncPendingIcon, name: syncPendingIcon} = ICONS.SYNC_PENDING;
  const {as: HeartIcon, name: heartIcon} = ICONS.HEART;
  const {as: HeartOutlineIcon, name: heartOutlineIcon} = ICONS.HEART_OUTLINE;

  const total = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);
  const pendingSync = recipe.id.startsWith('temp-') || !!recipe.editPending;

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

      <TouchableOpacity
        style={s.favBtn}
        onPress={() => toggleFavourite(recipe.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {recipe.favourite
          ? <HeartIcon name={heartIcon} size={15} color={colours.error} />
          : <HeartOutlineIcon name={heartOutlineIcon} size={15} color={colours.borderLight} />
        }
      </TouchableOpacity>
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

export const createStyles = (colours: ReturnType<typeof useTheme>['colours']) => StyleSheet.create({
  card:                 { flex: 1, backgroundColor: colours.surface, borderRadius: 10, overflow: 'hidden', borderWidth: 0.5, borderColor: colours.border },
  cardImage:            { width: '100%', height: 110 },
  cardImagePlaceholder: { backgroundColor: colours.accentBg, alignItems: 'center', justifyContent: 'center' },
  cardImageEmoji:       { fontSize: 36 },
  syncBadge:            { position: 'absolute', top: 6, left: 6, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colours.surface, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  syncBadgeText:        { fontSize: 9, color: colours.accent, fontWeight: '600' },
  favBtn:               { position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  cardBody:             { padding: 10, gap: 5 },
  cardTitle:            { fontSize: 13, fontWeight: '600', color: colours.text, lineHeight: 18 },
  cardMeta:             { flexDirection: 'row', gap: 10 },
  cardMetaText:         { fontSize: 11, color: colours.textGhost },
  tagRow:               { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  tag:                  { backgroundColor: 'rgba(99,102,241,0.15)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  tagText:              { fontSize: 10, color: colours.accent },
});
