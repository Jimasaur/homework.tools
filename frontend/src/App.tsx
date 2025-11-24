import { useState, useRef, useEffect } from 'react';
import { useStore } from './store/useStore';
import { ChatInterface } from './components/ChatInterface';
import { Whiteboard } from './components/Whiteboard';

function App() {
  const { error } = useStore();
  const [chatWidth, setChatWidth] = useState(450);
  const [isWhiteboardMinimized, setIsWhiteboardMinimized] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;
      setChatWidth(Math.max(300, Math.min(newWidth, window.innerWidth - 300)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div ref={containerRef} className="flex flex-col md:flex-row h-screen overflow-hidden bg-white relative">
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
      <div
        className="flex-shrink-0 flex flex-col border-r border-gray-200 h-1/2 md:h-full z-10 bg-white relative"
        style={{ width: isWhiteboardMinimized ? '100%' : `${chatWidth}px` }}
      >
        <ChatInterface />
      </div>

      {/* Resizable Divider */}
      {!isWhiteboardMinimized && (
        <div
          className="hidden md:block w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize transition-colors relative z-20"
          onMouseDown={() => setIsResizing(true)}
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
        </div>
      )}

      {/* Whiteboard Area */}
      {!isWhiteboardMinimized && (
        <div className="flex-1 h-1/2 md:h-full relative bg-gray-50">
          <Whiteboard />

          {/* Minimize Button */}
          <button
            onClick={() => setIsWhiteboardMinimized(true)}
            className="absolute top-4 right-4 z-30 p-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
            title="Minimize Whiteboard"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Expand Whiteboard Button (when minimized) */}
      {isWhiteboardMinimized && (
        <button
          onClick={() => setIsWhiteboardMinimized(false)}
          className="fixed bottom-4 right-4 z-30 px-4 py-2 bg-purple-600 text-white rounded-lg shadow-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          <span className="font-medium">Show Whiteboard</span>
        </button>
      )}
    </div>
  );
}

export default App;
