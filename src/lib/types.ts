// Core data models for Curio Space

export interface Axis {
  minLabel: string;          // "Simple Black Coffee"
  maxLabel: string;          // "12-layer Ceremonial Latte"
  // Note: All axes always range from -100 to +100 (like percentages)
}

export interface Manifestation {
  id: string;                // UUID
  x: number;                 // Snapped to 0.5 increments
  y: number;
  name: string;
  description: string;
  reasoning: string;         // Why the AI placed it at these coordinates
  imageUrl: string;          // DALL-E generated image URL
  timestamp: string;
  isHallucination: boolean;
  isImpossible?: boolean;    // Boundary paradox flag
  impossibleExplanation?: string;  // Why this coordinate is impossible
}

export interface CurioSpace {
  id: string;
  version: string;           // File format version
  subject: string;
  xAxis: Axis;
  yAxis: Axis;
  manifestations: Manifestation[];
  createdAt: string;
  lastModified: string;
}

export interface AppState {
  currentSpace: CurioSpace | null;
  isGenerating: boolean;
  selectedCoordinate: { x: number; y: number } | null;
  error: string | null;
}
