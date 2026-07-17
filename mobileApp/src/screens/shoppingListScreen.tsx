import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { shoppingList, ShoppingListItem } from '../shoppingList';
import { Header } from '../util/header';
import { ICONS } from '../constants/icons';
import { useTheme } from '../theme/Themecontext';
import { formatFraction } from '../util/cleanIngridents';

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
    Alert.alert('Clear shopping list', 'Remove everything from the list?', [
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

  const sorted = [...items].sort((a, b) => Number(a.checked) - Number(b.checked));
  const checkedCount = items.filter(i => i.checked).length;

  return (
    <View style={s.container}>
      <Header
        title="Shopping List"
        subtitle={items.length ? `${items.length} item${items.length === 1 ? '' : 's'}` : 'Add ingredients from a recipe'}
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
                    {item.name}{fmtAmount(item) ? `  ·  ${fmtAmount(item)}` : ''}
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
});
