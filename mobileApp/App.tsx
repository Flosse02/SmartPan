import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar, StyleSheet } from 'react-native';
import { RecipesProvider } from './src/context/RecipesContext';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import HomeScreen from './src/screens/homeScreen';
import RecipeListScreen from './src/screens/recipeListScreen';
import FavouritesScreen from './src/screens/favouritesScreen';
import ShoppingListScreen from './src/screens/shoppingListScreen';
import RecipeDetailScreen from './src/screens/recipeDetailScreen';
import CookingModeScreen from './src/screens/cookingModeScreen';
import AddRecipeScreen from './src/screens/addRecipeScreen';
import { getBottomTabsIcon } from './src/util/getBottomTabsIcon';
import { ROUTES } from './src/constants/routes';
import SettingsScreen from './src/screens/settingsScreen';
import { ThemeProvider, useTheme } from './src/theme/Themecontext';
import { ConfigProvider } from './src/context/ConfigContext';
import { AlertHost } from './src/util/AlertHost';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

// smartpan://shopping-list opens straight to the Shopping List tab — used
// by the home-screen widget's OPEN_URI click action (see ShoppingListWidget.tsx).
// Typed `any`: the Stack/Tab navigators here aren't created with a typed
// param list (createStackNavigator() not createStackNavigator<...>()), so
// LinkingOptions infers every screen as `unknown` and can't validate this
// nested shape against it — a pre-existing gap in this app's navigation
// typing, not something specific to the linking config itself.
const linking: any = {
  prefixes: ['smartpan://'],
  config: {
    screens: {
      Main: {
        screens: {
          [ROUTES.HOME]: 'home',
          [ROUTES.RECIPES]: 'recipes',
          [ROUTES.FAVOURITES]: 'favourites',
          [ROUTES.SHOPPING_LIST]: 'shopping-list',
          [ROUTES.SETTINGS]: 'settings',
        },
      },
      RecipeDetail: 'recipe-detail',
      CookingMode: 'cooking-mode',
      AddRecipe: 'add-recipe',
    },
  },
};

function MainTabs() {
  const { colours } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colours.bg,
          borderTopColor: colours.surface,
          borderTopWidth: 0.5,
          paddingBottom: 4,
        },
        tabBarActiveTintColor:   colours.accent,
        tabBarInactiveTintColor: colours.textGhost,
        tabBarLabelStyle: { fontSize: 11, marginBottom: 2 },
        tabBarIcon: ({ color, focused }) =>
          getBottomTabsIcon(route.name, focused, color),
      })}
    >
      <Tab.Screen name={ROUTES.HOME} component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name={ROUTES.RECIPES} component={RecipeListScreen} options={{ title: 'Recipes' }} />
      <Tab.Screen name={ROUTES.FAVOURITES} component={FavouritesScreen} options={{ title: 'Favourites' }} />
      <Tab.Screen name={ROUTES.SHOPPING_LIST} component={ShoppingListScreen} options={{ title: 'Shopping' }} />
      <Tab.Screen name={ROUTES.SETTINGS} component={SettingsScreen} options={{ title: 'Settings' }} />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { colours, isDark } = useTheme();
  const s = createStyles(colours);

  return (
    <ConfigProvider>
      <RecipesProvider>
        <SafeAreaProvider>
          <SafeAreaView style={s.safeArea}>
            <NavigationContainer linking={linking}>
              <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colours.bg} />

              <Stack.Navigator
                screenOptions={{
                  headerShown: false,
                  cardStyle: { backgroundColor: colours.bg },
                }}
              >
                <Stack.Screen name="Main" component={MainTabs} />
                <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
                <Stack.Screen name="CookingMode" component={CookingModeScreen} />
                <Stack.Screen name="AddRecipe" component={AddRecipeScreen} />
              </Stack.Navigator>
            </NavigationContainer>
            <AlertHost />
          </SafeAreaView>
        </SafeAreaProvider>
      </RecipesProvider>
    </ConfigProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

const createStyles = (colours: ReturnType<typeof useTheme>['colours']) => StyleSheet.create({
  safeArea:            { flex: 1, backgroundColor: colours.bg },
});