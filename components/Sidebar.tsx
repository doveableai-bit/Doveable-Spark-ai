import React, { useState, useRef } from 'react';
import { ChatMessage, GenerationState, Project } from '../types';
import {
    PlusIcon, PaperclipIcon, ArrowUpSquareIcon, NewProjectIcon, UndoIcon,
    UserIcon, ChevronRightIcon, CodeBracketIcon, LightbulbIcon, CoinsIcon, XIcon
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
    onSwitchToCodeView: () => void;
    activeProject: Project | null;
    userCoins: number;
    attachment: { file: File; dataUrl: string } | null;
    onSetAttachment: (attachment: { file: File; dataUrl: string } | null) => void;
}> = ({ 
    messages, onSendMessage, generationState, driveStatus, onConnectDrive, onNavigateHome, 
    onOpenProjects, onNewProject, onRollback, onSwitchToCodeView, activeProject, 
    userCoins, attachment, onSetAttachment 
}) => {
    const [prompt, setPrompt] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (prompt.trim() && generationState !== 'generating') {
            onSendMessage(prompt);
            setPrompt('');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onSetAttachment({
                    file,
                    dataUrl: reader.result as string,
                });
            };
            reader.readAsDataURL(file);
        }
        if(e.target) {
            e.target.value = '';
        }
    };

    const isFirstPrompt = activeProject ? !activeProject.freePromptUsed : true;
    const hasEnoughCoins = userCoins >= 10;
    const canSubmit = (prompt.trim() || attachment) && generationState !== 'generating' && (isFirstPrompt || hasEnoughCoins);

    return (
        <aside className="w-[30%] bg-[#f7f7f8] border-r border-gray-200 flex flex-col flex-shrink-0">
            <SidebarHeader 
              driveStatus={driveStatus} 
              onConnectDrive={onConnectDrive}
              onNavigateHome={onNavigateHome}
              onOpenProjects={onOpenProjects}
              onNewProject={onNewProject}
            />
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
                <h2 className="text-sm font-semibold text-gray-800">Chat</h2>
                <button 
                  onClick={onNewProject} 
                  className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-semibold text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-purple-500"
                >
                  <NewProjectIcon className="w-4 h-4" />
                  <span>New Project</span>
                </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-6">
                {messages.map((msg) => {
                    if (msg.role === 'system') {
                        return (
                             <div key={msg.id} className="text-center text-xs text-gray-500 italic py-2">
                                <span>{msg.content}</span>
                            </div>
                        );
                    }
                    if (msg.role === 'user') {
                        return (
                            <div key={msg.id} className="flex space-x-3">
                                <div className="w-6 h-6 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center mt-1">
                                    <UserIcon className="w-4 h-4 text-gray-600" />
                                </div>
                                <div className="flex-1 bg-white p-3 rounded-lg border border-gray-200/80">
                                    <p className="font-semibold text-gray-900 mb-1 text-sm">
                                        You
                                    </p>
                                    {msg.content && <p className="whitespace-pre-wrap text-sm text-gray-700">{msg.content}</p>}
                                    {msg.attachment && (
                                        <div className="mt-2">
                                            <img src={msg.attachment.dataUrl} alt={msg.attachment.name} className="max-w-full h-auto rounded-md border" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    }
                    if (msg.role === 'model') {
                        return (
                            <div key={msg.id} className="bg-white rounded-lg border border-gray-200/80 overflow-hidden text-sm">
                                <div className="p-3">
                                    {msg.thoughtDuration !== undefined && (
                                        <p className="text-xs text-gray-500">Thought for {msg.thoughtDuration}s</p>
                                    )}
                                    {msg.aiSummary && <p className="mt-2 text-gray-800 whitespace-pre-wrap">{msg.aiSummary}</p>}
                                    
                                    {msg.editsMade !== undefined && msg.editsMade > 0 && (
                                        <div className="text-xs text-gray-600 mt-3 flex justify-between items-center py-1">
                                            <span>{msg.editsMade} edits made</span>
                                            <button className="font-semibold text-gray-800 hover:underline">Show all</button>
                                        </div>
                                    )}
                                    
                                    {msg.content && <p className="mt-1 text-gray-600 whitespace-pre-wrap">{msg.content}</p>}
                                </div>
                                
                                {msg.commitMessage && (
                                    <div className="bg-gray-50 border-t border-gray-200 px-3 py-2 flex items-center justify-between">
                                        <button className="flex items-center space-x-1 text-blue-600 font-medium text-sm hover:underline">
                                            <span className="truncate">{msg.commitMessage}</span>
                                            <ChevronRightIcon className="w-4 h-4 flex-shrink-0" />
                                        </button>
                                        <div className="flex items-center space-x-3">
                                            {msg.rollbackStateIndex !== undefined && (
                                                <button
                                                    onClick={() => onRollback(msg.rollbackStateIndex!)}
                                                    className="flex items-center space-x-1.5 text-xs font-semibold text-gray-600 hover:text-black"
                                                >
                                                    <UndoIcon className="w-3 h-3" />
                                                    <span>Restore</span>
                                                </button>
                                            )}
                                            <button 
                                                onClick={onSwitchToCodeView} 
                                                className="flex items-center space-x-1.5 text-xs font-semibold text-gray-600 hover:text-black"
                                            >
                                                <CodeBracketIcon className="w-4 h-4" />
                                                <span>Code</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    }
                    return null;
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
            <div className="p-4 border-t border-gray-200 bg-white">
                <form onSubmit={handleSubmit} className="space-y-2">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe the website you want to build, or the changes you want to make..."
                        className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none text-sm"
                        rows={3}
                        disabled={generationState === 'generating'}
                    />
                    {attachment && (
                        <div className="mt-2 p-2 border rounded-lg flex items-center justify-between bg-gray-50">
                            <div className="flex items-center space-x-2 overflow-hidden">
                                <img src={attachment.dataUrl} alt="Preview" className="w-10 h-10 rounded object-cover" />
                                <div className="text-xs overflow-hidden">
                                    <p className="font-medium text-gray-700 truncate">{attachment.file.name}</p>
                                    <p className="text-gray-500">{Math.round(attachment.file.size / 1024)} KB</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => onSetAttachment(null)} className="p-1 rounded-full hover:bg-gray-200 flex-shrink-0">
                                <XIcon className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>
                    )}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileChange}
                                accept="image/png, image/jpeg, image/webp, image/gif"
                            />
                            <button 
                                type="button" 
                                className="p-2 rounded-md hover:bg-gray-100 text-gray-500"
                                onClick={() => fileInputRef.current?.click()}
                                title="Attach an image"
                            >
                                <PaperclipIcon className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                            <div className="text-xs text-gray-500 text-right">
                                {activeProject && !activeProject.freePromptUsed && !hasEnoughCoins && <span className="text-red-500">Not enough coins</span>}
                                {activeProject && activeProject.freePromptUsed && hasEnoughCoins &&
                                    <span className="flex items-center space-x-1">
                                        <CoinsIcon className="w-3 h-3 text-yellow-500" />
                                        <span>Cost: 10 Coins</span>
                                    </span>
                                }
                                {(!activeProject || (activeProject && !activeProject.freePromptUsed)) &&
                                    <span className="font-medium text-purple-600">First prompt is free</span>
                                }
                            </div>
                            <button 
                                type="submit"
                                className="w-9 h-9 bg-black text-white rounded-md flex items-center justify-center disabled:bg-gray-400"
                                disabled={!canSubmit}
                            >
                                <ArrowUpSquareIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </aside>
    );
};

export default Sidebar;