'use client';

import { useTheme } from '@/contexts/ThemeContext';

export default function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`text-xs px-2 py-1 border transition-colors ${
        theme === 'modern'
          ? 'text-[#4A4A4A] border-[#4A4A4A] hover:bg-[#4A4A4A] hover:text-[#F7F3F2]'
          : 'text-green-700 border-green-700 hover:text-green-500 hover:border-green-500'
      }`}
      style={{ fontFamily: '"Courier New", monospace' }}
    >
      [{theme === 'modern' ? 'TERMINAL' : 'MODERN'}]
    </button>
  );
}
