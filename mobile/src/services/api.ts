import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Automatically detect the host IP (PC) from Expo's configuration
const getBaseUrl = () => {
    if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

    if (Platform.OS === 'web') return 'http://localhost:3000/api';

    // hostUri usually looks like "192.168.x.x:8081"
    const hostUri = Constants.expoConfig?.hostUri;
    const ip = hostUri?.split(':')[0];

    // Fallback to your last known working IP if auto-detection fails
    return ip ? `http://${ip}:3000/api` : 'http://192.168.1.7:3000/api';
};

const API_BASE_URL = getBaseUrl();

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Token and User management
let authToken: string | null = null;

export interface User {
    id: number;
    role: string;
    username: string;
}

let userData: User | null = null;
const OFFLINE_QUEUE_KEY = 'offline_production_logs';

/**
 * Sync offline logs with the server.
 */
export const syncOfflineLogs = async () => {
    try {
        const queueStr = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
        if (!queueStr) return 0;

        const queue: any[] = JSON.parse(queueStr);
        if (queue.length === 0) return 0;

        console.log(`[API] Attempting to sync ${queue.length} offline logs...`);
        let successCount = 0;
        const remainingQueue: any[] = [];

        for (const log of queue) {
            try {
                await api.post('/production/log', log);
                successCount++;
            } catch (err) {
                console.error('[API] Failed to sync log, keeping in queue', err);
                remainingQueue.push(log);
            }
        }

        await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue));
        return successCount;
    } catch (err) {
        console.error('[API] Sync failed', err);
        return 0;
    }
};

/**
 * Initialize auth state from persistent storage.
 * Call this once during app startup (e.g., in RootLayout).
 */
export const initAuth = async () => {
    try {
        const savedToken = await AsyncStorage.getItem('userToken');
        const savedUser = await AsyncStorage.getItem('userData');
        if (savedToken) authToken = savedToken;
        if (savedUser) userData = JSON.parse(savedUser);
        console.log('[API] Auth initialized', { hasToken: !!authToken, user: userData?.username });
    } catch (err) {
        console.error('[API] Auth init failed', err);
    }
};

// Add Interceptor for Authentication
api.interceptors.request.use(async (config) => {
    // If token isn't in memory yet (e.g. first request after refresh), try to load it
    if (!authToken) {
        const savedToken = await AsyncStorage.getItem('userToken');
        if (savedToken) authToken = savedToken;
    }

    if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export const setToken = async (token: string | null, user: User | null = null) => {
    authToken = token;
    userData = user;

    try {
        if (token) {
            await AsyncStorage.setItem('userToken', token);
        } else {
            await AsyncStorage.removeItem('userToken');
        }

        if (user) {
            await AsyncStorage.setItem('userData', JSON.stringify(user));
        } else {
            await AsyncStorage.removeItem('userData');
        }
    } catch (err) {
        console.error('[API] Storage failed', err);
    }
};

export const getUserInfo = (): User | null => {
    return userData;
};

export const authService = {
    login: (username: string, password: string) => api.post('/auth/login', { username, password }),
    register: (userData: any) => api.post('/auth/register', userData),
};

export const inventoryService = {
    getMaterials: () => api.get('/inventory/materials'),
    createMaterial: (materialData: any) => api.post('/inventory/materials', materialData),
    deleteMaterial: (id: number) => api.delete(`/inventory/materials/${id}`),
    updateMaterialStock: (id: number, quantity: number) => api.put(`/inventory/materials/${id}`, { quantity }),
    addMaterialStock: (id: number, quantity: number) => api.put(`/inventory/materials/${id}/add-stock`, { quantity }),

    getProducts: () => api.get('/inventory/products'),
    createProduct: (productData: any) => api.post('/inventory/products', productData),
    updateProduct: (id: number, productData: any) => api.put(`/inventory/products/${id}`, productData),
    deleteProduct: (id: number) => api.delete(`/inventory/products/${id}`),
};

export const orderService = {
    getOrders: () => api.get('/orders'),
    getOrderDetails: (id: number) => api.get(`/orders/${id}`),
    getBuyerOrders: (buyerId: number) => api.get(`/orders/buyer/${buyerId}`),
    createOrder: (orderData: any) => api.post('/orders', orderData),
    updateOrderStatus: (id: number, status: string, completionNotes?: string) => api.put(`/orders/${id}`, { status, completionNotes }),
    cancelOrder: (id: number, reason?: string) => api.delete(`/orders/${id}`, { data: { reason } }),
    getTracking: (id: string) => api.get(`/orders/track/${id}`),
};

export const productionService = {
    logProduction: async (logData: any) => {
        try {
            return await api.post('/production/log', logData);
        } catch (error: any) {
            // If network error (no response), queue it offline
            if (!error.response) {
                const queueStr = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
                const queue = queueStr ? JSON.parse(queueStr) : [];
                queue.push({ ...logData, offline: true, timestamp: new Date().toISOString() });
                await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
                throw new Error('OFFLINE_QUEUED');
            }
            throw error;
        }
    },
    getLogs: (workerId: number) => api.get(`/production/logs/${workerId}`),
    getOfflineQueueCount: async () => {
        const queueStr = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
        return queueStr ? JSON.parse(queueStr).length : 0;
    },
    syncOfflineLogs: syncOfflineLogs
};

export const analyticsService = {
    getPredictions: (days: number = 7) => api.get(`/analytics/predict?days=${days}`),
    getProductionSummary: () => api.get('/analytics/production-summary'),
};

export default api;

