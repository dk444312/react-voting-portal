
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants';
import type { Candidate, VotePayload, Admin, ResultsStats } from '../types';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const loginAdmin = async (username: string, password: string): Promise<Admin> => {
    const { data, error } = await supabase
        .from('directors')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Invalid admin credentials');
    return { username: data.username };
};

export const startVotingProcess = async (regNumber: string, program: string): Promise<void> => {
    // Check if voter has already voted
    const { data: existingVoter, error: checkError } = await supabase
        .from('voters')
        .select('has_voted')
        .eq('username', regNumber)
        .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116: no rows found
        throw new Error(checkError.message);
    }

    if (existingVoter?.has_voted) {
        throw new Error('This student has already cast their vote.');
    }

    // Upsert voter to ensure they exist in the database
    const { error: upsertError } = await supabase
        .from('voters')
        .upsert({ username: regNumber, password: 'N/A', has_voted: false }, { onConflict: 'username' });

    if (upsertError) throw new Error(upsertError.message);
};

export const fetchCandidates = async (): Promise<Candidate[]> => {
    const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('position', { ascending: true })
        .order('name', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
};

export const fetchDeadline = async (): Promise<string | null> => {
    const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'voting_deadline')
        .single();
    
    if (error || !data) return null;
    return data.value;
};

export const getLiveVoteCount = async (): Promise<number> => {
    const { count, error } = await supabase
        .from('physical_votes')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error("Error fetching vote count:", error);
        return 0;
    }
    return count || 0;
};


export const submitPhysicalVote = async (votes: VotePayload, voterRegNumber: string, adminOperator: string) => {
    // 1. Record the vote in physical_votes table
    const { error: voteError } = await supabase
        .from('physical_votes')
        .insert([{ 
            votes: votes,
            voter_reg_number: voterRegNumber,
            voteType: 'physical',
            adminOperator: adminOperator
        }]);

    if (voteError) throw new Error(`Failed to record vote: ${voteError.message}`);

    // 2. Mark the voter as having voted
    const { error: updateError } = await supabase
        .from('voters')
        .update({ has_voted: true })
        .eq('username', voterRegNumber);

    if (updateError) {
        // This is a critical issue, might need manual reconciliation
        console.error(`CRITICAL: Vote for ${voterRegNumber} recorded, but failed to mark as voted.`);
        throw new Error(`Failed to update voter status: ${updateError.message}`);
    }
};

export const fetchResults = async (): Promise<ResultsStats> => {
    const { data: candidates, error: candidatesError } = await supabase.from('candidates').select('name, position');
    if (candidatesError) throw new Error(candidatesError.message);

    const { data: physicalVotes, error: physicalError } = await supabase.from('physical_votes').select('votes');
    if (physicalError) throw new Error(physicalError.message);

    const { data: onlineVotes, error: onlineError } = await supabase.from('votes').select('votes');
    if (onlineError) throw new Error(onlineError.message);
    
    const allVotes = [...(physicalVotes || []), ...(onlineVotes || [])];

    const resultsByPosition: ResultsStats['resultsByPosition'] = {};

    const positions = [...new Set(candidates.map(c => c.position))];
    
    positions.forEach(position => {
        const voteCounts: {[candidate: string]: number} = {};
        
        candidates.filter(c => c.position === position).forEach(c => {
            voteCounts[c.name] = 0;
        });

        allVotes.forEach(record => {
            const vote = record.votes as VotePayload;
            if (vote && vote[position] && voteCounts.hasOwnProperty(vote[position])) {
                voteCounts[vote[position]]++;
            }
        });

        const totalPositionVotes = Object.values(voteCounts).reduce((sum, count) => sum + count, 0);

        resultsByPosition[position] = Object.entries(voteCounts)
            .map(([candidate, votes]) => ({
                candidate,
                votes,
                percentage: totalPositionVotes > 0 ? ((votes / totalPositionVotes) * 100).toFixed(1) : '0.0'
            }))
            .sort((a, b) => b.votes - a.votes);
    });

    return {
        totalVoters: allVotes.length,
        resultsByPosition
    };
};
