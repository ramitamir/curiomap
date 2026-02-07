'use client';

import { Manifestation } from '@/lib/types';
import Image from 'next/image';

interface ManifestationPanelProps {
  manifestations: Manifestation[];
  isGenerating: boolean;
}

export default function ManifestationPanel({
  manifestations,
  isGenerating,
}: ManifestationPanelProps) {
  if (manifestations.length === 0 && !isGenerating) {
    return (
      <div className="border-2 border-black p-8 bg-white">
        <p className="font-mono text-sm text-gray-500 text-center">
          Click anywhere on the grid to manifest an item
        </p>
      </div>
    );
  }

  return (
    <div className="border-2 border-black bg-white max-h-[800px] overflow-y-auto">
      {isGenerating && (
        <div className="p-8 border-b-2 border-black">
          <p className="font-mono text-sm animate-pulse">Manifesting item...</p>
        </div>
      )}

      {manifestations
        .slice()
        .reverse()
        .map((m) => (
          <div key={m.id} className="p-6 border-b-2 border-black last:border-b-0">
            <div className="flex gap-4">
              {/* Image */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 border-2 border-black overflow-hidden bg-gray-100">
                  <img
                    src={m.imageUrl}
                    alt={m.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-mono font-bold text-lg">
                    {m.name}
                    {m.isHallucination && (
                      <span className="ml-2 text-xs text-red-600">[SPECULATIVE]</span>
                    )}
                  </h3>
                  <div className="flex-shrink-0 font-mono text-xs text-gray-600">
                    ({m.x}, {m.y})
                  </div>
                </div>

                <p className="font-mono text-sm mb-3 leading-relaxed">
                  {m.description}
                </p>

                <details className="group">
                  <summary className="font-mono text-xs text-gray-600 cursor-pointer hover:text-black list-none">
                    <span className="group-open:hidden">▸ Show reasoning</span>
                    <span className="hidden group-open:inline">▾ Hide reasoning</span>
                  </summary>
                  <p className="font-mono text-xs text-gray-700 mt-2 pl-4 border-l-2 border-gray-300">
                    {m.reasoning}
                  </p>
                </details>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}
