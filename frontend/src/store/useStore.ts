import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Submission, Guidance, PracticeProblem } from '../lib/api';

interface Settings {
  provider: 'gemini' | 'openai';
  apiKey: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string | Guidance;
  timestamp: number;
}

interface StoreState {
  submission: Submission | null;
  guidance: Guidance | null;
  practiceProblems: PracticeProblem[];
  isLoading: boolean;
  error: string | null;
  sessionId: string | null;
  settings: Settings;
  history: ChatMessage[];

  setSubmission: (submission: Submission | null) => void;
  setGuidance: (guidance: Guidance | null) => void;
  setPracticeProblems: (problems: PracticeProblem[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setSessionId: (sessionId: string | null) => void;
  setSettings: (settings: Partial<Settings>) => void;
  addMessage: (message: ChatMessage) => void;
  clearHistory: () => void;
  reset: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      submission: null,
      guidance: null,
      practiceProblems: [],
      isLoading: false,
      error: null,
      sessionId: null,
      settings: {
        provider: 'gemini',
        apiKey: '',
      },
      history: [],

      setSubmission: (submission) => set({ submission }),
      setGuidance: (guidance) => set({ guidance }),
      setPracticeProblems: (practiceProblems) => set({ practiceProblems }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setSessionId: (sessionId) => set({ sessionId }),
      setSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),
      addMessage: (message) => set((state) => ({ history: [...state.history, message] })),
      clearHistory: () => set({ history: [] }),
      reset: () => set((state) => ({
        submission: null,
        guidance: null,
        practiceProblems: [],
        error: null,
        isLoading: false,
        // Don't reset settings, sessionId, or history by default
      })),
    }),
    {
      name: 'homework-tools-storage',
      partialize: (state) => ({
        sessionId: state.sessionId,
        settings: state.settings,
        history: state.history
      }),
    }
  )
);
