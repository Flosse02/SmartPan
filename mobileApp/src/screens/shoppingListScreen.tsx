import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, AppState, Modal, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { shoppingList, ShoppingListItem } from '../shoppingList';
import { Header } from '../util/header';
import { ICONS } from '../constants/icons';
import { useTheme } from '../theme/Themecontext';
import { formatFraction } from '../util/cleanIngridents';
import { alert } from '../util/alertStore';

function fmtAmount(item: ShoppingListItem) {
  return [item.amount != null ? formatFraction(Number(item.amount.toFixed(3))) : null, item.unit]
    .filter(Boolean)
    .join(' ');
}

export default function ShoppingListScreen() {
  const { colours } = useTheme();
  const s = createStyles(colours);
  const [items, setItems] = useState<ShoppingListItem[]>([]);

  const load = useCallback(() => {
    shoppingList.getAll().then(setItems);
  }, []);

  useFocusEffect(load);

  // useFocusEffect only fires on in-app navigation transitions — if this
  // tab was already active when the app was backgrounded (e.g. tapping the
  // widget to reopen the app while already on Shopping List), navigating
  // "into" the same already-focused screen isn't a focus change, so it
  // never re-fires. The widget can toggle items while the app is
  // backgrounded, so also refresh whenever the app returns to the foreground.
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') load();
    });
    return () => sub.remove();
  }, [load]);

  const toggle = async (id: string) => {
    setItems(await shoppingList.toggleChecked(id));
  };

  const remove = async (id: string) => {
    setItems(await shoppingList.removeItem(id));
  };

  const clearChecked = async () => {
    setItems(await shoppingList.clearChecked());
  };

  const clearAll = () => {
    alert('Clear shopping list', 'Remove everything from the list?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear all',
        style: 'destructive',
        onPress: async () => setItems(await shoppingList.clearAll()),
      },
    ]);
  };

  const {as: CheckIcon, name: checkIcon} = ICONS.TICK;
  const {as: TrashIcon, name: trashIcon} = ICONS.TRASH;
  const {as: AddIcon, name: addIcon} = ICONS.ADD;

  const [pickerVisible, setPickerVisible] = useState(false);
  const [newItem, setNewItem] = useState({ amount: '', unit: '', name: '' });

  const openAddPicker = () => {
    setNewItem({ amount: '', unit: '', name: '' });
    setPickerVisible(true);
  };

  const confirmAddItem = async () => {
    if (!newItem.name.trim()) return;
    setItems(await shoppingList.addIngredients(
      [{
        amount: newItem.amount.trim() ? parseFloat(newItem.amount) : 1,
        unit: newItem.unit.trim() || null,
        name: newItem.name.trim(),
      }],
      'Manually added'
    ));
    setPickerVisible(false);
  };

  const sorted = [...items].sort((a, b) => Number(a.checked) - Number(b.checked));
  const checkedCount = items.filter(i => i.checked).length;

  return (
    <View style={s.container}>
      <Header
        title="Shopping List"
        subtitle={items.length ? `${items.length} item${items.length === 1 ? '' : 's'}` : 'Add ingredients from a recipe'}
        onPress={openAddPicker}
        buttonIcon={{ as: AddIcon, name: addIcon }}
      />

      {items.length > 0 && (
        <View style={s.actionsRow}>
          <TouchableOpacity style={s.actionBtn} disabled={checkedCount === 0} onPress={clearChecked}>
            <Text style={[s.actionBtnText, checkedCount === 0 && s.actionBtnTextDisabled]}>Clear checked</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtn} onPress={clearAll}>
            <Text style={s.actionBtnTextDanger}>Clear all</Text>
          </TouchableOpacity>
        </View>
      )}

      {items.length === 0 ? (
        <Text style={s.empty}>Your shopping list is empty — add ingredients from a recipe's detail screen.</Text>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={i => i.id}
          contentContainerStyle={s.list}
          renderItem={({ item }) => (
            <View style={s.row}>
              <TouchableOpacity style={s.rowMain} onPress={() => toggle(item.id)} activeOpacity={0.7}>
                <View style={[s.checkbox, item.checked && s.checkboxChecked]}>
                  {item.checked && <CheckIcon name={checkIcon} size={12} color="#fff" />}
                </View>
                <View style={s.rowText}>
                  <Text style={[s.itemName, item.checked && s.itemNameChecked]}>
                    {fmtAmount(item) ? `${fmtAmount(item)} ` : ''}{item.name}
                  </Text>
                  <Text style={s.itemSource} numberOfLines={1}>{item.recipeTitles.join(', ')}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => remove(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <TrashIcon name={trashIcon} size={18} color={colours.textGhost} />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <Modal
        transparent
        visible={pickerVisible}
        animationType="fade"
        onRequestClose={() => setPickerVisible(false)}
      >
        <View style={s.backdrop}>
           <View style={s.card}>
              <Text style={s.title}>Add Ingredient</Text>
              <Text style={s.message}>Add ingredient to shopping list</Text>
              <View style={s.ingRow}>
                <TextInput style={[s.input, s.ingAmt]}  placeholder="Amt"  placeholderTextColor={colours.textGhost} value={newItem.amount} onChangeText={v => setNewItem(f => ({ ...f, amount: v }))} keyboardType="decimal-pad" />
                <TextInput style={[s.input, s.ingUnit]} placeholder="Unit" placeholderTextColor={colours.textGhost} value={newItem.unit}   onChangeText={v => setNewItem(f => ({ ...f, unit: v }))} />
                <TextInput style={[s.input, s.ingName]} placeholder="Ingredient" placeholderTextColor={colours.textGhost} value={newItem.name} onChangeText={v => setNewItem(f => ({ ...f, name: v }))} />
              </View>
              <View style={s.actions}>
                <TouchableOpacity style={[s.btn, s.btnCancel]} onPress={() => setPickerVisible(false)}>
                  <Text style={[s.btnText, s.btnTextCancel]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.btn} onPress={confirmAddItem} disabled={!newItem.name.trim()}>
                  <Text style={s.btnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colours: ReturnType<typeof useTheme>['colours']) => StyleSheet.create({
  container:          { flex: 1, backgroundColor: colours.bg },
  actionsRow:         { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 10 },
  actionBtn:          { backgroundColor: colours.surface, borderRadius: 8, borderWidth: 0.5, borderColor: colours.border, paddingHorizontal: 12, paddingVertical: 7 },
  actionBtnText:      { fontSize: 12, color: colours.accent, fontWeight: '600' },
  actionBtnTextDisabled: { color: colours.textGhost },
  actionBtnTextDanger: { fontSize: 12, color: colours.error, fontWeight: '600' },
  empty:              { textAlign: 'center', color: colours.textGhost, fontSize: 13, marginTop: 60, marginHorizontal: 32, lineHeight: 20 },
  list:               { paddingHorizontal: 16, paddingBottom: 32 },
  row:                { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: colours.border },
  rowMain:            { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox:           { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colours.border, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked:    { backgroundColor: colours.accent, borderColor: colours.accent },
  rowText:            { flex: 1 },
  itemName:           { fontSize: 14, color: colours.text },
  itemNameChecked:    { color: colours.textGhost, textDecorationLine: 'line-through' },
  itemSource:         { fontSize: 11, color: colours.textGhost, marginTop: 2 },

  backdrop:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  card:             { width: '100%', maxWidth: 340, backgroundColor: colours.surface, borderRadius: 14, padding: 20, gap: 8 },
  title:            { fontSize: 16, fontWeight: '600', color: colours.text, textAlign: 'center' },
  message:          { fontSize: 13, color: colours.textGhost, textAlign: 'center', lineHeight: 19, marginTop: 2 },
  actions:          { flexDirection: 'row', gap: 8, marginTop: 14 },
  btn:              { flex: 1, backgroundColor: colours.accent, borderRadius: 8, paddingVertical: 11, alignItems: 'center' },
  btnCancel:        { backgroundColor: colours.bg, borderWidth: 0.5, borderColor: colours.border },
  btnDestructive:   { backgroundColor: colours.error },
  btnText:          { color: '#fff', fontSize: 14, fontWeight: '600' },
  btnTextCancel:    { color: colours.textGhost },
  btnTextDestructive: { color: '#fff' },
  ingRow:          { flexDirection: 'row', gap: 6, alignItems: 'center' },
  ingAmt:          { width: 56 },
  ingUnit:         { width: 64 },
  ingName:         { flex: 1 },
  input:           { backgroundColor: colours.surface, borderWidth: 0.5, borderColor: colours.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: colours.text, fontSize: 13 },
  removeBtn:       { padding: 8 },
  removeBtnText:   { color: colours.textGhost, fontSize: 13 },
});