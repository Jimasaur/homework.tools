import { useStore } from './store/useStore';
import { ChatInterface } from './components/ChatInterface';
import { GuidanceDisplay } from './components/GuidanceDisplay';
import { PracticeProblems } from './components/PracticeProblems';

function App() {
  const { submission, isLoading, error, reset } = useStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex flex-col">
      {/* Error Display - Fixed at top */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-start gap-2">
            <span className="text-red-600 text-xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-red-800 text-sm">{error}</p>
            </div>
            <button
              onClick={() => useStore.getState().setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && !submission && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-2xl">🤔</div>
              </div>
            </div>
            <p className="text-gray-900 font-semibold text-lg">Analyzing your question...</p>
            <p className="text-gray-600 text-sm mt-1">This may take a few moments</p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {!submission ? (
        /* Chat Interface - Full Screen */
        <div className="flex-1 flex flex-col">
          {submission && (
            <div className="bg-white border-b border-gray-200 px-4 py-3">
              <div className="max-w-7xl mx-auto">
                <button
                  onClick={reset}
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  New Problem
                </button>
              </div>
            </div>
          )}
          <ChatInterface />
        </div>
      ) : (
        /* Results View */
        <div className="flex-1 overflow-auto">
          <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📚</span>
                <h1 className="text-lg font-bold text-gray-900">Homework.tools</h1>
              </div>
              <button
                onClick={reset}
                className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                New Problem
              </button>
            </div>
          </div>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="space-y-8">
              <GuidanceDisplay />
              <div className="border-t border-gray-200 pt-8">
                <PracticeProblems />
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="bg-white border-t border-gray-200 mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="text-center text-gray-600 text-sm">
                <p className="mb-1">
                  <strong>Remember:</strong> homework.tools helps you <em>learn</em>, not cheat.
                </p>
                <p className="text-gray-500 text-xs">
                  We guide you through problems step-by-step so you understand the concepts.
                </p>
              </div>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
}

export default App;
