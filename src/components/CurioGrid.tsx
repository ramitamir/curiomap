'use client';

import { useRef, useEffect, useState } from 'react';
import { Axis, Manifestation } from '@/lib/types';
import { useTheme } from '@/contexts/ThemeContext';

interface CurioGridProps {
  xAxis: Axis;
  yAxis: Axis;
  manifestations: Manifestation[];
  onCoordinateClick: (x: number, y: number) => void;
  onAxisUpdate: (axis: 'x' | 'y', updates: Partial<Axis>) => void;
  onLabelClick?: (axis: 'x' | 'y', side: 'min' | 'max') => void;
  selectedPointId?: string;
  onPointSelect: (point: Manifestation | null) => void;
  isMobile?: boolean;
}

export default function CurioGrid({
  xAxis,
  yAxis,
  manifestations,
  onCoordinateClick,
  onLabelClick,
  selectedPointId,
  onPointSelect,
  isMobile = false,
}: CurioGridProps) {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [hoveredPoint, setHoveredPoint] = useState<Manifestation | null>(null);
  const [cursorInGrid, setCursorInGrid] = useState(false);

  const PADDING = 80; // Less padding for fuller screen use

  // Responsive canvas sizing - use full viewport
  useEffect(() => {
    const updateSize = () => {
      // Account for header (60px) and make it fill the rest
      const width = window.innerWidth;
      const height = window.innerHeight - 60; // Subtract header height
      const size = Math.min(width, height);
      setCanvasSize({ width: size, height: size });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const gridSize = canvasSize.width - PADDING * 2;

  const gridToCanvas = (x: number, y: number) => {
    const canvasX = PADDING + ((x + 100) / 200) * gridSize;
    const canvasY = PADDING + ((100 - y) / 200) * gridSize;
    return { x: canvasX, y: canvasY };
  };

  const canvasToGrid = (canvasX: number, canvasY: number) => {
    const x = Math.round(((canvasX - PADDING) / gridSize) * 200 - 100);
    const y = Math.round(100 - ((canvasY - PADDING) / gridSize) * 200);
    return {
      x: Math.max(-100, Math.min(100, x)),
      y: Math.max(-100, Math.min(100, y)),
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvasSize.width) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Theme colors
    const bgColor = theme === 'modern' ? '#F7F3F2' : '#0a0e0a';
    const primaryColor = theme === 'modern' ? '#2C2C2C' : '#00ff41';
    const dimColor = theme === 'modern' ? '#4A4A4A' : '#00aa2e';
    const fadedColor = theme === 'modern' ? '#666666' : '#004411';

    // Clear with background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    const green = primaryColor;
    const dimGreen = dimColor;
    const fadedGreen = fadedColor;

    // Draw axes (faded)
    ctx.strokeStyle = fadedGreen;
    ctx.lineWidth = 1;

    // X-axis
    ctx.beginPath();
    ctx.moveTo(PADDING, canvasSize.height / 2);
    ctx.lineTo(canvasSize.width - PADDING, canvasSize.height / 2);
    ctx.stroke();

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(canvasSize.width / 2, PADDING);
    ctx.lineTo(canvasSize.width / 2, canvasSize.height - PADDING);
    ctx.stroke();

    // Draw corner markers for extremes (L-shaped brackets)
    ctx.strokeStyle = dimGreen;
    ctx.lineWidth = 2;
    const cornerSize = 10;

    // Top-left corner: (-100, 100)
    const topLeft = gridToCanvas(-100, 100);
    ctx.beginPath();
    ctx.moveTo(topLeft.x + cornerSize, topLeft.y);
    ctx.lineTo(topLeft.x, topLeft.y);
    ctx.lineTo(topLeft.x, topLeft.y + cornerSize);
    ctx.stroke();

    // Top-right corner: (100, 100)
    const topRight = gridToCanvas(100, 100);
    ctx.beginPath();
    ctx.moveTo(topRight.x - cornerSize, topRight.y);
    ctx.lineTo(topRight.x, topRight.y);
    ctx.lineTo(topRight.x, topRight.y + cornerSize);
    ctx.stroke();

    // Bottom-left corner: (-100, -100)
    const bottomLeft = gridToCanvas(-100, -100);
    ctx.beginPath();
    ctx.moveTo(bottomLeft.x + cornerSize, bottomLeft.y);
    ctx.lineTo(bottomLeft.x, bottomLeft.y);
    ctx.lineTo(bottomLeft.x, bottomLeft.y - cornerSize);
    ctx.stroke();

    // Bottom-right corner: (100, -100)
    const bottomRight = gridToCanvas(100, -100);
    ctx.beginPath();
    ctx.moveTo(bottomRight.x - cornerSize, bottomRight.y);
    ctx.lineTo(bottomRight.x, bottomRight.y);
    ctx.lineTo(bottomRight.x, bottomRight.y - cornerSize);
    ctx.stroke();

    // Skip drawing axis labels on canvas - they'll be HTML overlays instead

    // Draw manifestation points
    manifestations.forEach((m) => {
      const pos = gridToCanvas(m.x, m.y);
      const isSelected = selectedPointId === m.id;
      const isHovered = hoveredPoint?.id === m.id;

      // Check if impossible coordinate
      if (m.isImpossible) {
        // Draw X mark instead of circle
        ctx.strokeStyle = green;
        ctx.lineWidth = 2;
        const size = isSelected ? 10 : 6;

        // Draw X
        ctx.beginPath();
        ctx.moveTo(pos.x - size, pos.y - size);
        ctx.lineTo(pos.x + size, pos.y + size);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(pos.x + size, pos.y - size);
        ctx.lineTo(pos.x - size, pos.y + size);
        ctx.stroke();

        // Glow effect for selection
        if (isSelected || isHovered) {
          ctx.strokeStyle = theme === 'modern'
            ? 'rgba(44, 44, 44, 0.4)'
            : 'rgba(0, 255, 65, 0.5)';
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        // Show "IMPOSSIBLE" text only on hover
        if (isHovered && !isSelected) {
          ctx.font = '12px "Courier New", monospace';
          ctx.fillStyle = green;
          ctx.textAlign = 'center';
          ctx.fillText('IMPOSSIBLE', pos.x, pos.y - 15);
        }
      } else {
        // Draw normal circle point
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, isSelected ? 8 : 5, 0, Math.PI * 2);
        ctx.fillStyle = green;
        ctx.fill();

        // Glow effect
        if (isSelected || isHovered) {
          ctx.strokeStyle = theme === 'modern'
            ? 'rgba(44, 44, 44, 0.4)'
            : 'rgba(0, 255, 65, 0.5)';
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        // Show name only on hover
        if (isHovered && !isSelected) {
          ctx.font = '12px "Courier New", monospace';
          ctx.fillStyle = green;
          ctx.textAlign = 'center';
          ctx.fillText(m.name, pos.x, pos.y - 15);
        }
      }
    });
  }, [xAxis, yAxis, manifestations, hoveredPoint, selectedPointId, canvasSize, theme]);

  function wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) {
    const words = text.split(' ');
    let line = '';
    let lineY = y;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line, x, lineY);
        line = words[i] + ' ';
        lineY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, lineY);
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;

    // Check if click is within the grid boundaries
    if (canvasX < PADDING || canvasX > canvasSize.width - PADDING ||
        canvasY < PADDING || canvasY > canvasSize.height - PADDING) {
      return; // Ignore clicks outside the grid area
    }

    // Check if clicking on existing point
    const clickedPoint = manifestations.find((m) => {
      const pos = gridToCanvas(m.x, m.y);
      const distance = Math.sqrt(Math.pow(pos.x - canvasX, 2) + Math.pow(pos.y - canvasY, 2));
      return distance < 10;
    });

    if (clickedPoint) {
      onPointSelect(selectedPointId === clickedPoint.id ? null : clickedPoint);
    } else {
      const coords = canvasToGrid(canvasX, canvasY);
      onPointSelect(null);
      onCoordinateClick(coords.x, coords.y);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;

    // Check if cursor is within grid boundaries
    const inBounds = canvasX >= PADDING && canvasX <= canvasSize.width - PADDING &&
                     canvasY >= PADDING && canvasY <= canvasSize.height - PADDING;
    setCursorInGrid(inBounds);

    const hovered = manifestations.find((m) => {
      const pos = gridToCanvas(m.x, m.y);
      const distance = Math.sqrt(Math.pow(pos.x - canvasX, 2) + Math.pow(pos.y - canvasY, 2));
      return distance < 10;
    });

    setHoveredPoint(hovered || null);
  };

  if (!canvasSize.width) return null;

  const canvasCenter = { x: canvasSize.width / 2, y: canvasSize.height / 2 };

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={() => {
            setHoveredPoint(null);
            setCursorInGrid(false);
          }}
          className={cursorInGrid ? "cursor-crosshair" : "cursor-default"}
        />

        {/* HTML axis labels overlaid on canvas */}
        {canvasSize.width > 0 && (
          <>
            {/* X-axis min label (left) - rotated 90° counterclockwise */}
            <div
              className={`absolute text-sm cursor-text hover:opacity-70 pointer-events-auto ${
                theme === 'modern' ? 'text-[#2C2C2C]' : 'text-green-500'
              }`}
              style={{
                left: `${PADDING / 2}px`,
                top: '50%',
                fontFamily: '"Courier New", monospace',
                transform: 'translate(-50%, -50%) rotate(-90deg)',
                whiteSpace: 'nowrap',
              }}
              onClick={() => onLabelClick?.('x', 'min')}
            >
              {xAxis.minLabel}{isMobile && ' [✎]'}
            </div>

            {/* X-axis max label (right) - rotated 90° clockwise */}
            <div
              className={`absolute text-sm cursor-text hover:opacity-70 pointer-events-auto ${
                theme === 'modern' ? 'text-[#2C2C2C]' : 'text-green-500'
              }`}
              style={{
                right: `${PADDING / 2}px`,
                top: '50%',
                fontFamily: '"Courier New", monospace',
                transform: 'translate(50%, -50%) rotate(90deg)',
                whiteSpace: 'nowrap',
              }}
              onClick={() => onLabelClick?.('x', 'max')}
            >
              {xAxis.maxLabel}{isMobile && ' [✎]'}
            </div>

            {/* Y-axis max label (top) */}
            <div
              className={`absolute text-sm cursor-text hover:opacity-70 text-center pointer-events-auto ${
                theme === 'modern' ? 'text-[#2C2C2C]' : 'text-green-500'
              }`}
              style={{
                left: '50%',
                transform: 'translateX(-50%)',
                top: `${PADDING - 35}px`,
                fontFamily: '"Courier New", monospace',
                maxWidth: '200px',
              }}
              onClick={() => onLabelClick?.('y', 'max')}
            >
              {yAxis.maxLabel}{isMobile && ' [✎]'}
            </div>

            {/* Y-axis min label (bottom) */}
            <div
              className={`absolute text-sm cursor-text hover:opacity-70 text-center pointer-events-auto ${
                theme === 'modern' ? 'text-[#2C2C2C]' : 'text-green-500'
              }`}
              style={{
                left: '50%',
                transform: 'translateX(-50%)',
                bottom: `${PADDING - 70}px`,
                fontFamily: '"Courier New", monospace',
                maxWidth: '200px',
              }}
              onClick={() => onLabelClick?.('y', 'min')}
            >
              {yAxis.minLabel}{isMobile && ' [✎]'}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
