export interface User {
  id: string;
  username: string;
  email: string;
  elo_rating: number;
  wins: number;
  losses: number;
  draws: number;
  avatar_url?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface UserProfile extends User {
  total_matches: number;
  win_rate: number;
}

export interface Example {
  input: string;
  output: string;
  explanation?: string;
}

export interface TestCase {
  id: string;
  input: string;
  expected_output: string;
  is_sample: boolean;
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  constraints?: string;
  examples?: Example[];
  time_limit_seconds: number;
  memory_limit_mb: number;
  starter_code?: Record<string, string>;
  test_cases?: TestCase[];
}

export interface ProblemListItem {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  time_limit_seconds: number;
  memory_limit_mb: number;
  created_at: string;
}

export interface Match {
  id: string;
  player1_id: string;
  player2_id: string;
  problem_id?: string;
  winner_id?: string | null;
  status: 'waiting' | 'active' | 'completed' | 'cancelled';
  started_at?: string;
  ended_at?: string | null;
  duration_seconds?: number | null;
  created_at?: string;
  player1?: User;
  player2?: User;
  problem?: Problem;
}

export interface Submission {
  id: string;
  match_id: string;
  user_id: string;
  problem_id?: string;
  language: string;
  verdict: 'pending' | 'accepted' | 'wrong_answer' | 'time_limit' | 'runtime_error' | 'compilation_error';
  runtime_ms?: number;
  memory_kb?: number;
  tests_passed: number;
  total_tests: number;
  created_at?: string;
}

export interface CodeAnalysis {
  approach: string;
  time_complexity: string;
  space_complexity: string;
  code_quality: number;
  issues: string[];
}

export interface MatchAnalysis {
  player1_analysis: CodeAnalysis;
  player2_analysis: CodeAnalysis;
  optimal_solution: string;
  improvement_tips: string[];
}

export interface LeaderboardEntry {
  rank: number;
  user: User;
}
