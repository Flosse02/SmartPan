import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { api } from '../api';
import { localStore } from '../localStore';
import { Recipe } from '../types';
import { useConfig } from '../context/ConfigContext';

type RecipesContextType = {
  recipes: Recipe[];
  loading: boolean;
  error: string | null;
  connected: boolean;

  refresh: () => Promise<void>;
  save: (data: Omit<Recipe, 'id' | 'createdAt'>) => Promise<void>;
  update: (data: Recipe) => Promise<void>;
  remove: (id: string) => Promise<void>;
  dedupe: () => Promise<number>;
  resetLocal: () => Promise<void>;
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
    localStore.getAll().then(setRecipes);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getRecipes();
      setRecipes(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

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

      ws.onopen = () => {
        console.log('[WS] connected');
        setConnected(true);

        // Push anything created while offline, then pull a fresh merged
        // list so both this device and the dashboard end up in sync.
        (async () => {
          try {
            await api.pushUnsyncedRecipes();
            const data = await api.getRecipes();
            setRecipes(data);
          } catch (e) {
            console.log('Reconnect sync failed, will retry next reconnect');
          }
        })();
      };

      ws.onclose = () => {
        setConnected(false);
        if (!cancelled) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => ws.close();

      ws.onmessage = (e) => {
        console.log('[WS] message', e.data);
        try {
          const msg = JSON.parse(e.data);

          // id-based dedup: recipe ids are always the same server-issued
          // UUID everywhere (phone, dashboard, this broadcast), so "does
          // this id already exist in state?" is a reliable, simple guard
          // against the echo of our own optimistic add showing up twice.
          if (msg.type === 'recipe_added') {
            setRecipes(prev =>
              prev.some(r => r.id === msg.recipe.id) ? prev : [msg.recipe, ...prev]
            );
          }

          if (msg.type === 'recipe_updated') {
            setRecipes(prev => prev.map(r => (r.id === msg.recipe.id ? msg.recipe : r)));
          }

          if (msg.type === 'recipe_deleted') {
            setRecipes(prev => prev.filter(r => r.id !== msg.id));
          }
        } catch (err) {
          console.log('[WS] failed to parse message', err);
        }
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
  }, [refresh]);

  const save = useCallback(async (data: Omit<Recipe, 'id' | 'createdAt'>) => {
    const tempRecipe: Recipe = {
      ...data,
      id: `temp-${Date.now()}`,
      createdAt: new Date().toISOString(),
    } as Recipe;

    setRecipes(prev => [tempRecipe, ...prev]);

    (async () => {
      try {
        const real = await api.saveRecipe(data);
        setRecipes(prev => prev.map(r => (r.id === tempRecipe.id ? real : r)));
      } catch (e) {
        console.log('Pi offline - saved locally only');
      }
    })();
  }, []);

  const update = useCallback(async (data: Recipe) => {
    const recipe = await api.updateRecipe(data);
    setRecipes(prev => prev.map(r => (r.id === recipe.id ? recipe : r)));
  }, []);

  const remove = useCallback(async (id: string) => {
    setRecipes(prev => prev.filter(r => r.id !== id));
    api.deleteRecipe(id).catch(() => {
      console.log('Pi offline - delete not synced');
    });
  }, []);

  const dedupe = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const removedCount = await api.dedupeRecipes();
      const fresh = await localStore.getAll();
      setRecipes(fresh);
      return removedCount;
    } catch (e: any) {
      setError(e.message);
      return 0;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetLocal = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await localStore.clearAll();
      const fresh = await api.getRecipes();
      setRecipes(fresh);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <RecipesContext.Provider
      value={{
        recipes,
        loading,
        error,
        connected,
        refresh,
        save,
        update,
        remove,
        dedupe,
        resetLocal,
      }}
    >
      {children}
    </RecipesContext.Provider>
  );
}

export function useRecipes() {
  const ctx = useContext(RecipesContext);
  if (!ctx) throw new Error('useRecipes must be used inside RecipesProvider');
  return ctx;
}