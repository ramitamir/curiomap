import { NextRequest, NextResponse } from 'next/server';
import { getGenerativeModel } from '@/lib/gemini';
import { buildSubjectGenerationPrompt } from '@/lib/prompts';
import { extractJSON } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    // Build prompt
    const prompt = buildSubjectGenerationPrompt();

    // Call Gemini
    const model = getGenerativeModel();
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    if (!text) {
      throw new Error('No content in Gemini response');
    }

    // Extract and parse JSON response
    const cleanedText = extractJSON(text);
    const parsedResult = JSON.parse(cleanedText);

    // Validate response structure
    if (!parsedResult.subject || parsedResult.subject.trim().length === 0) {
      throw new Error('Invalid response format from Gemini');
    }

    return NextResponse.json({ subject: parsedResult.subject });

  } catch (error) {
    console.error('Error generating subject:', error);
    return NextResponse.json(
      { error: 'Failed to generate subject' },
      { status: 500 }
    );
  }
}
