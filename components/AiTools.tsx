import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Item } from '../types';
import { SparklesIcon, CopyIcon, CheckmarkIcon } from './Icons';

interface AiToolsProps {
    items: Item[];
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const AiTools: React.FC<AiToolsProps> = ({ items }) => {
    const [selectedItemId, setSelectedItemId] = useState<string>(items.length > 0 ? String(items[0].id) : '');
    const [tone, setTone] = useState<string>('Persuasif');
    const [platform, setPlatform] = useState<string>('Instagram');
    const [generatedCopy, setGeneratedCopy] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [copySuccess, setCopySuccess] = useState<boolean>(false);

    const handleGenerateCopy = async () => {
        const item = items.find(i => String(i.id) === selectedItemId);
        if (!item) {
            alert('Please select an item first.');
            return;
        }

        setIsLoading(true);
        setGeneratedCopy('');
        setCopySuccess(false);

        const prompt = `
Anda adalah seorang ahli copywriting marketing untuk toko digital bernama "Futo Premium". Buatlah sebuah copy promosi yang menarik untuk platform media sosial (${platform}) berdasarkan detail produk berikut.

**Detail Produk:**
- Nama Produk: ${item.name}
- Harga: ${item.price}
- Deskripsi Singkat: ${item.description}
- Fitur Utama: ${item.features.join(', ')}
- Garansi: ${item.warranty}

**Instruksi:**
- Gunakan nada **${tone}**.
- Sorot manfaat utama bagi pelanggan, bukan hanya fitur.
- Buatlah call-to-action (CTA) yang kuat untuk mendorong pelanggan melakukan pembelian via WhatsApp.
- Gunakan emoji yang relevan untuk membuat teks lebih hidup dan menarik secara visual.
- Pastikan copy terasa natural, mudah dibaca, dan siap untuk di-posting.
- Tambahkan beberapa hashtag yang relevan di akhir.
        `.trim();

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setGeneratedCopy(response.text);
        } catch (error) {
            console.error("Gemini API error:", error);
            setGeneratedCopy('Gagal membuat copywriting. Silakan coba lagi.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (!generatedCopy) return;
        navigator.clipboard.writeText(generatedCopy).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        });
    };

    const tones = ['Persuasif', 'Informatif', 'Ramah', 'Profesional', 'Fun', 'Mendesak'];
    const platforms = ['Instagram', 'Facebook', 'Twitter (X)', 'WhatsApp Status'];

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">AI Copywriting Generator</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Controls Panel */}
                <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg space-y-6 h-fit">
                    <h3 className="text-xl font-semibold">Pengaturan</h3>
                    <div>
                        <label htmlFor="item-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pilih Produk</label>
                        <select
                            id="item-select"
                            value={selectedItemId}
                            onChange={(e) => setSelectedItemId(e.target.value)}
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                        >
                            {items.filter(i => i.isVisibleInStore).map(item => (
                                <option key={item.id} value={item.id}>{item.name}</option>
                            ))}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="tone-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gaya Bahasa</label>
                        <select
                            id="tone-select"
                            value={tone}
                            onChange={(e) => setTone(e.target.value)}
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                        >
                            {tones.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="platform-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Platform</label>
                        <select
                            id="platform-select"
                            value={platform}
                            onChange={(e) => setPlatform(e.target.value)}
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                        >
                            {platforms.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <button
                        onClick={handleGenerateCopy}
                        disabled={isLoading || !selectedItemId}
                        className="w-full px-4 py-3 bg-cyan-500 text-white rounded-lg flex items-center justify-center font-semibold hover:bg-cyan-600 disabled:bg-gray-400"
                    >
                        <SparklesIcon className="h-5 w-5 mr-2" />
                        {isLoading ? 'Membuat Copy...' : 'Buat Copywriting'}
                    </button>
                </div>

                {/* Result Panel */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                         <h3 className="text-xl font-semibold">Hasil Copywriting</h3>
                         {generatedCopy && (
                             <button
                                onClick={handleCopy}
                                className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600"
                             >
                                {copySuccess ? <CheckmarkIcon className="h-4 w-4 text-green-500"/> : <CopyIcon className="h-4 w-4"/>}
                                {copySuccess ? 'Disalin!' : 'Salin Teks'}
                             </button>
                         )}
                    </div>
                    <div className="w-full min-h-[24rem] h-auto p-4 border rounded dark:bg-gray-900 dark:border-gray-600 overflow-y-auto whitespace-pre-wrap font-sans">
                        {isLoading ? (
                             <div className="flex items-center justify-center h-full">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                                <p className="ml-3 text-gray-500">AI sedang meracik kata-kata...</p>
                            </div>
                        ) : generatedCopy ? (
                            generatedCopy
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                <p>Hasil copywriting akan muncul di sini.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AiTools;
