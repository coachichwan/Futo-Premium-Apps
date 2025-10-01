import React, { useState } from 'react';
import { ChatBubbleLeftEllipsisIcon, XIcon, BotIcon, UserIcon } from './Icons';

const HelpWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    const helpOptions = [
        {
            icon: BotIcon,
            title: 'BOT 24 Jam NONSTOP',
            subtitle: 'Cek Stok & Pesan Otomatis',
            link: 'https://wa.me/6285175122103?text=stok'
        },
        {
            icon: UserIcon,
            title: 'Chat Admin Resmi',
            subtitle: 'Bantuan & Pertanyaan Langsung',
            link: 'https://wa.me/6285779462118'
        }
    ];

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Flyout Menu */}
            {isOpen && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-72 mb-4 border dark:border-gray-700 transition-all duration-300 ease-out transform origin-bottom-right animate-[fade-in_0.2s_ease-out]">
                    <header className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800 dark:text-white">Butuh Bantuan?</h3>
                         <button 
                            onClick={() => setIsOpen(false)} 
                            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                            aria-label="Tutup Bantuan"
                         >
                            <XIcon className="h-5 w-5" />
                        </button>
                    </header>
                    <div className="p-2 space-y-1">
                        {helpOptions.map((option) => {
                            const Icon = option.icon;
                            return (
                                <a
                                    key={option.title}
                                    href={option.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <Icon className="h-8 w-8 text-cyan-500 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{option.title}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{option.subtitle}</p>
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Main FAB */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-cyan-500 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center hover:bg-cyan-600 transition-transform transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-cyan-300 dark:focus:ring-cyan-800"
                aria-label={isOpen ? 'Tutup Bantuan' : 'Buka Bantuan'}
            >
                {isOpen ? (
                    <XIcon className="h-8 w-8" />
                ) : (
                    <ChatBubbleLeftEllipsisIcon className="h-8 w-8" />
                )}
            </button>
        </div>
    );
};

export default HelpWidget;