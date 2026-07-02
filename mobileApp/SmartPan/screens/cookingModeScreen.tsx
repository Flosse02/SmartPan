import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView,
} from 'react-native';
import { Recipe } from '../types';

function scaleAmount(amount: number | null, base: number, current: number) {
  if (amount == null) return '';
  const scaled = (amount * current) / base;
  return scaled === Math.floor(scaled) ? String(scaled) : scaled.toFixed(1).replace(/\.0$/, '');
}

export default function CookingModeScreen({ route, navigation }: any) {
  const { recipe, servings = recipe.servings }: { recipe: Recipe; servings: number } = route.params;
  const [step,    setStep]    = useState(0);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const total = recipe.steps.length;

  const toggle = (i: number) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title} numberOfLines={1}>{recipe.title}</Text>
        <Text style={s.progress}>{step + 1} / {total}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.closeBtn}>
          <Text style={s.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
        {/* Ingredient checklist */}
        <Text style={s.sectionLabel}>Ingredients · {checked.size}/{recipe.ingredients.length} used</Text>
        <View style={s.ingredientsList}>
          {recipe.ingredients.map((ing, i) => (
            <TouchableOpacity
              key={i}
              style={[s.ingredient, checked.has(i) && s.ingredientChecked]}
              onPress={() => toggle(i)}
              activeOpacity={0.7}
            >
              <Text style={[s.ingredientCheck, checked.has(i) && s.ingredientCheckDone]}>
                {checked.has(i) ? '✓' : '○'}
              </Text>
              <Text style={[s.ingredientText, checked.has(i) && s.ingredientTextDone]}>
                <Text style={s.ingredientAmount}>
                  {[scaleAmount(ing.amount, recipe.servings, servings), ing.unit].filter(Boolean).join(' ')}
                  {' '}
                </Text>
                {ing.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Current step */}
        <View style={s.stepCard}>
          <Text style={s.stepLabel}>Step {step + 1}</Text>
          <Text style={s.stepText}>{recipe.steps[step].text}</Text>
        </View>

        {/* Dot nav */}
        <View style={s.dots}>
          {recipe.steps.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => setStep(i)}>
              <View style={[s.dot, i === step ? s.dotActive : i < step ? s.dotDone : s.dotIdle]} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Nav buttons */}
      <View style={s.nav}>
        <TouchableOpacity
          style={[s.navBtn, step === 0 && s.navBtnDisabled]}
          onPress={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          <Text style={[s.navBtnText, step === 0 && s.navBtnTextDisabled]}>← Prev</Text>
        </TouchableOpacity>

        {step < total - 1
          ? <TouchableOpacity style={[s.navBtn, s.navBtnPrimary]} onPress={() => setStep(s => s + 1)}>
              <Text style={s.navBtnTextPrimary}>Next →</Text>
            </TouchableOpacity>
          : <TouchableOpacity style={[s.navBtn, s.navBtnDone]} onPress={() => navigation.goBack()}>
              <Text style={s.navBtnTextPrimary}>Done ✓</Text>
            </TouchableOpacity>
        }
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:            { flex: 1, backgroundColor: '#0a0a0d' },
  header:               { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 10, borderBottomWidth: 0.5, borderBottomColor: '#1e1e24' },
  title:                { flex: 1, fontSize: 13, color: '#888', letterSpacing: 1, textTransform: 'uppercase' },
  progress:             { fontSize: 12, color: '#555' },
  closeBtn:             { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  closeBtnText:         { color: '#666', fontSize: 16 },
  scroll:               { flex: 1 },
  scrollContent:        { padding: 16, gap: 20 },
  sectionLabel:         { fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: 1.5 },
  ingredientsList:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ingredient:           { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1a1a1f', borderWidth: 0.5, borderColor: '#2a2a2f', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  ingredientChecked:    { backgroundColor: 'rgba(76,175,125,0.08)', borderColor: '#4caf7d', opacity: 0.5 },
  ingredientCheck:      { fontSize: 11, color: '#555' },
  ingredientCheckDone:  { color: '#4caf7d' },
  ingredientText:       { fontSize: 12, color: '#d0d0d0' },
  ingredientTextDone:   { textDecorationLine: 'line-through', color: '#555' },
  ingredientAmount:     { color: '#6366f1' },
  stepCard:             { backgroundColor: '#1a1a1f', borderRadius: 12, padding: 20, borderWidth: 0.5, borderColor: '#2a2a2f', gap: 12 },
  stepLabel:            { fontSize: 11, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 1.5 },
  stepText:             { fontSize: 22, color: '#f0f0f0', lineHeight: 34, fontWeight: '500' },
  dots:                 { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  dot:                  { width: 8, height: 8, borderRadius: 4 },
  dotIdle:              { backgroundColor: '#2a2a2f' },
  dotActive:            { backgroundColor: '#6366f1' },
  dotDone:              { backgroundColor: '#444' },
  nav:                  { flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 0.5, borderTopColor: '#1e1e24' },
  navBtn:               { flex: 1, paddingVertical: 14, borderRadius: 10, borderWidth: 0.5, borderColor: '#2a2a2f', alignItems: 'center' },
  navBtnDisabled:       { opacity: 0.3 },
  navBtnPrimary:        { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  navBtnDone:           { backgroundColor: '#4caf7d', borderColor: '#4caf7d' },
  navBtnText:           { fontSize: 14, color: '#888', fontWeight: '500' },
  navBtnTextDisabled:   { color: '#444' },
  navBtnTextPrimary:    { fontSize: 14, color: '#fff', fontWeight: '600' },
});