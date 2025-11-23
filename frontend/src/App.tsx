import { useState } from 'react';
import { useStore } from './store/useStore';
import { ChatInterface } from './components/ChatInterface';
import { Whiteboard } from './components/Whiteboard';

function App() {
  const { error } = useStore();
  const [activeTab, setActiveTab] = useState<'chat' | 'whiteboard'>('chat');

  return (
    <div className="min-h-screen bg-white flex flex-col h-screen overflow-hidden">
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

      {/* Navigation Tabs - Floating or Fixed Header */}
      <div className="bg-white border-b border-gray-200 px-4 flex justify-center z-20">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('chat')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'chat'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            💬 Chat
          </button>
          <button
            onClick={() => setActiveTab('whiteboard')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'whiteboard'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            🎨 Whiteboard
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative">
        {/* Chat Interface */}
        <div className={`absolute inset-0 ${activeTab === 'chat' ? 'z-10' : 'z-0 invisible'}`}>
          <ChatInterface />
        </div>

        {/* Whiteboard - Kept mounted to preserve state and editor instance */}
        <div className={`absolute inset-0 ${activeTab === 'whiteboard' ? 'z-10' : 'z-0 invisible'}`}>
          <Whiteboard />
        </div>
      </div>
    </div>
  );
}

export default App;
