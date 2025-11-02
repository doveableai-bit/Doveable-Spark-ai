import React from 'react';
import { Header } from './Header';
import { ArrowUpIcon, ShopIcon, CameraIcon } from './icons/Icons';
import { AdDisplay } from './AdDisplay';

const ProjectCard: React.FC<{
    bgColor: string;
    icon: React.ReactNode;
    title: string;
    author: string;
    authorInitial: string;
    authorAvatarColor: string;
}> = ({ bgColor, icon, title, author, authorInitial, authorAvatarColor }) => (
    <div className="flex-shrink-0 w-full sm:w-72">
        <div className={`relative aspect-[4/3] rounded-lg ${bgColor} flex items-center justify-center`}>
            {icon}
        </div>
        <div className="mt-3 flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full ${authorAvatarColor} flex items-center justify-center text-white font-medium`}>
                {authorInitial}
            </div>
            <div>
                <p className="font-semibold text-dark">{title}</p>
                <p className="text-sm text-gray-500">by {author}</p>
            </div>
        </div>
    </div>
);


export const HomePage: React.FC<{ onNavigate: () => void; onNavigateAdmin: () => void; }> = ({ onNavigate, onNavigateAdmin }) => {
    return (
        <div className="bg-white min-h-screen font-sans text-gray-800 flex flex-col">
            <Header onGetStartedClick={onNavigate} />

            <main className="flex-grow pt-24 pb-16">
                <section className="text-center px-4 pt-10">
                    <div className="inline-block bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-600 mb-4">
                        Introducing Doveable x Shopify
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold text-dark tracking-tight">
                        Build something
                        <br />
                        <span className="bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text text-transparent">
                            Doveable
                        </span>
                    </h1>
                    <p className="mt-6 text-lg text-gray-500 max-w-2xl mx-auto">
                        Create apps and websites by chatting with AI
                    </p>

                    <div className="mt-8 max-w-xl mx-auto">
                        <div className="relative" onClick={onNavigate} style={{ cursor: 'pointer' }}>
                            <input
                                type="text"
                                placeholder="Ask Doveable to create a landing page for my..."
                                className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-brand-purple focus:outline-none pointer-events-none"
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-dark text-white rounded-md flex items-center justify-center">
                                <ArrowUpIcon className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                </section>

                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                   <AdDisplay placement="Top Banner" />
                </div>

                <section className="mt-12">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-dark">From the Community</h2>
                            <a href="#" className="text-sm font-medium text-purple-600 hover:underline">
                                View all →
                            </a>
                        </div>

                        <div className="border-b border-gray-200 mb-6">
                            <nav className="-mb-px flex space-x-8">
                                <button className="py-2 text-sm font-semibold text-dark border-b-2 border-dark">
                                    Featured
                                </button>
                                <button className="py-2 text-sm font-semibold text-gray-500 hover:text-dark">
                                    Discover
                                </button>
                            </nav>
                        </div>

                        <div className="flex space-x-6 overflow-x-auto pb-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
                           <ProjectCard 
                                bgColor="bg-green-300"
                                icon={<ShopIcon className="w-12 h-12 text-white/70" />}
                                title="GreenLeaf Planters"
                                author="Anna Wong"
                                authorInitial="A"
                                authorAvatarColor="bg-pink-400"
                           />
                           <ProjectCard 
                                bgColor="bg-gray-800"
                                icon={<CameraIcon className="w-12 h-12 text-white/70" />}
                                title="Lens & Light"
                                author="Mark Chen"
                                authorInitial="M"
                                authorAvatarColor="bg-blue-400"
                           />
                        </div>
                    </div>
                </section>

                 <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                   <AdDisplay placement="Bottom Banner" />
                </div>
            </main>
            <footer className="bg-gray-50 border-t border-gray-200">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-sm text-gray-500">
                    <p>&copy; {new Date().getFullYear()} Doveable AI. All rights reserved. 
                        <a href="#" onClick={(e) => { e.preventDefault(); onNavigateAdmin(); }} className="ml-4 hover:underline">Admin Login</a>
                    </p>
                </div>
            </footer>
        </div>
    );
};