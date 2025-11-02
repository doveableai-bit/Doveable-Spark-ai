
import React, { useState } from 'react';
import { XIcon, LightbulbIcon } from './icons/Icons';

interface TeachDoveableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (learningContent: string) => void;
}

export const TeachDoveableModal: React.FC<TeachDoveableModalProps> = ({ isOpen, onClose, onSave }) => {
  const [content, setContent] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSave(content.trim());
      setContent('');
      onClose();
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg transform transition-all animate-fade-in-up">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <LightbulbIcon className="w-5 h-5 mr-2 text-yellow-500" />
            Teach Doveable AI
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
            <XIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-600">
              Provide feedback, a design principle, or a piece of information you think would be useful. This knowledge will be stored and used to improve future website generations for all users.
            </p>
            <div>
              <label htmlFor="learningContent" className="block text-sm font-medium text-gray-700 mb-1">
                Knowledge or Feedback <span className="text-red-500">*</span>
              </label>
              <textarea
                id="learningContent"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none text-sm"
                rows={5}
                placeholder="e.g., 'A good call-to-action button should have high contrast with its background.'"
                required
                autoFocus
              />
            </div>
          </div>
          <div className="p-4 bg-gray-50 border-t rounded-b-lg flex justify-end items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded-md hover:bg-purple-700 disabled:bg-gray-400"
              disabled={!content.trim()}
            >
              Save to Knowledge Base
            </button>
          </div>
        </form>
         <style>{`
          @keyframes fade-in-up {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-up {
              animation: fade-in-up 0.3s ease-out forwards;
          }
        `}</style>
      </div>
    </div>
  );
};
