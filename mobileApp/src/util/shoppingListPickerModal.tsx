import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import { Recipe } from '../types';
import { ICONS } from '../constants/icons';
import { useTheme } from '../theme/Themecontext';
import { shoppingList } from '../shoppingList';
import { scaleAmount } from './cleanIngridents';
import { alert } from './alertStore';

type ShoppingListPickerModalProps = {
  recipe: Recipe;
  visible: boolean;
  onClose: () => void;
  // Scales quantities relative to recipe.servings — pass the recipe detail
  // screen's adjustable servings count; omit (e.g. from a recipe card,
  // which has no servings control) to use the recipe's default.
  servings?: number;
};

/**
 * Ingredient picker used both by the "Add to shopping list" button on the
 * recipe detail screen and the quick cart button on recipe cards — kept as
 * one shared component so both stay behaviorally identical rather than
 * drifting apart as two separate copies.
 */
export function ShoppingListPickerModal({ recipe, visible, onClose, servings }: ShoppingListPickerModalProps) {
  const { colours } = useTheme();
  const s = createStyles(colours);
  const effectiveServings = servings ?? recipe.servings;
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const {as: TickIcon, name: tickIcon} = ICONS.TICK;

  useEffect(() => {
    if (visible) {
      setSelected(new Set((recipe.ingredients ?? []).map((_, i) => i)));
    }
  }, [visible, recipe]);

  const toggle = (i: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const confirm = async () => {
    const items = (recipe.ingredients ?? [])
      .filter((ing, i) => selected.has(i) && ing.name.trim())
      .map(ing => ({
        name: ing.name,
        unit: ing.unit,
        amount: ing.amount != null ? (ing.amount * effectiveServings) / recipe.servings : null,
      }));
    onClose();
    if (items.length === 0) return;
    await shoppingList.addIngredients(items, recipe.title);
    alert('Added to shopping list', `${items.length} ingredient${items.length === 1 ? '' : 's'} added.`);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={s.modalBackdrop} activeOpacity={1} onPress={onClose}>
        <View style={s.modalCard}>
          <Text style={s.modalTitle}>Add to shopping list</Text>

          <ScrollView style={s.modalList}>
            {(recipe.ingredients ?? []).map((ing, i) => {
              const checked = selected.has(i);
              return (
                <TouchableOpacity key={i} style={s.modalIngredientRow} onPress={() => toggle(i)}>
                  <View style={[s.checkbox, checked && s.checkboxChecked]}>
                    {checked && <TickIcon name={tickIcon} size={12} color="#fff" />}
                  </View>
                  <Text style={s.modalIngredientText}>
                    {[scaleAmount(ing.amount, recipe.servings, effectiveServings), ing.unit, ing.name].filter(Boolean).join(' ')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={s.modalLinksRow}>
            <TouchableOpacity onPress={() => setSelected(new Set((recipe.ingredients ?? []).map((_, i) => i)))}>
              <Text style={s.modalLinkText}>Select all</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelected(new Set())}>
              <Text style={s.modalLinkText}>Select none</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[s.modalConfirmBtn, selected.size === 0 && s.modalConfirmBtnDisabled]}
            onPress={confirm}
            disabled={selected.size === 0}
          >
            <Text style={s.modalConfirmBtnText}>Add {selected.size > 0 ? `(${selected.size})` : ''}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.modalCancel} onPress={onClose}>
            <Text style={s.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const createStyles = (colours: ReturnType<typeof useTheme>['colours']) => StyleSheet.create({
  modalBackdrop:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard:          { maxHeight: '80%', backgroundColor: colours.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, paddingBottom: 32, gap: 10 },
  modalTitle:         { fontSize: 16, fontWeight: '600', color: colours.text, textAlign: 'center' },
  modalList:          { flexGrow: 0 },
  modalIngredientRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: colours.border },
  checkbox:           { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colours.border, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked:    { backgroundColor: colours.accent, borderColor: colours.accent },
  modalIngredientText:{ flex: 1, fontSize: 13, color: colours.text },
  modalLinksRow:      { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 4 },
  modalLinkText:      { color: colours.accent, fontSize: 12, fontWeight: '600' },
  modalConfirmBtn:    { backgroundColor: colours.accent, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 6 },
  modalConfirmBtnDisabled: { opacity: 0.4 },
  modalConfirmBtnText:{ color: '#fff', fontSize: 14, fontWeight: '600' },
  modalCancel:        { paddingVertical: 10, alignItems: 'center' },
  modalCancelText:    { fontSize: 14, color: colours.textGhost },
});
