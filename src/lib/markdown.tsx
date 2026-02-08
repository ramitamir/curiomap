import React from 'react';

/**
 * Renders text with markdown-style links [text](url) as clickable links
 */
export function renderTextWithLinks(text: string, theme: 'terminal' | 'modern' = 'terminal'): React.ReactNode {
  if (!text) return text;

  // Regex to match markdown links: [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  const linkClasses = theme === 'modern'
    ? 'text-[#4A4A4A] hover:text-[#2C2C2C] underline'
    : 'text-green-400 hover:text-green-300 underline glow';

  while ((match = linkRegex.exec(text)) !== null) {
    const [fullMatch, linkText, url] = match;
    const matchIndex = match.index;

    // Add text before the link
    if (matchIndex > lastIndex) {
      parts.push(text.substring(lastIndex, matchIndex));
    }

    // Add the link
    parts.push(
      <a
        key={matchIndex}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClasses}
      >
        {linkText}
      </a>
    );

    lastIndex = matchIndex + fullMatch.length;
  }

  // Add remaining text after the last link
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  // If no links found, return original text
  if (parts.length === 0) {
    return text;
  }

  return <>{parts}</>;
}
