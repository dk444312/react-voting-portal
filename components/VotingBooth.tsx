
import React, { useState, useEffect, useMemo } from 'react';
import { fetchCandidates, fetchDeadline, getLiveVoteCount, submitPhysicalVote } from '../services/supabaseService';
import type { Admin, Voter, Candidate, VotePayload } from '../types';
import Modal from './Modal';

interface VotingBoothProps {
    voter: Voter;
    admin: Admin;
    onCancelVoting: () => void;
    onVoteSubmitted: () => void;
}

const LoadingSpinner: React.FC = () => (
    <div className="text-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading Candidates...</p>
    </div>
);

const CandidateCard: React.FC<{
    candidate: Candidate;
    position: string;
    isSelected: boolean;
    onSelect: (candidateName: string) => void;
}> = ({ candidate, position, isSelected, onSelect }) => (
    <div className={`p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-lg' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-400 hover:shadow-md'}`}
         onClick={() => onSelect(candidate.name)}>
        <div className="flex items-center gap-4">
            <img src={candidate.photo_url || 'https://picsum.photos/100'} alt={candidate.name} className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700" />
            <div className="flex-grow">
                <p className="font-bold text-lg text-gray-800 dark:text-white">{candidate.name}</p>
                <label className="flex items-center gap-2 mt-2 text-gray-600 dark:text-gray-300">
                    <input
                        type="radio"
                        name={position}
                        value={candidate.name}
                        checked={isSelected}
                        onChange={() => onSelect(candidate.name)}
                        className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    Vote for this candidate
                </label>
            </div>
        </div>
    </div>
);

const VotingBooth: React.FC<VotingBoothProps> = ({ voter, admin, onCancelVoting, onVoteSubmitted }) => {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deadline, setDeadline] = useState<string | null>(null);
    const [liveVoteCount, setLiveVoteCount] = useState(0);
    const [selectedVotes, setSelectedVotes] = useState<VotePayload>({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    
    const positions = useMemo(() => {
        return [...new Set(candidates.map(c => c.position))];
    }, [candidates]);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError('');
                const [fetchedCandidates, fetchedDeadline, fetchedCount] = await Promise.all([
                    fetchCandidates(),
                    fetchDeadline(),
                    getLiveVoteCount()
                ]);
                setCandidates(fetchedCandidates);
                setDeadline(fetchedDeadline);
                setLiveVoteCount(fetchedCount);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load voting data.');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const progress = useMemo(() => {
        if (positions.length === 0) return 0;
        return (Object.keys(selectedVotes).length / positions.length) * 100;
    }, [selectedVotes, positions]);

    const handleSelectVote = (position: string, candidateName: string) => {
        setSelectedVotes(prev => ({ ...prev, [position]: candidateName }));
    };
    
    const handleConfirmVote = () => {
        setSubmitStatus(null);
        if (Object.keys(selectedVotes).length !== positions.length) {
            setSubmitStatus({type: 'error', message: 'Please select a candidate for every position.'});
            return;
        }
        setIsModalOpen(true);
    };

    const handleSubmitVote = async () => {
        setIsSubmitting(true);
        setSubmitStatus(null);
        try {
            await submitPhysicalVote(selectedVotes, voter.regNumber, admin.username);
            setSubmitStatus({type: 'success', message: 'Vote submitted successfully! Redirecting...'});
            setTimeout(() => {
                onVoteSubmitted();
            }, 2000);
        } catch (err) {
            setSubmitStatus({ type: 'error', message: err instanceof Error ? err.message : 'An unknown error occurred during submission.' });
        } finally {
            setIsSubmitting(false);
            setIsModalOpen(false);
        }
    };
    
    const isVotingEnded = deadline ? new Date() > new Date(deadline) : false;

    return (
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6 md:p-8 max-w-4xl mx-auto animate-fade-in">
            <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-6">Voting Booth</h2>

            <div className="bg-green-100 dark:bg-green-900/50 border-l-4 border-green-500 text-green-800 dark:text-green-200 p-4 rounded-md mb-4">
                <p><i className="fas fa-user mr-2"></i>Current Voter: <span className="font-semibold">{voter.regNumber} ({voter.program})</span></p>
            </div>
            {deadline && (
                <div className={`p-3 rounded-md text-center mb-4 ${isVotingEnded ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                    <i className={`fas ${isVotingEnded ? 'fa-exclamation-triangle' : 'fa-clock'} mr-2`}></i>
                    {isVotingEnded ? 'Voting has ended!' : `Voting ends: ${new Date(deadline).toLocaleString()}`}
                </div>
            )}
            <p className="text-center text-gray-600 dark:text-gray-400 mb-4">Total votes cast today: <span className="font-bold">{liveVoteCount}</span></p>

            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-6">
                <div className="bg-blue-600 h-4 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
            </div>

            {loading && <LoadingSpinner />}
            {error && <p className="text-red-500 text-center">{error}</p>}
            
            {!loading && !error && (
                <div className="space-y-8">
                    {positions.map(position => (
                        <div key={position}>
                            <h3 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">{position}</h3>
                            <div className="space-y-4">
                                {candidates.filter(c => c.position === position).map(candidate => (
                                    <CandidateCard
                                        key={candidate.id}
                                        candidate={candidate}
                                        position={position}
                                        isSelected={selectedVotes[position] === candidate.name}
                                        onSelect={(name) => handleSelectVote(position, name)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {submitStatus && (
                <p className={`text-center mt-4 ${submitStatus.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>{submitStatus.message}</p>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <button
                    onClick={handleConfirmVote}
                    disabled={isVotingEnded || loading || isSubmitting}
                    className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    <i className="fas fa-check"></i>
                    Submit Vote
                </button>
                <button
                    onClick={onCancelVoting}
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg shadow-md hover:bg-red-700 transition flex items-center justify-center gap-2">
                    <i className="fas fa-times"></i>
                    Cancel
                </button>
            </div>
            
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleSubmitVote}
                title="Confirm Your Vote"
                confirmText="Confirm"
                isConfirming={isSubmitting}
            >
                <p className="text-gray-600 dark:text-gray-300">Are you sure you want to submit this vote? This action cannot be undone.</p>
            </Modal>
        </div>
    );
};

export default VotingBooth;
