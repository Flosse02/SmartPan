import React from 'react';
import { Appearance, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestWidgetUpdate } from 'react-native-android-widget';
// Type-only import — erased by the TS/Babel transform before Metro sees a
// real module edge. shoppingList.ts imports pushShoppingListWidgetUpdate
// from this file; if this ever became a value import of shoppingList.ts,
// that would create a circular require() between the two files.
import type { ShoppingListItem } from '../shoppingList';
import { darkColours, lightColours, Colours } from '../theme/theme';
import { ShoppingListWidget } from './ShoppingListWidget';

// Must match the simple class name of the Kotlin receiver at
// android/app/src/main/java/com/smartpan/ShoppingListWidgetProvider.kt —
// react-native-android-widget derives widgetName from getClass().getSimpleName().
export const SHOPPING_LIST_WIDGET_NAME = 'ShoppingListWidgetProvider';

const THEME_STORAGE_KEY = 'smartpan_theme_mode';

// Mirrors ThemeContext's mode resolution. Reimplemented standalone because
// this runs both headless (widget task, no React tree) and from arbitrary
// app code (shoppingList.ts), so it can't use the useColorScheme() hook.
export async function resolveColours(): Promise<Colours> {
  const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
  const mode = saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
  const isDark = mode === 'system' ? Appearance.getColorScheme() !== 'light' : mode === 'dark';
  return isDark ? darkColours : lightColours;
}

export async function buildShoppingListWidgetElement(items: ShoppingListItem[]) {
  const colours = await resolveColours();
  return React.createElement(ShoppingListWidget, { items, colours });
}

/**
 * Pushes a fresh render to any home-screen widget instances so they reflect
 * app-side edits immediately instead of waiting for the OS's periodic
 * update or the next widget tap. Android-only. Fire-and-forget and
 * error-swallowing on purpose: shoppingList.ts's mutators are awaited by UI
 * code that expects a quick AsyncStorage round-trip, and a widget draw
 * failure must never surface as a shopping-list error.
 */
export function pushShoppingListWidgetUpdate(items: ShoppingListItem[]): void {
  if (Platform.OS !== 'android') return;
  requestWidgetUpdate({
    widgetName: SHOPPING_LIST_WIDGET_NAME,
    renderWidget: () => buildShoppingListWidgetElement(items),
  }).catch(err => {
    console.warn('[ShoppingListWidget] requestWidgetUpdate failed', err);
  });
}
