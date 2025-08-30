
import React, { useState } from 'react';
import type { Admin } from '../types';
import { loginAdmin } from '../services/supabaseService';

interface AdminLoginProps {
    onLoginSuccess: (admin: Admin) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!username || !password) {
            setError('Please enter both username and password.');
            return;
        }
        setIsLoading(true);
        try {
            const admin = await loginAdmin(username, password);
            onLoginSuccess(admin);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm shadow-2xl rounded-2xl p-8 max-w-md mx-auto animate-fade-in">
            <h2 className="text-3xl font-bold text-center text-white mb-2">Admin Login</h2>
            <p className="text-center text-gray-300 mb-6">Election administrators only.</p>
            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <input
                        type="text"
                        id="admin-username"
                        placeholder="Admin Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-200/80 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        disabled={isLoading}
                    />
                    <input
                        type="password"
                        id="admin-password"
                        placeholder="Admin Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-200/80 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        disabled={isLoading}
                    />
                </div>
                <button
                    type="submit"
                    className="w-full mt-6 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={isLoading}
                >
                    {isLoading ? 'Logging In...' : 'Login as Admin'}
                </button>
                {error && <p className="text-red-400 text-center mt-4">{error}</p>}
            </form>
        </div>
    );
};

export default AdminLogin;
