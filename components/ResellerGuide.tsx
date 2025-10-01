import React from 'react';
import { StoreIcon, BotIcon, TrophyIcon, SparklesIcon, PriceTagIcon, ChatBubbleLeftEllipsisIcon } from './Icons';

interface ResellerGuideProps {
    onSwitchToStore: () => void;
}

const ResellerGuide: React.FC<ResellerGuideProps> = ({ onSwitchToStore }) => {

    const GuideStep: React.FC<{ icon: React.FC<any>, title: string, children: React.ReactNode }> = ({ icon: Icon, title, children }) => (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-start space-x-4">
            <div className="flex-shrink-0">
                <Icon className="h-10 w-10 text-cyan-500" />
            </div>
            <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{children}</p>
            </div>
        </div>
    );
    
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white">
             <div className="container mx-auto px-6 py-12">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-4xl font-extrabold tracking-tight">Panduan Reseller</h2>
                    <button 
                        onClick={onSwitchToStore}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                    >
                        <StoreIcon className="h-5 w-5" />
                        <span>Kembali ke Toko</span>
                    </button>
                </div>
                
                <div className="bg-cyan-500/10 dark:bg-cyan-500/20 p-8 rounded-2xl mb-12 text-center">
                     <TrophyIcon className="h-16 w-16 mx-auto text-cyan-500 mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Selamat Datang, Calon Reseller Sukses!</h3>
                    <p className="max-w-3xl mx-auto text-gray-600 dark:text-gray-300">
                        Menjadi reseller produk digital adalah peluang bisnis yang menjanjikan dengan modal minim. Ikuti panduan ini untuk memulai perjalananmu dan raih keuntungan maksimal.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <GuideStep icon={BotIcon} title="Gunakan Bot WhatsApp">
                        Kami menyediakan bot WhatsApp khusus untuk reseller yang memudahkan proses order, cek harga, dan mendapatkan update stok secara real-time. Ini adalah alat utamamu!
                    </GuideStep>
                    <GuideStep icon={PriceTagIcon} title="Struktur Komisi & Keuntungan">
                        Anda akan mendapatkan harga khusus reseller yang lebih rendah dari harga jual normal. Keuntungan Anda adalah selisih antara harga reseller dan harga jual yang Anda tetapkan. Contoh: Harga reseller Netflix Rp 35k, Anda jual Rp 45k, maka keuntungan Anda adalah Rp 10k.
                    </GuideStep>
                    <GuideStep icon={SparklesIcon} title="Pahami Produk & Garansi">
                        Setiap produk memiliki kebijakan garansi yang berbeda. Pastikan kamu memahaminya dengan baik agar bisa menjelaskan kepada pelangganmu. Kepercayaan adalah kunci.
                    </GuideStep>
                     <GuideStep icon={TrophyIcon} title="Bangun Branding Sendiri">
                        Buat toko online-mu sendiri di media sosial atau marketplace. Gunakan nama dan logo yang unik. Jangan hanya menyalin materi promosi kami, kreasikan gayamu sendiri.
                    </GuideStep>
                </div>

                 <div className="mt-12 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
                    <div className="text-center">
                        <ChatBubbleLeftEllipsisIcon className="h-12 w-12 mx-auto text-cyan-500 mb-4" />
                        <h3 className="text-2xl font-bold mb-2">Butuh Bantuan?</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Gunakan ikon bantuan <span className="font-bold text-cyan-500">mengambang</span> di pojok kanan bawah halaman toko untuk terhubung langsung dengan BOT 24 Jam atau Admin kami.
                        </p>
                    </div>
                </div>

             </div>
        </div>
    );
};

export default ResellerGuide;