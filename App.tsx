import React, { useState } from 'react';
import { HomePage } from './components/HomePage';
import { WebsiteBuilder } from './components/WebsiteBuilder';

function App() {
  const [view, setView] = useState<'home' | 'builder'>('home');

  const navigateToBuilder = () => {
    setView('builder');
  };

  const navigateToHome = () => {
    setView('home');
  };

  if (view === 'home') {
    return <HomePage onNavigate={navigateToBuilder} />;
  }

  return <WebsiteBuilder onNavigateHome={navigateToHome} />;
}

export default App;