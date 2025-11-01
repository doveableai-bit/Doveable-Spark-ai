import React, { useState } from 'react';
import { MenuIcon, XIcon } from './icons/Icons';

const Logo = () => (
    <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-xl">D</span>
        </div>
        <span className="text-xl font-semibold text-dark">Doveable AI</span>
    </div>
);

const NavLinks: React.FC<{ className?: string, onGetStartedClick?: () => void }> = ({ className = '', onGetStartedClick }) => (
    <nav className={`items-center ${className}`}>
        <a href="#" className="block md:inline-block text-sm font-medium text-gray-600 hover:text-dark mb-4 md:mb-0 md:mr-4">
            Log in
        </a>
        <a href="#" onClick={(e) => { e.preventDefault(); onGetStartedClick?.(); }} className="block md:inline-block px-4 py-2 text-sm font-medium text-white bg-dark rounded-md hover:bg-gray-800 text-center">
            Get started
        </a>
    </nav>
);

export const Header: React.FC<{ onGetStartedClick?: () => void }> = ({ onGetStartedClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="absolute top-0 left-0 right-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
                <Logo />
                <div className="hidden md:block">
                    <NavLinks onGetStartedClick={onGetStartedClick} className="flex space-x-4" />
                </div>
                <div className="md:hidden">
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
                        {isMenuOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
                    </button>
                </div>
            </div>
            {isMenuOpen && (
                <div className="md:hidden mt-4 bg-white p-4 rounded-lg shadow-lg">
                    <NavLinks onGetStartedClick={onGetStartedClick} className="flex flex-col space-y-4" />
                </div>
            )}
        </div>
    </header>
  );
};
