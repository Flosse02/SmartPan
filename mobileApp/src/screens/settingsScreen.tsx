import React from 'react';
import {
  View, 
  ScrollView, 
  StyleSheet
} from 'react-native';
import { Header } from '../util/header';

export default function SettingsScreen({ navigation }: any) {

  return (
    <View style={s.container}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
             <Header 
              title="Settings"
              subtitle="Customise your experience"
            />
        </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:            { flex: 1, backgroundColor: '#0f0f13' },
  scroll:               { paddingBottom: 80 },
});