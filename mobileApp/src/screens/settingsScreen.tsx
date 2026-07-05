import React from 'react';
import {
  View, 
  ScrollView, 
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Header } from '../util/header';
import { useTheme } from '../theme/Themecontext';

const OPTIONS: { label: string; value: 'system' | 'light' | 'dark' }[] = [
  { label: 'System', value: 'system' },
  { label: 'Light',  value: 'light'  },
  { label: 'Dark',   value: 'dark'   },
];

export default function SettingsScreen({ navigation }: any) {
  const { colours, mode, setMode } = useTheme();
  const styles = s(colours);

  return (
    <View style={s(colours).container}>
        <ScrollView contentContainerStyle={s(colours).scroll} showsVerticalScrollIndicator={false}>
            <Header 
            title="Settings"
            subtitle="Customise your experience"
          />
        
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
      </ScrollView>
    </View>
  );
}
const s = (colours: ReturnType<typeof useTheme>['colours']) => StyleSheet.create({
  container:            { flex: 1, backgroundColor: colours.bg },
  scroll:               { paddingBottom: 80 },
  sectionLabel:         { fontSize: 10, color: colours.textGhost, textTransform: 'uppercase', letterSpacing: 1.5, paddingHorizontal: 16, marginTop: 12, marginBottom: 10 },
  optionRow:            { flexDirection: 'row', gap: 8, marginHorizontal: 16 },
  option:               { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8, borderWidth: 0.5, borderColor: colours.border, backgroundColor: colours.surface },
  optionActive:         { backgroundColor: colours.accent, borderColor: colours.accent },
  optionText:           { fontSize: 13, color: colours.textGhost, fontWeight: '600' },
  optionTextActive:      { color: colours.text },

});