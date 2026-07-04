import {
    API_KEY,
    BASE_URL,
} from '@env';

import {IS_DEV} from './IS_DEV';

export default {
    API_KEY,
    BASE_URL,
    DASHBOARD_URL: IS_DEV ? 'http://localhost:8081' : 'https://smartpan-dashboard.vercel.app',
};