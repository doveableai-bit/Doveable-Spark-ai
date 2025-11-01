import React, { useState, useEffect } from 'react';
import { FileNode } from '../types';
import { DocumentTextIcon } from './icons/Icons';

interface CodePanelProps {
  files: FileNode[];
}

export const CodePanel: React.FC<CodePanelProps> = ({ files }) => {
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);

  useEffect(() => {
    if (files && files.length > 0) {
      const htmlFile = files.find(f => f.path === 'index.html');
      setSelectedFilePath(htmlFile ? htmlFile.path : files[0].path);
    } else {
      setSelectedFilePath(null);
    }
  }, [files]);

  const selectedFile = files.find(f => f.path === selectedFilePath);

  return (
    <div className="flex h-full bg-white">
      {/* File Explorer */}
      <div className="w-1/3 max-w-xs border-r border-gray-200 bg-gray-50 overflow-y-auto">
        <div className="p-2 border-b border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">Files</h3>
        </div>
        <nav className="p-2">
          {files.length > 0 ? (
            <ul>
              {files.map(file => (
                <li key={file.path}>
                  <button
                    onClick={() => setSelectedFilePath(file.path)}
                    className={`w-full text-left flex items-center space-x-2 px-2 py-1.5 rounded-md text-sm ${
                      selectedFilePath === file.path
                        ? 'bg-purple-100 text-purple-800 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <DocumentTextIcon className="w-4 h-4 flex-shrink-0 text-gray-500" />
                    <span className="truncate">{file.path}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-sm text-gray-500">
              No files to display.
            </div>
          )}
        </nav>
      </div>

      {/* Code Viewer */}
      <div className="flex-1 bg-[#1e1e1e] text-gray-300 font-mono text-sm overflow-auto">
        {selectedFile ? (
          <pre className="p-4 h-full w-full overflow-auto">
            <code className="language-html">{selectedFile.content}</code>
          </pre>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 font-sans">
            <p>Select a file to view its code</p>
          </div>
        )}
      </div>
    </div>
  );
};