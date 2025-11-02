import React, { useState, useEffect } from 'react';
import { supabaseService } from '../services/supabaseService';
import { AdvertisementConfig } from '../types';

export const AdDisplay: React.FC<{ placement: string }> = ({ placement }) => {
    const [adConfig, setAdConfig] = useState<AdvertisementConfig | null>(null);

    useEffect(() => {
        const fetchAd = async () => {
            try {
                const configs = await supabaseService.getAdvertisementConfigs();
                // Find the first enabled configuration to display.
                // In a real app, you might have more complex logic for placement.
                const enabledConfig = configs.find(c => c.enabled); 
                if (enabledConfig) {
                    setAdConfig(enabledConfig);
                }
            } catch (error) {
                console.error("Failed to fetch ad configuration:", error);
            }
        };

        fetchAd();
    }, []);

    if (!adConfig) {
        return null; // Don't render anything if no active ad is found
    }

    // In a real production application, you would need a secure way
    // to dynamically inject and execute the third-party script.
    // For this development environment, we will render a safe placeholder
    // that displays the ad code without executing it. This demonstrates
    // that the correct ad data is being fetched and displayed based on
    // the admin panel settings.
    return (
        <div className="my-8 p-4 border-2 border-dashed border-gray-300 bg-gray-100 text-center text-gray-500">
            <p className="font-semibold">Advertisement Placeholder ({placement})</p>
            <p className="text-xs mb-2">
                Provider: <span className="capitalize font-mono">{adConfig.provider === 'custom' ? adConfig.name : adConfig.provider}</span>
            </p>
            <pre className="text-xs bg-gray-200 text-gray-600 p-2 rounded overflow-x-auto text-left">
                <code>{adConfig.scriptOrCode}</code>
            </pre>
        </div>
    );
};
