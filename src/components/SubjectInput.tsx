'use client';

import { useState } from 'react';

interface SubjectInputProps {
  subject: string;
  onSubjectChange: (subject: string) => void;
  onGenerateAxes: () => void;
  isGenerating: boolean;
}

export default function SubjectInput({
  subject,
  onSubjectChange,
  onGenerateAxes,
  isGenerating,
}: SubjectInputProps) {
  const [inputText, setInputText] = useState('');

  const handleGenerate = () => {
    const trimmed = inputText.trim();
    if (trimmed) {
      onSubjectChange(trimmed);
      onGenerateAxes();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGenerate();
    }
  };

  // Initial input form
  if (!subject) {
    return (
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter a subject to explore..."
            className="flex-1 px-4 py-3 font-mono text-2xl bg-white border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
            disabled={isGenerating}
            autoFocus
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !inputText.trim()}
            className="px-6 py-3 font-mono text-lg bg-black text-white hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </button>
        </div>
        <p className="mt-2 font-mono text-xs text-gray-600">
          Press Enter or click Generate to continue
        </p>
      </div>
    );
  }

  // Display existing subject (with click-to-edit in future)
  return (
    <div className="mb-8">
      <h1 className="px-4 py-3 font-mono text-3xl font-bold">
        {subject}
      </h1>
    </div>
  );
}
