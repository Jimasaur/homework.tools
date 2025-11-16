import { useEffect } from 'react';
import { getGuidance } from '../lib/api';
import { useStore } from '../store/useStore';
import ReactMarkdown from 'react-markdown';

export function GuidanceDisplay() {
  const {
    submission,
    problemIndex,
    guidance,
    setGuidance,
    revealLevel,
    incrementRevealLevel,
    resetRevealLevel,
    setIsLoading,
    setError,
  } = useStore();

  useEffect(() => {
    if (!submission) return;

    const fetchGuidance = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getGuidance(submission.id, problemIndex);
        setGuidance(data);
        resetRevealLevel();
      } catch (error: any) {
        setError(error.response?.data?.detail || 'Failed to load guidance');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGuidance();
  }, [submission, problemIndex]);

  if (!submission || !guidance) return null;

  const currentProblem = submission.parsed_problems[problemIndex];
  const currentReveal = guidance.reveal_sequence.find(r => r.level === revealLevel);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Problem Display */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Problem</h2>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">
              {submission.subject || 'Unknown'}
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
              {submission.difficulty || 'N/A'}
            </span>
          </div>
        </div>
        <div className="text-lg text-gray-800 whitespace-pre-wrap">
          {currentProblem.text}
        </div>
      </div>

      {/* Micro Explanation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Understanding the Concept</h3>
        <p className="text-blue-800">{guidance.micro_explanation}</p>
      </div>

      {/* Step Breakdown */}
      {guidance.step_breakdown && guidance.step_breakdown.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Guided Steps</h3>
          <div className="space-y-4">
            {guidance.step_breakdown.map((step, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold">
                  {step.order}
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 mb-1">{step.text}</p>
                  {step.hint && (
                    <p className="text-sm text-gray-500 italic">Hint: {step.hint}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Warnings */}
      {guidance.error_warnings && guidance.error_warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-3">Common Mistakes to Avoid</h3>
          <ul className="space-y-2">
            {guidance.error_warnings.map((warning, idx) => (
              <li key={idx} className="flex gap-2 text-yellow-800">
                <span className="text-yellow-600">⚠</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Progressive Hint Reveal */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Need More Help?</h3>
          <span className="text-sm text-gray-500">
            Hint Level: {revealLevel}/4
          </span>
        </div>

        {revealLevel === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              Try working through the steps first. Click below when you need a hint.
            </p>
            <button
              onClick={incrementRevealLevel}
              className="bg-primary-600 text-white py-2 px-6 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Show First Hint
            </button>
          </div>
        )}

        {revealLevel > 0 && (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${
              currentReveal?.reveal_type === 'full'
                ? 'bg-red-50 border border-red-200'
                : currentReveal?.reveal_type === 'partial'
                ? 'bg-orange-50 border border-orange-200'
                : 'bg-green-50 border border-green-200'
            }`}>
              <div className="flex items-start gap-2">
                <span className="text-lg">
                  {currentReveal?.reveal_type === 'full' ? '📝' :
                   currentReveal?.reveal_type === 'partial' ? '💡' : '🤔'}
                </span>
                <div className="flex-1">
                  <p className={`font-medium mb-1 ${
                    currentReveal?.reveal_type === 'full' ? 'text-red-900' :
                    currentReveal?.reveal_type === 'partial' ? 'text-orange-900' :
                    'text-green-900'
                  }`}>
                    {currentReveal?.reveal_type === 'full' ? 'Full Solution' :
                     currentReveal?.reveal_type === 'partial' ? 'Partial Work' :
                     `Hint ${revealLevel}`}
                  </p>
                  <div className={`${
                    currentReveal?.reveal_type === 'full' ? 'text-red-800' :
                    currentReveal?.reveal_type === 'partial' ? 'text-orange-800' :
                    'text-green-800'
                  }`}>
                    <ReactMarkdown>
                      {currentReveal?.content || ''}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>

            {revealLevel < 4 && currentReveal?.reveal_type !== 'full' && (
              <button
                onClick={incrementRevealLevel}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Show Next Hint ({revealLevel}/4)
              </button>
            )}

            {currentReveal?.reveal_type === 'full' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-900 text-sm">
                  ⚠️ <strong>Academic Integrity:</strong> Use this solution to understand the process,
                  not to copy answers. Make sure you can explain each step!
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Interactive Checks */}
      {guidance.interactive_checks && guidance.interactive_checks.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Check Your Understanding</h3>
          <div className="space-y-4">
            {guidance.interactive_checks.map((check, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4">
                <p className="font-medium text-gray-800 mb-2">{check.text}</p>
                <input
                  type="text"
                  placeholder="Your answer..."
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <details className="mt-2">
                  <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                    Show explanation
                  </summary>
                  <p className="text-sm text-gray-700 mt-2">{check.explanation}</p>
                </details>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
