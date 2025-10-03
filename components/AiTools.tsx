import React, { useState, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Item, FeedbackMessage } from '../types';
import { SparklesIcon, CopyIcon, CheckmarkIcon, DocumentArrowUpIcon, SaveIcon, DownloadIcon } from './Icons';
import { ImageIcon } from './Icons';

interface AiToolsProps {
    items: Item[];
    onBulkUpdateItems: (updatedItems: Item[]) => void;
    setFeedback: (feedback: FeedbackMessage | null) => void;
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const AiTools: React.FC<AiToolsProps> = ({ items, onBulkUpdateItems, setFeedback }) => {
    // State for Social Media Copywriter
    const [selectedItemId, setSelectedItemId] = useState<string>(items.length > 0 ? String(items[0].id) : '');
    const [tone, setTone] = useState<string>('Persuasif');
    const [platform, setPlatform] = useState<string>('Instagram');
    const [generatedCopy, setGeneratedCopy] = useState<string>('');
    const [isCopyLoading, setIsCopyLoading] = useState<boolean>(false);
    const [copySuccess, setCopySuccess] = useState<boolean>(false);

    // State for Product Description Enhancer
    const [isGeneratingDescriptions, setIsGeneratingDescriptions] = useState(false);
    const [descriptionItems, setDescriptionItems] = useState<{ item: Item; newDescription: string; status: 'idle' | 'loading' | 'done' | 'error' }[]>([]);

    // State for AI Image Generator
    const [imagePrompt, setImagePrompt] = useState<string>('');
    const [aspectRatio, setAspectRatio] = useState<string>('1:1');
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string>('');
    const [isImageLoading, setIsImageLoading] = useState<boolean>(false);

    const handleGenerateCopy = async () => {
        const item = items.find(i => String(i.id) === selectedItemId);
        if (!item) {
            setFeedback({type: 'error', message: 'Silakan pilih produk terlebih dahulu.'});
            return;
        }

        setIsCopyLoading(true);
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
            setIsCopyLoading(false);
        }
    };

