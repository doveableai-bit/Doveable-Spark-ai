import React, { useState } from 'react';
import { ChatMessage, GenerationState } from '../types';
import {
    PlusIcon, PaperclipIcon, ArrowUpSquareIcon, NewProjectIcon, UndoIcon
} from './icons/Icons';
import { SidebarHeader } from './WebsiteBuilder';


const Sidebar: React.FC<{
    messages: ChatMessage[];
    onSendMessage: (prompt: string) => void;
    generationState: GenerationState;
    driveStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
    onConnectDrive: () => void;
    onNavigateHome: () => void;
    onOpenProjects: () => void;
    onNewProject: () => void;
    onRollback: (stateIndex: number) => void;
}> = ({ messages, onSendMessage, generationState, driveStatus, onConnectDrive, onNavigateHome, onOpenProjects, onNewProject, onRollback }) => {
    const [prompt, setPrompt] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (prompt.trim() && generationState !== 'generating') {
            onSendMessage(prompt);
            setPrompt('');
        }
    };

    return (
        <aside className="w-[30%] bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
            <SidebarHeader 
              driveStatus={driveStatus} 
              onConnectDrive={onConnectDrive}
              onNavigateHome={onNavigateHome}
              onOpenProjects={onOpenProjects}
              onNewProject={onNewProject}
            />
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-800">Chat</h2>
                <button 
                  onClick={onNewProject} 
                  className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-semibold text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-purple-500"
                >
                  <NewProjectIcon className="w-4 h-4" />
                  <span>New Project</span>
                </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((msg) => {
                    if (msg.role === 'system') {
                        return (
                             <div key={msg.id} className="text-center text-xs text-gray-500 italic py-2">
                                <span>{msg.content}</span>
                            </div>
                        );
                    }
                    return (
                        <div key={msg.id} className="text-sm text-gray-700">
                            <p className="font-semibold text-gray-900 mb-1">
                                {msg.role === 'model' ? 'Doveable AI' : 'You'}
                            </p>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                            {msg.rollbackStateIndex !== undefined && (
                                <div className="mt-2">
                                    <button
                                        onClick={() => onRollback(msg.rollbackStateIndex!)}
                                        className="flex items-center space-x-1.5 px-2 py-1 text-xs font-semibold text-purple-600 bg-purple-50 rounded-md hover:bg-purple-100 hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-purple-500 transition-colors"
                                    >
                                        <UndoIcon className="w-3.5 h-3.5" />
                                        <span>Roll back changes (#{msg.rollbackStateIndex + 1})</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
                 {generationState === 'generating' && (
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <svg className="animate-spin h-4 w-4 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Generating...</span>
                    </div>
                )}
            </div>
            <div className="p-4 border-t border-gray-200">
                <form onSubmit={handleSubmit} className="space-y-2">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Here write ask to Doveable....."
                        className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none text-sm"
                        rows={3}
                        disabled={generationState === 'generating'}
                    />
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                            <button type="button" className="p-2 rounded-md hover:bg-gray-100 text-gray-500">
                                <PlusIcon className="w-5 h-5" />
                            </button>
                             <button type="button" className="p-2 rounded-md hover:bg-gray-100 text-gray-500">
                                <PaperclipIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <button 
                            type="submit"
                            className="w-9 h-9 bg-black text-white rounded-md flex items-center justify-center disabled:bg-gray-400"
                            disabled={!prompt.trim() || generationState === 'generating'}
                        >
                            <ArrowUpSquareIcon className="w-5 h-5" />
                        </button>
                    </div>
                </form>
            </div>
        </aside>
    );
};

export default Sidebar;