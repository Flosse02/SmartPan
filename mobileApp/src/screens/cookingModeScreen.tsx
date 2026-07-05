import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView,
} from 'react-native';
import { Recipe } from '../types';
import { ICONS } from '../constants/icons';
import { useTheme } from '../theme/Themecontext';

function scaleAmount(amount: number | null, base: number, current: number) {
  if (amount == null) return '';
  const scaled = (amount * current) / base;
  return scaled === Math.floor(scaled) ? String(scaled) : scaled.toFixed(1).replace(/\.0$/, '');
}

export default function CookingModeScreen({ route, navigation }: any) {
  const { colours } = useTheme();
  const s = createStyles(colours);

  const { recipe, servings = recipe.servings }: { recipe: Recipe; servings: number } = route.params;
  const [step,    setStep]    = useState(0);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const total = recipe.steps.length;

  const {as: CloseIcon, name: closeIcon} = ICONS.CLOSE;
  const {as: ArrowLeftIcon, name: arrowLeftIcon} = ICONS.ARROW_LEFT;
  const {as: ArrowRightIcon, name: arrowRightIcon} = ICONS.ARROW_RIGHT;
  const {as: TickIcon, name: tickIcon} = ICONS.TICK;

  const toggle = (i: number) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title} numberOfLines={1}>{recipe.title}</Text>
        <Text style={s.progress}>{step + 1} / {total}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.closeBtn}>
          <CloseIcon name={closeIcon} size={24} color={colours.textGhost} />
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
                {checked.has(i) ? <TickIcon name={tickIcon} size={10} color={colours.success}/> : '○'}
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
          onPress={() => setStep(prev => Math.max(0, prev - 1))}
          disabled={step === 0}
        >
          <Text style={[s.navBtnText, step === 0 && s.navBtnTextDisabled]}><ArrowLeftIcon name={arrowLeftIcon} size={24} color={ step === 0 ? colours.textGhost : colours.text } /> Prev</Text>
        </TouchableOpacity>

        {step < total - 1
          ? <TouchableOpacity style={[s.navBtn, s.navBtnPrimary]} onPress={() => setStep(prev => prev + 1)}>
              <Text style={s.navBtnTextPrimary}>Next <ArrowRightIcon name={arrowRightIcon} size={24} color={colours.text} /></Text>
            </TouchableOpacity>
          : <TouchableOpacity style={[s.navBtn, s.navBtnDone]} onPress={() => navigation.goBack()}>
              <Text style={s.navBtnTextPrimary}>Done <TickIcon name={tickIcon} size={24} color={colours.text}/></Text>
            </TouchableOpacity>
        }
      </View>
    </View>
  );
}

const createStyles = (colours: ReturnType<typeof useTheme>['colours']) => StyleSheet.create({
  container:            { flex: 1, backgroundColor: colours.bg },
  header:               { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 10, borderBottomWidth: 0.5, borderBottomColor: colours.border },
  title:                { flex: 1, fontSize: 13, color: colours.textGhost, letterSpacing: 1, textTransform: 'uppercase' },
  progress:             { fontSize: 12, color: colours.textGhost },
  closeBtn:             { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  closeBtnText:         { color: colours.text, fontSize: 16 },
  scroll:               { flex: 1 },
  scrollContent:        { padding: 16, gap: 20 },
  sectionLabel:         { fontSize: 10, color: colours.textGhost, textTransform: 'uppercase', letterSpacing: 1.5 },
  ingredientsList:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ingredient:           { flexDirection: 'row', alignItems: 'center', width: '100%', gap: 6, backgroundColor: colours.surface, borderWidth: 0.5, borderColor: colours.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  ingredientChecked:    { backgroundColor: 'rgba(76,175,125,0.08)', borderColor: colours.accent, opacity: 0.5 },
  ingredientCheck:      { fontSize: 11, color: colours.textGhost },
  ingredientCheckDone:  { color: colours.success },
  ingredientText:       { fontSize: 12, color: colours.text },
  ingredientTextDone:   { textDecorationLine: 'line-through', color: colours.textGhost },
  ingredientAmount:     { color: colours.accent },
  stepCard:             { backgroundColor: colours.surface, borderRadius: 12, padding: 20, borderWidth: 0.5, borderColor: colours.border, gap: 12 },
  stepLabel:            { fontSize: 11, color: colours.accent, textTransform: 'uppercase', letterSpacing: 1.5 },
  stepText:             { fontSize: 22, color: colours.text, lineHeight: 34, fontWeight: '500' },
  dots:                 { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  dot:                  { width: 8, height: 8, borderRadius: 4 },
  dotIdle:              { backgroundColor: colours.surface, borderColor: colours.border, borderWidth: 0.5 },
  dotActive:            { backgroundColor: colours.accent },
  dotDone:              { backgroundColor: colours.textGhost },
  nav:                  { flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 0.5, borderTopColor: colours.border },
  navBtn:               { flex: 1, paddingVertical: 14, borderRadius: 10, borderWidth: 0.5, borderColor: colours.border, alignItems: 'center' },
  navBtnDisabled:       { opacity: 0.3 },
  navBtnPrimary:        { backgroundColor: colours.accent, borderColor: colours.accent },
  navBtnDone:           { backgroundColor: colours.success, borderColor: colours.success },
  navBtnText:           { fontSize: 14, color: colours.text, fontWeight: '500' },
  navBtnTextDisabled:   { color: colours.textGhost },
  navBtnTextPrimary:    { fontSize: 14, color: colours.text, fontWeight: '600' },
});