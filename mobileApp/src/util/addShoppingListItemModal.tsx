import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { shoppingList, ShoppingListItem } from '../shoppingList';
import { useTheme } from '../theme/Themecontext';

type AddShoppingListItemModalProps = {
  visible: boolean;
  onClose: () => void;
  // Only needed by screens that already keep their own copy of the list in
  // state (e.g. ShoppingListScreen) and want it to update immediately
  // without waiting for a refocus/AppState refresh.
  onAdded?: (items: ShoppingListItem[]) => void;
};

const EMPTY_ITEM = { amount: '', unit: '', name: '' };

/**
 * Single-item add form, usable from anywhere (Home's quick-access card,
 * the Shopping List screen's own Add button) without needing to navigate
 * to the Shopping List screen first — it stays mounted and just toggles
 * `visible`, same pattern as ShoppingListPickerModal.
 */
export function AddShoppingListItemModal({ visible, onClose, onAdded }: AddShoppingListItemModalProps) {
  const { colours } = useTheme();
  const s = createStyles(colours);
  const [newItem, setNewItem] = useState(EMPTY_ITEM);

  // Reset the form on each open — the modal stays mounted between uses
  // rather than remounting, so this can't just be initial state.
  useEffect(() => {
    if (visible) setNewItem(EMPTY_ITEM);
  }, [visible]);

  const confirm = async () => {
    if (!newItem.name.trim()) return;
    const items = await shoppingList.addIngredients(
      [{
        amount: newItem.amount.trim() ? parseFloat(newItem.amount) : 1,
        unit: newItem.unit.trim() || null,
        name: newItem.name.trim(),
      }],
      'Manually added'
    );
    onAdded?.(items);
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.card}>
          <Text style={s.title}>Add Ingredient</Text>
          <Text style={s.message}>Add ingredient to shopping list</Text>
          <View style={s.ingRow}>
            <TextInput style={[s.input, s.ingAmt]} placeholder="Amt" placeholderTextColor={colours.textGhost} value={newItem.amount} onChangeText={v => setNewItem(f => ({ ...f, amount: v }))} keyboardType="decimal-pad" />
            <TextInput style={[s.input, s.ingUnit]} placeholder="Unit" placeholderTextColor={colours.textGhost} value={newItem.unit} onChangeText={v => setNewItem(f => ({ ...f, unit: v }))} />
            <TextInput style={[s.input, s.ingName]} placeholder="Ingredient" placeholderTextColor={colours.textGhost} value={newItem.name} onChangeText={v => setNewItem(f => ({ ...f, name: v }))} />
          </View>
          <View style={s.actions}>
            <TouchableOpacity style={[s.btn, s.btnCancel]} onPress={onClose}>
              <Text style={[s.btnText, s.btnTextCancel]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btn} onPress={confirm} disabled={!newItem.name.trim()}>
              <Text style={s.btnText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colours: ReturnType<typeof useTheme>['colours']) => StyleSheet.create({
  backdrop:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  card:         { width: '100%', maxWidth: 340, backgroundColor: colours.surface, borderRadius: 14, padding: 20, gap: 8 },
  title:        { fontSize: 16, fontWeight: '600', color: colours.text, textAlign: 'center' },
  message:      { fontSize: 13, color: colours.textGhost, textAlign: 'center', lineHeight: 19, marginTop: 2 },
  ingRow:       { flexDirection: 'row', gap: 6, alignItems: 'center' },
  ingAmt:       { width: 56 },
  ingUnit:      { width: 64 },
  ingName:      { flex: 1 },
  input:        { backgroundColor: colours.surface, borderWidth: 0.5, borderColor: colours.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: colours.text, fontSize: 13 },
  actions:      { flexDirection: 'row', gap: 8, marginTop: 14 },
  btn:          { flex: 1, backgroundColor: colours.accent, borderRadius: 8, paddingVertical: 11, alignItems: 'center' },
  btnCancel:    { backgroundColor: colours.bg, borderWidth: 0.5, borderColor: colours.border },
  btnText:      { color: '#fff', fontSize: 14, fontWeight: '600' },
  btnTextCancel:{ color: colours.textGhost },
});
