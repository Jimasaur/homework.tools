import { create } from 'zustand';
import type { Submission, Guidance, PracticeProblem } from '../lib/api';

interface AppState {
  // Current submission
  submission: Submission | null;
  setSubmission: (submission: Submission | null) => void;

  // Current problem index
  problemIndex: number;
  setProblemIndex: (index: number) => void;

  // Guidance data
  guidance: Guidance | null;
  setGuidance: (guidance: Guidance | null) => void;

  // Practice problems
  practiceProblems: PracticeProblem[];
  setPracticeProblems: (problems: PracticeProblem[]) => void;

  // Hint reveal level (1-4)
  revealLevel: number;
  incrementRevealLevel: () => void;
  resetRevealLevel: () => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Error handling
  error: string | null;
  setError: (error: string | null) => void;

  // Session ID
  sessionId: string | null;
  setSessionId: (id: string | null) => void;

  // Reset everything
  reset: () => void;
}

export const useStore = create<AppState>((set) => ({
  submission: null,
  setSubmission: (submission) => set({ submission }),

  problemIndex: 0,
  setProblemIndex: (index) => set({ problemIndex: index }),

  guidance: null,
  setGuidance: (guidance) => set({ guidance }),

  practiceProblems: [],
  setPracticeProblems: (problems) => set({ practiceProblems: problems }),

  revealLevel: 0,
  incrementRevealLevel: () => set((state) => ({ revealLevel: Math.min(state.revealLevel + 1, 4) })),
  resetRevealLevel: () => set({ revealLevel: 0 }),

  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  error: null,
  setError: (error) => set({ error }),

  sessionId: null,
  setSessionId: (id) => set({ sessionId: id }),

  reset: () => set({
    submission: null,
    problemIndex: 0,
    guidance: null,
    practiceProblems: [],
    revealLevel: 0,
    isLoading: false,
    error: null,
  }),
}));
