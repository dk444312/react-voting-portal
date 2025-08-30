
export type View = 'adminLogin' | 'voterRegistration' | 'votingBooth' | 'results';

export interface Admin {
    username: string;
}

export interface Voter {
    regNumber: string;
    program: string;
}

export interface Candidate {
    id: number;
    name: string;
    position: string;
    photo_url: string;
    created_at: string;
}

export interface VotePayload {
    [position: string]: string; // e.g., { "President": "John Doe" }
}

export interface VoteRecord {
    votes: VotePayload;
    voter_reg_number: string;
    adminOperator: string;
    voteType: 'physical' | 'online';
}

export interface ResultsStats {
    totalVoters: number;
    resultsByPosition: {
        [position: string]: {
            candidate: string;
            votes: number;
            percentage: string;
        }[];
    };
}
