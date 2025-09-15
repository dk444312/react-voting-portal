import React, { useState } from 'react';
import { startVotingProcess } from '../services/supabaseService';
import type { Voter } from '../types';

interface VoterRegistrationProps {
    onStartVoting: (voter: Voter) => void;
}

const VoterRegistration: React.FC<VoterRegistrationProps> = ({ onStartVoting }) => {
    const [regNumber, setRegNumber] = useState('');
    const [studentName, setStudentName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!regNumber || !studentName) {
            setError('Please provide both registration number and student name.');
            return;
        }
        setIsLoading(true);
        try {
            const voterForSession = await startVotingProcess(regNumber, studentName);
            onStartVoting(voterForSession);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleReset = () => {
        setRegNumber('');
        setStudentName('');
        setError('');
    };

    return (
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 max-w-lg mx-auto animate-fade-in">
            <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-2">Assisted Voter Verification</h2>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-6">Enter student details to begin the voting process.</p>
            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <input
                        type="text"
                        placeholder="Student Registration Number"
                        value={regNumber}
                        onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        disabled={isLoading}
                        aria-label="Student Registration Number"
                    />
                    <input
                        type="text"
                        placeholder="Student's Full Name"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        disabled={isLoading}
                        aria-label="Student's Full Name"
                    />
                </div>
                <div className="mt-6 space-y-3">
                    <button
                        type="submit"
                        className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold rounded-lg shadow-lg transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
                        disabled={isLoading}
                    >
                        {isLoading ? <><i className="fas fa-spinner fa-spin mr-2"></i>Verifying...</> : 'Start Voting Process'}
                    </button>
                    <button
                        type="button"
                        onClick={handleReset}
                        className="w-full py-3 px-4 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg shadow-lg transition-transform transform hover:scale-105"
                        disabled={isLoading}
                    >
                        Reset Form
                    </button>
                </div>
                {error && <div role="alert" className="text-red-500 dark:text-red-400 text-center mt-4 bg-red-50 dark:bg-red-900/50 p-3 rounded-lg text-sm">{error}</div>}
            </form>
        </div>
    );
};

export default VoterRegistration;

