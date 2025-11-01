import React, { useState } from 'react';
import { XIcon } from './icons/Icons';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (details: { url: string; anonKey: string }) => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose, onConnect }) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && anonKey.trim()) {
      onConnect({ url: url.trim(), anonKey: anonKey.trim() });
    }
  };
  
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Connect to Supabase</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
            <XIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="supabaseUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Project URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                id="supabaseUrl"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500"
                placeholder="https://<project-ref>.supabase.co"
                required
              />
            </div>
            <div>
              <label htmlFor="supabaseAnonKey" className="block text-sm font-medium text-gray-700 mb-1">
                Anon (Public) Key <span className="text-red-500">*</span>
              </label>
              <textarea
                id="supabaseAnonKey"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 font-mono text-xs"
                rows={3}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                required
              />
            </div>
          </div>
          <div className="p-4 bg-gray-50 border-t rounded-b-lg flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded-md hover:bg-purple-700 disabled:bg-gray-400"
              disabled={!url.trim() || !anonKey.trim()}
            >
              Connect
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
