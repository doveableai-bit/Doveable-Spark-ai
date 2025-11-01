import React from 'react';
import { CodePanel } from './CodePanel';
import { FileNode } from '../types';

interface PreviewPanelProps {
  srcDoc: string;
  isLoading: boolean;
  files: FileNode[];
  activeTab: 'preview' | 'code';
  device: 'desktop' | 'tablet' | 'mobile';
  previewKey: number;
}

type Device = 'desktop' | 'tablet' | 'mobile';

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ srcDoc, files, activeTab, device, previewKey }) => {
  const deviceWidths: Record<Device, string> = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px',
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
        {activeTab === 'preview' ? (
             <div className="p-4 bg-gray-200 flex justify-center items-start h-full overflow-auto">
                <div 
                    className="bg-white rounded-md shadow-lg h-full transition-all duration-300 ease-in-out"
                    style={{ width: deviceWidths[device] }}
                >
                    <iframe
                    key={previewKey}
                    title="Website Preview"
                    srcDoc={srcDoc}
                    className="w-full h-full border-none rounded-md"
                    sandbox="allow-scripts allow-same-origin allow-forms"
                    />
                </div>
            </div>
        ) : (
            <CodePanel files={files} />
        )}
    </div>
  );
};
