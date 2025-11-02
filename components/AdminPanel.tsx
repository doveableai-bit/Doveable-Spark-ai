import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
    Project, Learning, User, PaymentRequest, PaymentMethod, CoinRate, PaymentGateway, 
    AiApiKey, BackendIntegration, BackendServiceType, AdvertisementConfig, AdProvider
} from '../types';
import { learningService } from '../services/learningService';
import { supabaseService } from '../services/supabaseService';
import { 
    LogoutIcon, FolderIcon, LightbulbIcon, CoinsIcon, XIcon, CheckIcon, PencilIcon, UserIcon as UserIconSolid, 
    MegaphoneIcon, CogIcon, CpuChipIcon, ServerStackIcon, ChevronDownIcon, ChevronUpIcon, ExternalLinkIcon 
} from './icons/Icons';

const PROJECTS_STORAGE_key = 'doveable_ai_projects';

const maskApiKey = (key: string | undefined): string => {
    if (!key) return '';
    if (key.length <= 8) return '****';
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
}

const getInitialFormData = (type: BackendServiceType) => {
    const base = { purpose: '', type, enabled: true };
    switch (type) {
        case 'supabase': return { ...base, credentials: { url: '', anonKey: '' } };
        case 'firebase': return { ...base, credentials: { apiKey: '', authDomain: '', projectId: '', storageBucket: '', messagingSenderId: '', appId: '', measurementId: '' } };
        case 'mongodb': return { ...base, credentials: { uri: '' } };
        case 'cloudflare': return { ...base, credentials: { apiToken: '', accountId: '' } };
        case 'google-drive-oauth': return { ...base, credentials: { clientId: '', clientSecret: '', projectId: '' } };
        case 'google-drive-service': return { ...base, credentials: { privateKeyId: '', clientEmail: '', clientId: '', projectId: '' } };
        case 'google-sheets': return { ...base, credentials: { privateKeyId: '', clientEmail: '', clientId: '', projectId: '' } };
        default: return { ...base, credentials: {} };
    }
};

const serviceTypeLabels: Record<BackendServiceType, string> = {
    'supabase': 'Supabase',
    'firebase': 'Firebase',
    'mongodb': 'MongoDB',
    'cloudflare': 'Cloudflare',
    'google-drive-oauth': 'Google Drive (OAuth)',
    'google-drive-service': 'Google Drive (Service)',
    'google-sheets': 'Google Sheets',
};


