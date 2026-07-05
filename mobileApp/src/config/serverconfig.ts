import AsyncStorage from '@react-native-async-storage/async-storage';

const IP_KEY = 'smarthome_ip';
const PORT_KEY = 'smarthome_port';

export async function getServerConfig() {
  const [ip, port] = await Promise.all([
    AsyncStorage.getItem(IP_KEY),
    AsyncStorage.getItem(PORT_KEY),
  ]);

  const finalIp = ip ?? '192.168.1.100';
  const finalPort = port ?? '3000';

  return {
    ip: finalIp,
    port: finalPort,
    baseUrl: `http://${finalIp}:${finalPort}`,
    wsUrl: `ws://${finalIp}:${finalPort}`,
  };
}