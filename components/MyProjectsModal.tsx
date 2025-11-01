import React, { useState } from 'react';
import { Project, FileNode } from '../types';
import { XIcon, FolderIcon, PencilIcon, CheckIcon } from './icons/Icons';

interface MyProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onLoadProject: (project: Project) => void;
  onUpdateProjectName: (projectId: string, newName: string) => void;
}

export const MyProjectsModal: React.FC<MyProjectsModalProps> = ({ isOpen, onClose, projects, onLoadProject, onUpdateProjectName }) => {
    const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    
    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleStartEditing = (project: Project) => {
        setEditingProjectId(project.id);
        setEditingName(project.name);
    };

    const handleCancelEditing = () => {
        setEditingProjectId(null);
        setEditingName('');
    };

    const handleSaveName = () => {
        if (editingProjectId && editingName.trim()) {
            onUpdateProjectName(editingProjectId, editingName.trim());
            handleCancelEditing();
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl transform transition-all animate-fade-in-up">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                        <FolderIcon className="w-5 h-5 mr-2 text-gray-500" />
                        My Projects
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                        <XIcon className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {projects.length === 0 ? (
                        <div className="text-center py-8">
                             <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                <FolderIcon className="w-6 h-6 text-gray-400" />
                            </div>
                            <p className="text-gray-600 font-semibold mt-4">No saved projects yet.</p>
                            <p className="text-sm text-gray-500 mt-1">Projects you create will be auto-saved here after connecting Google Drive.</p>
                        </div>
                    ) : (
                        <ul className="space-y-4">
                            {projects.map(project => (
                                <li key={project.id} className="p-3 bg-gray-50 rounded-md border group hover:border-purple-300 transition-colors flex items-center space-x-4">
                                    <div className="w-40 h-28 bg-white border border-gray-200 rounded-md flex-shrink-0 overflow-hidden shadow-sm">
                                        <iframe
                                            srcDoc={project.srcDoc}
                                            title={`${project.name} thumbnail`}
                                            className="w-[534px] h-[374px] transform scale-[0.3] origin-top-left"
                                            sandbox="allow-scripts"
                                            scrolling="no"
                                            loading="lazy"
                                            style={{ pointerEvents: 'none', border: 'none' }}
                                        />
                                    </div>
                                    <div className="flex-1 flex justify-between items-center min-w-0">
                                        <div className="flex-1 min-w-0 pr-4">
                                            {editingProjectId === project.id ? (
                                                <input
                                                    type="text"
                                                    value={editingName}
                                                    onChange={(e) => setEditingName(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                                                    className="w-full px-2 py-1 text-sm border border-purple-400 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                                    autoFocus
                                                    onBlur={handleCancelEditing}
                                                />
                                            ) : (
                                                <div className="flex items-center space-x-2">
                                                    <p className="font-medium text-gray-900 truncate">{project.name}</p>
                                                    <button onClick={() => handleStartEditing(project)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-gray-200">
                                                        <PencilIcon className="w-4 h-4 text-gray-500" />
                                                    </button>
                                                </div>
                                            )}
                                            <p className="text-xs text-gray-500">
                                                Saved: {project.savedAt.toLocaleString()}
                                            </p>
                                        </div>
                                        {editingProjectId === project.id ? (
                                            <div className="flex items-center space-x-2 flex-shrink-0">
                                                <button
                                                    onClick={handleSaveName}
                                                    className="p-1.5 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                                                    title="Save"
                                                >
                                                    <CheckIcon className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={handleCancelEditing}
                                                    className="p-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                                                    title="Cancel"
                                                >
                                                    <XIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    onLoadProject(project);
                                                    onClose();
                                                }}
                                                className="px-4 py-1.5 bg-brand-primary text-white text-sm font-medium rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 flex-shrink-0"
                                            >
                                                Load
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="p-4 bg-gray-50 border-t rounded-b-lg text-right">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400">
                        Close
                    </button>
                </div>
            </div>
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
    );
};