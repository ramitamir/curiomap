/**
 * Extract JSON from text that might be wrapped in markdown code blocks
 */
export function extractJSON(text: string): string {
  // Remove markdown code blocks if present
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // Return trimmed text as-is
  return text.trim();
}
