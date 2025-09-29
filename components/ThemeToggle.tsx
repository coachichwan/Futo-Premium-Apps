import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { SunIcon, MoonIcon } from './Icons';

export const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 focus:ring-cyan-500 rounded-full transition-colors"
            aria-label="Toggle theme"
        >
            {theme === 'light' ? (
                <MoonIcon className="h-6 w-6" />
            ) : (
                <SunIcon className="h-6 w-6" />
            )}
        </button>
    );
};
