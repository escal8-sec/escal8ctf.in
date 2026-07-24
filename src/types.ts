export type Category = 
  | 'crypto' 
  | 'rev' 
  | 'forensics' 
  | 'stego' 
  | 'osint' 
  | 'misc' 
  | 'web' 
  | 'pwn' 
  | 'blockchain';

export interface Challenge {
  id: string;
  title: string;
  category: Category;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  points: number;
  description: string;
  flag: string; // Hidden on client, kept on server
  hints: string[];
  solvedCount: number;
  author: string;
  isDown?: boolean; // If true, challenge status is DOWN (Paused/Offline)
  files?: { name: string; content?: string; url?: string; imageUrl?: string; size?: string }[];
  hintCost?: number;
  isLiveInstance?: boolean;
  instanceConfig?: {
    status?: 'stopped' | 'running';
    connectionUrl?: string;
    port?: number;
    contractAddress?: string;
    timeoutMinutes?: number;
    startedAt?: string;
  };
}

export interface Submission {
  id: string;
  username: string;
  teamName?: string;
  challengeId: string;
  challengeTitle: string;
  points: number;
  timestamp: string; // ISO String
  success: boolean;
  flagSubmitted: string;
  isFirstBlood?: boolean;
  bonusPoints?: number;
}

export interface User {
  username: string;
  passwordHash: string; // stored securely or plaintext in this sandbox env
  isAdmin: boolean;
  teamName?: string;
  status?: 'active' | 'banned';
}


export interface UserScore {
  username: string;
  teamName?: string;
  score: number;
  solvedChallenges: string[]; // Challenge IDs
  lastSolvedTime: string; // ISO String
}

export interface TeamScore {
  teamName: string;
  score: number;
  solvedChallenges: string[]; // Challenge IDs (unique across team)
  members: string[]; // Usernames of members
  lastSolvedTime: string;
  status?: 'active' | 'banned' | 'disqualified';
}

export interface EventConfig {
  status: 'active' | 'paused' | 'ended';
  statusMessage?: string;
  announcement?: string;
  startTime?: string;
  endTime?: string;
}

export interface TeamRecord {
  teamName: string;
  members: string[];
  score: number;
  solvedChallenges: string[];
  status: 'active' | 'banned' | 'disqualified';
  lastSolvedTime: string;
  bonusPoints?: number;
}

export interface AdminStats {
  totalUsers: number;
  totalSolves: number;
  totalChallenges: number;
  totalPoints: number;
}

export interface SupportMessage {
  id: string;
  sender: string;
  teamName: string;
  message: string;
  timestamp: string;
  isAdminReply?: boolean;
}

export interface SupportTicket {
  teamName: string;
  messages: SupportMessage[];
  status: 'open' | 'resolved';
  lastUpdated: string;
}

export interface PublicChatMessage {
  id: string;
  sender: string;
  teamName: string;
  message: string;
  timestamp: string;
  isAdmin?: boolean;
  isPinned?: boolean;
}

export interface UnlockedHint {
  challengeId: string;
  hintIndex: number;
  cost: number;
}

