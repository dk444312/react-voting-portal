
import React, { useState, useEffect } from 'react';
import { fetchResults } from '../services/supabaseService';
import type { ResultsStats } from '../types';

const LoadingSkeleton: React.FC = () => (
    <div className="space-y-8">
        {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
                <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                    <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-5/6"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-4/6"></div>
                </div>
            </div>
        ))}
    </div>
);

const Results: React.FC = () => {
    const [stats, setStats] = useState<ResultsStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadStats = async () => {
            try {
                setLoading(true);
                setError('');
                const fetchedStats = await fetchResults();
                setStats(fetchedStats);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load results.');
            } finally {
                setLoading(false);
            }
        };

        loadStats();
        const interval = setInterval(loadStats, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6 md:p-8 max-w-4xl mx-auto animate-fade-in">
            <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-2">Voting Statistics</h2>
            <p className="text-center text-lg text-gray-500 dark:text-gray-400 mb-6">
                Total Votes Cast: <span className="font-bold text-blue-600 dark:text-blue-400">{loading ? '...' : stats?.totalVoters ?? 0}</span>
            </p>

            {loading && !stats && <LoadingSkeleton />}
            {error && <p className="text-red-500 text-center">{error}</p>}
            
            {stats && (
                <div className="space-y-8">
                    {Object.entries(stats.resultsByPosition).map(([position, results]) => (
                        <div key={position}>
                            <h3 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200 border-b-2 border-gray-200 dark:border-gray-600 pb-2">{position}</h3>
                            <div className="space-y-4">
                                {results.map(({ candidate, votes, percentage }, index) => (
                                    <div key={candidate}>
                                        <div className="flex justify-between items-center mb-1 font-semibold">
                                            <span className="text-gray-800 dark:text-gray-100">{index + 1}. {candidate}</span>
                                            <span className="text-gray-600 dark:text-gray-300">{votes} votes ({percentage}%)</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                                            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-4 rounded-full" style={{ width: `${percentage}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                                {results.length === 0 && <p className="text-gray-500">No votes yet for this position.</p>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Results;
