import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api';
import { Recipe } from '../types';
import { useConfig } from '../context/ConfigContext';


const CACHE_KEY = 'smartpan_recipes';

type RecipesContextType = {
  recipes: Recipe[];
  loading: boolean;
  error: string | null;
  connected: boolean;

  refresh: () => Promise<void>;   // ← renamed from fetch
  save: (data: Omit<Recipe, 'id' | 'createdAt'>) => Promise<void>;
  update: (data: Recipe) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

const RecipesContext = createContext<RecipesContextType | null>(null);

export function RecipesProvider({ children }: { children: React.ReactNode }) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const { config } = useConfig();

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(CACHE_KEY).then(raw => {
      if (raw) setRecipes(JSON.parse(raw));
    });
  }, []);

  const cache = useCallback((data: Recipe[]) => {
    AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
  }, []);

  const refresh = useCallback(async () => {  
    setLoading(true);
    setError(null);

    try {
      const data = await api.getRecipes();
      setRecipes(data);
      cache(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [cache]);


  useEffect(() => {
    if (!config) return;

    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      if (cancelled) return;

      const url = `${config.wsUrl}/api/recipes/ws`;
      console.log('[WS] connecting to', url);

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);

      ws.onclose = () => {
        setConnected(false);
        if (!cancelled) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => ws.close();

      ws.onmessage = (e) => {
        console.log('[WS] message', e.data);
      };
    };

    connect();

    return () => {
      cancelled = true;
      clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, [config]);


  useEffect(() => {
    refresh();
  }, [refresh])

  const save = useCallback(async (data: Omit<Recipe, 'id' | 'createdAt'>) => {
  const tempRecipe: Recipe = {
    ...data,
    id: `temp-${Date.now()}`,
    createdAt: new Date().toISOString(),
  } as Recipe;

  setRecipes(prev => {
    const next = [tempRecipe, ...prev];
    cache(next);
    return next;
  });

  (async () => {
    try {
      const real = await api.saveRecipe(data);

      setRecipes(prev => {
        const next = prev.map(r =>
          r.id === tempRecipe.id ? real : r
        );
        cache(next);
        return next;
      });
    } catch (e) {
      console.log('Pi offline - saved locally only');
    }
  })();
}, [cache]);

  const update = useCallback(async (data: Recipe) => {
    const recipe = await api.updateRecipe(data);

    setRecipes(prev => {
      const next = prev.map(r =>
        r.id === recipe.id ? recipe : r
      );
      cache(next);
      return next;
    });
  }, [cache]);

  // -----------------------
  // DELETE (OPTIMISTIC)
  // -----------------------
  const remove = useCallback(async (id: string) => {
    // 1. optimistic UI update
    setRecipes(prev => {
      const next = prev.filter(r => r.id !== id);
      cache(next);
      return next;
    });

    // 2. background sync (non-blocking)
    api.deleteRecipe(id)
      .catch(() => {
        console.log('Pi offline - delete not synced');
      });
  }, [cache]);

  return (
    <RecipesContext.Provider value={{
      recipes,
      loading,
      error,
      connected,
      refresh,
      save,
      update,
      remove,
    }}>
      {children}
    </RecipesContext.Provider>
  );
}

export function useRecipes() {
  const ctx = useContext(RecipesContext);
  if (!ctx) throw new Error('useRecipes must be used inside RecipesProvider');
  return ctx;
}