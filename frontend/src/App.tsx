import { useStore } from './store/useStore';
import { ChatInterface } from './components/ChatInterface';
import { Whiteboard } from './components/Whiteboard';

function App() {
  const { error } = useStore();

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-white relative">
      {/* Error Display - Floating Toast */}
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[60] animate-fade-in-down w-[90%] max-w-2xl">
          <div className="bg-red-50 border border-red-200 rounded-xl shadow-lg px-4 py-3 flex items-start gap-3">
            <span className="text-red-600 text-xl">⚠️</span>
            <div className="flex-1">
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-red-800 text-sm">{error}</p>
            </div>
            <button
              onClick={() => useStore.getState().setError(null)}
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Chat Sidebar */}
      <div className="w-full md:w-[450px] lg:w-[500px] flex-shrink-0 flex flex-col border-r border-gray-200 h-1/2 md:h-full z-10 bg-white">
        <ChatInterface />
      </div>

      {/* Whiteboard Area */}
      <div className="flex-1 h-1/2 md:h-full relative bg-gray-50">
        <Whiteboard />
      </div>
    </div>
  );
}

export default App;
