
export interface FileNode {
  path: string;
  content: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  rollbackStateIndex?: number;
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
}