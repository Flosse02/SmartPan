import ENV from './constants/ENV';

export const DASHBOARD_URL = ENV.BASE_URL;
export const WS_URL = DASHBOARD_URL.replace('http', 'ws');