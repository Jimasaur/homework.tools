import { useStore } from './store/useStore';
import { ChatInterface } from './components/ChatInterface';

function App() {
  const { error } = useStore();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Error Display - Fixed at top */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3 z-50">
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

      {/* Main Content - Zero Friction Chat */}
      <div className="flex-1 flex flex-col h-screen">
        <ChatInterface />
      </div>
    </div>
  );
}

export default App;
