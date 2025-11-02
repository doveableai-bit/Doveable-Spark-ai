
import React, { useState } from 'react';
import { CoinRate, User, PaymentMethod, PaymentGateway } from '../types';
import { XIcon, CheckIcon, ArrowUpTrayIcon } from './icons/Icons';
import { supabaseService } from '../services/supabaseService';


interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: CoinRate;
  user: User;
  paymentMethods: PaymentMethod[];
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, plan, user, paymentMethods, onSuccess }) => {
    const [selectedMethod, setSelectedMethod] = useState<PaymentGateway | null>(paymentMethods[0]?.id || null);
    const [proofScreenshot, setProofScreenshot] = useState<File | null>(null);
    const [proofPreview, setProofPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProofScreenshot(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setProofPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMethod || !proofScreenshot || !proofPreview) {
            setError("Please select a payment method and upload a payment proof screenshot.");
            return;
        }
        setError('');
        setIsSubmitting(true);
        try {
            await supabaseService.createPaymentRequest({
                userId: user.id,
                userName: user.name,
                userEmail: user.email,
                plan: plan.plan,
                amount: plan.price,
                paymentMethod: selectedMethod,
                proofScreenshotUrl: proofPreview,
            });
            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const selectedMethodDetails = paymentMethods.find(pm => pm.id === selectedMethod);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800">Complete Your Purchase</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                        <XIcon className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Side: Instructions */}
                        <div>
                            <h4 className="font-semibold text-gray-800">1. Select Payment Method</h4>
                            <div className="mt-2 space-y-2">
                                {paymentMethods.map(method => (
                                    <button type="button" key={method.id} onClick={() => setSelectedMethod(method.id)} className={`w-full text-left p-3 border rounded-md flex items-center justify-between ${selectedMethod === method.id ? 'border-purple-500 ring-2 ring-purple-500' : 'border-gray-300'}`}>
                                        <span className="font-medium capitalize">{method.name}</span>
                                        {selectedMethod === method.id && <CheckIcon className="w-5 h-5 text-purple-600" />}
                                    </button>
                                ))}
                            </div>

                            <h4 className="font-semibold text-gray-800 mt-6">2. Make Payment</h4>
                            <div className="mt-2 p-4 bg-gray-50 rounded-md border">
                                {selectedMethodDetails?.id === 'jazzcash' && (
                                    <div className="text-sm space-y-2">
                                        <p>Please send <span className="font-bold">${plan.price}</span> to the following JazzCash account:</p>
                                        <p className="font-mono bg-gray-200 p-2 rounded text-center">{selectedMethodDetails.accountNumber}</p>
                                        {selectedMethodDetails.qrCodeUrl && (
                                            <div className="mt-2">
                                                <p>Or scan the QR code:</p>
                                                <img src={selectedMethodDetails.qrCodeUrl} alt="JazzCash QR Code" className="w-40 h-40 mx-auto mt-1 border" />
                                            </div>
                                        )}
                                    </div>
                                )}
                                 {(selectedMethodDetails?.id === 'stripe' || selectedMethodDetails?.id === 'paypal' || selectedMethodDetails?.id === 'payoneer') && (
                                    <div className="text-sm">
                                        <p>Please follow the instructions on the {selectedMethodDetails.name} payment page (this is a demo).</p>
                                    </div>
                                )}
                                {!selectedMethodDetails && <p className="text-sm text-gray-500">Select a method to see instructions.</p>}
                            </div>
                        </div>

                        {/* Right Side: Upload */}
                        <div>
                             <h4 className="font-semibold text-gray-800">3. Upload Proof</h4>
                             <p className="text-sm text-gray-500 mb-2">Upload a screenshot of your payment confirmation.</p>
                             <div className="mt-2">
                                {proofPreview ? (
                                    <div className="text-center">
                                        <img src={proofPreview} alt="Screenshot preview" className="max-h-48 mx-auto border rounded-md" />
                                        <button type="button" onClick={() => { setProofPreview(null); setProofScreenshot(null); }} className="mt-2 text-sm text-red-600 hover:underline">
                                            Remove Screenshot
                                        </button>
                                    </div>
                                ): (
                                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-md hover:bg-gray-50">
                                        <ArrowUpTrayIcon className="w-8 h-8 text-gray-400" />
                                        <span className="mt-2 text-sm text-gray-600">Click to upload screenshot</span>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                                    </label>
                                )}
                             </div>
                        </div>
                    </div>
                     {error && <p className="text-sm text-red-600 text-center px-6 pb-2">{error}</p>}
                    <div className="p-4 bg-gray-50 border-t rounded-b-lg flex justify-end">
                        <button
                            type="submit"
                            className="px-6 py-2 bg-brand-primary text-white text-sm font-medium rounded-md hover:bg-purple-700 disabled:bg-gray-400"
                            disabled={isSubmitting || !proofScreenshot}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit for Verification'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
