import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants';
import type { Candidate, VotePayload, Admin, ResultsStats, Voter } from '../types';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const loginAdmin = async (username: string, password: string): Promise<Admin> => {
    const normalizedUsername = username.trim();

    const { data, error } = await supabase
        .from('directors')
        .select('*')
        .eq('username', normalizedUsername)
        .eq('password', password)
        .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Invalid admin credentials');
    return { username: data.username };
};

// --- FINAL UPDATED startVotingProcess FUNCTION (FIXED PASSWORD CONSTRAINT) ---
export const startVotingProcess = async (regNumber: string, program: string): Promise<void> => {
    // 1. Normalize the inputs for robust matching and data integrity
    const normalizedRegNumber = regNumber.trim().toUpperCase(); 
    const normalizedProgram = program.trim();

    // -------------------------------------------------------------------------
    // STEP 1: EXISTENCE CHECK (against the Master 'registrations' List)
    // -------------------------------------------------------------------------
    const { count, error: regError } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('registration_number', normalizedRegNumber);

    if (regError || count === 0) {
        const errorMessage = (regError && regError.message !== 'JSON object requested, multiple rows found') 
            ? `Database error during list check: ${regError.message}`
            : 'Verification failed: Registration number not found in the official student list.';
        throw new Error(errorMessage);
    }


    // -------------------------------------------------------------------------
    // STEP 2: VOTED STATUS CHECK (against the 'voters' tracking table)
    // -------------------------------------------------------------------------
    const { data: voterData, error: voterCheckError } = await supabase
        .from('voters')
        .select('has_voted')
        .eq('username', normalizedRegNumber)
        .single();
    
    if (voterData && voterData.has_voted) {
        throw new Error('This student has already cast their vote.');
    }

    // -------------------------------------------------------------------------
    // STEP 3: RECORD/UPDATE VOTER using UPSERT (FIXES THE INSERT/CONSTRAINT ERROR)
    // -------------------------------------------------------------------------
    
    // Data to be inserted or updated
    const voterRecord = {
        username: normalizedRegNumber, 
        program: normalizedProgram, 
        has_voted: false, 
        // 👈 THE FIX: Provide a non-null, placeholder password value as required by the table
        password: 'NO_PHYSICAL_LOGIN_REQUIRED', 
    };

    const { error: upsertError } = await supabase
        .from('voters')
        .upsert(voterRecord, { onConflict: 'username' });

    if (upsertError) {
        console.error("Voter upsert failed:", upsertError.message);
        throw new Error(`Failed to initialize voter tracking record. Details: ${upsertError.message}`); 
    }
    
    // Student is confirmed and ready to vote.
};
// --- END FINAL startVotingProcess FUNCTION ---

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
    const normalizedRegNumber = voterRegNumber.trim().toUpperCase();

    // 1. Record the vote in physical_votes table
    const { error: voteError } = await supabase
        .from('physical_votes')
        .insert([{ 
            votes: votes,
            voter_reg_number: normalizedRegNumber,
            voteType: 'physical',
            adminOperator: adminOperator.trim()
        }]);

    if (voteError) throw new Error(`Failed to record vote: ${voteError.message}`);

    // 2. Mark the voter as having voted
    const { error: updateError } = await supabase
        .from('voters')
        .update({ has_voted: true })
        .eq('username', normalizedRegNumber);

    if (updateError) {
        console.error(`CRITICAL: Vote for ${normalizedRegNumber} recorded, but failed to mark as voted.`);
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
