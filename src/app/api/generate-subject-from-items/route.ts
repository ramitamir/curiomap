import { NextRequest, NextResponse } from 'next/server';
import { getGenerativeModel } from '@/lib/gemini';
import { buildSubjectFromItemsPrompt } from '@/lib/prompts';
import { extractJSON } from '@/lib/utils';

interface GenerateSubjectFromItemsRequest {
  items: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateSubjectFromItemsRequest = await request.json();
    const { items } = body;

    // Validate input
    if (!items || !Array.isArray(items) || items.length !== 3) {
      return NextResponse.json(
        { error: 'Exactly 3 items are required' },
        { status: 400 }
      );
    }

    // Validate each item is non-empty
    const trimmedItems = items.map(item => item.trim()).filter(item => item.length > 0);
    if (trimmedItems.length !== 3) {
      return NextResponse.json(
        { error: 'All 3 items must be non-empty strings' },
        { status: 400 }
      );
    }

    // Build prompt
    const prompt = buildSubjectFromItemsPrompt(trimmedItems);

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

    return NextResponse.json({
      subject: parsedResult.subject,
      reasoning: parsedResult.reasoning || '',
    });

  } catch (error) {
    console.error('Error generating subject from items:', error);
    return NextResponse.json(
      { error: 'Failed to generate subject from items' },
      { status: 500 }
    );
  }
}
