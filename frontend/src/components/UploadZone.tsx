import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { submitUpload, submitText } from '../lib/api';
import { useStore } from '../store/useStore';

export function UploadZone() {
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);

  const { setSubmission, setIsLoading, setError, sessionId } = useStore();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
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
  }, [sessionId, setSubmission, setIsLoading, setError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!textInput.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const submission = await submitText(textInput, sessionId || undefined);
      setSubmission(submission);
      setTextInput('');
      setShowTextInput(false);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Submission failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Homework.tools
        </h1>
        <p className="text-lg text-gray-600">
          Upload a photo, PDF, or type your homework problem to get started
        </p>
      </div>

      {!showTextInput ? (
        <div className="space-y-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-primary-400 bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />

            <div className="space-y-4">
              <svg
                className="mx-auto h-16 w-16 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <div>
                <p className="text-lg font-medium text-gray-900">
                  {isDragActive ? 'Drop your file here' : 'Drop a file or click to upload'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  PNG, JPG, PDF up to 10MB
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => setShowTextInput(true)}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Or type your problem instead
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleTextSubmit} className="space-y-4">
          <div>
            <label htmlFor="problem-text" className="block text-sm font-medium text-gray-700 mb-2">
              Type or paste your homework problem
            </label>
            <textarea
              id="problem-text"
              rows={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              placeholder="Example: Solve for x: 2x + 5 = 13"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!textInput.trim()}
              className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              Get Help
            </button>
            <button
              type="button"
              onClick={() => setShowTextInput(false)}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
