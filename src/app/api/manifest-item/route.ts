import { NextRequest, NextResponse } from 'next/server';
import { getGenerativeModel } from '@/lib/gemini';
import { buildManifestationPrompt } from '@/lib/prompts';
import { extractJSON } from '@/lib/utils';
import { Axis } from '@/lib/types';

interface ManifestItemRequest {
  subject: string;
  xAxis: Axis;
  yAxis: Axis;
  x: number;
  y: number;
  existingManifestations?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: ManifestItemRequest = await request.json();

    // Validate coordinates
    if (typeof body.x !== 'number' || typeof body.y !== 'number') {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      );
    }

    if (body.x < -100 || body.x > 100 || body.y < -100 || body.y > 100) {
      return NextResponse.json(
        { error: 'Coordinates must be between -100 and 100' },
        { status: 400 }
      );
    }

    // Validate axes
    if (!body.xAxis?.minLabel || !body.xAxis?.maxLabel ||
        !body.yAxis?.minLabel || !body.yAxis?.maxLabel) {
      return NextResponse.json(
        { error: 'Invalid axis data' },
        { status: 400 }
      );
    }

    // Build prompt
    const existingNames = body.existingManifestations || [];
    const manifestPrompt = buildManifestationPrompt(
      body.subject,
      body.xAxis,
      body.yAxis,
      body.x,
      body.y,
      existingNames
    );

    // Generate text content using Gemini
    const model = getGenerativeModel();
    const result = await model.generateContent(manifestPrompt);
    const response = result.response;
    const text = response.text();

    if (!text) {
      throw new Error('No content in Gemini response');
    }

    // Extract and parse JSON response (handles markdown code blocks)
    const cleanedText = extractJSON(text);
    const textResult = JSON.parse(cleanedText);

    // Check if this is a boundary paradox response
    if (textResult.isImpossible) {
      return NextResponse.json({
        name: 'Impossible Coordinate',
        description: textResult.explanation,
        reasoning: '',
        imageUrl: '',
        isHallucination: false,
        isImpossible: true,
        impossibleExplanation: textResult.explanation,
      });
    }

    // Normal response - validate text response
    if (!textResult.name || !textResult.description || !textResult.reasoning) {
      throw new Error('Invalid text response format');
    }

    // Generate placeholder image URL
    // Using a simple gradient placeholder that includes coordinate info
    const imageUrl = `https://via.placeholder.com/1024x1024/4A90E2/ffffff?text=${encodeURIComponent(textResult.name)}`;

    // Determine if this is a hallucination (extreme coordinates)
    const isHallucination = Math.abs(body.x) > 80 || Math.abs(body.y) > 80;

    return NextResponse.json({
      name: textResult.name,
      description: textResult.description,
      reasoning: textResult.reasoning,
      imageUrl,
      isHallucination,
      isImpossible: false,
    });

  } catch (error) {
    console.error('Error manifesting item:', error);
    return NextResponse.json(
      { error: 'Failed to manifest item' },
      { status: 500 }
    );
  }
}