export const AdminPanel: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const [activeTab, setActiveTab] = useState<'paymentRequests' | 'learnings' | 'projects' | 'users' | 'paymentMethods' | 'coinRates' | 'advertisement' | 'settings' | 'aiIntegration' | 'backendIntegration'>('paymentRequests');
    
    // Data states
    const [learnings, setLearnings] = useState<Learning[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [coinRates, setCoinRates] = useState<CoinRate[]>([]);
    const [aiApiKeys, setAiApiKeys] = useState<AiApiKey[]>([]);
    const [backendIntegrations, setBackendIntegrations] = useState<BackendIntegration[]>([]);
    const [advertisementConfigs, setAdvertisementConfigs] = useState<AdvertisementConfig[]>([]);

    const [expandedIntegrationId, setExpandedIntegrationId] = useState<string | null>(null);
    const [newIntegrationType, setNewIntegrationType] = useState<BackendServiceType>('supabase');
    const [newIntegrationData, setNewIntegrationData] = useState<any>(getInitialFormData('supabase'));

    // Form states
    const [newAiKey, setNewAiKey] = useState({ provider: 'gemini' as AiApiKey['provider'], key: '', name: '' });
    const [newAdConfig, setNewAdConfig] = useState({ provider: 'google' as AdProvider, name: '', scriptOrCode: '' });

    // Editing states
    const [isEditingLearning, setIsEditingLearning] = useState<Learning | null>(null);
    const [editingContent, setEditingContent] = useState('');
    const [newLearningContent, setNewLearningContent] = useState('');
    const [editingRates, setEditingRates] = useState<CoinRate[]>([]);
    const [editingMethods, setEditingMethods] = useState<PaymentMethod[]>([]);
    const qrCodeInputRef = useRef<HTMLInputElement>(null);

    // Payment request verification state
    const [verifyingRequest, setVerifyingRequest] = useState<PaymentRequest | null>(null);
    const [coinsToAward, setCoinsToAward] = useState(0);
    const [setSubscriptionActive, setSetSubscriptionActive] = useState(true);

    const fetchData = useCallback(async () => {
        setLearnings((await learningService.getLearnings()).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        setUsers(await supabaseService.getUsers());
        setPaymentRequests((await supabaseService.getPaymentRequests()).sort((a,b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));
        const methods = await supabaseService.getPaymentMethods();
        setPaymentMethods(methods);
        setEditingMethods(JSON.parse(JSON.stringify(methods)));
        const rates = await supabaseService.getCoinRates();
        setCoinRates(rates);
        setEditingRates(JSON.parse(JSON.stringify(rates)));
        setAiApiKeys(await supabaseService.getAiApiKeys());
        setBackendIntegrations(await supabaseService.getBackendIntegrations());
        setAdvertisementConfigs(await supabaseService.getAdvertisementConfigs());

        try { const storedProjects = localStorage.getItem(PROJECTS_STORAGE_key); setProjects(storedProjects ? JSON.parse(storedProjects) : []); } catch (error) { console.error("Failed to load projects for admin:", error); setProjects([]); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Handlers
    const handleUpdateLearning = async () => { if (isEditingLearning && editingContent.trim()) { await learningService.updateLearning(isEditingLearning.id, editingContent); setIsEditingLearning(null); setEditingContent(''); fetchData(); } };
    const handleDeleteLearning = async (id: string) => { if (window.confirm('Are you sure?')) { await learningService.deleteLearning(id); fetchData(); } };
    const handleAddLearning = async (e: React.FormEvent) => { e.preventDefault(); if (newLearningContent.trim()) { await learningService.saveLearning(newLearningContent); setNewLearningContent(''); fetchData(); } };
    
    const handleStartVerification = (request: PaymentRequest) => {
        setVerifyingRequest(request);
        const plan = coinRates.find(r => r.plan === request.plan);
        setCoinsToAward(plan?.coins || 0);
        setSetSubscriptionActive(true);
    };

    const handleConfirmApproval = async () => {
        if (!verifyingRequest) return;
        await supabaseService.approvePaymentRequest(
            verifyingRequest.id,
            coinsToAward,
            setSubscriptionActive
        );
        setVerifyingRequest(null);
        fetchData();
    };

    const handleRejectRequest = async (request: PaymentRequest) => { if (window.confirm('Are you sure you want to reject this request?')) { await supabaseService.updatePaymentRequestStatus(request.id, 'rejected'); fetchData(); } };
    
    const handleToggleSubscription = async (user: User) => { const newStatus = user.subscriptionStatus === 'active' ? 'inactive' : 'active'; await supabaseService.updateUser(user.id, { subscriptionStatus: newStatus }); fetchData(); };
    const handleRatesChange = (plan: string, price: string) => { const newPrice = parseFloat(price); if (!isNaN(newPrice)) { setEditingRates(prev => prev.map(rate => rate.plan === plan ? {...rate, price: newPrice} : rate)); } };
    const handleSaveRates = async () => { await supabaseService.updateCoinRates(editingRates); fetchData(); alert('Coin rates updated!'); };
    const handleMethodsChange = (id: PaymentGateway, field: keyof PaymentMethod, value: string | boolean) => { setEditingMethods(prev => prev.map(method => method.id === id ? {...method, [field]: value} : method)); };
    const handleQrCodeUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => { handleMethodsChange('jazzcash', 'qrCodeUrl', reader.result as string); }; reader.readAsDataURL(file); } };
    const handleSaveMethods = async () => { await supabaseService.updatePaymentMethods(editingMethods); fetchData(); alert('Payment methods updated!'); };
    
    const handleAddAiKey = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newAiKey.key.trim()) {
            const keyData: Omit<AiApiKey, 'id'> = {
                provider: newAiKey.provider,
                key: newAiKey.key,
                enabled: true,
            };

            if (newAiKey.provider === 'custom') {
                if (!newAiKey.name.trim()) {
                    alert("Please enter a name for the custom provider.");
                    return;
                }
                keyData.name = newAiKey.name.trim();
            }

            await supabaseService.addAiApiKey(keyData);
            setNewAiKey({ provider: 'gemini', key: '', name: '' });
            fetchData();
        }
    };

    const handleToggleAiKey = async (key: AiApiKey) => { await supabaseService.updateAiApiKey(key.id, { enabled: !key.enabled }); fetchData(); };
    const handleDeleteAiKey = async (id: string) => { if(window.confirm('Are you sure?')) { await supabaseService.deleteAiApiKey(id); fetchData(); } };
    const handleToggleIntegration = async (int: BackendIntegration) => { await supabaseService.updateBackendIntegration(int.id, { enabled: !int.enabled }); fetchData(); };
    const handleDeleteIntegration = async (id: string) => { if(window.confirm('Are you sure?')) { await supabaseService.deleteBackendIntegration(id); fetchData(); } };

    const handleNewIntegrationTypeChange = (type: BackendServiceType) => {
        setNewIntegrationType(type);
        setNewIntegrationData(getInitialFormData(type));
    };

    const handleIntegrationFormChange = (field: string, value: string) => {
        setNewIntegrationData((prev: any) => ({
            ...prev,
            credentials: {
                ...prev.credentials,
                [field]: value
            }
        }));
    };
    
    const handleAddIntegration = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newIntegrationData.purpose.trim()) {
            await supabaseService.addBackendIntegration(newIntegrationData);
            handleNewIntegrationTypeChange(newIntegrationType); // Reset form
            fetchData();
        }
    };

    const handleAddAdConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAdConfig.scriptOrCode.trim()) {
            alert('Ad Script or Code is required.');
            return;
        }
        if (newAdConfig.provider === 'custom' && !newAdConfig.name.trim()) {
            alert('Provider Name is required for custom providers.');
            return;
        }
        await supabaseService.addAdvertisementConfig({
            provider: newAdConfig.provider,
            name: newAdConfig.provider === 'custom' ? newAdConfig.name.trim() : undefined,
            scriptOrCode: newAdConfig.scriptOrCode.trim(),
            enabled: true,
        });
        setNewAdConfig({ provider: 'google', name: '', scriptOrCode: '' });
        fetchData();
    };
    
    const handleToggleAdConfig = async (config: AdvertisementConfig) => {
        await supabaseService.updateAdvertisementConfig(config.id, { enabled: !config.enabled });
        fetchData();
    };
    
    const handleDeleteAdConfig = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this ad configuration?')) {
            await supabaseService.deleteAdvertisementConfig(id);
            fetchData();
        }
    };
    
    const renderIntegrationFormFields = () => {
        const fields = Object.keys(newIntegrationData.credentials);
        return fields.map(field => (
            <div key={field}>
                <label className="block text-sm font-medium text-gray-700 capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
                <input
                    type="text"
                    value={newIntegrationData.credentials[field]}
                    onChange={e => handleIntegrationFormChange(field, e.target.value)}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm"
                    required
                />
            </div>
        ));
    };

    const renderIntegrationDetails = (integration: BackendIntegration) => (
        <div className="bg-gray-50 p-3 mt-2 rounded">
            <h5 className="font-semibold text-sm mb-2">Credentials</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-xs">
                {Object.entries(integration.credentials).map(([key, value]) => (
                    <div key={key}>
                        <p className="font-medium text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                        <p className="font-mono text-gray-800 break-all">{maskApiKey(value)}</p>
                    </div>
                ))}
            </div>
        </div>
    );
    
    const renderContent = () => {
        switch (activeTab) {
            case 'paymentRequests': return (
                <div className="bg-white p-4 rounded-lg border overflow-x-auto">
                    {paymentRequests.length > 0 ? (
                        <table className="min-w-full divide-y divide-gray-200">
                             <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Method</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Screenshot</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subscription Plan</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {paymentRequests.map(req => (
                                    <React.Fragment key={req.id}>
                                    <tr>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{req.userName}</div>
                                            <div className="text-sm text-gray-500">{req.userEmail}</div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm capitalize">{req.paymentMethod}</td>
                                        <td className="px-4 py-4">
                                            <a href={req.proofScreenshotUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center space-x-1">
                                                <span>View Proof</span>
                                                <ExternalLinkIcon className="w-4 h-4" />
                                            </a>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 capitalize">{req.plan.replace('-', ' ')}</div>
                                            <div className="text-sm text-gray-500">${req.amount}</div>
                                        </td>
                                         <td className="px-4 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                req.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                                req.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                            {req.status === 'pending' ? (
                                                <div className="flex items-center space-x-2">
                                                    <button onClick={() => handleStartVerification(req)} className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-md hover:bg-green-600">Approve</button>
                                                    <button onClick={() => handleRejectRequest(req)} className="px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded-md hover:bg-red-600">Reject</button>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-xs">Processed</span>
                                            )}
                                        </td>
                                    </tr>
                                    {verifyingRequest?.id === req.id && (
                                        <tr>
                                            <td colSpan={6} className="p-0">
                                                <div className="bg-green-50 p-4 border-2 border-green-200">
                                                    <h4 className="font-semibold text-green-800">Verify & Approve Request</h4>
                                                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                                                        <div className="space-y-2">
                                                            <div>
                                                                <label htmlFor="coins-to-award" className="block text-sm font-medium text-gray-700">Coins to Award</label>
                                                                <input
                                                                    id="coins-to-award"
                                                                    type="number"
                                                                    value={coinsToAward}
                                                                    onChange={(e) => setCoinsToAward(Number(e.target.value))}
                                                                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                                                                />
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <label htmlFor="activate-sub" className="text-sm font-medium text-gray-700">Set Subscription to Active:</label>
                                                                <input
                                                                    id="activate-sub"
                                                                    type="checkbox"
                                                                    className="toggle toggle-sm toggle-success"
                                                                    checked={setSubscriptionActive}
                                                                    onChange={(e) => setSetSubscriptionActive(e.target.checked)}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col md:flex-row md:items-end md:justify-end space-y-2 md:space-y-0 md:space-x-2">
                                                            <button onClick={() => setVerifyingRequest(null)} className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300">Cancel</button>
                                                            <button onClick={handleConfirmApproval} className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700">Confirm Approval</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    ) : <p>No payment requests found.</p>}
                </div>
            );
            case 'users': return <div className="bg-white p-4 rounded-lg border"><table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coins</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subscription</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead><tbody className="bg-white divide-y divide-gray-200">{users.map(u => (<tr key={u.id}><td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{u.name}</div><div className="text-sm text-gray-500">{u.email}</div></td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.coins}</td><td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.subscriptionStatus === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{u.subscriptionStatus}</span></td><td className="px-6 py-4 whitespace-nowrap text-sm font-medium"><button onClick={() => handleToggleSubscription(u)} className="text-indigo-600 hover:text-indigo-900">Toggle Status</button></td></tr>))}</tbody></table></div>;
            case 'coinRates': return <div className="bg-white p-6 rounded-lg border space-y-4"><h3 className="font-semibold text-lg">Edit Coin Prices (USD)</h3>{editingRates.filter(rate => rate.plan !== 'free').map(rate => (<div key={rate.plan} className="flex items-center space-x-4"><label className="w-40" htmlFor={`price-${rate.plan}`}>{rate.plan} ({rate.coins} coins):</label><span>$</span><input id={`price-${rate.plan}`} type="number" value={rate.price} onChange={(e) => handleRatesChange(rate.plan, e.target.value)} className="w-32 p-1 border border-gray-300 rounded-md"/></div>))}<button onClick={handleSaveRates} className="mt-4 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">Save Prices</button></div>;
            case 'paymentMethods': return <div className="bg-white p-6 rounded-lg border space-y-6"><h3 className="font-semibold text-lg">Manage Payment Methods</h3>{editingMethods.map((method) => (<div key={method.id} className="p-4 border rounded-md"><div className="flex items-center justify-between mb-2"><h4 className="font-medium capitalize">{method.name}</h4><div className="flex items-center"><span className="text-sm mr-2">{method.enabled ? 'Enabled' : 'Disabled'}</span><input type="checkbox" className="toggle toggle-success" checked={method.enabled} onChange={(e) => handleMethodsChange(method.id, 'enabled', e.target.checked)} /></div></div>{method.id === 'jazzcash' && (<div className="space-y-2"><div><label className="block text-sm font-medium text-gray-700">Account Number</label><input type="text" value={method.accountNumber || ''} onChange={e => handleMethodsChange(method.id, 'accountNumber', e.target.value)} className="w-full p-1 border border-gray-300 rounded-md"/></div><div><label className="block text-sm font-medium text-gray-700">QR Code Image</label><input type="file" accept="image/*" ref={qrCodeInputRef} onChange={handleQrCodeUpload} className="file-input file-input-bordered file-input-sm w-full max-w-xs" />{method.qrCodeUrl && <img src={method.qrCodeUrl} alt="QR Code Preview" className="mt-2 h-32 w-32 border"/>}</div></div>)}{['stripe', 'paypal', 'payoneer'].includes(method.id) && (<div><label className="block text-sm font-medium text-gray-700">Secret Key</label><input type="text" value={method.secretKey || ''} onChange={e => handleMethodsChange(method.id, 'secretKey', e.target.value)} className="w-full p-1 border border-gray-300 rounded-md"/></div>)}</div>))}<button onClick={handleSaveMethods} className="mt-4 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">Save Methods</button></div>;
            case 'learnings': return <div className="space-y-6"><form onSubmit={handleAddLearning} className="bg-white p-4 rounded-lg border"><h3 className="font-semibold mb-2">Add New Learning</h3><textarea value={newLearningContent} onChange={(e) => setNewLearningContent(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-sm" rows={3} placeholder="Enter a new design principle or feedback..."/><button type="submit" className="mt-2 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400" disabled={!newLearningContent.trim()}>Add Learning</button></form><ul className="space-y-3">{learnings.map(l => (<li key={l.id} className="bg-white p-3 rounded-lg border">{isEditingLearning?.id === l.id ? (<div><textarea value={editingContent} onChange={(e) => setEditingContent(e.target.value)} className="w-full p-2 border border-purple-400 rounded-lg text-sm" rows={4} /><div className="flex items-center space-x-2 mt-2"><button onClick={handleUpdateLearning} className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-md">Save</button><button onClick={() => setIsEditingLearning(null)} className="px-3 py-1 bg-gray-200 text-gray-800 text-xs font-semibold rounded-md">Cancel</button></div></div>) : (<div><p className="text-sm text-gray-700">{l.content}</p><div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100"><p className="text-xs text-gray-500">Created: {new Date(l.createdAt).toLocaleString()}</p><div className="flex items-center space-x-2"><button onClick={() => { setIsEditingLearning(l); setEditingContent(l.content); }} className="p-1 hover:bg-gray-100 rounded-full"><PencilIcon className="w-4 h-4 text-gray-600" /></button><button onClick={() => handleDeleteLearning(l.id)} className="p-1 hover:bg-gray-100 rounded-full"><XIcon className="w-4 h-4 text-red-500" /></button></div></div></div>)}</li>))}</ul></div>;
            case 'projects': return <div className="bg-white p-4 rounded-lg border">{projects.length > 0 ? <ul className="divide-y divide-gray-200">{projects.map(p => (<li key={p.id} className="py-3"><p className="font-semibold">{p.name}</p><p className="text-sm text-gray-600 truncate">{p.description || 'No description'}</p><p className="text-xs text-gray-400">Last Saved: {new Date(p.savedAt).toLocaleString()}</p></li>))}</ul> : <p>No projects found.</p>}</div>;
            case 'advertisement': return <div className="space-y-6">
                <form onSubmit={handleAddAdConfig} className="bg-white p-4 rounded-lg border">
                    <h3 className="font-semibold text-lg">Add New Ad Configuration</h3>
                    <div className="mt-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Ad Provider</label>
                            <select
                                value={newAdConfig.provider}
                                onChange={e => setNewAdConfig(p => ({ ...p, provider: e.target.value as AdProvider, name: '' }))}
                                className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                            >
                                <option value="google">Google Ads</option>
                                <option value="adsterra">Adsterra</option>
                                <option value="custom">Other</option>
                            </select>
                        </div>
                        {newAdConfig.provider === 'custom' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Provider Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g., PropellerAds"
                                    value={newAdConfig.name}
                                    onChange={e => setNewAdConfig(p => ({ ...p, name: e.target.value }))}
                                    className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                                    required
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Ad Script or Code</label>
                            <textarea
                                placeholder="Paste your ad code here (e.g., <script>... or ad unit ID)"
                                value={newAdConfig.scriptOrCode}
                                onChange={e => setNewAdConfig(p => ({ ...p, scriptOrCode: e.target.value }))}
                                className="mt-1 w-full p-2 border border-gray-300 rounded-md font-mono text-xs"
                                rows={5}
                                required
                            />
                        </div>
                    </div>
                    <button type="submit" className="mt-4 px-4 py-2 bg-blue-600 text-white font-medium text-sm rounded-md hover:bg-blue-700">Add Ad</button>
                </form>

                <div className="bg-white p-4 rounded-lg border">
                    <h3 className="font-semibold text-lg mb-4">Manage Advertisements</h3>
                    {advertisementConfigs.length > 0 ? (
                        <div className="space-y-3">
                            {advertisementConfigs.map(config => (
                                <div key={config.id} className="p-3 border rounded-md flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold capitalize">{config.provider === 'custom' ? config.name : config.provider}</p>
                                        <pre className="text-xs text-gray-500 bg-gray-50 p-2 rounded mt-1 font-mono w-full max-w-md truncate">{config.scriptOrCode}</pre>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm font-medium">{config.enabled ? 'Visible' : 'Hidden'}</span>
                                            <input type="checkbox" className="toggle toggle-sm toggle-success" checked={config.enabled} onChange={() => handleToggleAdConfig(config)} />
                                        </div>
                                        <button onClick={() => handleDeleteAdConfig(config.id)} className="p-1 hover:bg-gray-100 rounded-full">
                                            <XIcon className="w-4 h-4 text-red-500" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : <p>No advertisement configurations found.</p>}
                </div>
            </div>;
            case 'settings': return <div className="bg-white p-6 rounded-lg border"><h3 className="font-semibold text-lg">General Settings</h3><p className="mt-2 text-gray-600">This section is under development.</p></div>;
            case 'aiIntegration': return <div className="space-y-6">
                <form onSubmit={handleAddAiKey} className="bg-white p-4 rounded-lg border">
                    <h3 className="font-semibold">Add New AI API Key</h3>
                    <div className="mt-3 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Provider</label>
                            <select value={newAiKey.provider} onChange={e => setNewAiKey(p => ({ ...p, provider: e.target.value as AiApiKey['provider'], name: '' }))} className="mt-1 w-full p-2 border border-gray-300 rounded-md">
                                <option value="gemini">Gemini</option>
                                <option value="groq">Groq</option>
                                <option value="openai">OpenAI</option>
                                <option value="huggingface">Hugging Face</option>
                                <option value="emergent-llm">Emergent LLM</option>
                                <option value="custom">Custom</option>
                            </select>
                        </div>

                        {newAiKey.provider === 'custom' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Custom Provider Name</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g., Anthropic" 
                                    value={newAiKey.name} 
                                    onChange={e => setNewAiKey(p => ({ ...p, name: e.target.value }))} 
                                    className="mt-1 w-full p-2 border border-gray-300 rounded-md" 
                                    required 
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700">API Key</label>
                            <input 
                                type="text" 
                                placeholder="Enter API Key" 
                                value={newAiKey.key} 
                                onChange={e => setNewAiKey(p => ({ ...p, key: e.target.value }))} 
                                className="mt-1 w-full p-2 border border-gray-300 rounded-md" 
                                required 
                            />
                        </div>
                    </div>
                    <button type="submit" className="mt-4 px-4 py-2 bg-blue-600 text-white font-medium text-sm rounded-md hover:bg-blue-700">Add Key</button>
                    <p className="text-xs text-gray-500 mt-2">If an enabled Gemini key is present, it will be used instead of the environment variable. If all Gemini keys are removed or disabled, the application will automatically fall back to the `process.env.API_KEY`.</p>
                </form>

                <div className="bg-white p-4 rounded-lg border">
                    <h3 className="font-semibold mb-2">Manage API Keys</h3>
                    {aiApiKeys.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr>
                                        <th className="text-left text-sm font-medium text-gray-600 py-2">Provider</th>
                                        <th className="text-left text-sm font-medium text-gray-600 py-2">Key</th>
                                        <th className="text-left text-sm font-medium text-gray-600 py-2">Status</th>
                                        <th className="text-right text-sm font-medium text-gray-600 py-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {aiApiKeys.map(key => (
                                        <tr key={key.id} className="border-t">
                                            <td className="py-2 capitalize text-sm">{key.provider === 'custom' ? key.name : key.provider}</td>
                                            <td className="py-2 font-mono text-sm">{maskApiKey(key.key)}</td>
                                            <td><input type="checkbox" className="toggle toggle-sm toggle-success" checked={key.enabled} onChange={() => handleToggleAiKey(key)} /></td>
                                            <td className="text-right">
                                                <button onClick={() => handleDeleteAiKey(key.id)} className="p-1 hover:bg-gray-100 rounded-full"><XIcon className="w-4 h-4 text-red-500" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : <p>No AI API keys configured.</p>}
                </div>
            </div>;
            case 'backendIntegration': return <div className="space-y-6"><form onSubmit={handleAddIntegration} className="bg-white p-4 rounded-lg border space-y-4"><h3 className="font-semibold">Add New Backend Integration</h3><div><label className="block text-sm font-medium text-gray-700">Service Type</label><select value={newIntegrationType} onChange={e => handleNewIntegrationTypeChange(e.target.value as BackendServiceType)} className="mt-1 w-full p-2 border border-gray-300 rounded-md"><option value="supabase">Supabase</option><option value="firebase">Firebase</option><option value="mongodb">MongoDB</option><option value="cloudflare">Cloudflare</option><option value="google-drive-oauth">Google Drive (OAuth)</option><option value="google-drive-service">Google Drive (Service)</option><option value="google-sheets">Google Sheets</option></select></div><div><label className="block text-sm font-medium text-gray-700">Purpose / Name</label><input type="text" placeholder="e.g., Cloudflare Account 1" value={newIntegrationData.purpose} onChange={e => setNewIntegrationData({ ...newIntegrationData, purpose: e.target.value })} className="mt-1 w-full p-2 border border-gray-300 rounded-md" required /></div>{renderIntegrationFormFields()}<button type="submit" className="px-4 py-2 bg-blue-600 text-white font-medium text-sm rounded-md hover:bg-blue-700">Add Integration</button></form><div className="bg-white p-4 rounded-lg border"><h3 className="font-semibold mb-2">Manage Integrations</h3><div className="space-y-2">{backendIntegrations.length > 0 ? backendIntegrations.map(int => (<div key={int.id} className="border rounded-md p-3"><div className="flex items-center justify-between"><div className="flex-1 min-w-0"><p className="font-semibold truncate">{int.purpose}</p><p className="text-sm text-gray-500">{serviceTypeLabels[int.type]}</p></div><div className="flex items-center space-x-3 ml-4 flex-shrink-0"><input type="checkbox" className="toggle toggle-sm toggle-success" checked={int.enabled} onChange={() => handleToggleIntegration(int)} /><button onClick={() => handleDeleteIntegration(int.id)} className="p-1 hover:bg-gray-100 rounded-full"><XIcon className="w-4 h-4 text-red-500" /></button><button onClick={() => setExpandedIntegrationId(expandedIntegrationId === int.id ? null : int.id)} className="p-1 hover:bg-gray-100 rounded-full">{expandedIntegrationId === int.id ? <ChevronUpIcon className="w-5 h-5"/> : <ChevronDownIcon className="w-5 h-5"/>}</button></div></div>{expandedIntegrationId === int.id && renderIntegrationDetails(int)}</div>)) : <p>No backend integrations configured.</p>}</div></div></div>;
            default: return null;
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-100 flex">
            <aside className="w-64 bg-gray-800 text-white flex flex-col">
                <div className="p-4 border-b border-gray-700 flex items-center space-x-3"><div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-md flex items-center justify-center"><span className="font-bold text-xl">D</span></div><span className="text-lg font-semibold">Admin Panel</span></div>
                <nav className="flex-1 p-4 space-y-1">
                    <button onClick={() => setActiveTab('paymentRequests')} className={`w-full flex items-center space-x-3 p-2 rounded-md text-sm ${activeTab === 'paymentRequests' ? 'bg-gray-700' : 'hover:bg-gray-700/50'}`}><CoinsIcon className="w-5 h-5" /><span>Payment Requests</span></button>
                    <button onClick={() => setActiveTab('users')} className={`w-full flex items-center space-x-3 p-2 rounded-md text-sm ${activeTab === 'users' ? 'bg-gray-700' : 'hover:bg-gray-700/50'}`}><UserIconSolid className="w-5 h-5" /><span>Users</span></button>
                    <button onClick={() => setActiveTab('coinRates')} className={`w-full flex items-center space-x-3 p-2 rounded-md text-sm ${activeTab === 'coinRates' ? 'bg-gray-700' : 'hover:bg-gray-700/50'}`}><PencilIcon className="w-5 h-5" /><span>Coin Rates</span></button>
                    <button onClick={() => setActiveTab('paymentMethods')} className={`w-full flex items-center space-x-3 p-2 rounded-md text-sm ${activeTab === 'paymentMethods' ? 'bg-gray-700' : 'hover:bg-gray-700/50'}`}><FolderIcon className="w-5 h-5" /><span>Payment Methods</span></button>
                    <button onClick={() => setActiveTab('learnings')} className={`w-full flex items-center space-x-3 p-2 rounded-md text-sm ${activeTab === 'learnings' ? 'bg-gray-700' : 'hover:bg-gray-700/50'}`}><LightbulbIcon className="w-5 h-5" /><span>Knowledge Base</span></button>
                    <button onClick={() => setActiveTab('projects')} className={`w-full flex items-center space-x-3 p-2 rounded-md text-sm ${activeTab === 'projects' ? 'bg-gray-700' : 'hover:bg-gray-700/50'}`}><FolderIcon className="w-5 h-5" /><span>All Projects</span></button>
                    <div className="pt-2 mt-2 border-t border-gray-700"></div>
                    <button onClick={() => setActiveTab('advertisement')} className={`w-full flex items-center space-x-3 p-2 rounded-md text-sm ${activeTab === 'advertisement' ? 'bg-gray-700' : 'hover:bg-gray-700/50'}`}><MegaphoneIcon className="w-5 h-5" /><span>Advertisement</span></button>
                    <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center space-x-3 p-2 rounded-md text-sm ${activeTab === 'settings' ? 'bg-gray-700' : 'hover:bg-gray-700/50'}`}><CogIcon className="w-5 h-5" /><span>Settings</span></button>
                    <button onClick={() => setActiveTab('aiIntegration')} className={`w-full flex items-center space-x-3 p-2 rounded-md text-sm ${activeTab === 'aiIntegration' ? 'bg-gray-700' : 'hover:bg-gray-700/50'}`}><CpuChipIcon className="w-5 h-5" /><span>AI Integration</span></button>
                    <button onClick={() => setActiveTab('backendIntegration')} className={`w-full flex items-center space-x-3 p-2 rounded-md text-sm ${activeTab === 'backendIntegration' ? 'bg-gray-700' : 'hover:bg-gray-700/50'}`}><ServerStackIcon className="w-5 h-5" /><span>Backend Integration</span></button>
                </nav>
                <div className="p-4 border-t border-gray-700"><button onClick={onLogout} className="w-full flex items-center space-x-3 p-2 rounded-md text-sm hover:bg-gray-700/50"><LogoutIcon className="w-5 h-5" /><span>Logout</span></button></div>
            </aside>

            <main className="flex-1 p-8 overflow-y-auto"><h1 className="text-2xl font-bold text-gray-800 mb-6 capitalize">{activeTab.replace(/([A-Z])/g, ' $1')}</h1>{renderContent()}</main>
        </div>
    );
};