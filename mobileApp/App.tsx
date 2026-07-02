import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar, Text } from 'react-native';
import { RecipesProvider } from './SmartPan/context/RecipesContext';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';


import HomeScreen from './SmartPan/screens/homeScreen';
import RecipeListScreen  from './SmartPan/screens/recipeListScreen';
import RecipeDetailScreen from './SmartPan/screens/recipeDetailScreen';
import CookingModeScreen from './SmartPan/screens/cookingModeScreen';
import AddRecipeScreen   from './SmartPan/screens/addRecipeScreen';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f0f13',
          borderTopColor: '#1e1e24',
          borderTopWidth: 0.5,
          paddingBottom: 4,
        },
        tabBarActiveTintColor:   '#6366f1',
        tabBarInactiveTintColor: '#444',
        tabBarLabelStyle: { fontSize: 11, marginBottom: 2 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏠</Text> }}
      />
      <Tab.Screen
        name="RecipeList"
        component={RecipeListScreen}
        options={{ title: 'Recipes', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📖</Text> }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <RecipesProvider>
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0f0f13' }}>
          <NavigationContainer>
            <StatusBar
              barStyle="light-content"
              backgroundColor="#0f0f13"
            />

            <Stack.Navigator
              screenOptions={{
                headerShown: false,
                cardStyle: { backgroundColor: '#0f0f13' },
              }}
            >
              <Stack.Screen name="Main" component={MainTabs} />
              <Stack.Screen
                name="RecipeDetail"
                component={RecipeDetailScreen}
              />
              <Stack.Screen
                name="CookingMode"
                component={CookingModeScreen}
              />
              <Stack.Screen
                name="AddRecipe"
                component={AddRecipeScreen}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaView>
      </SafeAreaProvider>
    </RecipesProvider>
  );
}