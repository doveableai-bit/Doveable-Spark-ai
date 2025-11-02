import React, { useState } from 'react';
import { HomePage } from './components/HomePage';
import { WebsiteBuilder } from './components/WebsiteBuilder';
import { AdminLoginPage } from './components/AdminLoginPage';
import { AdminPanel } from './components/AdminPanel';
import { SubscriptionPage } from './components/SubscriptionPage';

function App() {
  const [view, setView] = useState<'home' | 'builder' | 'adminLogin' | 'adminPanel' | 'subscriptions'>('home');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  const navigateToBuilder = () => setView('builder');
  const navigateToHome = () => setView('home');
  const navigateToAdminLogin = () => setView('adminLogin');
  const navigateToSubscriptions = () => setView('subscriptions');
  
  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    setView('adminPanel');
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setView('adminLogin');
  };

  if (view === 'adminLogin') {
    return <AdminLoginPage onLoginSuccess={handleAdminLoginSuccess} onNavigateHome={navigateToHome} />;
  }

  if (view === 'adminPanel' && isAdminAuthenticated) {
    return <AdminPanel onLogout={handleAdminLogout} />;
  }

  if (view === 'home') {
    return <HomePage onNavigate={navigateToBuilder} onNavigateAdmin={navigateToAdminLogin} />;
  }

  if (view === 'subscriptions') {
    return <SubscriptionPage onNavigateToBuilder={navigateToBuilder} />;
  }

  return <WebsiteBuilder onNavigateHome={navigateToHome} onNavigateToSubscriptions={navigateToSubscriptions} />;
}

export default App;
