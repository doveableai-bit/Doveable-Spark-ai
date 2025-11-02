
import React, { useState, useEffect } from 'react';
import { supabaseService } from '../services/supabaseService';
import { CoinRate, User, PaymentMethod, PlanName } from '../types';
import { Header } from './Header';
import { PaymentModal } from './PaymentModal';
import { CoinsIcon } from './icons/Icons';

const USER_STORAGE_KEY = 'doveable_ai_user';


export const SubscriptionPage: React.FC<{ onNavigateToBuilder: () => void }> = ({ onNavigateToBuilder }) => {
    const [coinRates, setCoinRates] = useState<CoinRate[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<CoinRate | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    
    useEffect(() => {
        const fetchData = async () => {
            setCoinRates(await supabaseService.getCoinRates());
            setPaymentMethods(await supabaseService.getPaymentMethods());
            const storedUser = localStorage.getItem(USER_STORAGE_KEY);
            if(storedUser) setUser(JSON.parse(storedUser));
        };
        fetchData();
    }, []);

    const handleSelectPlan = (plan: CoinRate) => {
        setSelectedPlan(plan);
        setIsPaymentModalOpen(true);
    };

    const handlePaymentSuccess = () => {
        setIsPaymentModalOpen(false);
        // Optionally refetch user data here or show a success message
        alert("Your payment request has been submitted for review. Your coins will be added upon approval.");
        onNavigateToBuilder();
    };

    const PlanCard: React.FC<{ rate: CoinRate, onSelect: () => void, isCurrent: boolean }> = ({ rate, onSelect, isCurrent }) => (
        <div className={`border rounded-lg p-6 text-center transition-all ${isCurrent ? 'border-purple-500 ring-2 ring-purple-500' : 'border-gray-300 hover:shadow-lg'}`}>
            <h3 className="text-2xl font-semibold">{rate.plan.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
            <div className="my-4">
                <span className="text-5xl font-bold">{rate.coins}</span>
                <span className="text-gray-500"> coins</span>
            </div>
            <p className="text-xl font-medium mb-4">${rate.price}</p>
            {rate.plan === 'free' ? (
                 <p className="text-gray-500 h-10">Your starting plan</p>
            ): (
                 <button onClick={onSelect} disabled={isCurrent} className="w-full px-4 py-2 bg-brand-primary text-white font-semibold rounded-md hover:bg-purple-700 disabled:bg-gray-400">
                    {isCurrent ? 'Current Plan' : 'Choose Plan'}
                </button>
            )}
        </div>
    );

    return (
        <>
        <div className="min-h-screen bg-gray-50">
            <Header onGetStartedClick={onNavigateToBuilder} />
            <main className="max-w-4xl mx-auto pt-24 pb-12 px-4">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900">Choose Your Plan</h1>
                    <p className="mt-2 text-lg text-gray-600">Get more coins to power your creations.</p>
                     <div className="mt-4 inline-flex items-center space-x-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
                        <CoinsIcon className="w-5 h-5" />
                        <span className="font-semibold">Your balance: {user?.coins || 0} coins</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {coinRates.filter(rate => rate.plan !== 'free' && rate.plan !== 'none').map(rate => (
                        <PlanCard 
                            key={rate.plan} 
                            rate={rate} 
                            onSelect={() => handleSelectPlan(rate)}
                            isCurrent={user?.plan === rate.plan}
                        />
                    ))}
                </div>

                <div className="mt-12 text-center text-gray-500">
                    <p>Have questions? Email us at <a href="mailto:Doveableai@gmail.com" className="text-purple-600 hover:underline">Doveableai@gmail.com</a></p>
                     <button onClick={onNavigateToBuilder} className="mt-4 text-purple-600 hover:underline font-medium">
                        &larr; Back to Builder
                    </button>
                </div>
            </main>
        </div>
        {isPaymentModalOpen && selectedPlan && user && (
            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                plan={selectedPlan}
                user={user}
                paymentMethods={paymentMethods.filter(pm => pm.enabled)}
                onSuccess={handlePaymentSuccess}
            />
        )}
        </>
    );
};
