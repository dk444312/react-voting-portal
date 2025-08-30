
import React, { useState } from 'react';
import type { View } from '../types';

interface NavbarProps {
    currentView: View;
    setView: (view: View) => void;
    logoutAdmin: () => void;
    toggleTheme: () => void;
}

const NavLink: React.FC<{
    icon: string;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
    <li>
        <a
            href="#"
            onClick={(e) => { e.preventDefault(); onClick(); }}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 text-white hover:bg-blue-500/50 ${isActive ? 'bg-blue-600/80 shadow-md' : 'bg-transparent'}`}
        >
            <i className={`fas ${icon} w-5 text-center`}></i>
            <span>{label}</span>
        </a>
    </li>
);

const Navbar: React.FC<NavbarProps> = ({ currentView, setView, logoutAdmin, toggleTheme }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleLinkClick = (view: View) => {
        setView(view);
        setIsOpen(false);
    };
    
    const handleLogoutClick = () => {
        logoutAdmin();
        setIsOpen(false);
    };

    const handleThemeClick = () => {
        toggleTheme();
        setIsOpen(false);
    }

    return (
        <header>
            <nav className="bg-gray-800/50 dark:bg-gray-900/70 backdrop-blur-md fixed top-0 left-0 right-0 z-50 shadow-lg">
                <div className="container mx-auto px-4 flex justify-between items-center h-16">
                    <div className="text-white font-bold text-xl">
                        Admin Panel
                    </div>

                    {/* Desktop Menu */}
                    <ul className="hidden md:flex items-center gap-2">
                        <NavLink icon="fa-user-check" label="Registration" isActive={currentView === 'voterRegistration'} onClick={() => handleLinkClick('voterRegistration')} />
                        <NavLink icon="fa-vote-yea" label="Voting Booth" isActive={currentView === 'votingBooth'} onClick={() => handleLinkClick('votingBooth')} />
                        <NavLink icon="fa-chart-bar" label="Live Results" isActive={currentView === 'results'} onClick={() => handleLinkClick('results')} />
                        <NavLink icon="fa-sign-out-alt" label="Logout" isActive={false} onClick={handleLogoutClick} />
                        <li>
                            <button onClick={handleThemeClick} className="flex items-center justify-center w-10 h-10 rounded-full text-white hover:bg-blue-500/50 transition-colors">
                                <i className="fas fa-moon"></i>
                            </button>
                        </li>
                    </ul>

                    {/* Mobile Menu Button */}
                    <button className="md:hidden text-white text-2xl" onClick={() => setIsOpen(!isOpen)}>
                        <i className="fas fa-bars"></i>
                    </button>
                </div>
            </nav>

            {/* Mobile Menu */}
            <div className={`fixed top-0 left-0 h-full w-full bg-gray-900/90 backdrop-blur-sm z-40 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-y-0' : '-translate-y-full'} md:hidden`}>
                <ul className="flex flex-col items-center justify-center h-full gap-6 text-xl">
                    <NavLink icon="fa-user-check" label="Registration" isActive={currentView === 'voterRegistration'} onClick={() => handleLinkClick('voterRegistration')} />
                    <NavLink icon="fa-vote-yea" label="Voting Booth" isActive={currentView === 'votingBooth'} onClick={() => handleLinkClick('votingBooth')} />
                    <NavLink icon="fa-chart-bar" label="Live Results" isActive={currentView === 'results'} onClick={() => handleLinkClick('results')} />
                    <NavLink icon="fa-sign-out-alt" label="Logout" isActive={false} onClick={handleLogoutClick} />
                    <NavLink icon="fa-moon" label="Theme" isActive={false} onClick={handleThemeClick} />
                </ul>
            </div>
        </header>
    );
};

export default Navbar;
