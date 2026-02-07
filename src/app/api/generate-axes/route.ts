import { NextRequest, NextResponse } from 'next/server';
import { getGenerativeModel } from '@/lib/gemini';
import { buildAxisGenerationPrompt } from '@/lib/prompts';
import { extractJSON } from '@/lib/utils';
import { Axis } from '@/lib/types';

interface GenerateAxesRequest {
  subject: string;
  xAxis?: Partial<Axis>;
  yAxis?: Partial<Axis>;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateAxesRequest = await request.json();

    // Validate subject
    if (!body.subject || body.subject.trim().length === 0) {
      return NextResponse.json(
        { error: 'Subject is required' },
        { status: 400 }
      );
    }

    // Default to empty partial axes if not provided
    const xAxis: Partial<Axis> = body.xAxis || {};
    const yAxis: Partial<Axis> = body.yAxis || {};

    // Build prompt
    const prompt = buildAxisGenerationPrompt(body.subject, xAxis, yAxis);

    // Call Gemini
    const model = getGenerativeModel();
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    if (!text) {
      throw new Error('No content in Gemini response');
    }

    // Extract and parse JSON response (handles markdown code blocks)
    const cleanedText = extractJSON(text);
    const parsedResult = JSON.parse(cleanedText);

    // Validate response structure
    if (!parsedResult.xAxis?.minLabel || !parsedResult.xAxis?.maxLabel ||
        !parsedResult.yAxis?.minLabel || !parsedResult.yAxis?.maxLabel) {
      throw new Error('Invalid response format from Gemini');
    }

    return NextResponse.json(parsedResult);

  } catch (error) {
    console.error('Error generating axes:', error);
    return NextResponse.json(
      { error: 'Failed to generate axes' },
      { status: 500 }
    );
  }
}
