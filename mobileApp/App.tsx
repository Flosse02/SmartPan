import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'react-native';
import { RecipesProvider } from './src/context/RecipesContext';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import HomeScreen from './src/screens/homeScreen';
import RecipeListScreen from './src/screens/recipeListScreen';
import RecipeDetailScreen from './src/screens/recipeDetailScreen';
import CookingModeScreen from './src/screens/cookingModeScreen';
import AddRecipeScreen from './src/screens/addRecipeScreen';
import { getBottomTabsIcon } from './src/util/getBottomTabsIcon';
import { ROUTES } from './src/constants/routes';
import SettingsScreen from './src/screens/settingsScreen';
import { ThemeProvider, useTheme } from './src/theme/Themecontext';
import { ConfigProvider } from './src/context/ConfigContext';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

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
        tabBarIcon: ({ color, size, focused }) =>
          getBottomTabsIcon(route.name, focused, color),
      })}
    >
      <Tab.Screen name={ROUTES.HOME} component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name={ROUTES.RECIPES} component={RecipeListScreen} options={{ title: 'Recipes' }} />
      <Tab.Screen name={ROUTES.SETTINGS} component={SettingsScreen} options={{ title: 'Settings' }} />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { colours, isDark } = useTheme();

  return (
    <ConfigProvider>
      <RecipesProvider>
        <SafeAreaProvider>
          <SafeAreaView style={{ flex: 1, backgroundColor: colours.bg }}>
            <NavigationContainer>
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