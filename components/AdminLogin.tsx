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
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            {/* Card Container */}
            <div className="bg-white shadow-2xl rounded-2xl p-10 max-w-md w-full mx-auto border border-gray-300">
                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Admin Login</h2>
                    <p className="text-gray-600">Election administrators only.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Username Input */}
                    <input
                        type="text"
                        id="admin-username"
                        placeholder="Admin Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={isLoading}
                        className={`
                            w-full px-5 py-4 
                            bg-white border border-gray-400 rounded-xl
                            text-gray-900 placeholder:text-gray-500
                            text-lg font-medium
                            focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-gray-700
                            transition-all duration-200
                            disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
                        `}
                    />

                    {/* Password Input */}
                    <input
                        type="password"
                        id="admin-password"
                        placeholder="Admin Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        className={`
                            w-full px-5 py-4 
                            bg-white border border-gray-400 rounded-xl
                            text-gray-900 placeholder:text-gray-500
                            text-lg font-medium
                            focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-gray-700
                            transition-all duration-200
                            disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
                        `}
                    />

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`
                            w-full py-4 
                            bg-gray-900 hover:bg-black 
                            text-white font-bold text-lg
                            rounded-xl shadow-lg
                            transition-all duration-200 ease-in-out
                            disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none disabled:cursor-not-allowed
                            flex items-center justify-center
                        `}
                    >
                        {isLoading ? (
                            <>
                                <svg
                                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                                Logging In...
                            </>
                        ) : (
                            'Login as Admin'
                        )}
                    </button>

                    {/* Error Message */}
                    {error && (
                        <p className="text-center text-red-600 font-medium text-base animate-pulse">
                            {error}
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
