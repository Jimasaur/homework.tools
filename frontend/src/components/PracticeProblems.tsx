import { useEffect, useState } from 'react';
import { getPracticeProblems } from '../lib/api';
import { useStore } from '../store/useStore';

export function PracticeProblems() {
  const {
    submission,
    problemIndex,
    practiceProblems,
    setPracticeProblems,
    setIsLoading,
    setError,
  } = useStore();

  const [showPractice, setShowPractice] = useState(false);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [showSolutions, setShowSolutions] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    if (!submission || !showPractice) return;

    const fetchPractice = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getPracticeProblems(submission.id, problemIndex, 5);
        setPracticeProblems(data.practice_problems);
      } catch (error: any) {
        setError(error.response?.data?.detail || 'Failed to load practice problems');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPractice();
  }, [submission, problemIndex, showPractice]);

  if (!submission) return null;

  const toggleSolution = (index: number) => {
    setShowSolutions(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      {!showPractice ? (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Ready to Practice?</h3>
          <p className="text-gray-700 mb-6">
            Test your understanding with similar problems. The best way to learn is by doing!
          </p>
          <button
            onClick={() => setShowPractice(true)}
            className="bg-green-600 text-white py-3 px-8 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Generate Practice Problems
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-900">Practice Problems</h3>
            <button
              onClick={() => setShowPractice(false)}
              className="text-gray-600 hover:text-gray-800"
            >
              Hide Practice
            </button>
          </div>

          {practiceProblems.length === 0 ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Generating practice problems...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {practiceProblems.map((problem, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Practice Problem {idx + 1}</h4>
                        <span className="text-sm text-gray-500">{problem.variation_type}</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      problem.difficulty === 'basic'
                        ? 'bg-green-100 text-green-800'
                        : problem.difficulty === 'intermediate'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {problem.difficulty}
                    </span>
                  </div>

                  <p className="text-lg text-gray-800 mb-4 whitespace-pre-wrap">
                    {problem.text}
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your answer:
                      </label>
                      <input
                        type="text"
                        value={answers[idx] || ''}
                        onChange={(e) => setAnswers({ ...answers, [idx]: e.target.value })}
                        placeholder="Type your answer here..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    {problem.solution && (
                      <div>
                        <button
                          onClick={() => toggleSolution(idx)}
                          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                          {showSolutions[idx] ? '▼ Hide Solution' : '▶ Show Solution'}
                        </button>

                        {showSolutions[idx] && (
                          <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                            <p className="text-sm font-semibold text-gray-900 mb-2">Solution:</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {problem.solution}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-900 text-sm">
                  💡 <strong>Tip:</strong> Try solving these on your own before checking the solutions.
                  If you get stuck, review the guided steps above!
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
