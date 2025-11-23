import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { settings, setSettings } = useStore();
    const [apiKey, setApiKey] = useState(settings.apiKey);
    const [provider, setProvider] = useState(settings.provider);

    // Sync local state when settings change or modal opens
    useEffect(() => {
        if (isOpen) {
            setApiKey(settings.apiKey);
            setProvider(settings.provider);
        }
    }, [isOpen, settings]);

    const handleSave = () => {
        setSettings({ provider, apiKey });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900">AI Settings</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        ✕
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Provider Selection */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">AI Provider</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setProvider('gemini')}
                                className={`p-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 ${provider === 'gemini'
                                        ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                    }`}
                            >
                                <span>✨</span> Google Gemini
                            </button>
                            <button
                                onClick={() => setProvider('openai')}
                                className={`p-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 ${provider === 'openai'
                                        ? 'border-green-500 bg-green-50 text-green-700 ring-1 ring-green-500'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                    }`}
                            >
                                <span>🤖</span> OpenAI GPT-4
                            </button>
                        </div>
                    </div>

                    {/* API Key Input */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            API Key <span className="text-gray-400 font-normal">(Optional if set on server)</span>
                        </label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder={`Enter your ${provider === 'gemini' ? 'Google' : 'OpenAI'} API Key`}
                            className="w-full p-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        />
                        <p className="text-xs text-gray-500">
                            Your key is stored locally in your browser and sent directly to the backend for each request.
                        </p>
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
}