    const handleCopy = () => {
        if (!generatedCopy) return;
        navigator.clipboard.writeText(generatedCopy).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        });
    };

    // --- Description Enhancer Logic ---

    const itemsNeedingDescription = useMemo(() => {
        return items.filter(i => !i.description?.trim());
    }, [items]);

    const handleScanForItems = () => {
        setDescriptionItems(itemsNeedingDescription.map(item => ({ item, newDescription: '', status: 'idle' })));
    };
    
    const handleGenerateAllDescriptions = async () => {
        setIsGeneratingDescriptions(true);
        const itemsToProcess = [...descriptionItems];

        for (let i = 0; i < itemsToProcess.length; i++) {
            const currentItem = itemsToProcess[i];
            setDescriptionItems(prev => prev.map(d => d.item.id === currentItem.item.id ? { ...d, status: 'loading' } : d));
            
            const { item } = currentItem;
            const prompt = `You are a creative marketing copywriter for "Futo Premium", a digital store. Write a short, compelling, and persuasive product description (1-2 sentences) for the following product plan. Focus on the customer's experience and benefits. Do not mention price or warranty. The output should be ONLY the description text.

Product: ${item.name}
Features: ${item.features.join(', ')}`;

            try {
                const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
                const newDescription = response.text.trim();
                setDescriptionItems(prev => prev.map(d => d.item.id === currentItem.item.id ? { ...d, newDescription, status: 'done' } : d));
            } catch (error) {
                console.error("Error generating desc for", item.name, error);
                setDescriptionItems(prev => prev.map(d => d.item.id === currentItem.item.id ? { ...d, newDescription: "Gagal membuat deskripsi.", status: 'error' } : d));
            }
        }
        setIsGeneratingDescriptions(false);
    };

    const handleSaveChanges = () => {
        const updatedItems: Item[] = descriptionItems
            .filter(d => d.status === 'done' && d.newDescription)
            .map(d => ({ ...d.item, description: d.newDescription }));

        if (updatedItems.length > 0) {
            onBulkUpdateItems(updatedItems);
            setDescriptionItems([]); // Clear the list after saving
        } else {
            setFeedback({ type: 'error', message: 'Tidak ada deskripsi baru untuk disimpan.' });
        }
    };

    const hasGeneratedItems = descriptionItems.some(d => d.status === 'done' || d.status === 'error');

    // --- Image Generator Logic ---
    const handleGenerateImage = async () => {
        if (!imagePrompt.trim()) {
            setFeedback({ type: 'error', message: 'Silakan masukkan prompt gambar.' });
            return;
        }
        setIsImageLoading(true);
        setGeneratedImageUrl('');
    
        try {
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: imagePrompt,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: aspectRatio as "1:1" | "3:4" | "4:3" | "9:16" | "16:9",
                },
            });
    
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
            setGeneratedImageUrl(imageUrl);
        } catch (error) {
            console.error("Gemini image generation error:", error);
            setFeedback({ type: 'error', message: 'Gagal membuat gambar. Silakan coba lagi.' });
        } finally {
            setIsImageLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Layanan AI</h2>
            
            {/* Tool 1: Product Description Enhancer */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center">
                    <DocumentArrowUpIcon className="h-6 w-6 mr-2 text-green-500" />
                    Peningkat Deskripsi Produk
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Gunakan AI untuk membuat deskripsi produk yang menarik secara otomatis untuk item yang belum memiliki deskripsi.
                </p>

                {descriptionItems.length === 0 ? (
                    <div className="text-center py-4">
                        <p className="mb-4">
                            Ada <strong>{itemsNeedingDescription.length}</strong> item yang terdeteksi tanpa deskripsi.
                        </p>
                        <button
                            onClick={handleScanForItems}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg flex items-center justify-center mx-auto gap-2 hover:bg-green-600 transition-colors"
                        >
                            <SparklesIcon className="h-5 w-5" />
                            Mulai Pindai & Perbaiki
                        </button>
                    </div>
                ) : (
                    <div>
                        <div className="mb-4">
                            <h4 className="font-semibold">{descriptionItems.length} Item ditemukan:</h4>
                        </div>
                        <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                             {descriptionItems.map(({ item, newDescription, status }) => (
                                <div key={item.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                    <p className="font-semibold text-gray-800 dark:text-gray-200">{item.name}</p>
                                    {status === 'loading' && <p className="text-sm text-cyan-500 animate-pulse">Membuat deskripsi...</p>}
                                    {status === 'done' && <p className="text-sm text-green-600">{newDescription}</p>}
                                    {status === 'error' && <p className="text-sm text-red-500">{newDescription}</p>}
                                    {status === 'idle' && <p className="text-sm text-gray-400 italic">Menunggu untuk dibuat...</p>}
                                </div>
                            ))}
                        </div>
                         <div className="mt-6 flex flex-col sm:flex-row gap-3">
                             <button
                                onClick={handleGenerateAllDescriptions}
                                disabled={isGeneratingDescriptions}
                                className="w-full sm:w-auto px-4 py-2 bg-cyan-500 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-cyan-600 disabled:bg-gray-400 transition-colors"
                            >
                                <SparklesIcon className="h-5 w-5" />
                                {isGeneratingDescriptions ? 'Membuat...' : `Buat Semua Deskripsi (${descriptionItems.length})`}
                            </button>
                            {hasGeneratedItems && (
                                <button
                                    onClick={handleSaveChanges}
                                    className="w-full sm:w-auto px-4 py-2 bg-green-500 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-green-600"
                                >
                                    <SaveIcon className="h-5 w-5" />
                                    Simpan Semua Perubahan
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Tool 2: Social Media Copywriter */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center">
                    <SparklesIcon className="h-6 w-6 mr-2 text-purple-500" />
                    Copywriter Media Sosial
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Buat copywriting promosi yang siap posting untuk produk Anda. Pilih produk, nada, dan platform, lalu biarkan AI bekerja.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label htmlFor="product-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pilih Produk</label>
                        <select id="product-select" value={selectedItemId} onChange={(e) => setSelectedItemId(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600">
                            {items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="tone-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pilih Nada</label>
                        <select id="tone-select" value={tone} onChange={(e) => setTone(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600">
                            <option>Persuasif</option>
                            <option>Informatif</option>
                            <option>Kasual</option>
                            <option>Profesional</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="platform-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pilih Platform</label>
                        <select id="platform-select" value={platform} onChange={(e) => setPlatform(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600">
                            <option>Instagram</option>
                            <option>Facebook</option>
                            <option>Twitter (X)</option>
                            <option>Telegram</option>
                        </select>
                    </div>
                </div>
                <button
                    onClick={handleGenerateCopy}
                    disabled={isCopyLoading}
                    className="w-full sm:w-auto px-4 py-2 bg-purple-500 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-purple-600 disabled:bg-gray-400 transition-colors"
                >
                    <SparklesIcon className="h-5 w-5" />
                    {isCopyLoading ? 'Membuat...' : 'Buat Copywriting'}
                </button>

                {isCopyLoading && (
                    <div className="mt-4 p-4 border rounded-md dark:border-gray-700 animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                )}

                {generatedCopy && !isCopyLoading && (
                    <div className="mt-4 p-4 border rounded-md dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 relative">
                        <button
                            onClick={handleCopy}
                            className="absolute top-2 right-2 p-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                            {copySuccess ? <CheckmarkIcon className="h-5 w-5 text-green-500" /> : <CopyIcon className="h-5 w-5" />}
                        </button>
                        <pre className="whitespace-pre-wrap font-sans text-sm">{generatedCopy}</pre>
                    </div>
                )}
            </div>

             {/* Tool 3: AI Image Generator */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center">
                    <ImageIcon className="h-6 w-6 mr-2 text-blue-500" />
                    AI Image Generator
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Buat gambar unik untuk promosi atau ikon produk dari deskripsi teks sederhana.
                </p>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="image-prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Prompt Gambar</label>
                        <textarea
                            id="image-prompt"
                            rows={3}
                            value={imagePrompt}
                            onChange={(e) => setImagePrompt(e.target.value)}
                            placeholder="Contoh: Seekor kucing astronot mengendarai skateboard di bulan, gaya seni digital."
                            className="mt-1 block w-full text-base border-gray-300 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600"
                        />
                    </div>
                    <div>
                        <label htmlFor="aspect-ratio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rasio Aspek</label>
                        <select
                            id="aspect-ratio"
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600"
                        >
                            <option>1:1</option>
                            <option>3:4</option>
                            <option>4:3</option>
                            <option>9:16</option>
                            <option>16:9</option>
                        </select>
                    </div>
                    <button
                        onClick={handleGenerateImage}
                        disabled={isImageLoading}
                        className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
                    >
                        <SparklesIcon className="h-5 w-5" />
                        {isImageLoading ? 'Membuat Gambar...' : 'Buat Gambar'}
                    </button>
                </div>

                {isImageLoading && (
                    <div className="mt-4 flex justify-center items-center h-64 bg-gray-100 dark:bg-gray-700 rounded-md animate-pulse">
                         <ImageIcon className="h-12 w-12 text-gray-400"/>
                    </div>
                )}

                {generatedImageUrl && !isImageLoading && (
                    <div className="mt-4">
                        <img src={generatedImageUrl} alt="Generated by AI" className="rounded-md w-full max-w-md mx-auto shadow-md"/>
                        <div className="text-center mt-4">
                             <a
                                href={generatedImageUrl}
                                download={`futo-ai-image-${Date.now()}.jpeg`}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                            >
                                <DownloadIcon className="h-5 w-5" />
                                Unduh Gambar
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AiTools;