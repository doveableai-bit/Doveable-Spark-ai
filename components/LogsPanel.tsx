
import React from 'react';
import { AiLog } from '../types';
import { InformationCircleIcon, CheckIcon, ExclamationTriangleIcon, ChevronDownIcon } from './icons/Icons';

const logIcon = (type: AiLog['type']) => {
    switch(type) {
        case 'success': return <CheckIcon className="w-5 h-5 text-green-500" />;
        case 'error': return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
        case 'info':
        default: return <InformationCircleIcon className="w-5 h-5 text-gray-400" />;
    }
}

export const LogsPanel: React.FC<{ logs: AiLog[]; onClose: () => void }> = ({ logs, onClose }) => {
    return (
        <div className="h-full flex flex-col bg-white">
            <div className="p-2 border-b border-gray-200 flex items-center justify-between flex-shrink-0 h-[41px]">
                 <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">Logs</h3>
                <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-200" title="Collapse Logs">
                    <ChevronDownIcon className="w-5 h-5 text-gray-600" />
                </button>
            </div>
            <div className="flex-1 bg-[#111827] text-gray-300 font-mono p-4 overflow-y-auto text-xs">
                {logs.length === 0 ? (
                    <p className="text-gray-500">Generation logs will appear here...</p>
                ) : (
                    <ul className="space-y-2">
                        {logs.map(log => (
                            <li key={log.id} className="flex items-start space-x-3">
                                <div className="mt-0.5 flex-shrink-0">{logIcon(log.type)}</div>
                                <span className="text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                <span className="flex-1 text-gray-300 whitespace-pre-wrap">{log.message}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};
