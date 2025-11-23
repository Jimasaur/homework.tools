import { useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { submitUpload, submitText, getGuidance } from '../lib/api';
import { useStore } from '../store/useStore';
import { SettingsModal } from './SettingsModal';

const QUICK_CHIPS = [
  { icon: '➗', label: 'Help solve for X', prompt: 'Help me solve this equation for X: ' },
  { icon: '📖', label: 'Summarize text', prompt: 'Please summarize this text for me: ' },
  { icon: '🧠', label: 'Essay brainstorm', prompt: 'Help me brainstorm ideas for an essay about: ' },
  { icon: '🗣️', label: 'Explain like I\'m 10', prompt: 'Explain this concept like I am 10 years old: ' },
];

export function ChatInterface() {
  const [message, setMessage] = useState('');
  const [showParentContext, setShowParentContext] = useState<Record<string, boolean>>({}); // Track expanded state by message ID
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    submission,
    setSubmission,
    setIsLoading,
    isLoading,
    setError,
    sessionId,
    settings,
    history,
    addMessage,
    clearHistory,
    whiteboardEditor
  } = useStore();

  // Auto-focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Scroll to bottom on new history
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isLoading]);

  const handleCaptureWhiteboard = async () => {
    if (!whiteboardEditor) {
      setError("Whiteboard is not ready yet. Try opening the Whiteboard tab first.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const shapeIds = whiteboardEditor.getCurrentPageShapeIds();
      if (shapeIds.size === 0) {
        setError("Whiteboard is empty! Draw something first.");
        setIsLoading(false);
        return;
      }

      // Generate SVG from whiteboard using getSvgString
      const svgResult = await whiteboardEditor.getSvgString([...shapeIds], {
        scale: 1,
        background: true,
      });

      if (!svgResult?.svg) throw new Error("Could not generate snapshot");

      // Convert SVG string to PNG Blob
      const imageBlob = await new Promise<Blob | null>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error("Canvas context failed"));
            return;
          }
          // Fill white background (SVG might be transparent)
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(resolve, 'image/png');
        };
        img.onerror = () => reject(new Error("Failed to render SVG"));
        // Use base64 to avoid parsing issues
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgResult.svg)));
      });

      if (!imageBlob) throw new Error("Failed to create image blob");

      const file = new File([imageBlob], "whiteboard_snapshot.png", { type: "image/png" });

      // Optimistic user message
      const userMsgId = Date.now().toString();
      addMessage({
        id: userMsgId,
        role: 'user',
        content: `📸 Captured Whiteboard Snapshot`,
        timestamp: Date.now()
      });

      // Submit as upload
      const sub = await submitUpload(file, sessionId || undefined);
      setSubmission(sub);

      // Fetch guidance
      const guidanceData = await getGuidance(sub.id, settings.provider, settings.apiKey);

      addMessage({
        id: Date.now().toString(),
        role: 'assistant',
        content: guidanceData,
        timestamp: Date.now()
      });

    } catch (err: any) {
      console.error("Snapshot failed", err);
      setError("Failed to capture whiteboard. " + (err.message || ""));
    } finally {
      setIsLoading(false);
    }
  };

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    setIsLoading(true);
    setError(null);

    // Optimistic user message
    const userMsgId = Date.now().toString();
    addMessage({
      id: userMsgId,
      role: 'user',
      content: `Uploaded file: ${file.name}`,
      timestamp: Date.now()
    });

    try {
      const sub = await submitUpload(file, sessionId || undefined);
      setSubmission(sub);

      // Fetch guidance immediately
      const guidanceData = await getGuidance(sub.id, settings.provider, settings.apiKey);

      addMessage({
        id: Date.now().toString(),
        role: 'assistant',
        content: guidanceData,
        timestamp: Date.now()
      });

    } catch (error: any) {
      let errorMessage = 'Upload failed. Please try again.';
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        } else if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail.map((e: any) => e.msg).join(', ');
        } else {
          errorMessage = JSON.stringify(error.response.data.detail);
        }
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg'], 'application/pdf': ['.pdf'] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
    noClick: true,
  });

  const handleSubmit = async (e?: React.FormEvent, overrideText?: string) => {
    if (e) e.preventDefault();
    const textToSubmit = overrideText || message;
    if (!textToSubmit.trim()) return;

    setIsLoading(true);
    setError(null);
    setMessage('');

    // Optimistic user message
    addMessage({
      id: Date.now().toString(),
      role: 'user',
      content: textToSubmit,
      timestamp: Date.now()
    });

    try {
      const sub = await submitText(textToSubmit, sessionId || undefined);
      setSubmission(sub);

      // Fetch guidance immediately
      const guidanceData = await getGuidance(sub.id, settings.provider, settings.apiKey);

      addMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: guidanceData,
        timestamp: Date.now()
      });

    } catch (error: any) {
      let errorMessage = 'Failed to submit. Please try again.';
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        } else if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail.map((e: any) => e.msg).join(', ');
        } else {
          errorMessage = JSON.stringify(error.response.data.detail);
        }
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChipClick = (promptPrefix: string) => {
    setMessage(promptPrefix);
    inputRef.current?.focus();
  };

  const toggleParentContext = (msgId: string) => {
    setShowParentContext(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  return (
    <div {...getRootProps()} className="flex flex-col h-full bg-white relative overflow-hidden font-sans">
      <input {...getInputProps()} />

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white z-10">
        <div className="flex items-center gap-2">
          <div className="text-2xl text-blue-500">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 28C22.6274 28 28 22.6274 28 16C28 9.37258 22.6274 4 16 4C9.37258 4 4 9.37258 4 16C4 22.6274 9.37258 28 16 28Z" stroke="currentColor" strokeWidth="2" />
              <path d="M10 16H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M16 10V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span className="font-semibold text-gray-700 text-lg tracking-tight">homework.tools</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Settings"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-sm font-medium text-red-400 hover:text-red-600 transition-colors"
            >
              Clear Chat
            </button>
          )}
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8">
        {/* Welcome Message (only if history is empty) */}
        {history.length === 0 && (
          <div className="flex gap-4 max-w-3xl mx-auto mt-8 animate-fade-in">
            <div className="w-10 h-10 rounded-full bg-white border border-blue-100 flex items-center justify-center text-xl flex-shrink-0 shadow-sm text-blue-500">
              🤖
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none p-5 text-gray-800 shadow-sm">
              <p className="leading-relaxed">Hi! I'm your AI homework partner. I'm here to help you and your parent understand big concepts together. What are we working on right now? (Math, Science, History...)</p>
            </div>
          </div>
        )}

        {/* History Loop */}
        {history.map((msg) => (
          <div key={msg.id} className="animate-fade-in">
            {msg.role === 'user' ? (
              <div className="flex flex-col items-end max-w-3xl mx-auto">
                <div className="text-xs text-gray-400 mb-1 mr-2">You & Parent</div>
                <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-tr-none p-4 px-6 shadow-sm max-w-[85%]">
                  <p>{typeof msg.content === 'string' ? msg.content : 'Uploaded a file'}</p>
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-4">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-white border border-blue-100 flex items-center justify-center text-xl flex-shrink-0 shadow-sm text-blue-500">
                    🤖
                  </div>
                  <div className="flex-1 space-y-3">
                    {/* Student Response */}
                    <div className="bg-green-50 border border-green-100 rounded-2xl rounded-tl-none overflow-hidden shadow-sm">
                      <div className="bg-green-100/50 px-5 py-2 border-b border-green-100 flex items-center gap-2">
                        <span className="font-semibold text-green-800 text-sm">For the Student</span>
                        <span className="text-lg">🧑‍🎓</span>
                      </div>
                      <div className="p-5">
                        <p className="text-gray-800 leading-relaxed text-lg">
                          {typeof msg.content !== 'string' ? msg.content.micro_explanation : "I couldn't generate a response."}
                        </p>
                      </div>
                    </div>

                    {/* Parent Context (Expandable) */}
                    {typeof msg.content !== 'string' && (
                      <div className="bg-blue-50 border border-blue-100 rounded-xl overflow-hidden shadow-sm transition-all duration-300">
                        <button
                          onClick={() => toggleParentContext(msg.id)}
                          className="w-full flex items-center justify-between p-3 px-4 bg-blue-100/50 hover:bg-blue-100 transition-colors text-left"
                        >
                          <div className="flex items-center gap-2 text-blue-900 font-semibold text-sm">
                            <span>Parent Context & Teaching Tips</span> <span>ℹ️</span>
                          </div>
                          <span className={`transform transition-transform duration-200 text-blue-400 ${showParentContext[msg.id] ? 'rotate-180' : ''}`}>
                            ▼
                          </span>
                        </button>

                        {showParentContext[msg.id] && (
                          <div className="p-5 bg-white/50 text-gray-700 text-sm space-y-3 border-t border-blue-100">
                            {msg.content.error_warnings.map((warning, idx) => (
                              <div key={idx}>
                                <span className="font-semibold text-gray-900">Tip: </span>
                                {warning}
                              </div>
                            ))}
                            {!msg.content.error_warnings.length && <p>No specific parent tips for this one.</p>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Loading State */}
        {isLoading && (
          <div className="flex gap-4 max-w-3xl mx-auto animate-pulse">
            <div className="w-10 h-10 rounded-full bg-white border border-blue-100 flex items-center justify-center text-xl flex-shrink-0 shadow-sm">
              🤖
            </div>
            <div className="bg-gray-50 rounded-2xl rounded-tl-none p-4 text-gray-400 w-64 italic">
              Thinking...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 sm:p-6 bg-white">
        <div className="max-w-3xl mx-auto space-y-4">

          {/* Quick Chips (only if history is empty) */}
          {history.length === 0 && (
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start px-2">
              {QUICK_CHIPS.map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => handleChipClick(chip.prompt)}
                  className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-600 transition-all shadow-sm hover:shadow-md"
                >
                  <span>{chip.icon}</span>
                  <span className="font-medium">{chip.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div className={`relative shadow-sm rounded-2xl border-2 bg-white transition-all ${isLoading ? 'opacity-50 pointer-events-none' : ''} focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 border-gray-200`}>
            <textarea
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Type your next question or paste a problem here..."
              className="w-full p-4 pr-12 bg-transparent border-none focus:ring-0 resize-none text-lg placeholder-gray-400 rounded-2xl"
              rows={1}
              style={{ minHeight: '60px', maxHeight: '200px' }}
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              {/* Capture Whiteboard Button */}
              <button
                type="button"
                onClick={handleCaptureWhiteboard}
                className="p-2 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded-full transition-colors"
                title="Capture Whiteboard & Ask AI"
              >
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {/* File Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                title="Upload image or PDF"
              >
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onDrop([file]);
                }}
                className="hidden"
              />
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-400 font-medium">Powered by Google AI, OpenAI & Anthropic for diverse, safe support.</p>
          </div>
        </div>
      </div>

      {/* Drag Overlay */}
      {isDragActive && (
        <div className="absolute inset-0 bg-blue-500/10 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center">
            <div className="text-6xl mb-4">📤</div>
            <p className="text-xl font-bold text-gray-900">Drop your file here</p>
          </div>
        </div>
      )}
    </div>
  );
}
