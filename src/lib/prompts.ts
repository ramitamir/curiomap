import { Axis } from './types';

export function buildSubjectGenerationPrompt(): string {
  return `You are the Subject Scout for 'Curio Space.'

MISSION:
Generate a single, high-potential subject for a conceptual 2D map. Be creative and vary your choices - explore different domains like history, culture, science, art, technology, mythology, etc.

CRITERIA FOR A GOOD SUBJECT:
1. TAXONOMIC DEPTH: The subject must represent a category with a diverse range of well-known icons, archetypes, or entities.
2. DIMENSIONALITY: It must be a topic that can be viewed through multiple, non-obvious lenses (e.g., 'Mythology' is better than 'Goldfish').
3. CULTURAL WEIGHT: The items within the subject should be recognizable to a general audience to ensure 'aha' moments.
4. EVOCATIVE POWER: Pick subjects that feel like a 'world' to be explored—think history, subcultures, science, or literature.

GOOD EXAMPLES:
- "Medieval Siege Weapons"
- "Ancient Philosophical Schools"
- "Film Noir Detectives"
- "Space Exploration Missions"
- "Renaissance Artists"
- "Jazz Musicians"
- "Cryptographic Algorithms"
- "Mythological Creatures"

BAD EXAMPLES:
- "Dreams" (too vague, not a category)
- "Colors" (too generic)
- "Numbers" (too dry)
- "Things" (no meaning)

STRICT CONSTRAINTS:
- Generate a SPECIFIC category or domain, not abstract concepts
- Must have at least 10-20 well-known examples that could be mapped
- Avoid single-word subjects unless they represent a rich category (like "Revolutions" or "Dinosaurs")
- Vary your responses - don't repeat the same types of subjects

IMPORTANT: Return ONLY valid JSON, no markdown, no code blocks, no extra text.

Return this exact JSON structure:
{
  "subject": "..."
}`;
}

export function buildAxisGenerationPrompt(
  subject: string,
  xAxis: Partial<Axis>,
  yAxis: Partial<Axis>
): string {
  // Build explicit instructions for each axis
  let xAxisInstructions = '';
  let yAxisInstructions = '';

  // X-Axis instructions
  if (xAxis.minLabel && xAxis.maxLabel) {
    xAxisInstructions = `X-Axis: Both labels provided by user. Use EXACTLY: minLabel="${xAxis.minLabel}", maxLabel="${xAxis.maxLabel}"`;
  } else if (xAxis.minLabel && !xAxis.maxLabel) {
    xAxisInstructions = `X-Axis: User provided minLabel="${xAxis.minLabel}". You MUST keep this exactly. Generate a semantically OPPOSITE maxLabel that contrasts with "${xAxis.minLabel}".`;
  } else if (!xAxis.minLabel && xAxis.maxLabel) {
    xAxisInstructions = `X-Axis: User provided maxLabel="${xAxis.maxLabel}". You MUST keep this exactly. Generate a semantically OPPOSITE minLabel that contrasts with "${xAxis.maxLabel}".`;
  } else {
    xAxisInstructions = `X-Axis: No labels provided. Generate both minLabel and maxLabel according to the axis criteria.`;
  }

  // Y-Axis instructions
  if (yAxis.minLabel && yAxis.maxLabel) {
    yAxisInstructions = `Y-Axis: Both labels provided by user. Use EXACTLY: minLabel="${yAxis.minLabel}", maxLabel="${yAxis.maxLabel}"`;
  } else if (yAxis.minLabel && !yAxis.maxLabel) {
    yAxisInstructions = `Y-Axis: User provided minLabel="${yAxis.minLabel}". You MUST keep this exactly. Generate a semantically OPPOSITE maxLabel that contrasts with "${yAxis.minLabel}".`;
  } else if (!yAxis.minLabel && yAxis.maxLabel) {
    yAxisInstructions = `Y-Axis: User provided maxLabel="${yAxis.maxLabel}". You MUST keep this exactly. Generate a semantically OPPOSITE minLabel that contrasts with "${yAxis.maxLabel}".`;
  } else {
    yAxisInstructions = `Y-Axis: No labels provided. Generate both minLabel and maxLabel according to the axis criteria.`;
  }

  return `You are the Dimensional Architect for 'Curio Space.'

MISSION: Given a 'Subject,' identify two distinct, high-contrast dimensions (X and Y axes) that create a rich, 2D conceptual map for exploration.

AXIS CRITERIA:
1. ORTHOGONALITY: The two axes must be independent. If you choose 'Price,' do not choose 'Luxury' as the second axis, as they are too correlated.
2. BREADTH: The labels should allow for a wide variety of items, from the mundane to the extraordinary.
3. THE 'AHA' POTENTIAL: Choose dimensions that force the user to think about the subject in a non-obvious way. Avoid generic 'Good/Bad' scales.
4. TENSION: The best maps have 'logical friction' at the corners (e.g., something that is both 'Ancient' and 'High-Tech').

SUBJECT: ${subject}

INSTRUCTIONS:
${xAxisInstructions}
${yAxisInstructions}

EXAMPLES OF SEMANTIC OPPOSITES:
- "Open source" ↔ "Proprietary" or "Closed source"
- "Ancient" ↔ "Modern" or "Contemporary"
- "Minimalist" ↔ "Feature-rich" or "Maximalist"
- "Privacy-focused" ↔ "Data-driven" or "Surveillance-heavy"
- "Lightweight" ↔ "Heavy" or "Resource-intensive"

The opposite must create meaningful contrast and be contextually appropriate to the subject.

IMPORTANT: Return ONLY valid JSON, no markdown, no code blocks, no extra text.

Return this exact JSON structure:
{
  "xAxis": { "minLabel": "...", "maxLabel": "..." },
  "yAxis": { "minLabel": "...", "maxLabel": "..." }
}`;
}

