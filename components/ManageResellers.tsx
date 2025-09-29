import React, { useState, useMemo } from 'react';
import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";
import { Reseller, FeedbackMessage, Transaction, TransactionType } from '../types';
import { PlusIcon, SaveIcon, UserGroupIcon, WhatsAppIcon, XIcon, MailIcon, LinkIcon, CopyIcon, HourglassIcon } from './Icons';
import Tooltip from './Tooltip';

// Gemini API Key from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface InviteResellerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onInviteReseller: (inviteData: { name: string; email: string; commissionRate: number; inviteCode: string }) => void;
    setFeedback: (feedback: FeedbackMessage | null) => void;
}

const InviteResellerModal: React.FC<InviteResellerModalProps> = ({ isOpen, onClose, onInviteReseller, setFeedback }) => {
    const [activeTab, setActiveTab] = useState<'email' | 'link'>('email');
    const [inviteData, setInviteData] = useState({ name: '', email: '', commissionRate: 10 });
    const [generatedLink, setGeneratedLink] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [copySuccess, setCopySuccess] = useState('');

    if (!isOpen) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const processedValue = name === 'commissionRate' ? parseInt(value, 10) || 0 : value;
        setInviteData(prev => ({ ...prev, [name]: processedValue }));
    };

    const handleSendEmailInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        const inviteCode = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
        const invitationLink = `${window.location.origin}?invite_code=${inviteCode}`;

        const sendResellerInviteEmail: FunctionDeclaration = {
            name: 'sendResellerInviteEmail',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    email: { type: Type.STRING },
                    invitationLink: { type: Type.STRING },
                    commissionRate: { type: Type.NUMBER },
                },
                required: ['name', 'email', 'invitationLink', 'commissionRate'],
            },
        };

        try {
            const prompt = `Kirim email undangan reseller ke ${inviteData.name} di ${inviteData.email}. Tautan undangannya adalah ${invitationLink} dan tingkat komisinya adalah ${inviteData.commissionRate}%.`;
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    tools: [{ functionDeclarations: [sendResellerInviteEmail] }],
                },
            });
            
            if (response.functionCalls && response.functionCalls[0]?.name === 'sendResellerInviteEmail') {
                console.log("AI is simulating sending invite:", response.functionCalls[0].args);
                onInviteReseller({ ...inviteData, inviteCode });
                setFeedback({ type: 'success', message: `Simulasi pengiriman undangan ke ${inviteData.email} berhasil.` });
                onClose();
            } else {
                throw new Error("AI did not return the expected function call.");
            }

        } catch (error) {
            console.error("Gemini API error:", error);
            setFeedback({ type: 'error', message: 'Gagal mengirim undangan via AI. Silakan coba lagi.' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCreateLink = () => {
        const inviteCode = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
        const link = `${window.location.origin}?invite_code=${inviteCode}&commission=${inviteData.commissionRate}`;
        setGeneratedLink(link);
    };

    const handleCopyLink = () => {
        if (!generatedLink) return;
        navigator.clipboard.writeText(generatedLink).then(() => {
            setCopySuccess('Tautan disalin!');
            setTimeout(() => setCopySuccess(''), 2000);
        }, () => {
            setCopySuccess('Gagal menyalin.');
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Undang Reseller Baru</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><XIcon className="h-6 w-6" /></button>
                </header>
                
                <div className="p-6">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tingkat Komisi (%)</label>
                        <input type="number" name="commissionRate" value={inviteData.commissionRate} onChange={handleInputChange} min="0" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                    </div>

                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                            <button onClick={() => setActiveTab('email')} className={`${activeTab === 'email' ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}><MailIcon className="h-5 w-5"/> Undang via Email</button>
                            <button onClick={() => setActiveTab('link')} className={`${activeTab === 'link' ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}><LinkIcon className="h-5 w-5"/> Buat Tautan</button>
                        </nav>
                    </div>

                    {activeTab === 'email' ? (
                        <form onSubmit={handleSendEmailInvite} className="pt-6 space-y-4">
                            <input type="text" name="name" placeholder="Nama Reseller" value={inviteData.name} onChange={handleInputChange} required className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                            <input type="email" name="email" placeholder="Email Reseller" value={inviteData.email} onChange={handleInputChange} required className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                            <button type="submit" disabled={isProcessing} className="w-full bg-cyan-500 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-cyan-600 disabled:bg-gray-400">
                                <MailIcon className="h-5 w-5" />
                                {isProcessing ? 'Mengirim...' : 'Kirim Undangan'}
                            </button>
                        </form>
                    ) : (
                        <div className="pt-6 space-y-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Buat tautan undangan unik yang dapat Anda bagikan. Siapa pun yang mendaftar melalui tautan ini akan otomatis mendapatkan tingkat komisi yang telah ditetapkan.</p>
                            {generatedLink ? (
                                <div className="flex items-center gap-2">
                                    <input type="text" readOnly value={generatedLink} className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-900 dark:border-gray-600" />
                                    <button onClick={handleCopyLink} className="flex-shrink-0 bg-gray-200 dark:bg-gray-600 font-semibold py-2 px-3 rounded-lg flex items-center gap-2">
                                        <CopyIcon className="h-5 w-5" />
                                        {copySuccess ? 'Disalin!' : 'Salin'}
                                    </button>
                                </div>
                            ) : (
                                <button onClick={handleCreateLink} className="w-full bg-green-500 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-green-600">
                                    <LinkIcon className="h-5 w-5" /> Buat Tautan
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

interface ManageResellersProps {
    resellers: Reseller[];
    transactions: Transaction[];
    onAddReseller: (resellerData: Omit<Reseller, 'id' | 'joinDate' | 'status'>) => void;
    onInviteReseller: (inviteData: { name: string; email: string; commissionRate: number; inviteCode: string }) => void;
    onUpdateReseller: (updatedReseller: Reseller) => void;
    onDeleteReseller: (resellerId: number) => void;
    setFeedback: (feedback: FeedbackMessage | null) => void;
}

const ManageResellers: React.FC<ManageResellersProps> = ({ resellers, transactions, onAddReseller, onInviteReseller, onUpdateReseller, onDeleteReseller, setFeedback }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingReseller, setEditingReseller] = useState<Reseller | null>(null);
    const initialFormState: Omit<Reseller, 'id'|'joinDate'|'status'> = { name: '', whatsappNumber: '', commissionRate: 10 };
    const [formState, setFormState] = useState(initialFormState);
    const [searchTerm, setSearchTerm] = useState('');
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const processedValue = name === 'commissionRate' ? parseFloat(value) || 0 : value;
        if (editingReseller) {
            setEditingReseller({ ...editingReseller, [name]: processedValue });
        } else {
            setFormState({ ...formState, [name]: processedValue });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddReseller(formState);
        setFormState(initialFormState);
        setIsAdding(false);
    };

    const handleUpdateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingReseller) {
            onUpdateReseller(editingReseller);
            setEditingReseller(null);
        }
    };

    const startEditing = (reseller: Reseller) => {
        setEditingReseller({ ...reseller });
        setIsAdding(false);
    };

    const filteredResellers = useMemo(() => {
        return resellers.map(reseller => {
            const totalSales = transactions
                .filter(t => t.resellerId === reseller.id && t.type === TransactionType.OUT)
                .reduce((sum, t) => sum + t.quantity, 0);
            return { ...reseller, totalSales };
        }).filter(reseller =>
            reseller.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [resellers, transactions, searchTerm]);

    const renderResellerForm = (
        data: Omit<Reseller, 'id' | 'joinDate' | 'status'>,
        submitHandler: (e: React.FormEvent) => void,
        submitText: string
    ) => (
        <form onSubmit={submitHandler} className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                    type="text"
                    name="name"
                    placeholder="Nama Reseller"
                    value={data.name}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600"
                />
                <input
                    type="text"
                    name="whatsappNumber"
                    placeholder="Nomor WhatsApp (e.g., 62812...)"
                    value={data.whatsappNumber}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600"
                />
                 <div className="relative">
                    <input
                        type="number"
                        name="commissionRate"
                        placeholder="Komisi (%)"
                        value={data.commissionRate}
                        onChange={handleInputChange}
                        required
                        min="0"
                        className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600"
                    />
                    <span className="absolute inset-y-0 right-3 flex items-center text-gray-500">%</span>
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <Tooltip text="Batalkan dan tutup form">
                    <button type="button" onClick={() => { setIsAdding(false); setEditingReseller(null); }} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg">Batal</button>
                </Tooltip>
                <Tooltip text="Simpan perubahan">
                    <button type="submit" className="px-4 py-2 bg-cyan-500 text-white rounded-lg flex items-center">
                        <SaveIcon className="h-5 w-5 mr-2" /> {submitText}
                    </button>
                </Tooltip>
            </div>
        </form>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-4 justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Kelola Reseller</h2>
                <div className="flex gap-2">
                    <Tooltip text="Undang reseller baru via email atau tautan">
                        <button onClick={() => setIsInviteModalOpen(true)} className="px-4 py-2 bg-green-500 text-white rounded-lg flex items-center">
                            <MailIcon className="h-5 w-5 mr-2" /> Undang Reseller
                        </button>
                    </Tooltip>
                    {!isAdding && !editingReseller && (
                        <Tooltip text="Buka form untuk menambah reseller secara manual">
                            <button onClick={() => { setIsAdding(true); setEditingReseller(null); setFormState(initialFormState); }} className="px-4 py-2 bg-cyan-500 text-white rounded-lg flex items-center">
                                <PlusIcon className="h-5 w-5 mr-2" /> Tambah Manual
                            </button>
                        </Tooltip>
                    )}
                </div>
            </div>

            <InviteResellerModal 
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                onInviteReseller={onInviteReseller}
                setFeedback={setFeedback}
            />

            {isAdding && renderResellerForm(formState, handleSubmit, "Simpan Reseller")}
            {editingReseller && renderResellerForm(editingReseller, handleUpdateSubmit, "Update Reseller")}

            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <input
                    type="text"
                    placeholder="Cari reseller berdasarkan nama..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-cyan-500 outline-none transition"
                    aria-label="Cari Reseller"
                />
            </div>

            <div className="bg-transparent md:bg-white md:dark:bg-gray-800 md:shadow-lg md:rounded-lg overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-100 dark:bg-gray-700 hidden md:table-header-group">
                        <tr>
                            <th className="p-4">Nama</th>
                            <th className="p-4">Kontak</th>
                            <th className="p-4">Komisi</th>
                            <th className="p-4">Total Penjualan</th>
                            <th className="p-4">Tanggal Bergabung</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="block md:table-row-group">
                        {filteredResellers.map(reseller => (
                            <tr key={reseller.id} className="block md:table-row border-b dark:border-gray-700 md:border-b transition-colors mb-4 md:mb-0 rounded-lg md:rounded-none shadow-md md:shadow-none bg-white dark:bg-gray-800">
                                <td className="p-3 md:p-4 block md:table-cell font-medium">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                            <UserGroupIcon className="h-6 w-6 text-gray-400" />
                                        </div>
                                        <span className="font-semibold text-gray-800 dark:text-gray-200">{reseller.name}</span>
                                    </div>
                                </td>
                                 <td className="p-3 md:p-4 flex justify-between items-center md:table-cell text-gray-600 dark:text-gray-400 border-t md:border-t-0 dark:border-gray-700">
                                    <span className="font-normal text-gray-500 dark:text-gray-400 md:hidden">Kontak</span>
                                    <div>
                                        {reseller.status === 'active' && reseller.whatsappNumber ? (
                                            <a href={`https://wa.me/${reseller.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-green-500 hover:underline">
                                                <WhatsAppIcon className="h-4 w-4" /> {reseller.whatsappNumber}
                                            </a>
                                        ) : (
                                            <span className="text-sm">{reseller.email}</span>
                                        )}
                                    </div>
                                </td>
                                <td className="p-3 md:p-4 flex justify-between items-center md:table-cell text-gray-600 dark:text-gray-400 border-t md:border-t-0 dark:border-gray-700">
                                     <span className="font-normal text-gray-500 dark:text-gray-400 md:hidden">Komisi</span>
                                    <span className="font-semibold">{reseller.commissionRate}%</span>
                                </td>
                                <td className="p-3 md:p-4 flex justify-between items-center md:table-cell text-gray-600 dark:text-gray-400 border-t md:border-t-0 dark:border-gray-700">
                                    <span className="font-normal text-gray-500 dark:text-gray-400 md:hidden">Total Penjualan</span>
                                    <span className="font-semibold text-cyan-500">{reseller.totalSales} unit</span>
                                </td>
                                <td className="p-3 md:p-4 flex justify-between items-center md:table-cell text-gray-600 dark:text-gray-400 border-t md:border-t-0 dark:border-gray-700">
                                     <span className="font-normal text-gray-500 dark:text-gray-400 md:hidden">Bergabung</span>
                                    {new Date(reseller.joinDate).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </td>
                                 <td className="p-3 md:p-4 flex justify-between items-center md:table-cell text-gray-600 dark:text-gray-400 border-t md:border-t-0 dark:border-gray-700">
                                    <span className="font-normal text-gray-500 dark:text-gray-400 md:hidden">Status</span>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 ${reseller.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
                                        {reseller.status === 'pending' && <HourglassIcon className="h-3 w-3" />}
                                        {reseller.status === 'active' ? 'Aktif' : 'Tertunda'}
                                    </span>
                                </td>
                                <td className="p-3 md:p-4 flex justify-between items-center md:table-cell border-t md:border-t-0 dark:border-gray-700">
                                    <span className="font-normal text-gray-500 dark:text-gray-400 md:hidden">Aksi</span>
                                    <div className="flex gap-2 justify-end md:justify-start">
                                        <Tooltip text="Ubah detail reseller">
                                            <button onClick={() => startEditing(reseller)} className="px-3 py-1 text-sm bg-yellow-500 text-white rounded-md">Edit</button>
                                        </Tooltip>
                                        <Tooltip text="Hapus reseller">
                                            <button onClick={() => onDeleteReseller(reseller.id)} className="px-3 py-1 text-sm bg-red-500 text-white rounded-md">Hapus</button>
                                        </Tooltip>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredResellers.length === 0 && (
                    <p className="text-center p-6 text-gray-500 dark:text-gray-400">
                        {resellers.length > 0 ? "Tidak ada reseller yang cocok dengan pencarian Anda." : "Belum ada reseller yang ditambahkan."}
                    </p>
                )}
            </div>
        </div>
    );
};

export default ManageResellers;