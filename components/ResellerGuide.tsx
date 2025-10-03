import React from 'react';
import { StoreIcon, BotIcon, TrophyIcon, SparklesIcon, PriceTagIcon, ChatBubbleLeftEllipsisIcon, UserGroupIcon, ArrowRightIcon } from './Icons';

interface ResellerGuideProps {
    onSwitchToStore: () => void;
}

const ResellerGuide: React.FC<ResellerGuideProps> = ({ onSwitchToStore }) => {

    const GuideStep: React.FC<{ icon: React.FC<any>, title: string, children: React.ReactNode }> = ({ icon: Icon, title, children }) => (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border dark:border-gray-700 flex flex-col text-center items-center transform transition-transform hover:-translate-y-2">
            <div className="flex-shrink-0 bg-cyan-100 dark:bg-cyan-900/50 p-4 rounded-full mb-4">
                <Icon className="h-10 w-10 text-cyan-500" />
            </div>
            <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{children}</p>
            </div>
        </div>
    );
    
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white">
             <div className="container mx-auto px-6 py-12">
                <div className="text-center">
                    <UserGroupIcon className="h-16 w-16 mx-auto text-cyan-500 mb-4" />
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">Panduan Sukses Reseller Futo Premium</h1>
                    <p className="max-w-3xl mx-auto mt-4 text-lg text-gray-600 dark:text-gray-300">
                        Menjadi reseller produk digital adalah peluang bisnis yang menjanjikan. Ikuti panduan ini untuk memulai perjalananmu dan raih keuntungan maksimal.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 my-16">
                    <GuideStep icon={BotIcon} title="Gunakan Bot WhatsApp">
                        Alat utamamu! Bot kami memudahkan proses order, cek harga, dan mendapatkan update stok secara real-time.
                    </GuideStep>
                    <GuideStep icon={PriceTagIcon} title="Struktur Komisi">
                        Dapatkan harga khusus reseller. Keuntunganmu adalah selisih antara harga reseller dan harga jual yang kamu tetapkan.
                    </GuideStep>
                    <GuideStep icon={SparklesIcon} title="Pahami Produk">
                        Setiap produk memiliki garansi berbeda. Pahami dengan baik agar bisa meyakinkan pelangganmu. Kepercayaan adalah kunci.
                    </GuideStep>
                     <GuideStep icon={TrophyIcon} title="Bangun Branding">
                        Buat toko onlinemu sendiri. Gunakan nama & logo unik. Jangan hanya menyalin, kreasikan gayamu sendiri.
                    </GuideStep>
                </div>

                 <div className="bg-white dark:bg-gray-800/50 p-8 rounded-2xl shadow-lg border dark:border-gray-700">
                    <div className="text-center max-w-2xl mx-auto">
                        <ChatBubbleLeftEllipsisIcon className="h-12 w-12 mx-auto text-cyan-500 mb-4" />
                        <h3 className="text-2xl font-bold mb-2">Siap Memulai?</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Gunakan ikon bantuan <span className="font-bold text-cyan-500">mengambang</span> di pojok kanan bawah halaman toko untuk terhubung langsung dengan BOT 24 Jam atau Admin kami untuk mendaftar.
                        </p>
                        <button 
                            onClick={onSwitchToStore}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 text-white font-semibold rounded-lg hover:bg-cyan-600 transition-colors"
                        >
                            <StoreIcon className="h-5 w-5" />
                            <span>Kembali ke Katalog Produk</span>
                        </button>
                    </div>
                </div>

             </div>
        </div>
    );
};

export default ResellerGuide;
