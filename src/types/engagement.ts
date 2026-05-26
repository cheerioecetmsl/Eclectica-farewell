export type ModuleType = 'poll' | 'game' | 'result';
export type ModuleStatus = 'draft' | 'active' | 'completed' | 'results';
export type GameType = 'guess-senior' | 'memory-match' | 'reaction-speed';
export type ResultFormat = 'chart' | 'list' | 'winner-card';

export interface EngagementModule {
  id: string;
  type: ModuleType;
  status: ModuleStatus;
  title: string;
  description?: string;
  targetAudience: string[]; // ['STUDENT', 'LEGEND', 'FACULTY']
  config: PollConfig | GameConfig | ResultConfig;
  createdAt: any;
  createdBy: string;
  publishedResultId?: string; // Links a 'result' module to its source 'poll' or 'game'
}

export interface PollConfig {
  question: string;
  options: (string | { text: string; imageUrl?: string })[];
  multipleChoice: boolean;
  votes?: Record<string, number>;
  voters?: string[];
}

export interface GameConfig {
  gameType: GameType;
  gameAssets?: string[];
  targetSenior?: {
    name: string;
    imageUrl: string;
  } | null;
  settings?: {
    timeLimit?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
  };
}

export interface ResultConfig {
  sourceModuleId: string;
  format: ResultFormat;
  data: any; // Final aggregated results or winner info
}

export interface EngagementResponse {
  id: string;
  moduleId: string;
  userId: string;
  userName: string;
  data: {
    selectedOption?: string; // Poll
    score?: number; // Game
    time?: number; // Reaction
    moves?: number; // Memory
  };
  timestamp: any;
}

export interface AnonymousMessage {
  id: string;
  text: string;
  isAnonymous: boolean;
  authorName: string;
  authorId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
}
