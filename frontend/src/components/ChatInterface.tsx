import { useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { submitUpload, submitText } from '../lib/api';
import { useStore } from '../store/useStore';

const PERSONAS = [
  {
    id: 'eli5',
    name: 'ELI5',
    description: 'Explain like I\'m 5',
    detail: 'Simple terms for kindergarten',
    icon: '🧒',
    color: 'from-pink-500 to-rose-500',
    gradeLevel: 1,
  },
  {
    id: 'elementary',
    name: 'Elementary',
    description: 'Common Language',
    detail: '5th grade reading level, layman\'s terms',
    icon: '📚',
    color: 'from-blue-500 to-cyan-500',
    gradeLevel: 5,
  },
  {
    id: 'highschool',
    name: 'High School',
    description: 'Smarty Pants',
    detail: 'Standard academic terminology',
    icon: '🎓',
    color: 'from-purple-500 to-indigo-500',
    gradeLevel: 10,
  },
  {
    id: 'college',
    name: 'College',
    description: 'Undergrad Level',
    detail: 'Advanced concepts and theory',
    icon: '🏛️',
    color: 'from-orange-500 to-amber-500',
    gradeLevel: 13,
  },
  {
    id: 'masters',
    name: 'Masters',
    description: 'Graduate Level',
    detail: 'Research and specialized knowledge',
    icon: '🔬',
    color: 'from-green-500 to-emerald-500',
    gradeLevel: 16,
  },
  {
    id: 'phd',
    name: 'PhD',
    description: 'Expert Level',
    detail: 'Cutting-edge research terminology',
    icon: '🧠',
    color: 'from-red-500 to-pink-600',
    gradeLevel: 20,
  },
];

export function ChatInterface() {
  const [message, setMessage] = useState('');
  const [selectedPersona, setSelectedPersona] = useState(PERSONAS[1]); // Default to Elementary
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { setSubmission, setIsLoading, setError, sessionId } = useStore();

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setIsLoading(true);
    setError(null);

    try {
      const submission = await submitUpload(file, sessionId || undefined);
      setSubmission(submission);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Upload failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
    noClick: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const submission = await submitText(message, sessionId || undefined);
      setSubmission(submission);
      setMessage('');
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to submit. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div {...getRootProps()} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <input {...getInputProps()} />

      {/* Drag overlay */}
      {isDragActive && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          backdropFilter: 'blur(4px)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: '48px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📤</div>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>Drop your file here</p>
            <p style={{ color: '#6B7280' }}>Upload images or PDFs</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ textAlign: 'center', padding: '48px 16px 24px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '32px' }}>📚</span>
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
            Homework.tools
          </h1>
        </div>
        <p style={{ color: '#6B7280', fontSize: '18px', margin: 0 }}>
          AI tutor that adapts to your learning level
        </p>
      </div>

      {/* Main content - centered */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 16px 48px',
        overflow: 'auto'
      }}>
        <div style={{ width: '100%', maxWidth: '768px' }}>
          {/* Persona Selector */}
          <div style={{ position: 'relative', marginBottom: '24px' }}>
            <button
              type="button"
              onClick={() => setShowPersonaMenu(!showPersonaMenu)}
              className={`bg-gradient-to-r ${selectedPersona.color}`}
              style={{
                width: '100%',
                color: 'white',
                borderRadius: '12px',
                padding: '12px 20px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>{selectedPersona.icon}</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{selectedPersona.name}</div>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>{selectedPersona.description}</div>
                </div>
              </div>
              <span style={{ fontSize: '16px' }}>{showPersonaMenu ? '▲' : '▼'}</span>
            </button>

            {/* Dropdown */}
            {showPersonaMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '8px',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                border: '1px solid #E5E7EB',
                overflow: 'hidden',
                zIndex: 20
              }}>
                <div style={{ padding: '8px', maxHeight: '320px', overflowY: 'auto' }}>
                  {PERSONAS.map((persona) => (
                    <button
                      key={persona.id}
                      type="button"
                      onClick={() => {
                        setSelectedPersona(persona);
                        setShowPersonaMenu(false);
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        background: selectedPersona.id === persona.id ? '#F3F4F6' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedPersona.id !== persona.id) {
                          e.currentTarget.style.background = '#F9FAFB';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedPersona.id !== persona.id) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <span style={{ fontSize: '20px' }}>{persona.icon}</span>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={{ fontWeight: 600, color: '#111827', fontSize: '14px' }}>{persona.name}</div>
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>{persona.detail}</div>
                      </div>
                      {selectedPersona.id === persona.id && (
                        <span style={{ color: '#3B82F6', fontSize: '16px' }}>✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit}>
            <div style={{
              background: 'white',
              borderRadius: '16px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #E5E7EB',
              overflow: 'hidden'
            }}>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Type your homework question here... (or drag and drop an image)"
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  fontSize: '16px',
                  fontFamily: 'inherit',
                  minHeight: '120px'
                }}
                rows={4}
              />

              {/* Action Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: '#F9FAFB',
                borderTop: '1px solid #E5E7EB'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleFileClick}
                    style={{
                      padding: '8px',
                      color: '#6B7280',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#E5E7EB';
                      e.currentTarget.style.color = '#111827';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#6B7280';
                    }}
                    title="Upload image or PDF"
                  >
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    style={{ display: 'none' }}
                  />

                  <span style={{ fontSize: '12px', color: '#9CA3AF', marginLeft: '8px' }}>
                    Shift + Enter for new line
                  </span>
                </div>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className={message.trim() ? `bg-gradient-to-r ${selectedPersona.color}` : ''}
                  style={{
                    padding: '8px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 500,
                    cursor: message.trim() ? 'pointer' : 'not-allowed',
                    background: message.trim() ? undefined : '#E5E7EB',
                    color: message.trim() ? 'white' : '#9CA3AF',
                    boxShadow: message.trim() ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>Send</span>
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          </form>

          {/* Helper Text */}
          <p style={{
            textAlign: 'center',
            fontSize: '14px',
            color: '#9CA3AF',
            marginTop: '16px',
            marginBottom: 0
          }}>
            Upload images, PDFs, or type your question • AI-powered tutoring adapts to your level
          </p>
        </div>
      </div>
    </div>
  );
}
