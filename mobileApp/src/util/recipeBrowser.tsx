import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView, WebViewNavigation, WebViewProps } from 'react-native-webview';
import { ICONS } from '../constants/icons';
import { useTheme } from '../theme/Themecontext';

// react-native-webview@14's `class WebView<P = undefined>` generic default
// doesn't resolve cleanly against React 19's types, so JSX usage below hits
// "props: never" in the IDE — a known upstream typing gap, not a runtime
// issue (Metro strips types without type-checking). Recast to sidestep it.
const WebViewComponent = WebView as unknown as React.ComponentType<WebViewProps & { ref?: React.Ref<WebView> }>;

type RecipeBrowserProps = {
  importing: boolean;
  onAddToRecipes: (url: string) => void;
};

// Google actively detects and blocks WebView traffic on its search results
// (serves a grey/blocked page instead) — its homepage loads fine since
// that's mostly static, but the search backend specifically rejects
// non-Chrome-browser requests. DuckDuckGo doesn't do this, so it's used for
// both the default landing page and the search fallback below.
const SEARCH_HOME = 'https://duckduckgo.com/';

const isLikelyUrl = (input: string) => /^https?:\/\//i.test(input) || /^[\w-]+(\.[\w-]+)+(\/|$|\?)/i.test(input);

const toTarget = (input: string) => {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (isLikelyUrl(trimmed)) return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
  return `https://duckduckgo.com/?q=${encodeURIComponent(trimmed)}`;
};

/**
 * A minimal in-app browser for finding recipes without leaving the app.
 * The toolbar (back/forward/reload/address/Add to Recipes) stays pinned
 * above the WebView at all times — "Add to Recipes" runs api.importUrl on
 * whatever page is currently loaded, same as the plain Import URL tab.
 */
export function RecipeBrowser({ importing, onAddToRecipes }: RecipeBrowserProps) {
  const { colours } = useTheme();
  const s = createStyles(colours);
  const webviewRef = useRef<WebView>(null);

  const [currentUrl, setCurrentUrl] = useState<string | null>(SEARCH_HOME);
  const [addressInput, setAddressInput] = useState(SEARCH_HOME);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [loading, setLoading] = useState(false);

  const {as: ArrowLeftIcon, name: arrowLeftIcon} = ICONS.ARROW_LEFT;
  const {as: ArrowRightIcon, name: arrowRightIcon} = ICONS.ARROW_RIGHT;
  const {as: RefreshIcon, name: refreshIcon} = ICONS.REFRESH;
  const {as: CloseIcon, name: closeIcon} = ICONS.CLOSE;
  const {as: RecipeAddIcon, name: recipeAddIcon} = ICONS.RECIPE_ADD;

  const navigateTo = (input: string) => {
    const target = toTarget(input);
    if (target) setCurrentUrl(target);
  };

  const handleNavChange = (navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    setLoading(navState.loading);
    setCurrentUrl(navState.url);
    setAddressInput(navState.url);
  };

  if (currentUrl == null) {
    return (
      <View style={s.startContainer}>
        <Text style={s.startTitle}>Find a recipe</Text>
        <TextInput
          style={s.startInput}
          placeholder="Search or enter a website"
          placeholderTextColor={colours.textGhost}
          value={addressInput}
          onChangeText={setAddressInput}
          onSubmitEditing={() => navigateTo(addressInput)}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="go"
        />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.toolbar}>
        <View style={s.toolbarNav}>
          <TouchableOpacity onPress={() => setCurrentUrl(null)} style={s.navBtn}>
            <CloseIcon name={closeIcon} size={18} color={colours.textGhost} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => webviewRef.current?.goBack()} disabled={!canGoBack} style={s.navBtn}>
            <ArrowLeftIcon name={arrowLeftIcon} size={18} color={canGoBack ? colours.text : colours.textGhost} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => webviewRef.current?.goForward()} disabled={!canGoForward} style={s.navBtn}>
            <ArrowRightIcon name={arrowRightIcon} size={18} color={canGoForward ? colours.text : colours.textGhost} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => webviewRef.current?.reload()} style={s.navBtn}>
            {loading ? <ActivityIndicator size="small" color={colours.textGhost} /> : <RefreshIcon name={refreshIcon} size={16} color={colours.textGhost} />}
          </TouchableOpacity>
        </View>
        <TextInput
          style={s.addressInput}
          value={addressInput}
          onChangeText={setAddressInput}
          onSubmitEditing={() => navigateTo(addressInput)}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="go"
        />
        <TouchableOpacity
          style={[s.addBtn, importing && s.addBtnDisabled]}
          onPress={() => onAddToRecipes(currentUrl)}
          disabled={importing}
        >
          {importing
            ? <ActivityIndicator size="small" color="#fff" />
            : <RecipeAddIcon name={recipeAddIcon} size={18} color="#fff" />
          }
        </TouchableOpacity>
      </View>
      <WebViewComponent
        ref={webviewRef}
        source={{ uri: currentUrl }}
        style={s.webview}
        startInLoadingState
        onNavigationStateChange={handleNavChange}
      />
    </View>
  );
}

const createStyles = (colours: ReturnType<typeof useTheme>['colours']) => StyleSheet.create({
  container:        { flex: 1 },
  webview:           { flex: 1 },
  startContainer:    { flex: 1, padding: 24, gap: 12 },
  startTitle:        { fontSize: 16, fontWeight: '600', color: colours.text, marginBottom: 4 },
  startInput:        { backgroundColor: colours.surface, borderWidth: 0.5, borderColor: colours.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: colours.text, fontSize: 14 },
  toolbar:           { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: colours.border, backgroundColor: colours.bg },
  toolbarNav:        { flexDirection: 'row', alignItems: 'center' },
  navBtn:            { padding: 6 },
  addressInput:      { flex: 1, backgroundColor: colours.surface, borderWidth: 0.5, borderColor: colours.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, color: colours.text, fontSize: 12 },
  addBtn:            { backgroundColor: colours.accent, borderRadius: 8, padding: 8 },
  addBtnDisabled:    { opacity: 0.6 },
});
