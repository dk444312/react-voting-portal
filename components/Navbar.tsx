import React, { useState } from 'react';
import type { View } from '../types';

interface NavbarProps {
    currentView: View;
    setView: (view: View) => void;
    logoutAdmin: () => void;
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
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors duration-200 text-black hover:bg-gray-100 ${isActive ? 'bg-gray-200 font-semibold' : 'bg-transparent'}`}
        >
            <i className={`fas ${icon} w-5 text-center`}></i>
            <span>{label}</span>
        </a>
    </li>
);

const Navbar: React.FC<NavbarProps> = ({ currentView, setView, logoutAdmin }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleLinkClick = (view: View) => {
        setView(view);
        setIsOpen(false);
    };
    
    const handleLogoutClick = () => {
        logoutAdmin();
        setIsOpen(false);
    };

    return (
        <header>
            <nav className="bg-white fixed top-0 left-0 right-0 z-50 shadow-md border-b border-gray-200">
                <div className="container mx-auto px-4 flex justify-between items-center h-16">
                    <div className="text-black font-bold text-xl">
                        Admin Panel
                    </div>

                    {/* Desktop Menu */}
                    <ul className="hidden md:flex items-center gap-2">
                        <NavLink icon="fa-user-check" label="Registration" isActive={currentView === 'voterRegistration'} onClick={() => handleLinkClick('voterRegistration')} />
                        <NavLink icon="fa-vote-yea" label="Voting Booth" isActive={currentView === 'votingBooth'} onClick={() => handleLinkClick('votingBooth')} />
                        <NavLink icon="fa-sign-out-alt" label="Logout" isActive={false} onClick={handleLogoutClick} />
                    </ul>

                    {/* Mobile Menu Button */}
                    <button className="md:hidden text-black text-2xl" onClick={() => setIsOpen(!isOpen)}>
                        <i className="fas fa-bars"></i>
                    </button>
                </div>
            </nav>

            {/* Mobile Menu */}
            <div className={`fixed top-0 left-0 h-full w-full bg-white z-40 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-y-0' : '-translate-y-full'} md:hidden`}>
                <ul className="flex flex-col items-center justify-center h-full gap-6 text-xl">
                    <NavLink icon="fa-user-check" label="Registration" isActive={currentView === 'voterRegistration'} onClick={() => handleLinkClick('voterRegistration')} />
                    <NavLink icon="fa-vote-yea" label="Voting Booth" isActive={currentView === 'votingBooth'} onClick={() => handleLinkClick('votingBooth')} />
                    
                    <NavLink icon="fa-sign-out-alt" label="Logout" isActive={false} onClick={handleLogoutClick} />
                </ul>
            </div>
        </header>
    );
};

export default Navbar;
