import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Header } from '../util/header';
import { useTheme } from '../theme/Themecontext';
import { InputBar } from '../util/inputBar';
import { useConfig } from '../context/ConfigContext';
import { useRecipes } from '../context/RecipesContext';
import { alert } from '../util/alertStore';

const OPTIONS: { label: string; value: 'system' | 'light' | 'dark' }[] = [
  { label: 'System', value: 'system' },
  { label: 'Light',  value: 'light'  },
  { label: 'Dark',   value: 'dark'   },
];

export default function SettingsScreen() {
  const { colours, mode, setMode } = useTheme();
  const { config, updateConfig } = useConfig();
  const { dedupe, resetLocal } = useRecipes();
  const [deduping, setDeduping] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [ipAddress, setIpAddress] = useState('');
  const [port, setPort] = useState('');
  const styles = s(colours);

  const { connected } = useRecipes();

  useEffect(() => {
    if (config) {
      setIpAddress(config.ip);
      setPort(config.port);
    }
  }, [config]);

  const handleSave = async () => {
    updateConfig(ipAddress, port)
    console.log("Saving")
  };

  const handleReset = () => {
    alert(
      'Delete all recipes on this phone?',
      'This clears everything cached on this device and re-downloads your recipe list fresh from the server. Your recipes on the server are NOT affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete & resync',
          style: 'destructive',
          onPress: async () => {
            setResetting(true);
            try {
              await resetLocal();
              alert('Done', 'Local data cleared and resynced from the server.');
            } catch (e: any) {
              alert('Something went wrong', e.message ?? 'Please try again.');
            } finally {
              setResetting(false);
            }
          },
        },
      ]
    );
  };
 
  const handleDedupe = () => {
    alert(
      'Clean up duplicates?',
      'This will remove duplicate recipes from the server, keeping the oldest copy of each. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clean up',
          style: 'destructive',
          onPress: async () => {
            setDeduping(true);
            try {
              const removed = await dedupe();
              alert(
                removed > 0 ? 'Done' : 'No duplicates found',
                removed > 0
                  ? `Removed ${removed} duplicate recipe${removed === 1 ? '' : 's'}.`
                  : 'Your recipe list is already clean.'
              );
            } catch (e: any) {
              alert('Something went wrong', e.message ?? 'Please try again.');
            } finally {
              setDeduping(false);
            }
          },
        },
      ]
    );
  };


  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Header 
          title="Settings"
          subtitle="Customise your experience"
        />

        <View style={styles.settingContainer}>
          <Text style={styles.sectionLabel}>Appearance</Text>
          <View style={styles.optionRow}>
            {OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.option, mode === opt.value && styles.optionActive]}
                onPress={() => setMode(opt.value)}
              >
                <Text style={[styles.optionText, mode === opt.value && styles.optionTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.settingContainer}>
          <View style={styles.sectionSidebySide}>
            <Text style={styles.sectionLabel}>Smarthome</Text>
            <View style={[styles.dot, connected ? styles.dotOn : styles.dotOff]} />
          </View>
          <Text style={styles.sectionSubLabel}>Ip Address</Text>
          <InputBar
            placeholder='192.xxx.x.xxx'
            value={ipAddress}
            onChangeText={setIpAddress}
            keyboardType="number-pad"
            autoCapitalize="none"
            returnKeyType="done"
          />

          <Text style={styles.sectionSubLabel}>Port</Text>
          <InputBar
            placeholder='3000'
            value={port}
            onChangeText={setPort}
            keyboardType="number-pad"
            autoCapitalize="none"
            returnKeyType="done"
          />
        </View>

        <View style={styles.settingContainer}>
          <Text style={styles.sectionLabel}>Data</Text>
 
          <TouchableOpacity
            style={[styles.dedupeBtn]}
            onPress={handleDedupe}
            disabled={deduping}
          >
            {deduping
              ? <ActivityIndicator size="small" color={colours.accent} />
              : <Text style={styles.dedupeBtnText}>Clean up duplicates</Text>
            }
          </TouchableOpacity>

          <Text style={styles.dedupeHint}>
            Removes duplicate recipes from the server, keeping the oldest copy of each.
          </Text>

          <TouchableOpacity
            style={[styles.dedupeBtn, { marginTop: 12 }]}
            onPress={handleReset}
            disabled={resetting}
          >
            {resetting
              ? <ActivityIndicator size="small" color={colours.error} />
              : <Text style={styles.dedupeBtnText}>Delete all recipes on this phone</Text>
            }
          </TouchableOpacity>
          <Text style={styles.dedupeHint}>
            Clears everything cached locally and re-downloads fresh from the server.
          </Text>

        </View>
      </ScrollView>
      <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
    </View>
  );
}

const s = (colours: ReturnType<typeof useTheme>['colours']) => StyleSheet.create({
  container:            { flex: 1, backgroundColor: colours.bg },
  settingContainer:     { borderRadius: 8, borderWidth: 1, borderColor: colours.border, paddingBottom: 12, marginBottom: 8, marginHorizontal: 16 },
  sectionSidebySide:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 18},
  scroll:               { paddingBottom: 80 },
  sectionLabel:         { fontSize: 16, color: colours.textGhost, textTransform: 'uppercase', letterSpacing: 1.5, paddingHorizontal: 16, marginTop: 12, marginBottom: 10 },
  sectionSubLabel:      { fontSize: 10, color: colours.textGhost, textTransform: 'uppercase', letterSpacing: 1.5, paddingHorizontal: 16, marginTop: 2, marginBottom: 10 },
  optionRow:            { flexDirection: 'row', gap: 8, marginHorizontal: 16 },
  option:               { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8, borderWidth: 0.5, borderColor: colours.border, backgroundColor: colours.surface },
  optionActive:         { backgroundColor: colours.accent, borderColor: colours.accent },
  optionText:           { fontSize: 13, color: colours.textGhost, fontWeight: '600' },
  optionTextActive:     { color: colours.text },
  saveButton:           { marginHorizontal: 16, marginTop: 10, paddingVertical: 10, borderRadius: 8, backgroundColor: colours.accent, alignItems: 'center' },
  saveButtonText:       { color: colours.text,fontWeight: '600' },
  dot:                  { width: 16, height: 16, borderRadius: 12 },
  dotOn:                { backgroundColor: colours.accent },
  dotOff:               { backgroundColor: colours.textGhost },
  dedupeBtn:            { marginHorizontal: 16, backgroundColor: colours.surface, borderWidth: 0.5, borderColor: colours.error, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  dedupeBtnText:        { color: colours.error, fontSize: 13, fontWeight: '600' },
  dedupeHint:           { fontSize: 11, color: colours.textGhost, paddingHorizontal: 16, marginTop: 8, lineHeight: 16 },
});