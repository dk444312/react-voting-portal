
import React, { useState } from 'react';
import type { Voter } from '../types';
import { startVotingProcess } from '../services/supabaseService';

interface VoterRegistrationProps {
    onStartVoting: (voter: Voter) => void;
}

const VoterRegistration: React.FC<VoterRegistrationProps> = ({ onStartVoting }) => {
    const [regNumber, setRegNumber] = useState('');
    const [program, setProgram] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!regNumber || !program) {
            setError('Please provide both registration number and program.');
            return;
        }
        setIsLoading(true);
        try {
            await startVotingProcess(regNumber, program);
            onStartVoting({ regNumber, program });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleReset = () => {
        setRegNumber('');
        setProgram('');
        setError('');
    };

    return (
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 max-w-lg mx-auto animate-fade-in">
            <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-2">Student Voter Registration</h2>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-6">Enter student details to begin the voting process.</p>
            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <input
                        type="text"
                        placeholder="Student Registration Number"
                        value={regNumber}
                        onChange={(e) => setRegNumber(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        disabled={isLoading}
                    />
                    <input
                        type="text"
                        placeholder="Program of Study (e.g., Computer Science)"
                        value={program}
                        onChange={(e) => setProgram(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        disabled={isLoading}
                    />
                </div>
                <div className="mt-6 space-y-3">
                    <button
                        type="submit"
                        className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold rounded-lg shadow-lg transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Verifying...' : 'Start Voting Process'}
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
                {error && <p className="text-red-500 dark:text-red-400 text-center mt-4">{error}</p>}
            </form>
        </div>
    );
};

export default VoterRegistration;
