import { NextRequest, NextResponse } from 'next/server';
import { getGenerativeModel } from '@/lib/gemini';
import { buildItemPlacementPrompt } from '@/lib/prompts';
import { extractJSON } from '@/lib/utils';
import { Axis } from '@/lib/types';

interface PlaceItemRequest {
  subject: string;
  xAxis: Axis;
  yAxis: Axis;
  itemName: string;
  existingManifestations?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: PlaceItemRequest = await request.json();
    const { subject, xAxis, yAxis, itemName, existingManifestations = [] } = body;

    // Validate input
    if (!subject || !xAxis || !yAxis || !itemName || !itemName.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Build prompt
    const prompt = buildItemPlacementPrompt(
      subject,
      xAxis,
      yAxis,
      itemName.trim(),
      existingManifestations
    );

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
    const textResult = JSON.parse(cleanedText);

    // Check if item cannot be placed
    if (textResult.cannotPlace) {
      return NextResponse.json({
        cannotPlace: true,
        name: 'Cannot Place',
        description: textResult.explanation,
        reasoning: '',
        isCannotPlace: true,
      });
    }

    // Validate response structure for successful placement
    if (
      typeof textResult.x !== 'number' ||
      typeof textResult.y !== 'number' ||
      !textResult.description ||
      !textResult.reasoning
    ) {
      throw new Error('Invalid response format from Gemini');
    }

    // Return the placement coordinates and details
    return NextResponse.json({
      x: textResult.x,
      y: textResult.y,
      name: itemName.trim(),
      description: textResult.description,
      reasoning: textResult.reasoning,
    });

  } catch (error) {
    console.error('Error placing item:', error);
    return NextResponse.json(
      { error: 'Failed to place item' },
      { status: 500 }
    );
  }
}
