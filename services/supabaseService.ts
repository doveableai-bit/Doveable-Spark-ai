import { Project, User, PaymentRequest, CoinRate, PlanName, PaymentMethod, PaymentGateway, AiApiKey, BackendIntegration, AdvertisementConfig } from '../types';

const USERS_KEY = 'doveable_ai_users_db';
const PAYMENT_REQUESTS_KEY = 'doveable_ai_payment_requests_db';
const COIN_RATES_KEY = 'doveable_ai_coin_rates_db';
const PAYMENT_METHODS_KEY = 'doveable_ai_payment_methods_db';
const AI_API_KEYS_KEY = 'doveable_ai_api_keys_db';
const BACKEND_INTEGRATIONS_KEY = 'doveable_ai_backend_integrations_db';
const ADVERTISEMENT_CONFIGS_KEY = 'doveable_ai_ad_configs_db';


// --- MOCK DATABASE INITIALIZATION ---

const getDefaultCoinRates = (): CoinRate[] => [
  { plan: 'free', coins: 100, price: 0, durationMonths: 0 },
  { plan: '1-month', coins: 1000, price: 10, durationMonths: 1 },
  { plan: '6-month', coins: 6000, price: 60, durationMonths: 6 },
  { plan: '12-month', coins: 12000, price: 120, durationMonths: 12 },
];

const getDefaultPaymentMethods = (): PaymentMethod[] => [
    { id: 'jazzcash', name: 'JazzCash', enabled: true, accountNumber: '03220000000', qrCodeUrl: '' },
    { id: 'stripe', name: 'Stripe', enabled: false, secretKey: '' },
    { id: 'paypal', name: 'PayPal', enabled: false, secretKey: '' },
    { id: 'payoneer', name: 'Payoneer', enabled: false, secretKey: '' },
];

const getInitialUsers = (): User[] => [
    { id: 'default-user', name: 'Demo User', email: 'user@example.com', coins: 100, role: 'user', subscriptionStatus: 'inactive', plan: 'free'},
    { id: 'another-user', name: 'Jane Doe', email: 'jane@example.com', coins: 2500, role: 'user', subscriptionStatus: 'active', plan: '1-month'}
];

const getFromStorage = <T>(key: string, defaultValue: T): T => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
        console.error(`Error reading from localStorage key "${key}":`, e);
        return defaultValue;
    }
};

const saveToStorage = (key: string, value: any) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error(`Error writing to localStorage key "${key}":`, e);
    }
};

// Initialize mock DB
if (!localStorage.getItem(USERS_KEY)) {
    saveToStorage(USERS_KEY, getInitialUsers());
}
if (!localStorage.getItem(COIN_RATES_KEY)) {
    saveToStorage(COIN_RATES_KEY, getDefaultCoinRates());
}
if (!localStorage.getItem(PAYMENT_METHODS_KEY)) {
    saveToStorage(PAYMENT_METHODS_KEY, getDefaultPaymentMethods());
}
if (!localStorage.getItem(PAYMENT_REQUESTS_KEY)) {
    saveToStorage(PAYMENT_REQUESTS_KEY, []);
}
if (!localStorage.getItem(AI_API_KEYS_KEY)) {
    saveToStorage(AI_API_KEYS_KEY, []);
}
if (!localStorage.getItem(BACKEND_INTEGRATIONS_KEY)) {
    saveToStorage(BACKEND_INTEGRATIONS_KEY, []);
}
if (!localStorage.getItem(ADVERTISEMENT_CONFIGS_KEY)) {
    saveToStorage(ADVERTISEMENT_CONFIGS_KEY, []);
}


