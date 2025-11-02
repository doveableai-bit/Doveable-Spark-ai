import React from 'react';
import { CoinRate } from '../types';
import { XIcon, CoinsIcon } from './icons/Icons';

interface InsufficientCoinsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToSubscriptions: () => void;
  coinRates: CoinRate[];
}

const PlanCard: React.FC<{ rate: CoinRate; onSelect: () => void }> = ({ rate, onSelect }) => (
    <div className="border border-gray-200 rounded-lg p-4 text-center transition-all hover:shadow-md hover:border-purple-400">
        <h3 className="text-lg font-semibold text-gray-800">{rate.plan.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
        <div className="my-2">
            <span className="text-3xl font-bold text-gray-900">{rate.coins}</span>
            <span className="text-gray-500 text-sm"> coins</span>
        </div>
        <p className="text-md font-medium mb-3 text-gray-700">${rate.price}</p>
        <button 
            onClick={onSelect} 
            className="w-full px-3 py-1.5 bg-brand-primary text-white text-sm font-semibold rounded-md hover:bg-purple-700"
        >
            Get Plan
        </button>
    </div>
);

export const InsufficientCoinsModal: React.FC<InsufficientCoinsModalProps> = ({ isOpen, onClose, onNavigateToSubscriptions, coinRates }) => {
    if (!isOpen) return null;

    const handleSelectPlan = () => {
        onNavigateToSubscriptions();
        onClose();
    };
    
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl transform transition-all animate-fade-in-up relative">
                <button 
                    onClick={onClose} 
                    className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-200"
                >
                    <XIcon className="w-5 h-5 text-gray-600" />
                </button>

                <div className="p-8">
                    <div className="text-center">
                        <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                            <CoinsIcon className="w-7 h-7 text-yellow-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mt-4">You've run out of coins!</h3>
                        <p className="text-gray-600 mt-2 max-w-md mx-auto">
                            To continue creating, please choose a plan below to top up your coin balance.
                        </p>
                    </div>

                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {coinRates
                            .filter(rate => rate.plan !== 'free' && rate.plan !== 'none')
                            .map(rate => (
                                <PlanCard
                                    key={rate.plan}
                                    rate={rate}
                                    onSelect={handleSelectPlan}
                                />
                            ))}
                    </div>
                </div>

                <div className="p-4 bg-gray-50 border-t rounded-b-lg text-center">
                    <button onClick={onClose} className="text-sm text-gray-600 hover:underline">
                        Maybe later
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
