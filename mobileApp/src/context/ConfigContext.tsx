import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const IP_KEY = 'smarthome_ip';
const PORT_KEY = 'smarthome_port';

type Config = {
  ip: string;
  port: string;
  baseUrl: string;
  wsUrl: string;
};

type ConfigContextType = {
  config: Config | null;
  updateConfig: (ip: string, port: string) => Promise<void>;
};

const ConfigContext = createContext<ConfigContextType | null>(null);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<Config | null>(null);

  const buildConfig = (ip: string, port: string): Config => ({
    ip,
    port,
    baseUrl: `http://${ip}:${port}`,
    wsUrl: `ws://${ip}:${port}`,
  });

  const load = useCallback(async () => {
    const [ip, port] = await Promise.all([
      AsyncStorage.getItem(IP_KEY),
      AsyncStorage.getItem(PORT_KEY),
    ]);

    const finalIp = ip ?? '192.168.1.100';
    const finalPort = port ?? '3000';

    setConfig(buildConfig(finalIp, finalPort));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateConfig = useCallback(async (ip: string, port: string) => {
    await AsyncStorage.setItem('smarthome_ip', ip);
    await AsyncStorage.setItem('smarthome_port', port);
    setConfig(buildConfig(ip, port));
  }, []);

  return (
    <ConfigContext.Provider value={{ config, updateConfig }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used inside ConfigProvider');
  return ctx;
}