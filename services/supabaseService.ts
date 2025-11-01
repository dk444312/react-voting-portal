import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants';
import type { Candidate, VotePayload, Admin, ResultsStats, Voter } from '../types';

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

// --- MODIFIED startVotingProcess FUNCTION (FIXED) ---
export const startVotingProcess = async (regNumber: string, program: string): Promise<void> => {
    
    // Step 1: Check if the registration number exists in the 'registrations' table (Verification of Identity)
    const { data: registrationData, error: registrationError } = await supabase
        .from('registrations')
        .select('registration_number')
        .eq('registration_number', regNumber) 
        .maybeSingle();

    if (registrationError) {
        throw new Error(`Database error during registration check: ${registrationError.message}`);
    }

    // Check 1: Existence check
    if (!registrationData) {
        throw new Error('Verification failed: Registration number not found in the official registrations list.');
    }

    // Step 2: Check if the registration number already exists in the 'voters' table (Check for already voted/processed)
    const { data: voterData, error: voterError } = await supabase
        .from('voters')
        .select('registration_number')
        .eq('registration_number', regNumber)
        .maybeSingle();

    if (voterError) {
        throw new Error(`Database error during voter check: ${voterError.message}`);
    }

    // Check 2: Already Voted Check
    if (voterData) {
        throw new Error('This student has already been processed or has cast their vote.');
    }

    // Step 3: Voter is valid and hasn't voted. ADD the voter to the 'voters' table.
    const { error: insertError } = await supabase
        .from('voters')
        .insert({ 
            registration_number: regNumber, 
            program: program, 
            has_voted: false,
            // FIX 1: Provide mandatory 'username'
            username: regNumber, 
            // FIX 2: Provide mandatory 'password' placeholder
            password: '' 
        }); 

    if (insertError) {
        console.error("Voter insert failed:", insertError.message);
        throw new Error(`Failed to initialize voting session for student.`);
    }
    
    // If we reach here, verification is successful.
};
// --- END MODIFIED startVotingProcess FUNCTION (FIXED) ---

// ---

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


// --- MODIFIED submitPhysicalVote FUNCTION ---
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

    // 2. Mark the voter as having voted in the 'voters' table
    const { error: updateError } = await supabase
        .from('voters')
        .update({ has_voted: true })
        .eq('registration_number', voterRegNumber);

    if (updateError) {
        // This is a critical issue, might need manual reconciliation
        console.error(`CRITICAL: Vote for ${voterRegNumber} recorded, but failed to mark as voted.`);
        throw new Error(`Failed to update voter status: ${updateError.message}`);
    }
};
// --- END MODIFIED submitPhysicalVote FUNCTION ---

// ---

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
