import axios from 'axios';
import { LeaderboardEntry, Match, Problem, ProblemListItem, UserProfile } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  devLogin: async (username: string, email: string) => {
    const res = await api.post('/auth/dev-login', { username, email });
    return res.data;
  },
  googleLogin: async (credential: string) => {
    const res = await api.post('/auth/google', { credential });
    return res.data;
  },
  githubLogin: async (code: string) => {
    const res = await api.post('/auth/github', { code });
    return res.data;
  },
  getMe: async (): Promise<UserProfile> => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

export const problemsApi = {
  list: async (difficulty?: string) => {
    const res = await api.get<{ problems: ProblemListItem[]; total: number }>('/problems', {
      params: { difficulty },
    });
    return res.data;
  },
  get: async (id: string): Promise<Problem> => {
    const res = await api.get(`/problems/${id}`);
    return res.data;
  },
  getRandom: async (difficulty?: string): Promise<Problem> => {
    const res = await api.get('/problems/random', { params: { difficulty } });
    return res.data;
  },
};

export const matchesApi = {
  getHistory: async (page = 1, pageSize = 10) => {
    const res = await api.get<{ matches: Match[]; total: number }>('/matches/history', {
      params: { page, page_size: pageSize },
    });
    return res.data;
  },
  getDetail: async (id: string): Promise<Match> => {
    const res = await api.get(`/matches/${id}`);
    return res.data;
  },
  getAnalysis: async (id: string) => {
    const res = await api.get(`/matches/${id}/analysis`);
    return res.data;
  },
};

export const leaderboardApi = {
  get: async (page = 1, pageSize = 25) => {
    const res = await api.get<{ leaderboard: LeaderboardEntry[]; page: number }>('/leaderboard', {
      params: { page, page_size: pageSize },
    });
    return res.data;
  },
  getTop: async (limit = 10): Promise<LeaderboardEntry[]> => {
    const res = await api.get('/leaderboard/top', { params: { limit } });
    return res.data;
  },
};
