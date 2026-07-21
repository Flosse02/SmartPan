import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppState } from 'react-native';
import { shoppingList, ShoppingListItem, ShoppingListIngredient } from '../shoppingList';
import { useSocket } from './SocketContext';

type ShoppingListContextType = {
  items: ShoppingListItem[];
  loading: boolean;
  addIngredients: (ingredients: ShoppingListIngredient[], recipeTitle: string) => Promise<void>;
  toggleChecked: (id: string) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clearChecked: () => Promise<void>;
  clearAll: () => Promise<void>;
};

const ShoppingListContext = createContext<ShoppingListContextType | null>(null);

export function ShoppingListProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { subscribe, onConnect } = useSocket();

  useEffect(() => {
    (async () => {
      setItems(await shoppingList.getAll());
      setLoading(false);
      setItems(await shoppingList.sync());
    })();
  }, []);

  // Reconcile with the server on every reconnect (pushes local-only edits
  // made while offline, or adopts a newer server copy) — same "pull
  // anything I missed" hook the recipe sync uses.
  useEffect(() => onConnect(() => {
    shoppingList.sync().then(setItems);
  }), [onConnect]);

  useEffect(() => subscribe('shopping_note_updated', (msg) => {
    shoppingList.applyRemote(msg.note.items, msg.note.updatedAt).then(setItems);
  }), [subscribe]);

  // The home-screen widget writes straight to AsyncStorage while the app is
  // backgrounded (no React tree to notify) — refresh from local storage
  // whenever the app returns to the foreground so a widget-side toggle
  // shows up here too.
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') shoppingList.getAll().then(setItems);
    });
    return () => sub.remove();
  }, []);

  const addIngredients = useCallback(async (ingredients: ShoppingListIngredient[], recipeTitle: string) => {
    setItems(await shoppingList.addIngredients(ingredients, recipeTitle));
  }, []);

  const toggleChecked = useCallback(async (id: string) => {
    setItems(await shoppingList.toggleChecked(id));
  }, []);

  const removeItem = useCallback(async (id: string) => {
    setItems(await shoppingList.removeItem(id));
  }, []);

  const clearChecked = useCallback(async () => {
    setItems(await shoppingList.clearChecked());
  }, []);

  const clearAll = useCallback(async () => {
    setItems(await shoppingList.clearAll());
  }, []);

  return (
    <ShoppingListContext.Provider
      value={{ items, loading, addIngredients, toggleChecked, removeItem, clearChecked, clearAll }}
    >
      {children}
    </ShoppingListContext.Provider>
  );
}

export function useShoppingList() {
  const ctx = useContext(ShoppingListContext);
  if (!ctx) throw new Error('useShoppingList must be used inside ShoppingListProvider');
  return ctx;
}
