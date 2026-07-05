import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View, 
  ScrollView, 
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Header } from '../util/header';
import { useTheme } from '../theme/Themecontext';
import { InputBar } from '../util/inputBar';
import { useConfig } from '../context/ConfigContext';

const OPTIONS: { label: string; value: 'system' | 'light' | 'dark' }[] = [
  { label: 'System', value: 'system' },
  { label: 'Light',  value: 'light'  },
  { label: 'Dark',   value: 'dark'   },
];

export default function SettingsScreen({ navigation }: any) {
  const { colours, mode, setMode } = useTheme();
  const { config, updateConfig } = useConfig();
  const [ipAddress, setIpAddress] = useState('');
  const [port, setPort] = useState('');
  const styles = s(colours);

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
          <Text style={styles.sectionLabel}>Smarthome</Text>
          <Text style={styles.sectionSubLabel}>Ip Address</Text>
          <InputBar
            placeholder='192.xxx.x.xxx'
            value={ipAddress}
            onChangeText={setIpAddress}
            keyboardType="numbers-and-punctuation"
            autoCapitalize="none"
            returnKeyType="done"
          />

          <Text style={styles.sectionSubLabel}>Port</Text>
          <InputBar
            placeholder='3000'
            value={port}
            onChangeText={setPort}
            keyboardType="numbers-and-punctuation"
            autoCapitalize="none"
            returnKeyType="done"
          />
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const s = (colours: ReturnType<typeof useTheme>['colours']) => StyleSheet.create({
  container:            { flex: 1, backgroundColor: colours.bg },
  settingContainer:     { borderRadius: 8, borderWidth: 1, borderColor: colours.border, paddingBottom: 12, marginBottom: 8, marginHorizontal: 16 },
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
});