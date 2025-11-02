
import React, { useState, useEffect, useCallback } from 'react';
import type { View, Voter, Admin } from './types';
import Navbar from './components/Navbar';
import AdminLogin from './components/AdminLogin';
import VoterRegistration from './components/VoterRegistration';
import VotingBooth from './components/VotingBooth';
import Results from './components/Results';

const App: React.FC = () => {
    const [theme, setTheme] = useState<'light' | 'dark'>(localStorage.getItem('votingPortal_theme') as 'light' | 'dark' || 'light');
    const [view, setView] = useState<View>('adminLogin');
    const [admin, setAdmin] = useState<Admin | null>(null);
    const [voter, setVoter] = useState<Voter | null>(null);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove(theme === 'light' ? 'dark' : 'light');
        root.classList.add(theme);
        localStorage.setItem('votingPortal_theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    const handleLoginSuccess = useCallback((loggedInAdmin: Admin) => {
        setAdmin(loggedInAdmin);
        setView('voterRegistration');
    }, []);

    const handleLogout = () => {
        setAdmin(null);
        setVoter(null);
        setView('adminLogin');
    };
    
    const handleStartVoting = (voterInfo: Voter) => {
        setVoter(voterInfo);
        setView('votingBooth');
    };

    const handleCancelVoting = () => {
        setVoter(null);
        setView('voterRegistration');
    };
    
    const handleVoteSubmitted = () => {
        setVoter(null);
        setView('voterRegistration');
    };

    const renderView = () => {
        switch (view) {
            case 'adminLogin':
                return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
            case 'voterRegistration':
                return <VoterRegistration onStartVoting={handleStartVoting} />;
            case 'votingBooth':
                if (voter && admin) {
                    return <VotingBooth voter={voter} admin={admin} onCancelVoting={handleCancelVoting} onVoteSubmitted={handleVoteSubmitted} />;
                }
                // Fallback if voter/admin somehow becomes null
                setView('voterRegistration');
                return null;
            case 'results':
                return <Results />;
            default:
                return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
        }
    };

    return (
        <div className="font-poppins bg-black min-h-screen text-gray-800 dark:text-gray-200 transition-colors duration-300">
            {admin && (
                <Navbar
                    currentView={view}
                    setView={setView}
                    logoutAdmin={handleLogout}
                    toggleTheme={toggleTheme}
                />
            )}
            <main className={`container mx-auto px-4 ${admin ? 'pt-24 pb-8' : 'pt-8'}`}>
                <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-8 drop-shadow-lg">
                    Voting Portal
                </h1>
                {renderView()}
            </main>
        </div>
    );
};

export default App;