export function buildManifestationPrompt(
  subject: string,
  xAxis: Axis,
  yAxis: Axis,
  x: number,
  y: number,
  existingManifestations: string[]
): string {
  const existingList = existingManifestations.length > 0
    ? existingManifestations.map(name => `"${name}"`).join(', ')
    : 'None';

  return `You are the Perspective Architect for 'Curio Space.'

MAP LOGIC:
You are mapping a Subject onto a 2D Cartesian plane.
- The X-Axis represents a spectrum between [${xAxis.minLabel}] and [${xAxis.maxLabel}].
- The Y-Axis represents a spectrum between [${yAxis.minLabel}] and [${yAxis.maxLabel}].
- Coordinates range from -100 to 100.
  - (-100, -100) is the absolute extreme of BOTH [${xAxis.minLabel}] and [${yAxis.minLabel}].
  - (100, 100) is the absolute extreme of BOTH [${xAxis.maxLabel}] and [${yAxis.maxLabel}].
  - (0, 0) is the 'Neutral Origin' or the perfect balance of all four traits.

YOUR MISSION:
Identify a well-known, iconic example of "${subject}" that perfectly occupies the specific (${x}, ${y}) point.

THE 'AHA' REQUIREMENT:
The goal is to surprise the user with a non-obvious, lateral-thinking connection.
- Do not be literal. If the point is (100, 100), identify the 'extreme spiritual successor' or a cultural archetype that embodies those combined traits in an unexpected way.

STRICT CONSTRAINTS:
1. SUBJECT RELEVANCE: The entity MUST be a specific instance or example of the Subject domain. For 'City Transportation Systems,' choose actual transportation systems, vehicles, or services (buses, trains, bike-sharing, etc.)—not characters, companies, or tangential concepts. The entity should be something you would genuinely find or use within that subject category.
2. LABEL FIDELITY: You must treat the numerical value as a 'strength' indicator. A -100 is the most pure version of that label; a -10 is a subtle hint of it.
3. REAL EXAMPLES: Use only well-known real-world examples, famous historical instances, or widely recognized examples from the subject domain.
4. NO DUPLICATES: Check the 'Existing Map' list and never repeat an item.
5. BOUNDARY PARADOX: If a coordinate represents a logical impossibility (e.g., a 'Silent/Explosive' item), explain why reality cannot occupy that space rather than forcing a result.

CONTEXT:
- Subject: "${subject}"
- X-Axis: "${xAxis.minLabel}" to "${xAxis.maxLabel}"
- Y-Axis: "${yAxis.minLabel}" to "${yAxis.maxLabel}"
- Target Click: [${x}, ${y}]
- Existing Map: [${existingList}]

LINKS: In your description and reasoning, include relevant Wikipedia or informational links using markdown format: [link text](url). For example: "The [Tokyo Metro](https://en.wikipedia.org/wiki/Tokyo_Metro) is known for..."

IMPORTANT: Return ONLY valid JSON, no markdown, no code blocks, no extra text.

If the coordinate is POSSIBLE, return:
{
  "name": "...",
  "description": "... with [markdown links](url) ...",
  "reasoning": "... with [markdown links](url) ..."
}

If the coordinate is IMPOSSIBLE (boundary paradox), return:
{
  "isImpossible": true,
  "explanation": "This coordinate represents a logical impossibility because..."
}`;
}

