import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Suggestion, FeedbackMessage } from '../types';
import { XIcon, PlusIcon, SaveIcon, RobotIcon, SparklesIcon } from './Icons';
import Tooltip from './Tooltip';

// Gemini API Key from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface SuggestionBoxProps {
    isOpen: boolean;
    onClose: () => void;
    suggestions: Suggestion[];
    onAdd: (suggestion: Omit<Suggestion, 'id'>) => void;
    onUpdate: (suggestion: Suggestion) => void;
    onDelete: (id: number) => void;
    setFeedback: (feedback: FeedbackMessage | null) => void;
}

const SuggestionBox: React.FC<SuggestionBoxProps> = ({
    isOpen,
    onClose,
    suggestions,
    onAdd,
    onUpdate,
    onDelete,
    setFeedback
}) => {
    const [editingSuggestion, setEditingSuggestion] = useState<Suggestion | null>(null);
    const [formState, setFormState] = useState<{ title: string; description: string }>({ title: '', description: '' });
    const [isGenerating, setIsGenerating] = useState(false);

    if (!isOpen) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (editingSuggestion) {
            setEditingSuggestion({ ...editingSuggestion, [name]: value });
        } else {
            setFormState({ ...formState, [name]: value });
        }
    };

    const handleGenerateCopywriting = async () => {
        const title = editingSuggestion ? editingSuggestion.title : formState.title;
        if (!title.trim()) {
            setFeedback({ type: 'error', message: 'Tuliskan judul saran terlebih dahulu.' });
            return;
        }
        setIsGenerating(true);
        setFeedback(null);

        try {
            const prompt = `Buat deskripsi fitur yang menarik dan persuasif untuk sebuah aplikasi manajemen inventaris dan toko digital, berdasarkan judul fitur berikut: "${title}". Deskripsi harus dalam Bahasa Indonesia, jelas, singkat (maksimal 3 kalimat), dan menyoroti manfaat bagi pengguna.`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            const generatedText = response.text;

            if (editingSuggestion) {
                setEditingSuggestion({ ...editingSuggestion, description: generatedText });
            } else {
                setFormState({ ...formState, description: generatedText });
            }
        } catch (error) {
            console.error("Gemini API error:", error);
            setFeedback({ type: 'error', message: 'Gagal menghasilkan deskripsi. Silakan coba lagi.' });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingSuggestion) {
            if (editingSuggestion.title.trim()) {
                onUpdate(editingSuggestion);
                setEditingSuggestion(null);
            }
        } else {
            if (formState.title.trim()) {
                onAdd(formState);
            }
        }
        setFormState({ title: '', description: '' });
    };

    const startEditing = (suggestion: Suggestion) => {
        setEditingSuggestion({ ...suggestion });
        setFormState({ title: '', description: '' }); // Clear new suggestion form
    };

    const cancelEdit = () => {
        setEditingSuggestion(null);
    };

    const currentData = editingSuggestion ?? formState;
    const formTitle = editingSuggestion ? "Edit Saran" : "Tambah Saran Baru";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity duration-300" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <SparklesIcon className="h-6 w-6 text-cyan-500" />
                        Kotak Saran Aplikasi
                    </h2>
                    <Tooltip text="Tutup">
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                            <XIcon className="h-6 w-6" />
                        </button>
                    </Tooltip>
                </header>

                <div className="flex-grow p-6 overflow-y-auto space-y-6">
                    {/* Suggestion Form */}
                    <form onSubmit={handleSubmit} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-4">
                        <h3 className="font-semibold text-lg">{formTitle}</h3>
                        <input
                            type="text"
                            name="title"
                            placeholder="Judul Saran (Contoh: Laporan Keuntungan)"
                            value={currentData.title}
                            onChange={handleInputChange}
                            required
                            className="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-600 focus:ring-2 focus:ring-cyan-500 outline-none"
                        />
                         <div className="relative">
                            <textarea
                                name="description"
                                placeholder="Deskripsi detail tentang saran Anda..."
                                value={currentData.description}
                                onChange={handleInputChange}
                                required
                                rows={4}
                                className="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-600 focus:ring-2 focus:ring-cyan-500 outline-none"
                            />
                             <Tooltip text="Buat Deskripsi Otomatis dengan AI">
                                <button
                                    type="button"
                                    onClick={handleGenerateCopywriting}
                                    disabled={isGenerating || !currentData.title.trim()}
                                    className="absolute bottom-2 right-2 px-3 py-1.5 text-xs bg-cyan-500 text-white rounded-md flex items-center gap-1 hover:bg-cyan-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                >
                                    <RobotIcon className="h-4 w-4" />
                                    {isGenerating ? 'Membuat...' : 'Auto Generate'}
                                </button>
                             </Tooltip>
                        </div>
                        <div className="flex justify-end gap-2">
                            {editingSuggestion && (
                                <button type="button" onClick={cancelEdit} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500">Batal</button>
                            )}
                            <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded-lg flex items-center hover:bg-green-600">
                                {editingSuggestion ? <SaveIcon className="h-5 w-5 mr-2" /> : <PlusIcon className="h-5 w-5 mr-2" />}
                                {editingSuggestion ? 'Update Saran' : 'Tambah Saran'}
                            </button>
                        </div>
                    </form>

                    {/* Suggestions List */}
                    <div>
                        <h3 className="font-semibold text-lg mb-2">Daftar Saran Terkirim</h3>
                        <div className="space-y-3">
                            {suggestions.length > 0 ? suggestions.map(s => (
                                <div key={s.id} className="p-4 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800/50">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-gray-800 dark:text-white">{s.title}</h4>
                                        <div className="flex gap-2 flex-shrink-0 ml-4">
                                            <button onClick={() => startEditing(s)} className="px-3 py-1 text-sm bg-yellow-500 text-white rounded-md hover:bg-yellow-600">Edit</button>
                                            <button onClick={() => onDelete(s.id)} className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600">Hapus</button>
                                        </div>
                                    </div>
                                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{s.description}</p>
                                </div>
                            )) : <p className="text-center text-gray-500 p-4">Belum ada saran yang ditambahkan.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuggestionBox;