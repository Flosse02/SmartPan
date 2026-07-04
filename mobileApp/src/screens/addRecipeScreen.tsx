import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useRecipes } from '../context/RecipesContext';
import { api } from '../api';
import { ICONS } from '../constants/icons';

const EMPTY = {
  title: '', description: '', servings: '4', prepTime: '', cookTime: '',
  tags: '', image: '',
  ingredients: [{ amount: '', unit: '', name: '' }],
  steps: [{ text: '' }],
  notes: [{ text: '' }],
};

export default function AddRecipeScreen({ navigation, route }: any) {
  const editingRecipe = route.params?.recipe;
  const isEditing = !!editingRecipe;

  const { recipes, remove, save, update } = useRecipes()
  const [form,      setForm]      = useState(EMPTY);
  const [tab,       setTab]       = useState<'manual' | 'url'>('manual');
  const [url,       setUrl]       = useState('');
  const [importing, setImporting] = useState(false);
  const [saving,    setSaving]    = useState(false);

  const {as: AddIcon, name: addIcon} = ICONS.ADD;
  const {as: CloseIcon, name: closeIcon} = ICONS.CLOSE;
  const {as: ArrowLeftIcon, name: arrowLeftIcon} = ICONS.ARROW_LEFT;

  const setIng = (i: number, field: string, val: string) => {
    setForm(f => { const a = [...f.ingredients]; a[i] = { ...a[i], [field]: val }; return { ...f, ingredients: a }; });
  };

  const setStep = (i: number, val: string) => {
    setForm(f => { const a = [...f.steps]; a[i] = { text: val }; return { ...f, steps: a }; });
  };

  const setNote = (i: number, val: string) => {
    setForm(f => { const a = [...f.notes]; a[i] = { text: val }; return { ...f, notes: a }; });
  };

  useEffect(() => {
    if (!isEditing || !editingRecipe) return;

    setForm({
      title: editingRecipe.title ?? '',
      description: editingRecipe.description ?? '',
      servings: String(editingRecipe.servings ?? 4),
      prepTime:
        editingRecipe.prepTime != null ? String(editingRecipe.prepTime) : '',
      cookTime:
        editingRecipe.cookTime != null ? String(editingRecipe.cookTime) : '',
      tags: (editingRecipe.tags ?? []).join(', '),
      image: editingRecipe.image ?? '',
      ingredients: editingRecipe.ingredients?.length
        ? editingRecipe.ingredients.map((i: any) => ({
            amount: i.amount != null ? String(i.amount) : '',
            unit: i.unit ?? '',
            name: i.name,
          }))
        : [{ amount: '', unit: '', name: '' }],
      steps: editingRecipe.steps?.length
        ? editingRecipe.steps.map((s: any) => ({ text: s.text }))
        : [{ text: '' }],
      notes: editingRecipe.notes?.length
        ? editingRecipe.notes.map((n: any) => ({ text: n.text }))
        : [{ text: '' }],
    });
  }, [isEditing, editingRecipe]);

  const handleImport = async () => {
    if (!url.trim()) return;
    setImporting(true);
    try {
      const data = await api.importUrl(url.trim());
      console.log("IMPORT RESULT:", data);
      setForm({
        title:       data.title       ?? '',
        description: data.description ?? '',
        servings:    String(data.servings ?? 4),
        prepTime:    String(data.prepTime ?? ''),
        cookTime:    String(data.cookTime ?? ''),
        tags:        (data.tags ?? []).join(', '),
        image:       data.image       ?? '',
        ingredients: data.ingredients?.length
          ? data.ingredients.map((i: any) => ({ amount: i.amount != null ? String(i.amount) : '', unit: i.unit ?? '', name: i.name }))
          : [{ amount: '', unit: '', name: '' }],
        steps: data.steps?.length ? data.steps.map((s: any) => ({ text: s.text })) : [{ text: '' }],
        notes: data.notes?.length ? data.notes.map((n: any) => ({ text: n.text })) : [{ text: '' }],
      });
      setTab('manual');
    } catch (e: any) {
      Alert.alert('Import failed', e.message);
    } finally {
      setImporting(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;

    setSaving(true);

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        servings: Number(form.servings) || 4,
        prepTime: Number(form.prepTime) || undefined,
        cookTime: Number(form.cookTime) || undefined,
        tags: form.tags
          .split(',')
          .map(t => t.trim())
          .filter(Boolean),
        image: form.image.trim() || undefined,
        ingredients: form.ingredients
          .filter(i => i.name.trim())
          .map(i => ({
            amount: i.amount.trim() ? parseFloat(i.amount) : null,
            unit: i.unit.trim() || null,
            name: i.name.trim(),
          })),
        steps: form.steps.filter(s => s.text.trim()),
        notes: form.notes?.filter(n => n.text.trim()),
      };

      if (isEditing && editingRecipe) {
        await update({
          ...editingRecipe,
          ...payload,
        });
      } else {
        await save(payload);
      }

      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Save failed', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}><ArrowLeftIcon name={arrowLeftIcon} size={24} /></Text>
        </TouchableOpacity>
        <View style={s.tabs}>
          <TouchableOpacity style={[s.tab, tab === 'manual' && s.tabActive]} onPress={() => setTab('manual')}>
            <Text style={[s.tabText, tab === 'manual' && s.tabTextActive]}>Manual</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.tab, tab === 'url' && s.tabActive]} onPress={() => setTab('url')}>
            <Text style={[s.tabText, tab === 'url' && s.tabTextActive]}>Import URL</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={[s.saveBtn, !form.title.trim() && s.saveBtnDisabled]} onPress={handleSave} disabled={!form.title.trim() || saving}>
          {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveBtnText}>Save</Text>}
        </TouchableOpacity>
      </View>

      {tab === 'url' ? (
        <View style={s.importRow}>
          <TextInput style={[s.input, { flex: 1 }]} placeholder="https://..." placeholderTextColor="#555" value={url} onChangeText={setUrl} autoCapitalize="none" keyboardType="url" />
          <TouchableOpacity style={s.importBtn} onPress={handleImport} disabled={importing}>
            {importing ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.importBtnText}>Import</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={s.sectionLabel}>Basic Info</Text>
          <TextInput style={s.input} placeholder="Title *" placeholderTextColor="#555" value={form.title} onChangeText={v => setForm(f => ({ ...f, title: v }))} />
          <TextInput style={[s.input, s.textarea]} placeholder="Description" placeholderTextColor="#555" value={form.description} onChangeText={v => setForm(f => ({ ...f, description: v }))} multiline />
          <View style={s.row}>
            <TextInput style={[s.input, s.rowInput]} placeholder="Servings" placeholderTextColor="#555" value={form.servings} onChangeText={v => setForm(f => ({ ...f, servings: v }))} keyboardType="numeric" />
            <TextInput style={[s.input, s.rowInput]} placeholder="Prep (min)" placeholderTextColor="#555" value={form.prepTime} onChangeText={v => setForm(f => ({ ...f, prepTime: v }))} keyboardType="numeric" />
            <TextInput style={[s.input, s.rowInput]} placeholder="Cook (min)" placeholderTextColor="#555" value={form.cookTime} onChangeText={v => setForm(f => ({ ...f, cookTime: v }))} keyboardType="numeric" />
          </View>
          <TextInput style={s.input} placeholder="Tags (comma separated)" placeholderTextColor="#555" value={form.tags} onChangeText={v => setForm(f => ({ ...f, tags: v }))} />
          <TextInput style={s.input} placeholder="Image URL (optional)" placeholderTextColor="#555" value={form.image} onChangeText={v => setForm(f => ({ ...f, image: v }))} autoCapitalize="none" keyboardType="url" />

          <Text style={s.sectionLabel}>Ingredients</Text>
          {form.ingredients.map((ing, i) => (
            <View key={i} style={s.ingRow}>
              <TextInput style={[s.input, s.ingAmt]}  placeholder="Amt"  placeholderTextColor="#555" value={ing.amount} onChangeText={v => setIng(i, 'amount', v)} keyboardType="decimal-pad" />
              <TextInput style={[s.input, s.ingUnit]} placeholder="Unit" placeholderTextColor="#555" value={ing.unit}   onChangeText={v => setIng(i, 'unit',   v)} />
              <TextInput style={[s.input, s.ingName]} placeholder="Ingredient" placeholderTextColor="#555" value={ing.name} onChangeText={v => setIng(i, 'name', v)} />
              <TouchableOpacity onPress={() => setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, j) => j !== i) }))} style={s.removeBtn}>
                <Text style={s.removeBtnText}><CloseIcon name={closeIcon} size={24} color={"#444"} /></Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={s.addRowBtn} onPress={() => setForm(f => ({ ...f, ingredients: [...f.ingredients, { amount: '', unit: '', name: '' }] }))}>
            <Text style={s.addRowBtnText}><AddIcon name={addIcon} size={16} /> Ingredient</Text>
          </TouchableOpacity>

          <Text style={s.sectionLabel}>Steps</Text>
          {form.steps.map((step, i) => (
            <View key={i} style={s.stepRow}>
              <View style={s.stepNum}><Text style={s.stepNumText}>{i + 1}</Text></View>
              <TextInput style={[s.input, s.textarea, { flex: 1 }]} placeholder={`Step ${i + 1}…`} placeholderTextColor="#555" value={step.text} onChangeText={v => setStep(i, v)} multiline />
              <TouchableOpacity onPress={() => setForm(f => ({ ...f, steps: f.steps.filter((_, j) => j !== i) }))} style={s.removeBtn}>
                <Text style={s.removeBtnText}><CloseIcon name={closeIcon} size={24} color={"#444"} /></Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={s.addRowBtn} onPress={() => setForm(f => ({ ...f, steps: [...f.steps, { text: '' }] }))}>
            <Text style={s.addRowBtnText}><AddIcon name={addIcon} size={16} /> Step</Text>
          </TouchableOpacity>

          <Text style={s.sectionLabel}>Notes</Text>
          {form.notes.map((note, i) => (
            <View key={i} style={s.stepRow}>
              <View style={s.stepNum}><Text style={s.stepNumText}>{i + 1}</Text></View>
              <TextInput style={[s.input, s.textarea, { flex: 1 }]} placeholder={`Note ${i + 1}…`} placeholderTextColor="#555" value={note.text} onChangeText={v => setNote(i, v)} multiline />
              <TouchableOpacity onPress={() => setForm(f => ({ ...f, notes: f.notes.filter((_, j) => j !== i) }))} style={s.removeBtn}>
                <Text style={s.removeBtnText}><CloseIcon name={closeIcon} size={24} color={"#444"} /></Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={s.addRowBtn} onPress={() => setForm(f => ({ ...f, notes: [...f.notes, { text: '' }] }))}>
            <Text style={s.addRowBtnText}><AddIcon name={addIcon} size={16} /> Note</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#0f0f13' },
  header:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#1e1e24', gap: 10 },
  backBtn:         { padding: 4 },
  backText:        { color: '#aaa', fontSize: 20 },
  tabs:            { flex: 1, flexDirection: 'row', gap: 6 },
  tab:             { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 0.5, borderColor: '#2a2a2f' },
  tabActive:       { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  tabText:         { fontSize: 11, color: '#666' },
  tabTextActive:   { color: '#fff' },
  saveBtn:         { backgroundColor: '#6366f1', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText:     { color: '#fff', fontSize: 13, fontWeight: '600' },
  importRow:       { flexDirection: 'row', gap: 8, padding: 16 },
  importBtn:       { backgroundColor: '#6366f1', borderRadius: 8, paddingHorizontal: 14, justifyContent: 'center' },
  importBtnText:   { color: '#fff', fontSize: 13, fontWeight: '600' },
  scroll:          { flex: 1 },
  scrollContent:   { padding: 16, gap: 8 },
  sectionLabel:    { fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 12, marginBottom: 4 },
  input:           { backgroundColor: '#1a1a1f', borderWidth: 0.5, borderColor: '#2a2a2f', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: '#f0f0f0', fontSize: 13 },
  textarea:        { minHeight: 72, textAlignVertical: 'top' },
  row:             { flexDirection: 'row', gap: 8 },
  rowInput:        { flex: 1 },
  ingRow:          { flexDirection: 'row', gap: 6, alignItems: 'center' },
  ingAmt:          { width: 56 },
  ingUnit:         { width: 64 },
  ingName:         { flex: 1 },
  stepRow:         { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  stepNum:         { width: 24, height: 24, borderRadius: 12, borderWidth: 0.5, borderColor: '#6366f1', alignItems: 'center', justifyContent: 'center', marginTop: 10, flexShrink: 0 },
  stepNumText:     { fontSize: 11, color: '#6366f1' },
  removeBtn:       { padding: 8 },
  removeBtnText:   { color: '#555', fontSize: 13 },
  addRowBtn:       { borderWidth: 0.5, borderColor: '#2a2a2f', borderStyle: 'dashed', borderRadius: 8, paddingVertical: 10, alignItems: 'center', marginTop: 4 },
  addRowBtnText:   { color: '#555', fontSize: 12 },
});