// This is a mock service. In a real application, you would use the Supabase client library.
export const supabaseService = {
  connect: async (details: { url: string; anonKey: string }): Promise<void> => {
    console.log('Mock connecting to Supabase with:', details);
    await new Promise(resolve => setTimeout(resolve, 500));
    if (!details.url || !details.anonKey) {
        throw new Error("Supabase URL and Anon Key are required.");
    }
    console.log('Mock Supabase connection successful.');
  },

  saveProject: async (project: Project): Promise<void> => {
    console.log(`Mock saving project "${project.name}" to Supabase.`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Mock project save successful.');
  },

  // --- NEW MOCK DB FUNCTIONS ---

  getUsers: async (): Promise<User[]> => {
    await new Promise(res => setTimeout(res, 200));
    return getFromStorage<User[]>(USERS_KEY, []);
  },

  updateUser: async (userId: string, data: Partial<User>): Promise<User | null> => {
    await new Promise(res => setTimeout(res, 100));
    const users = getFromStorage<User[]>(USERS_KEY, []);
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...data };
        saveToStorage(USERS_KEY, users);
        return users[userIndex];
    }
    return null;
  },
  
  getPaymentRequests: async (): Promise<PaymentRequest[]> => {
      await new Promise(res => setTimeout(res, 200));
      return getFromStorage<PaymentRequest[]>(PAYMENT_REQUESTS_KEY, []);
  },

  createPaymentRequest: async (requestData: Omit<PaymentRequest, 'id' | 'status' | 'submittedAt'>): Promise<PaymentRequest> => {
      await new Promise(res => setTimeout(res, 500));
      const requests = getFromStorage<PaymentRequest[]>(PAYMENT_REQUESTS_KEY, []);
      const newRequest: PaymentRequest = {
          ...requestData,
          id: crypto.randomUUID(),
          status: 'pending',
          submittedAt: new Date().toISOString()
      };
      requests.push(newRequest);
      saveToStorage(PAYMENT_REQUESTS_KEY, requests);
      return newRequest;
  },

  updatePaymentRequestStatus: async (requestId: string, status: 'approved' | 'rejected'): Promise<PaymentRequest | null> => {
      await new Promise(res => setTimeout(res, 300));
      const requests = getFromStorage<PaymentRequest[]>(PAYMENT_REQUESTS_KEY, []);
      const requestIndex = requests.findIndex(r => r.id === requestId);
      
      if (requestIndex !== -1) {
          const request = requests[requestIndex];
          if (request.status !== 'pending') return request; // Already processed

          request.status = status;
          saveToStorage(PAYMENT_REQUESTS_KEY, requests);
          return request;
      }
      return null;
  },

  approvePaymentRequest: async (requestId: string, coinsToAdd: number, setSubscriptionActive: boolean): Promise<PaymentRequest | null> => {
    await new Promise(res => setTimeout(res, 300));
    const requests = getFromStorage<PaymentRequest[]>(PAYMENT_REQUESTS_KEY, []);
    const requestIndex = requests.findIndex(r => r.id === requestId);

    if (requestIndex !== -1) {
        const request = requests[requestIndex];
        if (request.status !== 'pending') return request;

        request.status = 'approved';
        
        const users = getFromStorage<User[]>(USERS_KEY, []);
        const userIndex = users.findIndex(u => u.id === request.userId);

        if (userIndex !== -1) {
            const user = users[userIndex];
            user.coins += coinsToAdd;

            if (setSubscriptionActive) {
                user.subscriptionStatus = 'active';
                user.plan = request.plan;
                
                const coinRates = getFromStorage<CoinRate[]>(COIN_RATES_KEY, []);
                const rate = coinRates.find(r => r.plan === request.plan);
                if (rate && rate.durationMonths > 0) {
                    const expiry = new Date();
                    expiry.setMonth(expiry.getMonth() + rate.durationMonths);
                    user.planExpiryDate = expiry.toISOString();
                }
            }
             saveToStorage(USERS_KEY, users);
        }

        saveToStorage(PAYMENT_REQUESTS_KEY, requests);
        return request;
    }
    return null;
  },
  
  getCoinRates: async (): Promise<CoinRate[]> => {
      await new Promise(res => setTimeout(res, 50));
      return getFromStorage<CoinRate[]>(COIN_RATES_KEY, []);
  },

  updateCoinRates: async (newRates: CoinRate[]): Promise<void> => {
      await new Promise(res => setTimeout(res, 200));
      saveToStorage(COIN_RATES_KEY, newRates);
  },

  getPaymentMethods: async (): Promise<PaymentMethod[]> => {
      await new Promise(res => setTimeout(res, 50));
      return getFromStorage<PaymentMethod[]>(PAYMENT_METHODS_KEY, []);
  },

  updatePaymentMethods: async (newMethods: PaymentMethod[]): Promise<void> => {
      await new Promise(res => setTimeout(res, 200));
      saveToStorage(PAYMENT_METHODS_KEY, newMethods);
  },
  
  // --- AI API Key Management ---
  getAiApiKeys: async (): Promise<AiApiKey[]> => {
      await new Promise(res => setTimeout(res, 50));
      return getFromStorage<AiApiKey[]>(AI_API_KEYS_KEY, []);
  },
  addAiApiKey: async (keyData: Omit<AiApiKey, 'id'>): Promise<AiApiKey> => {
      await new Promise(res => setTimeout(res, 200));
      const keys = getFromStorage<AiApiKey[]>(AI_API_KEYS_KEY, []);
      const newKey: AiApiKey = { ...keyData, id: crypto.randomUUID() };
      keys.push(newKey);
      saveToStorage(AI_API_KEYS_KEY, keys);
      return newKey;
  },
  updateAiApiKey: async (keyId: string, data: Partial<AiApiKey>): Promise<AiApiKey | null> => {
      await new Promise(res => setTimeout(res, 100));
      const keys = getFromStorage<AiApiKey[]>(AI_API_KEYS_KEY, []);
      const keyIndex = keys.findIndex(k => k.id === keyId);
      if (keyIndex !== -1) {
          keys[keyIndex] = { ...keys[keyIndex], ...data };
          saveToStorage(AI_API_KEYS_KEY, keys);
          return keys[keyIndex];
      }
      return null;
  },
  deleteAiApiKey: async (keyId: string): Promise<void> => {
      await new Promise(res => setTimeout(res, 100));
      let keys = getFromStorage<AiApiKey[]>(AI_API_KEYS_KEY, []);
      keys = keys.filter(k => k.id !== keyId);
      saveToStorage(AI_API_KEYS_KEY, keys);
  },

  // --- Backend Integration Management ---
  getBackendIntegrations: async (): Promise<BackendIntegration[]> => {
      await new Promise(res => setTimeout(res, 50));
      return getFromStorage<BackendIntegration[]>(BACKEND_INTEGRATIONS_KEY, []);
  },
  addBackendIntegration: async (integrationData: Omit<BackendIntegration, 'id'>): Promise<BackendIntegration> => {
      await new Promise(res => setTimeout(res, 200));
      const integrations = getFromStorage<BackendIntegration[]>(BACKEND_INTEGRATIONS_KEY, []);
      // FIX: Spreading a discriminated union is not well-supported and loses type info.
      // Casting to `any` forces TypeScript to accept the assignment, which is safe here
      // as we are simply adding an `id` property to a valid data structure.
      const newIntegration: BackendIntegration = { ...integrationData, id: crypto.randomUUID() } as any;
      integrations.push(newIntegration);
      saveToStorage(BACKEND_INTEGRATIONS_KEY, integrations);
      return newIntegration;
  },
  updateBackendIntegration: async (integrationId: string, data: Partial<BackendIntegration>): Promise<BackendIntegration | null> => {
      await new Promise(res => setTimeout(res, 100));
      const integrations = getFromStorage<BackendIntegration[]>(BACKEND_INTEGRATIONS_KEY, []);
      const index = integrations.findIndex(i => i.id === integrationId);
      if (index !== -1) {
          // FIX: Spreading a discriminated union can cause type errors. Casting the result
          // because we know that in this context we are only updating safe properties like 'enabled'.
          integrations[index] = { ...integrations[index], ...data } as BackendIntegration;
          saveToStorage(BACKEND_INTEGRATIONS_KEY, integrations);
          return integrations[index];
      }
      return null;
  },
  deleteBackendIntegration: async (integrationId: string): Promise<void> => {
      await new Promise(res => setTimeout(res, 100));
      let integrations = getFromStorage<BackendIntegration[]>(BACKEND_INTEGRATIONS_KEY, []);
      integrations = integrations.filter(i => i.id !== integrationId);
      saveToStorage(BACKEND_INTEGRATIONS_KEY, integrations);
  },

  // --- Ad Management ---
  getAdvertisementConfigs: async (): Promise<AdvertisementConfig[]> => {
      await new Promise(res => setTimeout(res, 50));
      return getFromStorage<AdvertisementConfig[]>(ADVERTISEMENT_CONFIGS_KEY, []);
  },
  addAdvertisementConfig: async (configData: Omit<AdvertisementConfig, 'id'>): Promise<AdvertisementConfig> => {
      await new Promise(res => setTimeout(res, 200));
      const configs = getFromStorage<AdvertisementConfig[]>(ADVERTISEMENT_CONFIGS_KEY, []);
      const newConfig: AdvertisementConfig = { ...configData, id: crypto.randomUUID() };
      configs.push(newConfig);
      saveToStorage(ADVERTISEMENT_CONFIGS_KEY, configs);
      return newConfig;
  },
  updateAdvertisementConfig: async (configId: string, data: Partial<AdvertisementConfig>): Promise<AdvertisementConfig | null> => {
      await new Promise(res => setTimeout(res, 100));
      const configs = getFromStorage<AdvertisementConfig[]>(ADVERTISEMENT_CONFIGS_KEY, []);
      const configIndex = configs.findIndex(c => c.id === configId);
      if (configIndex !== -1) {
          configs[configIndex] = { ...configs[configIndex], ...data };
          saveToStorage(ADVERTISEMENT_CONFIGS_KEY, configs);
          return configs[configIndex];
      }
      return null;
  },
  deleteAdvertisementConfig: async (configId: string): Promise<void> => {
      await new Promise(res => setTimeout(res, 100));
      let configs = getFromStorage<AdvertisementConfig[]>(ADVERTISEMENT_CONFIGS_KEY, []);
      configs = configs.filter(c => c.id !== configId);
      saveToStorage(ADVERTISEMENT_CONFIGS_KEY, configs);
  }
};