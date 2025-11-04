import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { PreviewPanel } from './PreviewPanel';
import { FileNode, ChatMessage, AiLog, GenerationState, DriveAccount, Project, User, CoinRate } from '../types';
import { generateWebsite } from '../services/geminiService';
import { googleDriveService } from '../services/googleDriveService';
import { supabaseService } from '../services/supabaseService';
import { githubService } from '../services/githubService';
import { learningService } from '../services/learningService';
import { MyProjectsModal } from './MyProjectsModal';
import { SupabaseModal } from './SupabaseModal';
import { GitHubModal } from './GitHubModal';
import { 
    CoinsIcon, NewProjectIcon, HomeIcon, 
    CogIcon, FolderIcon, LogoutIcon, PencilIcon, ArrowDownTrayIcon,
    ArrowsPointingOutIcon, ComputerDesktopIcon, DeviceTabletIcon, DevicePhoneMobileIcon, CodeBracketIcon,
    ChevronUpIcon, ChevronDownIcon, MenuIcon, XIcon, RocketIcon, GitHubIcon, SupabaseIcon, CheckIcon, TerminalIcon,
    RefreshIcon, GoogleSheetsIcon
} from './icons/Icons';
import Sidebar from './Sidebar';
import { LogsPanel } from './LogsPanel';
import { PaymentModal } from './PaymentModal';
import { InsufficientCoinsModal } from './InsufficientCoinsModal';
import { AdDisplay } from './AdDisplay';

declare var JSZip: any;

const PROJECTS_STORAGE_KEY = 'doveable_ai_projects';
const USER_STORAGE_KEY = 'doveable_ai_user';

const initialMessages: ChatMessage[] = [
    {
        id: crypto.randomUUID(),
        role: 'model',
        content: "I can now build complete, interactive web applications for you.",
        aiSummary: "Hello! I'm Doveable AI.\n\n- Describe the website or app you want to build.",
    }
];

const constructSrcDoc = (files: FileNode[]): string => {
  const htmlFile = files.find(f => f.path === 'index.html');
  if (!htmlFile) {
    return '<html><body><div style="font-family: sans-serif; color: #555; text-align: center; padding-top: 50px;"><h1>index.html not found</h1><p>The AI did not generate an index.html file.</p></div></body></html>';
  }

  let processedHtml = htmlFile.content;

  // This regex finds script tags with a `src` attribute.
  // It now specifically looks for module scripts to avoid replacing non-module scripts incorrectly.
  processedHtml = processedHtml.replace(/<script type="module"[^>]+src="([^"]+)"[^>]*>(?:<\/script>)?/g, (match, path) => {
    const cleanPath = path.startsWith('./') ? path.substring(2) : path;
    const jsFile = files.find(f => f.path === cleanPath);
    if (jsFile) {
      let scriptContent = jsFile.content;
      // Handle imports inside the JS file.
      // This is a naive implementation and might not cover all edge cases,
      // but it handles direct relative imports.
      scriptContent = scriptContent.replace(/from\s+['"](\.\/[^'"]+)['"]/g, (importMatch, importPath) => {
        const resolvedPath = importPath.endsWith('.js') ? importPath.substring(2) : `${importPath.substring(2)}.js`;
        const importedFile = files.find(f => f.path === resolvedPath);
        if (importedFile) {
          // This is a major simplification. We can't actually bundle the code here.
          // Instead, we might need a more sophisticated preview mechanism for React apps.
          // For now, let's just log that we found it.
          console.log(`Previewer found import for: ${resolvedPath}. This won't be bundled in the preview.`);
        }
        return importMatch; // Return original import statement
      });
      return `<script type="module">${scriptContent}</script>`;
    }
    return match;
  });

  // Handle CSS links
   processedHtml = processedHtml.replace(/<link[^>]+href="([^"]+\.css)"[^>]*>/g, (match, path) => {
    const cleanPath = path.startsWith('./') ? path.substring(2) : path;
    const cssFile = files.find(f => f.path === cleanPath);
    if (cssFile) {
      return `<style>${cssFile.content}</style>`;
    }
    return match;
  });

  return processedHtml;
};

const loadProjectsFromStorage = (): Project[] => {
    try {
        const storedData = localStorage.getItem(PROJECTS_STORAGE_KEY);
        if (storedData) {
            const parsedProjects = JSON.parse(storedData);
            // Dates are stored as strings in JSON, so we need to convert them back
            return parsedProjects.map((project: any) => ({
                ...project,
                savedAt: new Date(project.savedAt),
                history: (project.history || []).map((historyItem: any) => ({
                    ...historyItem,
                    savedAt: new Date(historyItem.savedAt),
                })),
                chatHistory: (project.chatHistory || []).map((chat: any) => ({
                    ...chat
                })),
                freePromptUsed: project.freePromptUsed ?? false, // Default to false for old projects
            }));
        }
    } catch (error) {
        console.error("Failed to load projects from local storage:", error);
    }
    return [];
};

const saveProjectsToStorage = (projects: Project[]) => {
    try {
        localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
    } catch (error) {
        console.error("Failed to save projects to local storage:", error);
    }
};

const loadUserFromStorage = (): User => {
    try {
        const storedUser = localStorage.getItem(USER_STORAGE_KEY);
        if (storedUser) {
            return JSON.parse(storedUser);
        }
    } catch (error) {
        console.error("Failed to load user data from storage:", error);
    }
    // Default user state
    return { 
        id: 'default-user',
        name: 'User Name', 
        email: 'user@example.com', 
        coins: 100,
        role: 'user',
        subscriptionStatus: 'inactive',
        plan: 'free',
    };
};

const saveUserToStorage = (user: User) => {
    try {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } catch (error) {
        console.error("Failed to save user data to storage:", error);
    }
};

const NewProjectModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => void;
}> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim(), description.trim());
      setName('');
      setDescription('');
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all animate-fade-in-up">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Create New Project</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
            <XIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="projectName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm"
                placeholder="e.g., My Awesome Landing Page"
                required
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700 mb-1">
                Project Description
              </label>
              <textarea
                id="projectDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none text-sm"
                rows={4}
                placeholder="Briefly describe what this project is about."
              />
            </div>
          </div>
          <div className="p-4 bg-gray-50 border-t rounded-b-lg flex justify-end items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-gray-400"
              disabled={!name.trim()}
            >
              Start Project
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

const ProjectSetupModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => void;
  project: Project | null;
}> = ({ isOpen, onClose, onSave, project }) => {
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');

  useEffect(() => {
    if (project) {
        setName(project.name);
        setDescription(project.description);
    }
  }, [project]);

  if (!isOpen || !project) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim(), description.trim());
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all animate-fade-in-up">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Setup Your Project</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
            <XIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-600">Give your new project a name and description before we generate it.</p>
            <div>
              <label htmlFor="setupProjectName" className="block text-sm font-medium text-gray-700 mb-1">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="setupProjectName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm"
                placeholder="e.g., My Awesome Landing Page"
                required
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="setupProjectDescription" className="block text-sm font-medium text-gray-700 mb-1">
                Project Description
              </label>
              <textarea
                id="setupProjectDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none text-sm"
                rows={4}
                placeholder="Briefly describe what this project is about."
              />
            </div>
          </div>
          <div className="p-4 bg-gray-50 border-t rounded-b-lg flex justify-end items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-gray-400"
              disabled={!name.trim()}
            >
              Save & Generate
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