export function buildSubjectFromItemsPrompt(items: string[]): string {
  const itemsList = items.map(item => `"${item}"`).join(', ');

  return `You are the Category Analyst for 'Curio Space.'

MISSION:
Given 3 specific items, identify the most fitting subject category that encompasses all of them.

YOUR TASK:
Analyze these 3 items: [${itemsList}]

Find the common thread - what category, domain, or conceptual space do these all belong to?

THE 'AHA' REQUIREMENT:
The goal is to surprise and delight with a non-obvious connection. Don't just pick the most literal category.
- If given ["Bicycle", "Subway", "Rickshaw"], don't settle for "Transportation" - find "Urban Transportation Methods"
- If given ["Katana", "Excalibur", "Lightsaber"], don't say "Weapons" - discover "Legendary Swords Across History and Fiction"
- Look for the SPECIFIC, EVOCATIVE category that makes someone say "Oh! I never thought of grouping these that way!"

CRITERIA FOR A GOOD SUBJECT:
1. SPECIFICITY: The subject should be specific enough to be meaningful (not just "Things" or "Objects")
2. INCLUSIVITY: All 3 items must belong to this category, even in a creative way (e.g. Bad Bunny the rapper is a bunny of some sort)
3. DIMENSIONALITY: The subject should allow for interesting 2D mapping with diverse examples
4. CREATIVE DEPTH: Choose subjects that feel like a 'world' to explore
5. LATERAL THINKING: Find the surprising angle, not the obvious one

EXAMPLES OF GOOD TRANSFORMATIONS:
- ["Bicycle", "Subway", "Rickshaw"] → "Urban Transportation Methods"
- ["Katana", "Excalibur", "Lightsaber"] → "Legendary Swords" (not just "Weapons")
- ["Espresso", "Cold Brew", "Turkish Coffee"] → "Coffee Preparation Methods" (not just "Beverages")
- ["Piano", "Theremin", "DJ Controller"] → "Musical Instruments" (not just "Instruments")
- ["Stonehenge", "Pyramids", "Nazca lines"] → "Monumental Objects with Mythical Origins" (not just "Ancient Architecture")

CONSTRAINTS:
- The subject should have room for at least 10-20 other well-known examples
- Avoid overly narrow subjects (e.g., "Red Bicycles" when "Bicycles" fits)
- Prioritize EVOCATIVE over SCIENTIFIC - "Mythical Origins" beats "Chronological Taxonomy"
- MOST IMPORTANT: Find the angle that creates the 'aha moment'

IMPORTANT: Return ONLY valid JSON, no markdown, no code blocks, no extra text.

Return this exact JSON structure:
{
  "subject": "...",
  "reasoning": "Brief explanation of why this subject fits all 3 items and what makes it interesting"
}`;
}

export function buildItemPlacementPrompt(
  subject: string,
  xAxis: Axis,
  yAxis: Axis,
  itemName: string,
  existingManifestations: string[]
): string {
  const existingList = existingManifestations.length > 0
    ? existingManifestations.map(name => `"${name}"`).join(', ')
    : 'None';

  return `You are the Coordinate Analyst for 'Curio Space.'

MAP LOGIC:
You are analyzing where a specific item should be placed on a 2D Cartesian plane.
- The X-Axis represents a spectrum between [${xAxis.minLabel}] and [${xAxis.maxLabel}].
- The Y-Axis represents a spectrum between [${yAxis.minLabel}] and [${yAxis.maxLabel}].
- Coordinates range from -100 to 100.
  - (-100, -100) is the absolute extreme of BOTH [${xAxis.minLabel}] and [${yAxis.minLabel}].
  - (100, 100) is the absolute extreme of BOTH [${xAxis.maxLabel}] and [${yAxis.maxLabel}].
  - (0, 0) is the 'Neutral Origin' or the perfect balance of all four traits.

YOUR MISSION:
Determine the precise coordinates where "${itemName}" should be placed on this map.

ANALYSIS STEPS:
1. SUBJECT FIT: First, verify that "${itemName}" is actually a valid example of "${subject}". If it's not a real instance or example from this domain, you cannot place it.
2. COORDINATE ANALYSIS: Analyze where this item falls on each axis based on its actual characteristics.
3. JUSTIFICATION: Explain why these coordinates make sense.

STRICT CONSTRAINTS:
1. SUBJECT RELEVANCE: The item MUST be a specific instance or example of the Subject domain. If "${itemName}" is not genuinely part of "${subject}", return cannotPlace.
2. LABEL FIDELITY: Treat the numerical value as a 'strength' indicator. A -100 is the most pure version of that label; a -10 is a subtle hint of it.
3. REAL EXAMPLES ONLY: The item must be a real, well-known example from the subject domain.
4. NO DUPLICATES: Check the 'Existing Map' list. If "${itemName}" is already placed, return cannotPlace.
5. PRECISION: Choose exact coordinates that best represent the item's position on both axes.

CONTEXT:
- Subject: "${subject}"
- X-Axis: "${xAxis.minLabel}" to "${xAxis.maxLabel}"
- Y-Axis: "${yAxis.minLabel}" to "${yAxis.maxLabel}"
- Item to Place: "${itemName}"
- Existing Map: [${existingList}]

LINKS: In your description and reasoning, include relevant Wikipedia or informational links using markdown format: [link text](url).

IMPORTANT: Return ONLY valid JSON, no markdown, no code blocks, no extra text.

If the item CAN be placed, return:
{
  "x": <number between -100 and 100>,
  "y": <number between -100 and 100>,
  "description": "... with [markdown links](url) ...",
  "reasoning": "... with [markdown links](url) ..."
}

If the item CANNOT be placed (not relevant to subject, duplicate, or doesn't fit), return:
{
  "cannotPlace": true,
  "explanation": "Explain why this item cannot be placed on this map..."
}`;
}
