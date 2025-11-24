import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Submission {
  id: string;
  subject: string | null;
  topic: string | null;
  grade_level: number | null;
  difficulty: string | null;
  raw_text?: string;
  parsed_problems: Array<{
    text: string;
    order: number;
    type: string | null;
  }>;
  created_at: string;
}

export interface Guidance {
  micro_explanation: string;
  step_breakdown: Array<{
    order: number;
    text: string;
    hint: string | null;
  }>;
  error_warnings: string[];
  interactive_checks: Array<{
    text: string;
    expected_answer: string | null;
    explanation: string;
  }>;
  reveal_sequence: Array<{
    level: number;
    content: string;
    reveal_type: 'hint' | 'partial' | 'full';
  }>;
}

export interface PracticeProblem {
  id?: string;
  text: string;
  difficulty: string;
  variation_type: string;
  solution?: string;
}

// Submit a file upload
export async function submitUpload(file: File, sessionId?: string, text?: string): Promise<Submission> {
  const formData = new FormData();
  formData.append('file', file);
  if (sessionId) {
    formData.append('session_id', sessionId);
  }
  if (text) {
    formData.append('text', text);
  }

  const response = await api.post<Submission>('/submissions/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

// Submit typed text
export async function submitText(text: string, sessionId?: string): Promise<Submission> {
  const response = await api.post<Submission>('/submissions/text', {
    text,
    session_id: sessionId
  });

  return response.data;
}

// Get practice problems
export async function getPracticeProblems(
  submissionId: string,
  problemIndex: number = 0,
  count: number = 3
): Promise<{ submission_id: string; practice_problems: PracticeProblem[] }> {
  const response = await api.get(
    `/submissions/${submissionId}/practice`,
    { params: { problem_index: problemIndex, count } }
  );

  return response.data;
}

// Get guidance for a problem
export const getGuidance = async (
  submissionId: string,
  provider?: string,
  apiKey?: string
): Promise<Guidance> => {
  const headers: Record<string, string> = {};
  if (provider) headers['x-provider'] = provider;
  if (apiKey) headers['x-api-key'] = apiKey;

  const response = await api.get<Guidance>(`/submissions/${submissionId}/guidance`, {
    headers
  });
  return response.data;
};

// Get submission by ID
export async function getSubmission(submissionId: string): Promise<Submission> {
  const response = await api.get<Submission>(`/submissions/${submissionId}`);
  return response.data;
}

// Create a new session
export async function createSession(studentLevel?: number): Promise<{ id: string }> {
  const response = await api.post('/submissions/sessions', {
    student_level: studentLevel,
  });

  return response.data;
}

export default api;
