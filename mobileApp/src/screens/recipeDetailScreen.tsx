import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Image,
} from 'react-native';
import { Recipe } from '../types';
import { api } from '../api';
import { useRecipes } from '../context/RecipesContext';
import { ICONS } from '../constants/icons';

function scaleAmount(amount: number | null, base: number, current: number) {
  if (amount == null) return '';
  const scaled = (amount * current) / base;
  return scaled === Math.floor(scaled) ? String(scaled) : scaled.toFixed(1).replace(/\.0$/, '');
}

function fmtTime(min?: number) {
  if (!min) return null;
  if (min < 60) return `${min}m`;
  return `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}m` : ''}`;
}

export default function RecipeDetailScreen({ route, navigation }: any) {
  const { recipe }: { recipe: Recipe } = route.params;
  const { recipes, remove, save, update } = useRecipes()
  const [servings, setServings] = useState(recipe.servings);

  const {as: ImagePlaceholderIcon, name: imagePlaceholderIcon} = ICONS.IMAGE_PLACEHOLDER;
  const {as: ArrowLeftIcon, name: arrowLeftIcon} = ICONS.ARROW_LEFT;
  const {as: AddIcon, name: addIcon} = ICONS.ADD;
  const {as: MinusIcon, name: minusIcon} = ICONS.MINUS;

  const handleDelete = async () => {
    try {
      await remove(recipe.id);
      console.log('deleted, going back');
      navigation.goBack();
    } catch (error) {
      console.error('Failed to delete recipe:', error);
    }
  };
  
  return (
    <View style={s.container}>
      {/* Header image */}
      {recipe.image
        ? <Image source={{ uri: recipe.image }} style={s.hero} />
        : <View style={[s.hero, s.heroPlaceholder]}><Text style={s.heroEmoji}><ImagePlaceholderIcon name={imagePlaceholderIcon} size={40} /></Text></View>
      }

      {/* Back button */}
      <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
        <Text style={s.backText}><ArrowLeftIcon name={arrowLeftIcon} size={24} /></Text>
      </TouchableOpacity>

      {/* Delete button */}
      <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete()}>
        <Text style={s.deleteBtnText}>Delete</Text>
      </TouchableOpacity>

      {/* Cook button */}
      {/* <TouchableOpacity style={s.cookBtn} onPress={() => navigation.navigate('CookingMode', { recipe, servings })}>
        <Text style={s.cookBtnText}>Cook</Text>
      </TouchableOpacity> */}

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
        {/* Title & meta */}
        <Text style={s.title}>{recipe.title}</Text>
        {recipe.description && <Text style={s.desc}>{recipe.description}</Text>}

        <View style={s.metaRow}>
          {fmtTime(recipe.prepTime) && <View style={s.badge}><Text style={s.badgeText}>Prep {fmtTime(recipe.prepTime)}</Text></View>}
          {fmtTime(recipe.cookTime) && <View style={s.badge}><Text style={s.badgeText}>Cook {fmtTime(recipe.cookTime)}</Text></View>}
          {(recipe.tags ?? []).map(t => (
            <View key={t} style={[s.badge, s.badgeTag]}>
              <Text style={[s.badgeText, s.badgeTagText]}>{t}</Text>
            </View>
          ))}
        </View>

        {/* Servings */}
        <View style={s.servingsRow}>
          <Text style={s.sectionLabel}>Ingredients</Text>
          <View style={s.servingsControl}>
            <TouchableOpacity onPress={() => setServings(s => Math.max(1, s - 1))} style={s.servingsBtn}>
              <Text style={s.servingsBtnText}><MinusIcon name={minusIcon} size={16} /></Text>
            </TouchableOpacity>
            <Text style={s.servingsVal}>{servings}</Text>
            <TouchableOpacity onPress={() => setServings(s => s + 1)} style={s.servingsBtn}>
              <Text style={s.servingsBtnText}><AddIcon name={addIcon} size={16} /></Text>
            </TouchableOpacity>
          </View>
        </View>

        {(recipe.ingredients ?? []).map((ing, i) => (
          <View key={i} style={s.ingredient}>
            <Text style={s.ingredientAmount}>
              {[scaleAmount(ing.amount, recipe.servings, servings), ing.unit].filter(Boolean).join(' ')}
            </Text>
            <Text style={s.ingredientName}>{ing.name}</Text>
          </View>
        ))}

        {/* Steps */}
        <Text style={[s.sectionLabel, { marginTop: 24 }]}>Method</Text>
        {(recipe.steps ?? []).map((step, i) => (
          <View key={i} style={s.step}>
            <View style={s.stepNum}><Text style={s.stepNumText}>{i + 1}</Text></View>
            <Text style={s.stepText}>{step.text}</Text>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#0f0f13' },
  hero:             { width: '100%', height: 220 },
  heroPlaceholder:  { backgroundColor: '#1a1a1f', alignItems: 'center', justifyContent: 'center' },
  heroEmoji:        { fontSize: 60 },
  back:             { position: 'absolute', top: 52, left: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  backText:         { color: '#fff', fontSize: 18 },
  cookBtn:          { position: 'absolute', top: 52, right: 16, backgroundColor: '#6366f1', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  cookBtnText:      { color: '#fff', fontSize: 13, fontWeight: '600' },
  deleteBtn:        { position: 'absolute', top: 52, right: 16, backgroundColor: '#ef4444', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  deleteBtnText:    { color: '#fff', fontSize: 13, fontWeight: '600' },
  scroll:           { flex: 1 },
  scrollContent:    { padding: 16 },
  title:            { fontSize: 22, fontWeight: '700', color: '#f0f0f0', marginBottom: 6, letterSpacing: -0.3 },
  desc:             { fontSize: 13, color: '#888', lineHeight: 20, marginBottom: 10 },
  metaRow:          { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 },
  badge:            { backgroundColor: '#1e1e24', borderRadius: 5, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 0.5, borderColor: '#2a2a2f' },
  badgeText:        { fontSize: 11, color: '#888' },
  badgeTag:         { backgroundColor: 'rgba(99,102,241,0.12)', borderColor: 'rgba(99,102,241,0.25)' },
  badgeTagText:     { color: '#6366f1' },
  sectionLabel:     { fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 },
  servingsRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  servingsControl:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  servingsBtn:      { width: 28, height: 28, borderRadius: 6, borderWidth: 0.5, borderColor: '#333', alignItems: 'center', justifyContent: 'center' },
  servingsBtnText:  { color: '#aaa', fontSize: 16, lineHeight: 20 },
  servingsVal:      { fontSize: 14, color: '#f0f0f0', minWidth: 24, textAlign: 'center' },
  ingredient:       { flexDirection: 'row', gap: 12, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#1e1e24' },
  ingredientAmount: { fontSize: 13, color: '#6366f1', minWidth: 80, fontVariant: ['tabular-nums'] },
  ingredientName:   { fontSize: 13, color: '#d0d0d0', flex: 1 },
  step:             { flexDirection: 'row', gap: 12, marginBottom: 16 },
  stepNum:          { width: 24, height: 24, borderRadius: 12, borderWidth: 0.5, borderColor: '#6366f1', alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 },
  stepNumText:      { fontSize: 11, color: '#6366f1' },
  stepText:         { fontSize: 14, color: '#d0d0d0', lineHeight: 22, flex: 1 },
});