import React, { useState } from 'react';
import { XIcon } from './icons/Icons';

interface GitHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (details: { token: string }) => void;
}

export const GitHubModal: React.FC<GitHubModalProps> = ({ isOpen, onClose, onConnect }) => {
  const [token, setToken] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      onConnect({ token: token.trim() });
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
          <h3 className="text-lg font-semibold text-gray-800">Connect to GitHub</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
            <XIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="github-token" className="block text-sm font-medium text-gray-700 mb-1">
                Personal Access Token <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="github-token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                placeholder="ghp_..."
                required
              />
               <p className="mt-2 text-xs text-gray-500">
                A new repository will be created for this project. Ensure your token has <code className="bg-gray-100 p-0.5 rounded">repo</code> scope.
                Your token is only used for this session and is not stored.
              </p>
            </div>
          </div>
          <div className="p-4 bg-gray-50 border-t rounded-b-lg flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded-md hover:bg-purple-700 disabled:bg-gray-400"
              disabled={!token.trim()}
            >
              Connect & Create Repo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};