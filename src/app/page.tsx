'use client';

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import CurioGrid from '@/components/CurioGrid';
import { Axis, Manifestation } from '@/lib/types';
import { renderTextWithLinks } from '@/lib/markdown';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useTheme } from '@/contexts/ThemeContext';
import ThemeToggleButton from '@/components/ThemeToggleButton';
import MobilePage from './mobile-page';

export default function Home() {
  const isMobile = useIsMobile();

  // If mobile, render mobile version
  if (isMobile) {
    return <MobilePage />;
  }

  // Otherwise render desktop version
  return <DesktopPage />;
}

function DesktopPage() {
  const { theme } = useTheme();
  const [subject, setSubject] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [xAxis, setXAxis] = useState<Axis | null>(null);
  const [yAxis, setYAxis] = useState<Axis | null>(null);
  const [manifestations, setManifestations] = useState<Manifestation[]>([]);
  const [isGeneratingAxes, setIsGeneratingAxes] = useState(false);
  const [isGeneratingItem, setIsGeneratingItem] = useState(false);
  const [isGeneratingSubject, setIsGeneratingSubject] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bootupComplete, setBootupComplete] = useState(false);
  const [bootupText, setBootupText] = useState('');
  const [hasAxisEdits, setHasAxisEdits] = useState(false);
  const [editingAxis, setEditingAxis] = useState<{ axis: 'x' | 'y'; side: 'min' | 'max' } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [originalEditValue, setOriginalEditValue] = useState('');
  const [editedLabels, setEditedLabels] = useState<{
    xAxis?: { minLabel?: string; maxLabel?: string };
    yAxis?: { minLabel?: string; maxLabel?: string };
  }>({});
  const [selectedPoint, setSelectedPoint] = useState<Manifestation | null>(null);
  const [isPlacingItem, setIsPlacingItem] = useState(false);
  const [placementInput, setPlacementInput] = useState('');
  const [inputMode, setInputMode] = useState<'subject' | 'items'>('subject');
  const [itemSeeds, setItemSeeds] = useState<string[]>(['', '', '']);
  const [subjectGeneratedFrom, setSubjectGeneratedFrom] = useState<string[] | null>(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showAxisTip, setShowAxisTip] = useState(false);

  // Terminal bootup sequence
  useEffect(() => {
    const messages = [
      'INITIALIZING CURIO.SPACE...',
      'LOADING NEURAL CARTOGRAPHY SYSTEM...',
      'ESTABLISHING GEMINI UPLINK...',
      'CONNECTED.',
    ];

    let messageIndex = 0;
    let charIndex = 0;
    let fullText = '';

    const typeInterval = setInterval(() => {
      if (messageIndex < messages.length) {
        if (charIndex < messages[messageIndex].length) {
          fullText += messages[messageIndex][charIndex];
          setBootupText(fullText);
          charIndex++;
        } else {
          // Move to next message
          fullText += '\n';
          setBootupText(fullText);
          messageIndex++;
          charIndex = 0;
        }
      } else {
        clearInterval(typeInterval);
        setTimeout(() => setBootupComplete(true), 500);
      }
    }, 30);

    return () => clearInterval(typeInterval);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMoreMenu) {
        const target = event.target as HTMLElement;
        if (!target.closest('[data-more-menu]')) {
          setShowMoreMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMoreMenu]);

  // Show axis tip on first map load
  useEffect(() => {
    if (xAxis && yAxis && !isGeneratingAxes) {
      const hasSeenTip = localStorage.getItem('hasSeenAxisTip');
      if (!hasSeenTip) {
        setShowAxisTip(true);
        // Auto-dismiss after 5 seconds
        const timer = setTimeout(() => {
          setShowAxisTip(false);
          localStorage.setItem('hasSeenAxisTip', 'true');
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [xAxis, yAxis, isGeneratingAxes]);

  const handleGenerateAxes = async (subjectText: string, providedXAxis?: Partial<Axis>, providedYAxis?: Partial<Axis>) => {
    // Clear old data immediately
    setManifestations([]);
    setSelectedPoint(null);
    setHasAxisEdits(false);
    setError(null);

    setIsGeneratingAxes(true);

    try {
      const response = await fetch('/api/generate-axes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subjectText,
          xAxis: providedXAxis || {},
          yAxis: providedYAxis || {},
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate axes');
      }

      const data = await response.json();
      setXAxis(data.xAxis);
      setYAxis(data.yAxis);
      setSubject(subjectText);
      setEditedLabels({}); // Clear edited labels after successful generation
    } catch (err) {
      setError('>> ERROR: AXIS GENERATION FAILED. RETRY?');
      console.error(err);
    } finally {
      setIsGeneratingAxes(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      handleGenerateAxes(inputValue.trim());
    }
  };

  const handleGenerateSubject = async () => {
    setIsGeneratingSubject(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-subject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to generate subject');
      }

      const data = await response.json();

      // Set the input value and auto-submit
      setInputValue(data.subject);
      handleGenerateAxes(data.subject);
    } catch (err) {
      console.error('Subject generation error:', err);
      setError('>> ERROR: SUBJECT GENERATION FAILED. RETRY?');
    } finally {
      setIsGeneratingSubject(false);
    }
  };

  const handleGenerateSubjectFromItems = async () => {
    const validItems = itemSeeds.map(item => item.trim()).filter(item => item.length > 0);

    if (validItems.length !== 3) {
      setError('>> ERROR: PLEASE ENTER ALL 3 ITEMS');
      return;
    }

    setIsGeneratingAxes(true);
    setError(null);
    setManifestations([]);
    setSelectedPoint(null);
    setHasAxisEdits(false);

    try {
      // Step 1: Generate subject from items
      const subjectResponse = await fetch('/api/generate-subject-from-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: validItems }),
      });

      if (!subjectResponse.ok) {
        throw new Error('Failed to generate subject from items');
      }

      const subjectData = await subjectResponse.json();
      const generatedSubject = subjectData.subject;

      // Store the seed items for reference
      setSubjectGeneratedFrom(validItems);

      // Step 2: Generate axes for this subject
      const axesResponse = await fetch('/api/generate-axes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: generatedSubject,
          xAxis: {},
          yAxis: {},
        }),
      });

      if (!axesResponse.ok) {
        throw new Error('Failed to generate axes');
      }

      const axesData = await axesResponse.json();
      const generatedXAxis = axesData.xAxis;
      const generatedYAxis = axesData.yAxis;

      // Update state with subject and axes
      setSubject(generatedSubject);
      setXAxis(generatedXAxis);
      setYAxis(generatedYAxis);

      // Step 3: Auto-place the 3 seed items on the map
      const newManifestations: Manifestation[] = [];

      console.log('Auto-placing items:', validItems);

      for (const itemName of validItems) {
        try {
          const existingNames = newManifestations.map(m => m.name);
          console.log(`Placing "${itemName}", existing:`, existingNames);
          const placeResponse = await fetch('/api/place-item', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subject: generatedSubject,
              xAxis: generatedXAxis,
              yAxis: generatedYAxis,
              itemName,
              existingManifestations: existingNames,
            }),
          });

          if (placeResponse.ok) {
            const placeData = await placeResponse.json();
            if (!placeData.cannotPlace) {
              const newManifestation: Manifestation = {
                id: uuidv4(),
                x: placeData.x,
                y: placeData.y,
                name: placeData.name || itemName, // Use returned name, fallback to input
                description: placeData.description,
                reasoning: placeData.reasoning,
                imageUrl: '',
                timestamp: new Date().toISOString(),
                isHallucination: false,
              };
              newManifestations.push(newManifestation);
            } else {
              // Log when item cannot be placed
              console.warn(`Cannot place "${itemName}": ${placeData.explanation || placeData.description}`);
            }
          }
        } catch (itemErr) {
          console.error(`Failed to place item ${itemName}:`, itemErr);
        }
      }

      // Update manifestations all at once
      setManifestations(newManifestations);

    } catch (err) {
      console.error('Subject generation error:', err);
      setError('>> ERROR: SUBJECT GENERATION FAILED. RETRY?');
    } finally {
      setIsGeneratingAxes(false);
    }
  };

  const handleCoordinateClick = async (x: number, y: number) => {
    if (!xAxis || !yAxis || isGeneratingItem || hasAxisEdits) return;

    setIsGeneratingItem(true);
    setError(null);

    try {
      const existingNames = manifestations.map(m => m.name);
      const response = await fetch('/api/manifest-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          xAxis,
          yAxis,
          x,
          y,
          existingManifestations: existingNames,
        }),
      });

      if (response.status === 429) {
        setError('>> ERROR: RATE LIMIT. WAIT 60 SECONDS BEFORE NEXT MANIFESTATION.');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        setError(`>> ERROR: ${errorData.error || 'MANIFESTATION FAILED'}`);
        return;
      }

      const data = await response.json();

      const newManifestation: Manifestation = {
        id: uuidv4(),
        x,
        y,
        name: data.name,
        description: data.description,
        reasoning: data.reasoning,
        imageUrl: data.imageUrl,
        timestamp: new Date().toISOString(),
        isHallucination: data.isHallucination,
        isImpossible: data.isImpossible || false,
        impossibleExplanation: data.impossibleExplanation,
      };

      setManifestations((prev) => {
        const filtered = prev.filter((m) => !(m.x === x && m.y === y));
        return [...filtered, newManifestation];
      });

      // Auto-select the newly generated manifestation
      setSelectedPoint(newManifestation);
    } catch (err: any) {
      console.error('Manifestation error:', err);
      setError('>> ERROR: NETWORK FAILURE. CHECK CONNECTION.');
    } finally {
      setIsGeneratingItem(false);
    }
  };

  const handleAxisUpdate = (axis: 'x' | 'y', updates: Partial<Axis>) => {
    if (axis === 'x' && xAxis) {
      setXAxis({ ...xAxis, ...updates });
      setHasAxisEdits(true);
      setManifestations([]); // Clear items - they were placed with old axes
      setSelectedPoint(null);
    } else if (axis === 'y' && yAxis) {
      setYAxis({ ...yAxis, ...updates });
      setHasAxisEdits(true);
      setManifestations([]); // Clear items - they were placed with old axes
      setSelectedPoint(null);
    }
  };

  const handleReset = () => {
    setSubject('');
    setInputValue('');
    setXAxis(null);
    setYAxis(null);
    setManifestations([]);
    setError(null);
    setHasAxisEdits(false);
    setSelectedPoint(null);
    setIsPlacingItem(false);
    setPlacementInput('');
    setInputMode('subject');
    setItemSeeds(['', '', '']);
    setSubjectGeneratedFrom(null);
    setShowMoreMenu(false);
    setEditedLabels({});
  };

  const handleRegenerate = () => {
    if (!xAxis || !yAxis) return;
    // Only pass the edited labels, not the full axis objects
    handleGenerateAxes(subject, editedLabels.xAxis || {}, editedLabels.yAxis || {});
    setEditedLabels({}); // Clear after regeneration
  };

  const startEditingAxis = (axis: 'x' | 'y', side: 'min' | 'max') => {
    const currentValue = axis === 'x'
      ? (side === 'min' ? xAxis?.minLabel : xAxis?.maxLabel)
      : (side === 'min' ? yAxis?.minLabel : yAxis?.maxLabel);
    setEditValue(currentValue || '');
    setOriginalEditValue(currentValue || '');
    setEditingAxis({ axis, side });
  };

  const saveAxisEdit = () => {
    if (!editingAxis || !editValue.trim()) {
      setEditingAxis(null);
      return;
    }

    const trimmedValue = editValue.trim();

    // Only update if value actually changed
    if (trimmedValue !== originalEditValue) {
      const updates = editingAxis.side === 'min'
        ? { minLabel: trimmedValue }
        : { maxLabel: trimmedValue };

      handleAxisUpdate(editingAxis.axis, updates);

      // Track which specific label was edited
      setEditedLabels(prev => ({
        ...prev,
        [editingAxis.axis === 'x' ? 'xAxis' : 'yAxis']: {
          ...prev[editingAxis.axis === 'x' ? 'xAxis' : 'yAxis'],
          [editingAxis.side === 'min' ? 'minLabel' : 'maxLabel']: trimmedValue
        }
      }));
    }

    setEditingAxis(null);
  };

  const handleDeleteItem = (itemId: string) => {
    setManifestations((prev) => prev.filter((m) => m.id !== itemId));
    setSelectedPoint(null);
  };

  const handleSaveToFile = () => {
    const saveData = {
      subject,
      xAxis,
      yAxis,
      manifestations,
      subjectGeneratedFrom,
      savedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `curio-${subject.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLoadFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        // Validate the data structure
        if (!data.subject || !data.xAxis || !data.yAxis || !Array.isArray(data.manifestations)) {
          throw new Error('Invalid file format');
        }

        // Restore the state
        setSubject(data.subject);
        setXAxis(data.xAxis);
        setYAxis(data.yAxis);
        setManifestations(data.manifestations);
        setSubjectGeneratedFrom(data.subjectGeneratedFrom || null);
        setSelectedPoint(null);
        setError(null);
        setHasAxisEdits(false);
      } catch (err) {
        console.error('Failed to load file:', err);
        setError('>> ERROR: INVALID FILE FORMAT');
      }
    };
    reader.readAsText(file);

    // Reset the input so the same file can be loaded again
    event.target.value = '';
  };

  const handlePlaceItem = async () => {
    if (!xAxis || !yAxis || !placementInput.trim() || isGeneratingItem) return;

    setIsPlacingItem(false);
    setIsGeneratingItem(true);
    setError(null);

    try {
      const existingNames = manifestations.map(m => m.name);
      const response = await fetch('/api/place-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          xAxis,
          yAxis,
          itemName: placementInput.trim(),
          existingManifestations: existingNames,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        setError(`>> ERROR: ${errorData.error || 'PLACEMENT FAILED'}`);
        return;
      }

      const data = await response.json();

      // Check if item cannot be placed
      if (data.cannotPlace) {
        const cannotPlaceCard: Manifestation = {
          id: uuidv4(),
          x: 0,
          y: 0,
          name: 'Cannot Place',
          description: data.description,
          reasoning: '',
          imageUrl: '',
          timestamp: new Date().toISOString(),
          isHallucination: false,
          isImpossible: true,
          impossibleExplanation: data.description,
        };
        setSelectedPoint(cannotPlaceCard);
        setPlacementInput('');
        return;
      }

      const newManifestation: Manifestation = {
        id: uuidv4(),
        x: data.x,
        y: data.y,
        name: data.name,
        description: data.description,
        reasoning: data.reasoning,
        imageUrl: '',
        timestamp: new Date().toISOString(),
        isHallucination: false,
      };

      setManifestations((prev) => {
        const filtered = prev.filter((m) => !(m.x === data.x && m.y === data.y));
        return [...filtered, newManifestation];
      });

      // Auto-select the newly placed manifestation
      setSelectedPoint(newManifestation);
      setPlacementInput('');
    } catch (err: any) {
      console.error('Placement error:', err);
      setError('>> ERROR: NETWORK FAILURE. CHECK CONNECTION.');
    } finally {
      setIsGeneratingItem(false);
    }
  };

  // Bootup screen
  if (!bootupComplete) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <pre className={`text-sm whitespace-pre-wrap glow ${
          theme === 'modern' ? 'text-[#2C2C2C]' : 'text-green-500'
        }`}>
          {bootupText}<span className="blink-cursor">█</span>
        </pre>
      </div>
    );
  }

  // Main interface
  return (
    <div className="fixed inset-0 flex flex-row">
      {/* Left: Map */}
      <div className="flex-1 relative">
        {/* Help button when map is empty - centered and large */}
        {!subject && !isGeneratingAxes && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={() => setShowHelp(true)}
              className="w-20 h-20 rounded-full border-2 border-green-700 text-green-500 hover:text-green-300 hover:border-green-500 flex items-center justify-center text-4xl glow"
              title="Help"
            >
              ?
            </button>
          </div>
        )}

        {isGeneratingAxes && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className={`text-sm animate-pulse glow ${
              theme === 'modern' ? 'text-[#2C2C2C]' : 'text-green-500'
            }`}>
              GENERATING COORDINATE SYSTEM...
            </p>
          </div>
        )}

        {xAxis && yAxis && !isGeneratingAxes && (
          <>
            <CurioGrid
              xAxis={xAxis}
              yAxis={yAxis}
              manifestations={manifestations}
              onCoordinateClick={handleCoordinateClick}
              onAxisUpdate={handleAxisUpdate}
              onLabelClick={(axis, side) => {
                if (!editingAxis) {
                  startEditingAxis(axis, side);
                }
              }}
              selectedPointId={selectedPoint?.id}
              onPointSelect={setSelectedPoint}
            />

            {/* Edit input overlay (only shown when editing) */}
            {editingAxis && (
              <div className={`absolute inset-0 bg-opacity-95 z-[60] flex items-center justify-center p-4 ${
                theme === 'modern' ? 'bg-[#F7F3F2]' : 'bg-black'
              }`}>
                <div className="w-full max-w-md">
                  <div className={`text-xs glow mb-3 text-center leading-relaxed ${
                    theme === 'modern' ? 'text-[#2C2C2C]' : 'text-green-500'
                  }`}>
                    EDIT AXIS LABEL: Modify the label text. This label will be preserved. After saving, use [REDO BOARD] to regenerate items with your custom axes.
                  </div>
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && editValue.trim()) saveAxisEdit();
                      if (e.key === 'Escape') setEditingAxis(null);
                    }}
                    className={`w-full border px-4 py-3 text-base mb-4 ${
                      theme === 'modern'
                        ? 'bg-[#F7F3F2] border-[#666666] text-[#2C2C2C]'
                        : 'bg-black border-green-900 text-green-500'
                    }`}
                    style={{ fontFamily: '"Courier New", monospace' }}
                    autoFocus
                    placeholder="Enter label..."
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={saveAxisEdit}
                      disabled={!editValue.trim()}
                      className={`flex-1 px-4 py-3 disabled:opacity-50 glow text-sm ${
                        theme === 'modern'
                          ? 'bg-[#4A4A4A] text-[#F7F3F2] hover:bg-[#1A1A1A]'
                          : 'bg-green-900 text-green-500 hover:bg-green-800'
                      }`}
                      style={{ fontFamily: '"Courier New", monospace' }}
                    >
                      [SAVE]
                    </button>
                    <button
                      onClick={() => setEditingAxis(null)}
                      className={`flex-1 border px-4 py-3 glow text-sm ${
                        theme === 'modern'
                          ? 'bg-[#F7F3F2] border-[#666666] text-[#2C2C2C] hover:border-[#1A1A1A]'
                          : 'bg-black border-green-900 text-green-500 hover:border-green-700'
                      }`}
                      style={{ fontFamily: '"Courier New", monospace' }}
                    >
                      [CANCEL]
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Place item input overlay */}
            {isPlacingItem && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="pointer-events-auto flex flex-col items-center">
                  <div className="text-green-500 text-sm glow mb-2">
                    ENTER ITEM TO PLACE:
                  </div>
                  <input
                    type="text"
                    value={placementInput}
                    onChange={(e) => setPlacementInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && placementInput.trim()) handlePlaceItem();
                      if (e.key === 'Escape') {
                        setIsPlacingItem(false);
                        setPlacementInput('');
                      }
                    }}
                    className={`border-2 px-4 py-2 text-base mb-2 ${
                      theme === 'modern'
                        ? 'bg-[#F7F3F2] border-[#666666] text-[#2C2C2C] placeholder-[#999999]'
                        : 'bg-black border-green-500 text-green-500'
                    }`}
                    style={{ fontFamily: '"Courier New", monospace', minWidth: '300px' }}
                    autoFocus
                    placeholder="e.g., Tokyo Metro..."
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handlePlaceItem}
                      disabled={!placementInput.trim()}
                      className={`px-4 py-1 disabled:opacity-50 glow text-xs ${
                        theme === 'modern'
                          ? 'bg-[#4A4A4A] text-[#F7F3F2] hover:bg-[#1A1A1A]'
                          : 'bg-green-900 text-green-500 hover:bg-green-800'
                      }`}
                      style={{ fontFamily: '"Courier New", monospace' }}
                    >
                      [PLACE]
                    </button>
                    <button
                      onClick={() => {
                        setIsPlacingItem(false);
                        setPlacementInput('');
                      }}
                      className={`border px-4 py-1 glow text-xs ${
                        theme === 'modern'
                          ? 'bg-[#F7F3F2] border-[#666666] text-[#2C2C2C] hover:border-[#1A1A1A]'
                          : 'bg-black border-green-900 text-green-500 hover:border-green-700'
                      }`}
                      style={{ fontFamily: '"Courier New", monospace' }}
                    >
                      [CANCEL]
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Axis tip banner - first time only */}
            {showAxisTip && subject && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-950 border border-green-500 p-3 z-30 animate-pulse max-w-md">
                <div className="flex items-center justify-between">
                  <p className="text-green-400 text-xs font-mono flex-1">
                    TIP: CLICK AXIS LABELS TO EDIT THEM
                  </p>
                  <button
                    onClick={() => {
                      setShowAxisTip(false);
                      localStorage.setItem('hasSeenAxisTip', 'true');
                    }}
                    className="text-green-500 hover:text-green-300 text-xs ml-4"
                  >
                    [OK]
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Right: Sidebar */}
      <div className={`w-96 border-l flex flex-col overflow-hidden ${
        theme === 'modern'
          ? 'bg-[#F7F3F2] border-[#666666]'
          : 'bg-black border-green-900'
      }`}>
        {/* Header */}
        <div className={`p-4 border-b ${
          theme === 'modern' ? 'border-[#666666]' : 'border-green-900'
        }`}>
          {!subject ? (
            <div>
              <div className={`flex items-center justify-between text-xs glow mb-3 ${
                theme === 'modern' ? 'text-[#2C2C2C]' : 'text-green-500'
              }`}>
                <span>CURIO.SPACE // NEURAL CARTOGRAPHY SYSTEM v1.0</span>
                <ThemeToggleButton />
              </div>

              {inputMode === 'subject' ? (
                // Default subject input
                <>
                  <form onSubmit={handleSubmit} className="flex items-center mb-2">
                    <span className={`mr-2 glow ${
                      theme === 'modern' ? 'text-[#2C2C2C]' : 'text-green-500'
                    }`}>&gt;</span>
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="enter subject..."
                      className={`flex-1 bg-transparent focus:outline-none border-0 focus:ring-0 ${
                        theme === 'modern'
                          ? 'text-[#2C2C2C] placeholder-[#999999]'
                          : 'text-green-500 placeholder-green-800'
                      }`}
                      disabled={isGeneratingAxes || isGeneratingSubject}
                      autoFocus
                      style={{
                        fontFamily: '"Courier New", monospace',
                        boxShadow: 'none',
                        outline: 'none'
                      }}
                    />
                  </form>
                  <div className="flex justify-end relative" data-more-menu>
                    <button
                      onClick={() => setShowMoreMenu(!showMoreMenu)}
                      className={`text-xs cursor-pointer ${
                        theme === 'modern'
                          ? 'text-[#4A4A4A] hover:text-[#2C2C2C]'
                          : 'text-green-700 hover:text-green-500'
                      }`}
                    >
                      [MORE ▼]
                    </button>

                    {/* Dropdown Menu */}
                    {showMoreMenu && (
                      <div className={`absolute top-full right-0 mt-1 border z-10 min-w-[160px] ${
                        theme === 'modern'
                          ? 'bg-[#F7F3F2] border-[#666666]'
                          : 'bg-black border-green-900'
                      }`}>
                        <button
                          onClick={() => {
                            handleGenerateSubject();
                            setShowMoreMenu(false);
                          }}
                          disabled={isGeneratingAxes || isGeneratingSubject}
                          className={`w-full text-left px-3 py-2 text-xs disabled:opacity-50 border-b ${
                            theme === 'modern'
                              ? 'text-[#2C2C2C] hover:bg-[#E8E4E3] border-[#666666]'
                              : 'text-green-500 hover:bg-green-900 border-green-900'
                          }`}
                        >
                          [SURPRISE ME]
                        </button>
                        <button
                          onClick={() => {
                            setInputMode('items');
                            setShowMoreMenu(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs border-b ${
                            theme === 'modern'
                              ? 'text-[#2C2C2C] hover:bg-[#E8E4E3] border-[#666666]'
                              : 'text-green-500 hover:bg-green-900 border-green-900'
                          }`}
                        >
                          [FROM 3 ITEMS]
                        </button>
                        <label className={`block w-full text-left px-3 py-2 text-xs cursor-pointer ${
                          theme === 'modern'
                            ? 'text-[#2C2C2C] hover:bg-[#E8E4E3]'
                            : 'text-green-500 hover:bg-green-900'
                        }`}>
                          [LOAD FROM FILE]
                          <input
                            type="file"
                            accept=".json"
                            onChange={(e) => {
                              handleLoadFromFile(e);
                              setShowMoreMenu(false);
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                // 3-items input form
                <>
                  <div className="space-y-2 mb-3">
                    {[0, 1, 2].map((index) => (
                      <div key={index} className="flex items-center">
                        <span className={`mr-2 glow text-xs ${
                          theme === 'modern' ? 'text-[#2C2C2C]' : 'text-green-500'
                        }`}>ITEM {index + 1}:</span>
                        <input
                          type="text"
                          value={itemSeeds[index]}
                          onChange={(e) => {
                            const newSeeds = [...itemSeeds];
                            newSeeds[index] = e.target.value;
                            setItemSeeds(newSeeds);
                          }}
                          placeholder={`e.g., ${
                            index === 0 ? 'Tokyo Metro' :
                            index === 1 ? 'Bicycle' :
                            'Rickshaw'
                          }...`}
                          className={`flex-1 bg-transparent focus:outline-none border-0 focus:ring-0 ${
                            theme === 'modern'
                              ? 'text-[#2C2C2C] placeholder-[#999999]'
                              : 'text-green-500 placeholder-green-800'
                          }`}
                          disabled={isGeneratingAxes}
                          autoFocus={index === 0}
                          style={{
                            fontFamily: '"Courier New", monospace',
                            boxShadow: 'none',
                            outline: 'none'
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className={`text-xs mb-3 italic ${
                    theme === 'modern' ? 'text-[#4A4A4A]' : 'text-green-700'
                  }`}>
                    AI will find the hidden thread connecting these items
                  </div>
                  <div className="flex justify-between">
                    <button
                      onClick={() => setInputMode('subject')}
                      className={`text-xs cursor-pointer ${
                        theme === 'modern'
                          ? 'text-[#4A4A4A] hover:text-[#2C2C2C]'
                          : 'text-green-700 hover:text-green-500'
                      }`}
                    >
                      [BACK]
                    </button>
                    <button
                      onClick={handleGenerateSubjectFromItems}
                      disabled={isGeneratingAxes || isGeneratingItem || itemSeeds.filter(s => s.trim()).length < 3}
                      className={`text-xs cursor-pointer disabled:opacity-50 glow disabled:cursor-not-allowed ${
                        theme === 'modern'
                          ? 'text-[#2C2C2C] hover:text-[#4A4A4A]'
                          : 'text-green-500 hover:text-green-300'
                      }`}
                    >
                      {isGeneratingAxes ? '[GENERATING...]' : '[GENERATE]'}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div>
              <div className={`flex items-center justify-between mb-2 ${
                theme === 'modern' ? 'text-[#2C2C2C]' : 'text-green-500'
              }`}>
                <div className="text-sm glow">
                  MAPPING: {subject.toUpperCase()}
                </div>
                <ThemeToggleButton />
              </div>
              {subjectGeneratedFrom && (
                <div className={`text-xs mb-2 ${
                  theme === 'modern' ? 'text-[#4A4A4A]' : 'text-green-700'
                }`}>
                  [Generated from: {subjectGeneratedFrom.join(', ')}]
                </div>
              )}
              <div className={`flex items-center gap-4 text-xs ${
                theme === 'modern' ? 'text-[#4A4A4A]' : 'text-green-700'
              }`}>
                <span>MANIFESTED: {manifestations.length}</span>
                {isGeneratingItem && <span className="animate-pulse">GENERATING...</span>}
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                <button
                  onClick={() => setIsPlacingItem(true)}
                  className={`cursor-pointer text-xs disabled:opacity-50 disabled:cursor-not-allowed ${
                    theme === 'modern'
                      ? 'text-[#2C2C2C] hover:text-[#4A4A4A]'
                      : 'text-green-500 hover:text-green-300'
                  }`}
                  disabled={isGeneratingItem || isGeneratingAxes || hasAxisEdits}
                >
                  [PLACE]
                </button>
                <button
                  onClick={() => handleGenerateAxes(subject)}
                  className={`cursor-pointer text-xs ${
                    theme === 'modern'
                      ? 'text-[#2C2C2C] hover:text-[#4A4A4A]'
                      : 'text-green-500 hover:text-green-300'
                  }`}
                  disabled={isGeneratingAxes}
                >
                  [REDO AXES]
                </button>
                <button
                  onClick={handleSaveToFile}
                  className={`cursor-pointer text-xs ${
                    theme === 'modern'
                      ? 'text-[#2C2C2C] hover:text-[#4A4A4A]'
                      : 'text-green-500 hover:text-green-300'
                  }`}
                >
                  [SAVE]
                </button>
                <button
                  onClick={handleReset}
                  className={`cursor-pointer text-xs ${
                    theme === 'modern'
                      ? 'text-[#2C2C2C] hover:text-[#4A4A4A]'
                      : 'text-green-500 hover:text-green-300'
                  }`}
                >
                  [NEW]
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-950 border-b border-red-900">
            <p className="text-red-500 text-sm font-mono">{error}</p>
          </div>
        )}

        {/* Regenerate button (appears when axes are edited) */}
        {hasAxisEdits && !isGeneratingAxes && (
          <div className="p-4 border-b border-green-900">
            <button
              onClick={handleRegenerate}
              className="w-full py-2 bg-green-900 text-green-500 hover:bg-green-800 glow font-bold animate-pulse"
              style={{ fontFamily: '"Courier New", monospace' }}
            >
              [REDO BOARD]
            </button>
          </div>
        )}

        {/* Selected point card - scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          {isGeneratingItem ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className={`text-sm glow animate-pulse mb-2 ${
                theme === 'modern' ? 'text-[#2C2C2C]' : 'text-green-500'
              }`}>
                MANIFESTING...
              </div>
              <div className={`text-xs ${
                theme === 'modern' ? 'text-[#4A4A4A]' : 'text-green-700'
              }`}>
                [CONSULTING GEMINI UPLINK]
              </div>
            </div>
          ) : selectedPoint ? (
            <div>
              <div className="mb-3">
                <h3 className={`font-bold text-lg glow mb-1 ${
                  theme === 'modern' ? 'text-[#2C2C2C]' : 'text-green-500'
                }`}>
                  {selectedPoint.name}
                  {selectedPoint.isImpossible && (
                    <span className="ml-2 text-xs text-red-500">[IMPOSSIBLE]</span>
                  )}
                </h3>
                <p className={`text-sm ${
                  theme === 'modern' ? 'text-[#4A4A4A]' : 'text-green-400'
                }`}>
                  COORDS: ({selectedPoint.x}, {selectedPoint.y})
                </p>
              </div>

              {/* Show explanation for impossible coords, description otherwise */}
              {selectedPoint.isImpossible ? (
                <p className="text-red-400 text-sm leading-relaxed">
                  {renderTextWithLinks(selectedPoint.impossibleExplanation || selectedPoint.description, theme)}
                </p>
              ) : (
                <>
                  <p className={`text-sm leading-relaxed mb-4 ${
                    theme === 'modern' ? 'text-[#2C2C2C]' : 'text-green-300'
                  }`}>
                    {renderTextWithLinks(selectedPoint.description, theme)}
                  </p>
                  <div className="flex items-start justify-between">
                    <details className={`text-xs flex-1 ${
                      theme === 'modern' ? 'text-[#4A4A4A]' : 'text-green-600'
                    }`}>
                      <summary className={`cursor-pointer ${
                        theme === 'modern' ? 'hover:text-[#2C2C2C]' : 'hover:text-green-400'
                      }`}>[REASONING]</summary>
                      <p className={`mt-2 pl-2 border-l ${
                        theme === 'modern'
                          ? 'border-[#666666] text-[#2C2C2C]'
                          : 'border-green-800 text-green-500'
                      }`}>
                        {renderTextWithLinks(selectedPoint.reasoning, theme)}
                      </p>
                    </details>
                    <button
                      onClick={() => handleDeleteItem(selectedPoint.id)}
                      className="text-red-500 hover:text-red-400 text-xs cursor-pointer ml-4"
                      title="Delete this item"
                    >
                      [DELETE]
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className={`text-sm ${
              theme === 'modern' ? 'text-[#4A4A4A]' : 'text-green-700'
            }`}>
              {xAxis && yAxis ? (
                <p>[CLICK A COORDINATE TO VIEW DETAILS]</p>
              ) : (
                <p>[ENTER A SUBJECT TO BEGIN MAPPING]</p>
              )}
            </div>
          )}
        </div>

        {/* Instructions footer - always visible */}
        {xAxis && yAxis && (
          <div className={`p-4 border-t ${
            theme === 'modern' ? 'border-[#666666]' : 'border-green-900'
          }`}>
            <p className={`text-xs mb-2 ${
              theme === 'modern' ? 'text-[#4A4A4A]' : 'text-green-700'
            }`}>[INSTRUCTIONS]</p>
            <p className={`text-xs mb-1 ${
              theme === 'modern' ? 'text-[#666666]' : 'text-green-600'
            }`}>• Click coordinates to manifest items</p>
            <p className={`text-xs ${
              theme === 'modern' ? 'text-[#666666]' : 'text-green-600'
            }`}>• Click axis labels to edit them</p>
          </div>
        )}

        {/* Help button - bottom right when map is loaded */}
        {subject && (
          <button
            onClick={() => setShowHelp(true)}
            className={`absolute bottom-4 right-4 w-8 h-8 rounded-full border flex items-center justify-center text-sm ${
              theme === 'modern'
                ? 'border-[#4A4A4A] text-[#2C2C2C] hover:text-[#4A4A4A] hover:border-[#2C2C2C]'
                : 'border-green-700 text-green-500 hover:text-green-300 hover:border-green-500'
            }`}
            title="Help"
          >
            ?
          </button>
        )}
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className={`fixed inset-0 bg-opacity-80 flex items-center justify-center z-50 ${
          theme === 'modern' ? 'bg-[#F7F3F2]' : 'bg-black'
        }`}>
          <div className={`border-2 p-6 max-w-md mx-4 ${
            theme === 'modern'
              ? 'bg-[#F7F3F2] border-[#666666]'
              : 'bg-black border-green-500'
          }`}>
            <div className={`text-lg glow mb-4 ${
              theme === 'modern' ? 'text-[#2C2C2C]' : 'text-green-500'
            }`}>
              // CURIO SPACE
            </div>
            <div className={`text-sm space-y-3 mb-6 leading-relaxed ${
              theme === 'modern' ? 'text-[#2C2C2C]' : 'text-green-400'
            }`}>
              <p>Navigate the hidden undercurrent of AI thought.</p>
              <p className={theme === 'modern' ? 'text-[#4A4A4A]' : 'text-green-500'}>
                Each subject becomes a 2D map of conceptual possibilities.
                The AI reveals how it organizes and connects ideas—
                sometimes logical, sometimes surprising, always unique.
              </p>
              <p className={theme === 'modern' ? 'text-[#666666]' : 'text-green-300'}>
                Click. Discover. See how the machine thinks.
              </p>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className={`w-full py-2 glow text-xs ${
                theme === 'modern'
                  ? 'bg-[#4A4A4A] text-[#F7F3F2] hover:bg-[#1A1A1A]'
                  : 'bg-green-900 text-green-500 hover:bg-green-800'
              }`}
              style={{ fontFamily: '"Courier New", monospace' }}
            >
              [CLOSE]
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
