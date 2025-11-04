// types.ts

export interface FileNode {
  path: string;
  content: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string; // User prompt, system message, or AI's detailed summary of changes.
  thoughtDuration?: number; // Duration of AI generation in seconds.
  aiSummary?: string; // The AI's plan/thought process summary. e.g., "I'll create the architecture..."
  editsMade?: number;
  commitMessage?: string;
  rollbackStateIndex?: number;
  rollbackLabel?: string;
  generatedFiles?: { path: string }[];
  attachment?: {
    name: string;
    type: string; // MIME type
    dataUrl: string;
  };
}

export interface AiLog {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'error' | 'success' | 'file';
}

export type GenerationState = 'idle' | 'generating' | 'success' | 'error';

export interface DriveAccount {
  id: number;
  email: string;
  status: 'active' | 'full';
}

export interface Project {
  id:string;
  name: string;
  description: string;
  files: FileNode[];
  savedAt: Date;
  chatHistory: ChatMessage[];
  srcDoc: string;
  history: Project[];
  branchedFrom?: { index: number; totalHistoryLength: number };
  freePromptUsed?: boolean;
  // Per-project integrations
  supabase?: {
    url: string;
    anonKey: string;
  };
  github?: {
    repoUrl: string;
  };
  googleSheets?: {
    privateKeyId: string;
    clientEmail: string;
    clientId: string;
    projectId: string;
  };
}

export interface Learning {
  id: string;
  content: string;
  createdAt: Date;
}


// --- SAAS FEATURES ---

export type UserRole = 'admin' | 'user';
export type SubscriptionStatus = 'active' | 'inactive';
export type PlanName = 'free' | '1-month' | '6-month' | '12-month' | 'none';

export interface User {
  id: string;
  name: string;
  email: string;
  coins: number;
  role: UserRole;
  subscriptionStatus: SubscriptionStatus;
  plan: PlanName;
  planExpiryDate?: string; // ISO string
}

export type PaymentGateway = 'jazzcash' | 'stripe' | 'paypal' | 'payoneer';

export interface PaymentMethod {
  id: PaymentGateway;
  name: string;
  enabled: boolean;
  // For JazzCash
  accountNumber?: string;
  qrCodeUrl?: string; // data URL
  // For others
  secretKey?: string;
}

export type PaymentRequestStatus = 'pending' | 'approved' | 'rejected';

export interface PaymentRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  plan: PlanName;
  amount: number;
  paymentMethod: PaymentGateway;
  proofScreenshotUrl: string; // data URL
  status: PaymentRequestStatus;
  submittedAt: string; // ISO string
}

export interface CoinRate {
  plan: PlanName;
  coins: number;
  price: number;
  durationMonths: number;
}

// --- ADMIN PANEL INTEGRATIONS ---

export interface AiApiKey {
  id: string;
  provider: 'gemini' | 'groq' | 'openai' | 'huggingface' | 'emergent-llm' | 'custom';
  name?: string; // For custom provider
  key: string;
  enabled: boolean;
}

// --- Backend Integration Types ---

export type BackendServiceType = 
  | 'supabase' 
  | 'firebase' 
  | 'mongodb' 
  | 'cloudflare' 
  | 'google-drive-oauth' 
  | 'google-drive-service' 
  | 'google-sheets';

interface BackendIntegrationBase {
    id: string;
    purpose: string; // e.g., "Main Project DB", "Cloudflare Account 1"
    type: BackendServiceType;
    enabled: boolean;
}

export interface SupabaseIntegration extends BackendIntegrationBase {
    type: 'supabase';
    credentials: {
        url: string;
        anonKey: string;
    };
}

export interface FirebaseIntegration extends BackendIntegrationBase {
    type: 'firebase';
    credentials: {
        apiKey: string;
        authDomain: string;
        projectId: string;
        storageBucket: string;
        messagingSenderId: string;
        appId: string;
        measurementId: string;
    };
}

export interface MongoDbIntegration extends BackendIntegrationBase {
    type: 'mongodb';
    credentials: {
        uri: string;
    };
}

export interface CloudflareIntegration extends BackendIntegrationBase {
    type: 'cloudflare';
    credentials: {
        apiToken: string;
        accountId: string;
    };
}

export interface GoogleDriveOauthIntegration extends BackendIntegrationBase {
    type: 'google-drive-oauth';
    credentials: {
        clientId: string;
        clientSecret: string;
        projectId: string;
    };
}

export interface GoogleDriveServiceIntegration extends BackendIntegrationBase {
    type: 'google-drive-service';
    credentials: {
        privateKeyId: string;
        clientEmail: string;
        clientId: string;
        projectId: string;
    };
}

export interface GoogleSheetsIntegration extends BackendIntegrationBase {
    type: 'google-sheets';
    credentials: {
        privateKeyId: string;
        clientEmail: string;
        clientId: string;
        projectId: string;
    };
}

export type BackendIntegration = 
    | SupabaseIntegration
    | FirebaseIntegration
    | MongoDbIntegration
    | CloudflareIntegration
    | GoogleDriveOauthIntegration
    | GoogleDriveServiceIntegration
    | GoogleSheetsIntegration;

// --- Advertisement Types ---

export type AdProvider = 'google' | 'adsterra' | 'custom';

export interface AdvertisementConfig {
  id: string;
  provider: AdProvider;
  name?: string; // For custom provider
  scriptOrCode: string;
  enabled: boolean;
}