export const SidebarHeader: React.FC<{
    driveStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
    onConnectDrive: () => void;
    onNavigateHome: () => void;
    onOpenProjects: () => void;
    onNewProject: () => void;
}> = ({ driveStatus, onConnectDrive, onNavigateHome, onOpenProjects, onNewProject }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleMenuAction = (action: () => void) => {
        action();
        setIsMenuOpen(false);
    };

    return (
        <div className="p-4 border-b border-gray-200">
            <div className="relative" ref={menuRef}>
                <button
                    onClick={() => setIsMenuOpen(prev => !prev)}
                    className="w-full flex items-center justify-between p-2 -mx-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    aria-haspopup="true"
                    aria-expanded={isMenuOpen}
                >
                    <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-md flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-xl">D</span>
                        </div>
                        <span className="text-lg font-semibold text-dark truncate">Doveable AI</span>
                    </div>
                    {isMenuOpen ? <ChevronUpIcon className="w-5 h-5 text-gray-500 flex-shrink-0" /> : <ChevronDownIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />}
                </button>

                {isMenuOpen && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-md shadow-lg z-10 border border-gray-100 py-1">
                         <div className="px-2 py-1">
                             <a href="#" onClick={(e) => { e.preventDefault(); handleMenuAction(onNavigateHome); }} className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                                <HomeIcon className="w-4 h-4 mr-3 text-gray-500" />
                                <span>Home Page</span>
                            </a>
                            <a href="#" onClick={(e) => { e.preventDefault(); handleMenuAction(onOpenProjects); }} className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                                <FolderIcon className="w-4 h-4 mr-3 text-gray-500" />
                                <span>My Projects</span>
                            </a>
                        </div>
                        <div className="border-t border-gray-100 my-1"></div>
                        <div className="px-2 py-1">
                            <button 
                                onClick={() => handleMenuAction(onNewProject)}
                                className="w-full text-left flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                                <NewProjectIcon className="w-4 h-4 mr-3 text-gray-500" />
                                <span>New Project</span>
                            </button>
                            <button
                                onClick={() => handleMenuAction(onConnectDrive)}
                                disabled={driveStatus === 'connecting' || driveStatus === 'connected'}
                                className="w-full text-left flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <img src="https://i.supaimg.com/d7864d78-0d6b-4942-8e0a-6b7efde0ad74.png" alt="Google Drive Icon" className="w-4 h-4 mr-3" />
                                <span>
                                    {driveStatus === 'connecting' && 'Connecting...'}
                                    {driveStatus === 'disconnected' && 'Connect Drive'}
                                    {driveStatus === 'error' && 'Connection Failed'}
                                    {driveStatus === 'connected' && 'Drive Connected'}
                                </span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const MainHeader: React.FC<{
    project: Project;
    onUpdateProjectName: (newName: string) => void;
    onDownloadZip: () => void;
    onNavigateHome: () => void;
    projectCount: number;
    onOpenProjects: () => void;
    user: User;
    onConnectSupabase: () => void;
    onConnectGitHub: () => void;
    onNavigateToSubscriptions: () => void;
    onOpenIntegrations: () => void;
}> = ({ project, onUpdateProjectName, onDownloadZip, onNavigateHome, projectCount, onOpenProjects, user, onConnectSupabase, onConnectGitHub, onNavigateToSubscriptions, onOpenIntegrations }) => {
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isDeployMenuOpen, setIsDeployMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const deployMenuRef = useRef<HTMLDivElement>(null);
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempProjectName, setTempProjectName] = useState(project.name);
    const nameInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setTempProjectName(project.name);
    }, [project.name]);

    useEffect(() => {
        if (isEditingName) {
            nameInputRef.current?.focus();
            nameInputRef.current?.select();
        }
    }, [isEditingName]);

    const handleNameUpdate = () => {
        if (tempProjectName.trim() && tempProjectName.trim() !== project.name) {
            onUpdateProjectName(tempProjectName.trim());
        }
        setIsEditingName(false);
    };


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
            if (deployMenuRef.current && !deployMenuRef.current.contains(event.target as Node)) {
                setIsDeployMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const getInitials = (name: string) => {
        if (!name) return '';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    const userInitials = getInitials(user.name);
    const isSupabaseConnected = !!project.supabase;
    const isGithubConnected = !!project.github;


    return (
        <header className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between flex-shrink-0 h-[57px]">
            <div className="flex items-center space-x-2">
                 {isEditingName ? (
                    <input
                        ref={nameInputRef}
                        type="text"
                        value={tempProjectName}
                        onChange={(e) => setTempProjectName(e.target.value)}
                        onBlur={handleNameUpdate}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleNameUpdate();
                            if (e.key === 'Escape') {
                                setTempProjectName(project.name);
                                setIsEditingName(false);
                            }
                        }}
                        className="text-sm font-semibold text-gray-800 bg-white border border-purple-400 rounded-md px-1 -my-1"
                    />
                ) : (
                    <h1 className="text-sm font-semibold text-gray-800">{project.name}</h1>
                )}
                <button onClick={() => setIsEditingName(true)} className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-full">
                    <PencilIcon className="w-4 h-4 text-gray-500 cursor-pointer"/>
                </button>
            </div>
            
            <div className="flex items-center space-x-3">
                 <div className="relative" ref={deployMenuRef}>
                    <button 
                        onClick={() => setIsDeployMenuOpen(p => !p)}
                        className="flex items-center justify-center space-x-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-900 rounded-md text-sm font-medium text-white transition-colors"
                    >
                        <RocketIcon className="w-4 h-4" />
                        <span>Deploy</span>
                    </button>
                     {isDeployMenuOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-20 border border-gray-100 py-1">
                            <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase">Integrations</div>
                            <div className="px-2">
                                <button onClick={() => { onConnectSupabase(); setIsDeployMenuOpen(false); }} disabled={isSupabaseConnected} className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md disabled:opacity-60 disabled:cursor-not-allowed">
                                    <span className="flex items-center"><SupabaseIcon className="w-4 h-4 mr-3" /> Supabase</span>
                                    {isSupabaseConnected && <CheckIcon className="w-4 h-4 text-green-500" />}
                                </button>
                                <button onClick={() => { onConnectGitHub(); setIsDeployMenuOpen(false); }} disabled={isGithubConnected} className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md disabled:opacity-60 disabled:cursor-not-allowed">
                                    <span className="flex items-center"><GitHubIcon className="w-4 h-4 mr-3" /> GitHub</span>
                                    {isGithubConnected && <CheckIcon className="w-4 h-4 text-green-500" />}
                                </button>
                            </div>
                            <div className="border-t border-gray-100 my-1"></div>
                            <div className="px-2">
                                <button onClick={onDownloadZip} title="Download as ZIP" className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                                    <ArrowDownTrayIcon className="w-4 h-4 mr-3 text-gray-500" />
                                    <span>Download ZIP</span>
                                </button>
                            </div>
                        </div>
                    )}
                 </div>
                 
                 <div className="h-6 w-px bg-gray-200"></div>

                 <div className="flex items-center space-x-2">
                    <button onClick={onNavigateToSubscriptions} className="flex items-center justify-center space-x-2 px-3 py-1.5 bg-yellow-100 hover:bg-yellow-200 rounded-md text-sm font-medium text-yellow-800">
                        <CoinsIcon className="w-4 h-4" />
                        <span>{user.coins} Coins</span>
                    </button>
                    <div className="relative" ref={userMenuRef}>
                        <button 
                            onClick={() => setIsUserMenuOpen(prev => !prev)}
                            className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                        >
                            {isUserMenuOpen ? <XIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
                        </button>
                        {isUserMenuOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-20 border border-gray-100">
                                <div className="px-4 py-3">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-9 h-9 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-semibold text-sm">
                                            {userInitials}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="border-t border-gray-100"></div>
                                <div className="py-1">
                                    <a href="#" onClick={(e) => { e.preventDefault(); onNavigateHome(); setIsUserMenuOpen(false); }} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        <HomeIcon className="w-4 h-4 mr-3 text-gray-500" />
                                        <span>Home page</span>
                                    </a>
                                    <a href="#" onClick={(e) => {e.preventDefault(); onNavigateToSubscriptions(); setIsUserMenuOpen(false);}} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        <CoinsIcon className="w-4 h-4 mr-3 text-gray-500" />
                                        <span>Get coins</span>
                                    </a>
                                    <a href="#" onClick={(e) => { e.preventDefault(); onOpenIntegrations(); setIsUserMenuOpen(false); }} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        <CogIcon className="w-4 h-4 mr-3 text-gray-500" />
                                        <span>Integration</span>
                                    </a>
                                    <a href="#" onClick={(e) => { e.preventDefault(); onOpenProjects(); setIsUserMenuOpen(false); }} className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        <div className="flex items-center">
                                            <FolderIcon className="w-4 h-4 mr-3 text-gray-500" />
                                            <span>My projects</span>
                                        </div>
                                        {projectCount > 0 && (
                                            <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-0.5 rounded-full">{projectCount}</span>
                                        )}
                                    </a>
                                </div>
                                <div className="border-t border-gray-100"></div>
                                <div className="py-1">
                                    <a href="#" onClick={() => setIsUserMenuOpen(false)} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        <LogoutIcon className="w-4 h-4 mr-3 text-gray-500" />
                                        <span>Logout</span>
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                 </div>
            </div>
        </header>
    );
};

const Toolbar: React.FC<{
    activeTab: 'preview' | 'code';
    setActiveTab: (tab: 'preview' | 'code') => void;
    device: 'desktop' | 'tablet' | 'mobile';
    setDevice: (device: 'desktop' | 'tablet' | 'mobile') => void;
    onRefresh: () => void;
    onFullScreen: () => void;
}> = ({ activeTab, setActiveTab, device, setDevice, onRefresh, onFullScreen }) => {
    const [isDeviceMenuOpen, setDeviceMenuOpen] = useState(false);
    const deviceMenuRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (deviceMenuRef.current && !deviceMenuRef.current.contains(event.target as Node)) {
                setDeviceMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const deviceIcons = {
        desktop: <ComputerDesktopIcon className="w-4 h-4" />,
        tablet: <DeviceTabletIcon className="w-4 h-4" />,
        mobile: <DevicePhoneMobileIcon className="w-4 h-4" />,
    };

    return (
        <div className="p-2 border-b border-gray-200 bg-white flex items-center justify-between h-[41px] flex-shrink-0">
            <div className="flex items-center space-x-1 p-1 bg-gray-100 rounded-md">
                <button 
                    onClick={() => setActiveTab('preview')}
                    className={`px-3 py-0.5 text-sm font-medium rounded flex items-center space-x-1.5 ${activeTab === 'preview' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:bg-white/60'}`}
                >
                    <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'preview' ? 'bg-blue-500' : 'bg-transparent'}`}></div>
                    <span>Preview</span>
                </button>
                <button 
                    onClick={() => setActiveTab('code')}
                    className={`px-3 py-0.5 text-sm font-medium rounded flex items-center space-x-1.5 ${activeTab === 'code' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:bg-white/60'}`}
                >
                    <CodeBracketIcon className="w-4 h-4" />
                    <span>Code</span>
                </button>
            </div>

            <div className="flex items-center space-x-4">
                 <button onClick={onFullScreen} className="flex items-center space-x-2 text-sm text-gray-600 hover:bg-gray-100 px-2 py-1 rounded-md">
                    <ArrowsPointingOutIcon className="w-4 h-4" />
                    <span>Full screen</span>
                </button>
            </div>

            <div className="flex items-center space-x-2">
                 <div className="relative" ref={deviceMenuRef}>
                    <button onClick={() => setDeviceMenuOpen(p => !p)} className="flex items-center space-x-2 text-sm text-gray-600 hover:bg-gray-100 px-2 py-1 rounded-md">
                        {deviceIcons[device]}
                        <span>Device</span>
                    </button>
                    {isDeviceMenuOpen && (
                         <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-20 border border-gray-100 py-1">
                            <button onClick={() => { setDevice('desktop'); setDeviceMenuOpen(false); }} className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                <ComputerDesktopIcon className="w-4 h-4 mr-3 text-gray-500" />
                                <span>Desktop</span>
                            </button>
                            <button onClick={() => { setDevice('tablet'); setDeviceMenuOpen(false); }} className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                <DeviceTabletIcon className="w-4 h-4 mr-3 text-gray-500" />
                                <span>Tablet</span>
                            </button>
                            <button onClick={() => { setDevice('mobile'); setDeviceMenuOpen(false); }} className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                <DevicePhoneMobileIcon className="w-4 h-4 mr-3 text-gray-500" />
                                <span>Mobile</span>
                            </button>
                        </div>
                    )}
                 </div>
                 <div className="h-4 w-px bg-gray-200 mx-2"></div>
                 <button onClick={onRefresh} title="Refresh Preview" className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600">
                     <RefreshIcon className="w-4 h-4" />
                 </button>
            </div>
        </div>
    );
}

const GoogleSheetsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConnect: (details: { privateKeyId: string; clientEmail: string; clientId: string; projectId: string; }) => void;
}> = ({ isOpen, onClose, onConnect }) => {
  const [details, setDetails] = useState({ privateKeyId: '', clientEmail: '', clientId: '', projectId: '' });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.values(details).every(val => val.trim())) {
      onConnect(details);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => { if (e.target === e.currentTarget) onClose(); };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setDetails({ ...details, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={handleBackdropClick}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2"><GoogleSheetsIcon className="w-5 h-5" /><span>Connect to Google Sheets</span></h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><XIcon className="w-5 h-5 text-gray-600" /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-500">Enter your Google Cloud Service Account credentials. These are stored per-project and are not shared.</p>
            {Object.keys(details).map(key => (
              <div key={key}>
                <label htmlFor={key} className="block text-sm font-medium text-gray-700 mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                <input
                  type="text"
                  id={key}
                  name={key}
                  value={details[key as keyof typeof details]}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 font-mono text-xs"
                  required
                />
              </div>
            ))}
          </div>
          <div className="p-4 bg-gray-50 border-t rounded-b-lg flex justify-end">
            <button type="submit" className="px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded-md hover:bg-purple-700 disabled:bg-gray-400" disabled={!Object.values(details).every(val => val.trim())}>
              Connect
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const IntegrationsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    project: Project;
    onConnectSupabase: () => void;
    onConnectGitHub: () => void;
    onConnectGoogleSheets: () => void;
}> = ({ isOpen, onClose, project, onConnectSupabase, onConnectGitHub, onConnectGoogleSheets }) => {
    if (!isOpen) return null;

    const integrations = [
        {
            name: 'Supabase',
            icon: <SupabaseIcon className="w-6 h-6" />,
            description: 'Connect a backend database for your project.',
            isConnected: !!project.supabase,
            onConnect: onConnectSupabase,
        },
        {
            name: 'GitHub',
            icon: <GitHubIcon className="w-6 h-6" />,
            description: 'Deploy your site to a new GitHub repository.',
            isConnected: !!project.github,
            onConnect: onConnectGitHub,
        },
        {
            name: 'Google Sheets',
            icon: <GoogleSheetsIcon className="w-6 h-6 text-green-600" />,
            description: 'Read from or write data to Google Sheets.',
            isConnected: !!project.googleSheets,
            onConnect: onConnectGoogleSheets,
        },
    ];

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={handleBackdropClick}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl transform transition-all animate-fade-in-up">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800">Project Integrations</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><XIcon className="w-5 h-5 text-gray-600" /></button>
                </div>
                <div className="p-6 space-y-4">
                    {integrations.map(int => (
                        <div key={int.name} className="flex items-center p-3 border rounded-lg">
                            <div className="mr-4 flex-shrink-0">{int.icon}</div>
                            <div className="flex-grow">
                                <h4 className="font-semibold text-gray-900">{int.name}</h4>
                                <p className="text-sm text-gray-500">{int.description}</p>
                            </div>
                            <button
                                onClick={int.onConnect}
                                disabled={int.isConnected}
                                className="px-4 py-1.5 text-sm font-medium rounded-md flex-shrink-0 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed bg-gray-800 text-white hover:bg-gray-900"
                            >
                                {int.isConnected ? 'Connected' : 'Connect'}
                            </button>
                        </div>
                    ))}
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

export const WebsiteBuilder: React.FC<{ onNavigateHome: () => void; onNavigateToSubscriptions: () => void; }> = ({ onNavigateHome, onNavigateToSubscriptions }) => {
    const [files, setFiles] = useState<FileNode[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
    const [logs, setLogs] = useState<AiLog[]>([]);
    const [generationState, setGenerationState] = useState<GenerationState>('idle');
    const [driveStatus, setDriveStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
    const [activeDriveAccount, setActiveDriveAccount] = useState<DriveAccount | null>(null);
    
    const [projects, setProjects] = useState<Project[]>([]);
    
    const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
    const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
    const [previewKey, setPreviewKey] = useState(0);
    const [user, setUser] = useState<User>(() => loadUserFromStorage());
    
    const [activeProject, setActiveProject] = useState<Project | null>(null);
    const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
    const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
    const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

    const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
    const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
    const [isGoogleSheetsModalOpen, setIsGoogleSheetsModalOpen] = useState(false);
    const [isIntegrationsModalOpen, setIsIntegrationsModalOpen] = useState(false);
    
    const [attachment, setAttachment] = useState<{ file: File; dataUrl: string } | null>(null);
    const isFirstRender = useRef(true);

    const [isCoinsModalOpen, setIsCoinsModalOpen] = useState(false);
    const [coinRates, setCoinRates] = useState<CoinRate[]>([]);

    const addLog = useCallback((message: string, type: AiLog['type'] = 'info') => {
        setLogs(prev => [...prev, { id: crypto.randomUUID(), timestamp: new Date().toISOString(), message, type }]);
    }, []);
    
    const handleLoadProject = useCallback((projectToLoad: Project) => {
        setActiveProject(projectToLoad);
        setFiles(projectToLoad.files);
        setMessages(projectToLoad.chatHistory.length > 0 ? projectToLoad.chatHistory : initialMessages);
        addLog(`Loaded project "${projectToLoad.name}".`, 'success');
    }, [addLog]);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            
            const loadedProjects = loadProjectsFromStorage();
            
            if (loadedProjects.length > 0) {
                setProjects(loadedProjects);
                // Sort by savedAt date to find the most recent project
                const sortedProjects = [...loadedProjects].sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
                const lastProject = sortedProjects[0];
                handleLoadProject(lastProject);
                addLog(`Automatically loaded your most recent project: "${lastProject.name}".`);
            } else {
                // No projects exist, create a new default one
                const defaultProject: Project = {
                    id: crypto.randomUUID(),
                    name: "My First Project",
                    description: "A new website generated by Doveable AI",
                    files: [],
                    savedAt: new Date(),
                    chatHistory: initialMessages,
                    srcDoc: '',
                    history: [],
                    freePromptUsed: false,
                };
                setProjects([defaultProject]);
                setActiveProject(defaultProject);
                setFiles([]);
                setMessages(initialMessages);
                addLog(`Welcome! Started your first project: "${defaultProject.name}"`);
            }
        }
    }, [addLog, handleLoadProject]);

    useEffect(() => {
        saveProjectsToStorage(projects);
    }, [projects]);
    
    useEffect(() => {
        saveUserToStorage(user);
    }, [user]);


    useEffect(() => {
        const fetchInitialData = async () => {
            const initialLearnings = await learningService.getLearnings();
            addLog(`Loaded ${initialLearnings.length} learnings from knowledge base.`);
            
            const rates = await supabaseService.getCoinRates();
            setCoinRates(rates);
            addLog(`Loaded ${rates.length} coin rate plans.`);
        };
        fetchInitialData();
    }, [addLog]);

    const srcDoc = useMemo(() => {
        if (!files || files.length === 0) {
          return `
            <html>
              <body style="display: flex; justify-content: center; align-items: center; height: 100%; font-family: sans-serif; color: #9ca3af; background-color: #f9fafb;">
                <div style="text-align: center;">
                  <p>Your website preview will appear here.</p>
                </div>
              </body>
            </html>`;
        }
        return constructSrcDoc(files);
      }, [files]);

    const handleOpenPreviewInNewTab = useCallback(() => {
        if (!srcDoc) return;
        const blob = new Blob([srcDoc], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    }, [srcDoc]);

    const handleDownloadZip = async () => {
        if (!activeProject || files.length === 0) {
            addLog("There are no files to download.", 'error');
            return;
        }

        addLog(`Preparing download for project: "${activeProject.name}"...`);
        try {
            const zip = new JSZip();
            files.forEach(file => {
                zip.file(file.path, file.content);
            });

            const blob = await zip.generateAsync({ type: 'blob' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${activeProject.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'website'}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            addLog(`Project "${activeProject.name}" downloaded successfully.`, 'success');
        } catch (error) {
            console.error("Error creating zip file:", error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            addLog(`Failed to create zip file: ${errorMessage}`, 'error');
        }
    };
    
    const handleConnectDrive = useCallback(async () => {
        setDriveStatus('connecting');
        addLog('Connecting to Google Drive...');
        try {
            const account = await googleDriveService.connect();
            setActiveDriveAccount(account);
            setDriveStatus('connected');
            addLog(`Successfully connected to Google Drive: ${account.email}`, 'success');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            setDriveStatus('error');
            addLog(`Failed to connect to Google Drive: ${errorMessage}`, 'error');
        }
    }, [addLog]);

    const updateProjectState = (updatedProject: Project) => {
        setActiveProject(updatedProject);
        setProjects(prevProjects => 
            prevProjects.map(p => p.id === updatedProject.id ? updatedProject : p)
        );
    };
    
    const handleConnectSupabase = useCallback(async (details: { url: string; anonKey: string }) => {
        setIsSupabaseModalOpen(false);
        if (!activeProject) return;

        addLog(`Connecting project "${activeProject.name}" to Supabase...`);
        try {
            await supabaseService.connect(details); // Simulate connection
            const updatedProject = { ...activeProject, supabase: details };
            updateProjectState(updatedProject);
            
            addLog('Successfully connected to Supabase.', 'success');
            setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'system', content: `Project "${activeProject.name}" connected to Supabase. Future changes will be saved.`}]);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            addLog(`Failed to connect to Supabase: ${errorMessage}`, 'error');
        }
    }, [addLog, activeProject]);

    const handleConnectGitHub = useCallback(async (details: { token: string }) => {
        setIsGitHubModalOpen(false);
        if (!activeProject) return;

        addLog(`Connecting project "${activeProject.name}" to GitHub...`);
        try {
            const { repoUrl } = await githubService.connect({ token: details.token, projectName: activeProject.name });
            const updatedProject = { ...activeProject, github: { repoUrl } };
            updateProjectState(updatedProject);

            addLog(`Successfully connected to GitHub. New repository created at: ${repoUrl}`, 'success');
            setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'system', content: `Project "${activeProject.name}" connected to GitHub repo: ${repoUrl}. Future changes will be pushed.`}]);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            addLog(`Failed to connect to GitHub: ${errorMessage}`, 'error');
        }
    }, [addLog, activeProject]);
    
    const handleConnectGoogleSheets = useCallback(async (details: { privateKeyId: string; clientEmail: string; clientId: string; projectId: string; }) => {
        setIsGoogleSheetsModalOpen(false);
        if (!activeProject) return;

        addLog(`Connecting project "${activeProject.name}" to Google Sheets...`);
        const updatedProject = { ...activeProject, googleSheets: details };
        updateProjectState(updatedProject);
        
        addLog('Successfully configured Google Sheets credentials.', 'success');
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'system', content: `Project "${activeProject.name}" connected to Google Sheets.`}]);
    }, [addLog, activeProject]);

    const handleSaveToIntegrations = useCallback(async (projectToSave: Project) => {
        if (projectToSave.supabase) {
            addLog(`Saving project "${projectToSave.name}" to Supabase...`);
            try {
                await supabaseService.saveProject(projectToSave);
                addLog('Project saved to Supabase successfully.', 'success');
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
                addLog(`Failed to save to Supabase: ${errorMessage}`, 'error');
            }
        }

        if (projectToSave.github) {
            addLog(`Pushing files for "${projectToSave.name}" to GitHub repo: ${projectToSave.github.repoUrl}`);
            try {
                await githubService.saveFiles(projectToSave.files, `Update from Doveable AI: ${new Date().toISOString()}`);
                addLog('Files pushed to GitHub successfully.', 'success');
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
                addLog(`Failed to push files to GitHub: ${errorMessage}`, 'error');
            }
        }
    }, [addLog]);

    const handleRollback = useCallback((stateIndex: number) => {
        if (!activeProject || !activeProject.history[stateIndex]) {
            addLog("No state found to roll back to.", 'error');
            return;
        }
    
        addLog(`Rolling back to project state from before change #${stateIndex + 1}...`, 'info');
    
        const stateToRestore = activeProject.history[stateIndex];
    
        // Create the updated project state after the rollback
        const rolledBackProject: Project = {
            ...activeProject, // Keep current project ID, name, etc.
            files: stateToRestore.files, // Use files from the historical state
            srcDoc: stateToRestore.srcDoc, // Use srcDoc from the historical state
            // Keep the current chat history so old rollback buttons are not lost
            chatHistory: messages, 
            history: activeProject.history, // Keep the full, unmodified history array
            branchedFrom: { index: stateIndex, totalHistoryLength: activeProject.history.length }
        };
    
        // Update the application state
        setActiveProject(rolledBackProject);
        setFiles(rolledBackProject.files);
        
        // Add a new system message to the existing chat history to inform the user
        const rollbackMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'system',
            content: `Project restored to the version before change #${stateIndex + 1}. Your next change will create a new branch in history.`,
        };
        setMessages(prevMessages => [...prevMessages, rollbackMessage]);
    
        addLog("Rollback successful. The next change will branch from this point.", 'success');
    }, [activeProject, messages, addLog]);

    const handleUpdateProjectName = useCallback((projectId: string, newName: string) => {
        setProjects(prevProjects =>
            prevProjects.map(p =>
                p.id === projectId ? { ...p, name: newName } : p
            )
        );
        if (activeProject && activeProject.id === projectId) {
            setActiveProject(p => p ? { ...p, name: newName } : null);
        }
        addLog(`Project name updated to "${newName}".`, 'success');
    }, [addLog, activeProject]);

    const handleUpdateActiveProjectName = (newName: string) => {
        if (activeProject) {
            const updatedProject = { ...activeProject, name: newName };
            updateProjectState(updatedProject);
            addLog(`Project name updated to "${newName}".`, 'success');
        }
    };

    const handleNewProject = () => {
        setIsNewProjectModalOpen(true);
    };
    
    const runGeneration = useCallback(async (prompt: string, project: Project, attachment: { file: File; dataUrl: string } | null) => {
        const isFreePrompt = !project.freePromptUsed;
        const promptCost = 10;
        
        if (!isFreePrompt && user.coins < promptCost) {
            addLog('Generation failed: Insufficient coins.', 'error');
            setIsCoinsModalOpen(true);
            return;
        }

        const startTime = Date.now();
        const isModification = project.files && project.files.length > 0;
        
        const isBranching = !!project.branchedFrom;
        const baseHistory = project.history;

        const stateToSaveInHistory = isModification ? { ...project, history: [], branchedFrom: undefined } : null;
        const updatedHistory = stateToSaveInHistory ? [...baseHistory, stateToSaveInHistory] : baseHistory;
        
        const rollbackIndex = isModification ? baseHistory.length : -1;

        setGenerationState('generating');
        addLog(`Generating with prompt: "${prompt}"`);

        const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: prompt };
        if (attachment) {
            userMessage.attachment = {
                name: attachment.file.name,
                type: attachment.file.type,
                dataUrl: attachment.dataUrl,
            };
        }
        
        const currentMessages = (project.chatHistory && project.chatHistory.length > 0) ? project.chatHistory : initialMessages;
        const newMessages: ChatMessage[] = [...currentMessages.filter(m => m.aiSummary !== "Hello! I'm Doveable AI.\n\n- Describe the website you want to build, or ask me to edit the current one."), userMessage];
        setMessages(newMessages);

        try {
            const aiResponse = await generateWebsite(prompt, project, attachment);
            const endTime = Date.now();
            const durationInSeconds = Math.round((endTime - startTime) / 1000);
            
            addLog(`Received ${aiResponse.files.length} total files from AI.`, 'success');

            const modelMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'model',
                content: aiResponse.summary,
                aiSummary: aiResponse.aiSummary,
                commitMessage: aiResponse.commitMessage,
                thoughtDuration: durationInSeconds,
                editsMade: aiResponse.changedFileCount,
                generatedFiles: aiResponse.files.map(file => ({ path: file.path })),
            };

            if (isModification) {
                modelMessage.rollbackStateIndex = rollbackIndex;
                let label: string;
                if (isBranching) {
                    const parentNumber = project.branchedFrom!.index + 1;
                    const newSequentialNumber = updatedHistory.length;
                    label = `(${parentNumber}/${newSequentialNumber})`;
                } else {
                    label = `(#${updatedHistory.length})`;
                }
                modelMessage.rollbackLabel = label;
            }
            
            let finalMessages = [...newMessages, modelMessage];
            
            const htmlFiles = aiResponse.files.filter(f => f.path.endsWith('.html'));
            const isReactApp = aiResponse.files.some(f => f.path.endsWith('.js') && f.content.includes('React.createElement'));
            if (htmlFiles.length > 1 && !isReactApp) {
                const multiPageMessage: ChatMessage = {
                    id: crypto.randomUUID(),
                    role: 'system',
                    content: `I've generated a multi-page website. Navigation between pages may not work in this preview, but all files are in the 'Code' tab and will be fully functional when downloaded.`
                };
                finalMessages.push(multiPageMessage);
            }

            setMessages(finalMessages);

            const updatedProject: Project = {
                ...project,
                files: aiResponse.files,
                srcDoc: constructSrcDoc(aiResponse.files),
                savedAt: new Date(),
                chatHistory: finalMessages,
                history: updatedHistory,
                branchedFrom: undefined, // Clear the flag
                freePromptUsed: true, // Mark free prompt as used
            };
            
            if (!isFreePrompt) {
                setUser(prevUser => ({ ...prevUser, coins: prevUser.coins - promptCost }));
                addLog(`Deducted ${promptCost} coins. New balance: ${user.coins - promptCost}.`, 'info');
            } else {
                 addLog('First free prompt used for this project.', 'info');
            }

            updateProjectState(updatedProject);
            setFiles(aiResponse.files);
            setGenerationState('success');
            setPreviewKey(k => k + 1);
            
            handleSaveToIntegrations(updatedProject);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during generation.";
            addLog(errorMessage, 'error');
            setGenerationState('error');

            const errorMessageForChat: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'model',
                content: `I encountered an error: ${errorMessage}\n\nPlease try again or modify your prompt.`
            };
            setMessages(prev => [...prev, errorMessageForChat]);
        }
    }, [addLog, handleSaveToIntegrations, user.coins]);

    const handleSendMessage = useCallback((prompt: string, projectOverride?: Project) => {
        const projectToUse = projectOverride || activeProject;

        if (!projectToUse) {
            setPendingPrompt(prompt);
            setIsNewProjectModalOpen(true);
            return;
        }
        
        // If project has no files, it's the first prompt. Show setup modal.
        if (projectToUse.files.length === 0) {
            setPendingPrompt(prompt);
            setIsSetupModalOpen(true);
            return;
        }

        runGeneration(prompt, projectToUse, attachment);
        setAttachment(null);
    }, [activeProject, runGeneration, attachment]);
    
    const handleSaveNewProject = (name: string, description: string) => {
        setIsNewProjectModalOpen(false);
        
        const newProject: Project = {
            id: crypto.randomUUID(),
            name,
            description,
            files: [],
            savedAt: new Date(),
            chatHistory: initialMessages,
            srcDoc: '',
            history: [],
            freePromptUsed: false,
        };

        setActiveProject(newProject);
        setProjects(prev => [...prev, newProject]);
        setFiles([]);
        setMessages(initialMessages);
        addLog(`Started new project: "${name}"`);

        if (pendingPrompt) {
            runGeneration(pendingPrompt, newProject, attachment);
            setAttachment(null);
            setPendingPrompt(null);
        }
    };
    
    const handleSetupAndGenerate = useCallback((name: string, description: string) => {
        setIsSetupModalOpen(false);
        if (!activeProject || !pendingPrompt) {
            addLog("Error: Missing project or prompt for setup generation.", 'error');
            return;
        }

        const updatedProject = {
            ...activeProject,
            name,
            description,
        };

        updateProjectState(updatedProject);
        addLog(`Project setup complete. Name: "${name}"`);

        runGeneration(pendingPrompt, updatedProject, attachment);
        setAttachment(null);
        setPendingPrompt(null);
    }, [activeProject, pendingPrompt, attachment, addLog, runGeneration]);


    const handleSwitchToCodeView = () => {
        setActiveTab('code');
    };

    return (
        <>
        <div className="h-screen w-screen flex bg-white font-sans antialiased text-gray-900">
            <Sidebar
                messages={messages}
                onSendMessage={handleSendMessage}
                generationState={generationState}
                driveStatus={driveStatus}
                onConnectDrive={handleConnectDrive}
                onNavigateHome={onNavigateHome}
                onOpenProjects={() => setIsProjectsModalOpen(true)}
                onNewProject={handleNewProject}
                onRollback={handleRollback}
                onSwitchToCodeView={handleSwitchToCodeView}
                activeProject={activeProject}
                userCoins={user.coins}
                attachment={attachment}
                onSetAttachment={setAttachment}
            />

            <main className="flex-1 flex flex-col min-w-0">
            {activeProject ? (
                <>
                <MainHeader
                    project={activeProject}
                    onNavigateHome={onNavigateHome}
                    projectCount={projects.length}
                    onOpenProjects={() => setIsProjectsModalOpen(true)}
                    user={user}
                    onUpdateProjectName={handleUpdateActiveProjectName}
                    onDownloadZip={handleDownloadZip}
                    onConnectSupabase={() => setIsSupabaseModalOpen(true)}
                    onConnectGitHub={() => setIsGitHubModalOpen(true)}
                    onNavigateToSubscriptions={onNavigateToSubscriptions}
                    onOpenIntegrations={() => setIsIntegrationsModalOpen(true)}
                />
                <Toolbar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    device={device}
                    setDevice={setDevice}
                    onRefresh={() => setPreviewKey(k => k + 1)}
                    onFullScreen={handleOpenPreviewInNewTab}
                />
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex-1 flex flex-col min-w-0">
                        <PreviewPanel
                            srcDoc={srcDoc}
                            isLoading={generationState === 'generating'}
                            files={files}
                            activeTab={activeTab}
                            device={device}
                            previewKey={previewKey}
                        />
                    </div>
                    <div className="flex-shrink-0 border-t border-gray-200 bg-yellow-50/50 min-h-[150px] flex items-center justify-center">
                        <AdDisplay placement="Bottom Banner" />
                    </div>
                </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-8 text-center">
                    <div className="max-w-md">
                        <div className="mx-auto w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <NewProjectIcon className="w-6 h-6 text-gray-500" />
                        </div>
                        <h2 className="mt-4 text-xl font-semibold text-gray-800">Welcome to Doveable AI</h2>
                        <p className="mt-2 text-sm text-gray-600">
                        To get started, create a new project. You'll be able to describe your website and watch it come to life.
                        </p>
                        <button
                        onClick={handleNewProject}
                        className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-primary hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                        >
                        <NewProjectIcon className="-ml-1 mr-2 h-5 w-5" />
                        Create New Project
                        </button>
                    </div>
                </div>
            )}
            </main>

        </div>
        
        <NewProjectModal
            isOpen={isNewProjectModalOpen}
            onClose={() => setIsNewProjectModalOpen(false)}
            onSave={handleSaveNewProject}
        />

        <ProjectSetupModal
            isOpen={isSetupModalOpen}
            onClose={() => setIsSetupModalOpen(false)}
            onSave={handleSetupAndGenerate}
            project={activeProject}
        />

        <MyProjectsModal
            isOpen={isProjectsModalOpen}
            onClose={() => setIsProjectsModalOpen(false)}
            projects={projects}
            onLoadProject={handleLoadProject}
            onUpdateProjectName={handleUpdateProjectName}
        />

        <SupabaseModal
            isOpen={isSupabaseModalOpen}
            onClose={() => setIsSupabaseModalOpen(false)}
            onConnect={handleConnectSupabase}
        />
        
        <GitHubModal
            isOpen={isGitHubModalOpen}
            onClose={() => setIsGitHubModalOpen(false)}
            onConnect={handleConnectGitHub}
        />

        {activeProject && (
            <IntegrationsModal
                isOpen={isIntegrationsModalOpen}
                onClose={() => setIsIntegrationsModalOpen(false)}
                project={activeProject}
                onConnectSupabase={() => { setIsIntegrationsModalOpen(false); setIsSupabaseModalOpen(true); }}
                onConnectGitHub={() => { setIsIntegrationsModalOpen(false); setIsGitHubModalOpen(true); }}
                onConnectGoogleSheets={() => { setIsIntegrationsModalOpen(false); setIsGoogleSheetsModalOpen(true); }}
            />
        )}

        <GoogleSheetsModal
            isOpen={isGoogleSheetsModalOpen}
            onClose={() => setIsGoogleSheetsModalOpen(false)}
            onConnect={handleConnectGoogleSheets}
        />

        <InsufficientCoinsModal
            isOpen={isCoinsModalOpen}
            onClose={() => setIsCoinsModalOpen(false)}
            coinRates={coinRates}
            onNavigateToSubscriptions={() => {
                setIsCoinsModalOpen(false);
                onNavigateToSubscriptions();
            }}
        />
        </>
    );
};