
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants';
import type { Candidate, VotePayload, Admin, ResultsStats, Voter } from '../types';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const loginAdmin = async (username: string, password: string): Promise<Pick<Admin, 'username'>> => {
    const { data, error } = await supabase
        .from('directors')
        .select('username')
        .eq('username', username)
        .eq('password', password)
        .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Invalid admin credentials');
    return { username: data.username };
};

export const startVotingProcess = async (regNumber: string, studentName: string): Promise<Voter> => {
    const upperRegNumber = regNumber.trim().toUpperCase();
    const trimmedStudentName = studentName.trim();

    // Step 1: Verify student details against the official registration list
    const { data: registration, error: regError } = await supabase
        .from('registrations')
        .select('student_name')
        .eq('registration_number', upperRegNumber)
        .single();
    
    // Improved error handling for better user feedback
    if (regError && regError.code !== 'PGRST116') { // PGRST116 means no rows found
        throw new Error('A database error occurred during verification.');
    }
    if (!registration) {
        throw new Error('Registration number not found. Please check the number and try again.');
    }
    if (registration.student_name.trim().toLowerCase() !== trimmedStudentName.toLowerCase()) {
        throw new Error('The student name does not match the provided registration number.');
    }

    // Step 2: Check if this registration number has already been used to vote
    const { data: existingVoter, error: voterError } = await supabase
        .from('voters')
        .select('*')
        .eq('registration_number', upperRegNumber)
        .maybeSingle();

    if (voterError) {
        throw new Error('A database error occurred while checking voter status.');
    }

    if (existingVoter && existingVoter.has_voted) {
        throw new Error('This student has already cast their vote.');
    }
    
    // If voter exists but hasn't voted, return them to resume the session
    if (existingVoter) {
        return existingVoter as Voter;
    }

    // Step 3: Create a new voter record if one doesn't exist
    const { data: newVoter, error: insertError } = await supabase
        .from('voters')
        .insert({
            username: upperRegNumber,
            password: '',
            full_name: registration.student_name,
            registration_number: upperRegNumber,
            has_voted: false,
        })
        .select()
        .single();
    
    if (insertError) {
        throw new Error('Failed to create a new voter session.');
    }
    if (!newVoter) {
        throw new Error('Could not initialize a voter session.');
    }

    return newVoter as Voter;
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
    const { error: voteError } = await supabase
        .from('physical_votes')
        .insert([{ 
            votes: votes,
            voter_reg_number: voterRegNumber,
            voteType: 'physical',
            adminOperator: adminOperator
        }]);

    if (voteError) throw new Error(`Failed to record vote: ${voteError.message}`);

    const { error: updateError } = await supabase
        .from('voters')
        .update({ has_voted: true })
        .eq('registration_number', voterRegNumber);

    if (updateError) {
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

// Fix: Add type guards to safely handle `record.votes` which might be `unknown`.
        allVotes.forEach(record => {
            const vote = record.votes;
            if (typeof vote === 'object' && vote !== null) {
                const candidate = (vote as VotePayload)[position];
                if (typeof candidate === 'string' && Object.prototype.hasOwnProperty.call(voteCounts, candidate)) {
                    voteCounts[candidate]++;
                }
            }
        });

        const totalPositionVotes = Object.values(voteCounts).reduce((sum, count) => sum + count, 0);

// Fix: Ensure `position` is treated as a string when used as an index.
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
