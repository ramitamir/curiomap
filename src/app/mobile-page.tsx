'use client';

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import CurioGrid from '@/components/CurioGrid';
import { Axis, Manifestation } from '@/lib/types';
import { renderTextWithLinks } from '@/lib/markdown';

export default function MobilePage() {
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
  const [selectedPoint, setSelectedPoint] = useState<Manifestation | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerExpanded, setDrawerExpanded] = useState(false);
  const [inputMode, setInputMode] = useState<'subject' | 'items'>('subject');
  const [itemSeeds, setItemSeeds] = useState<string[]>(['', '', '']);
  const [subjectGeneratedFrom, setSubjectGeneratedFrom] = useState<string[] | null>(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showInputOverlay, setShowInputOverlay] = useState(true);
  const [isPlacingItem, setIsPlacingItem] = useState(false);
  const [placementInput, setPlacementInput] = useState('');
  const [editingAxis, setEditingAxis] = useState<{ axis: 'x' | 'y'; side: 'min' | 'max' } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [originalEditValue, setOriginalEditValue] = useState('');
  const [hasAxisEdits, setHasAxisEdits] = useState(false);
  const [showAxisTip, setShowAxisTip] = useState(false);
  const [editedLabels, setEditedLabels] = useState<{
    xAxis?: { minLabel?: string; maxLabel?: string };
    yAxis?: { minLabel?: string; maxLabel?: string };
  }>({});

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

  // Show drawer when point is selected
  useEffect(() => {
    if (selectedPoint) {
      setShowDrawer(true);
      setDrawerExpanded(false); // Start collapsed
    }
  }, [selectedPoint]);

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
    setManifestations([]);
    setSelectedPoint(null);
    setError(null);
    setIsGeneratingAxes(true);
    setHasAxisEdits(false);

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
      setShowInputOverlay(false);
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

    try {
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
      setSubjectGeneratedFrom(validItems);

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

      setSubject(generatedSubject);
      setXAxis(generatedXAxis);
      setYAxis(generatedYAxis);
      setShowInputOverlay(false);

      const newManifestations: Manifestation[] = [];

      for (const itemName of validItems) {
        try {
          const existingNames = newManifestations.map(m => m.name);
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
                name: placeData.name || itemName,
                description: placeData.description,
                reasoning: placeData.reasoning,
                imageUrl: '',
                timestamp: new Date().toISOString(),
                isHallucination: false,
              };
              newManifestations.push(newManifestation);
            } else {
              console.warn(`Cannot place "${itemName}": ${placeData.explanation || placeData.description}`);
            }
          }
        } catch (itemErr) {
          console.error(`Failed to place item ${itemName}:`, itemErr);
        }
      }

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
        setError('>> ERROR: RATE LIMIT. WAIT 60 SECONDS.');
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

      setSelectedPoint(newManifestation);
    } catch (err: any) {
      console.error('Manifestation error:', err);
      setError('>> ERROR: NETWORK FAILURE. CHECK CONNECTION.');
    } finally {
      setIsGeneratingItem(false);
    }
  };

  const handleDeleteItem = (itemId: string) => {
    setManifestations((prev) => prev.filter((m) => m.id !== itemId));
    setSelectedPoint(null);
    setShowDrawer(false);
    setDrawerExpanded(false);
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

      if (editingAxis.axis === 'x' && xAxis) {
        setXAxis({ ...xAxis, ...updates });
        setHasAxisEdits(true);
        setManifestations([]); // Clear items - they were placed with old axes
        setSelectedPoint(null);
        setShowDrawer(false);

        // Track which specific label was edited
        setEditedLabels(prev => ({
          ...prev,
          xAxis: {
            ...prev.xAxis,
            [editingAxis.side === 'min' ? 'minLabel' : 'maxLabel']: trimmedValue
          }
        }));
      } else if (editingAxis.axis === 'y' && yAxis) {
        setYAxis({ ...yAxis, ...updates });
        setHasAxisEdits(true);
        setManifestations([]); // Clear items - they were placed with old axes
        setSelectedPoint(null);
        setShowDrawer(false);

        // Track which specific label was edited
        setEditedLabels(prev => ({
          ...prev,
          yAxis: {
            ...prev.yAxis,
            [editingAxis.side === 'min' ? 'minLabel' : 'maxLabel']: trimmedValue
          }
        }));
      }
    }

    setEditingAxis(null);
  };

  const handleRegenerate = () => {
    if (!xAxis || !yAxis) return;
    // Only pass the edited labels, not the full axis objects
    handleGenerateAxes(subject, editedLabels.xAxis || {}, editedLabels.yAxis || {});
    setEditedLabels({}); // Clear after regeneration
    setHasAxisEdits(false);
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

      setSelectedPoint(newManifestation);
      setPlacementInput('');
    } catch (err: any) {
      console.error('Placement error:', err);
      setError('>> ERROR: NETWORK FAILURE. CHECK CONNECTION.');
    } finally {
      setIsGeneratingItem(false);
    }
  };

  const handleReset = () => {
    setSubject('');
    setInputValue('');
    setXAxis(null);
    setYAxis(null);
    setManifestations([]);
    setError(null);
    setSelectedPoint(null);
    setInputMode('subject');
    setItemSeeds(['', '', '']);
    setSubjectGeneratedFrom(null);
    setShowMoreMenu(false);
    setShowInputOverlay(true);
    setShowDrawer(false);
    setEditedLabels({});
    setHasAxisEdits(false);
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

        if (!data.subject || !data.xAxis || !data.yAxis || !Array.isArray(data.manifestations)) {
          throw new Error('Invalid file format');
        }

        setSubject(data.subject);
        setXAxis(data.xAxis);
        setYAxis(data.yAxis);
        setManifestations(data.manifestations);
        setSubjectGeneratedFrom(data.subjectGeneratedFrom || null);
        setSelectedPoint(null);
        setError(null);
        setShowInputOverlay(false);
      } catch (err) {
        console.error('Failed to load file:', err);
        setError('>> ERROR: INVALID FILE FORMAT');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Bootup screen
  if (!bootupComplete) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <pre className="text-green-500 text-sm whitespace-pre-wrap glow">
          {bootupText}<span className="blink-cursor">█</span>
        </pre>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-black">
      {/* Map - full screen */}
      <div className="flex-1 relative">
        {/* Help button when map is empty - centered and large */}
        {!subject && !isGeneratingAxes && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <button
              onClick={() => setShowHelp(true)}
              className="w-24 h-24 rounded-full border-2 border-green-700 text-green-500 hover:text-green-300 hover:border-green-500 flex items-center justify-center text-5xl glow pointer-events-auto"
              title="Help"
            >
              ?
            </button>
          </div>
        )}

        {isGeneratingAxes && (
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[60]">
            <div className="bg-black bg-opacity-90 border-2 border-green-500 p-6 rounded pointer-events-none">
              <p className="text-green-500 text-base animate-pulse glow">
                GENERATING COORDINATE SYSTEM...
              </p>
            </div>
          </div>
        )}

        {xAxis && yAxis && !isGeneratingAxes && (
          <CurioGrid
            xAxis={xAxis}
            yAxis={yAxis}
            manifestations={manifestations}
            onCoordinateClick={handleCoordinateClick}
            onAxisUpdate={() => {}}
            onLabelClick={(axis, side) => {
              if (!editingAxis) {
                startEditingAxis(axis, side);
              }
            }}
            selectedPointId={selectedPoint?.id}
            onPointSelect={setSelectedPoint}
            isMobile={true}
          />
        )}

        {/* Top bar with subject and controls when map is loaded */}
        {subject && (
          <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-90 border-b border-green-900 p-3 z-10">
            <div className="text-green-500 text-xs glow mb-1">
              {subject.toUpperCase()}
            </div>
            {subjectGeneratedFrom && (
              <div className="text-green-700 text-xs mb-2">
                [From: {subjectGeneratedFrom.join(', ')}]
              </div>
            )}
            <div className="flex gap-2 text-xs flex-wrap">
              <button
                onClick={() => setIsPlacingItem(true)}
                className="text-green-500 hover:text-green-300 disabled:opacity-50"
                disabled={isGeneratingItem || hasAxisEdits}
              >
                [PLACE]
              </button>
              <button
                onClick={() => handleGenerateAxes(subject)}
                className="text-green-500 hover:text-green-300"
                disabled={isGeneratingAxes}
              >
                [REDO AXES]
              </button>
              <button
                onClick={handleSaveToFile}
                className="text-green-500 hover:text-green-300"
              >
                [SAVE]
              </button>
              <button
                onClick={handleReset}
                className="text-green-500 hover:text-green-300"
              >
                [NEW]
              </button>
              <button
                onClick={() => setShowHelp(true)}
                className="text-green-500 hover:text-green-300"
              >
                [?]
              </button>
            </div>
          </div>
        )}

        {/* Redo board button - appears when axes are edited */}
        {hasAxisEdits && !isGeneratingAxes && subject && (
          <div className="absolute top-16 left-0 right-0 px-3 z-10">
            <button
              onClick={handleRegenerate}
              className="w-full py-2 bg-green-900 text-green-500 hover:bg-green-800 glow font-bold animate-pulse text-xs"
              style={{ fontFamily: '"Courier New", monospace' }}
            >
              [REDO BOARD]
            </button>
          </div>
        )}

        {/* Axis tip banner - first time only */}
        {showAxisTip && subject && (
          <div className="absolute bottom-20 left-0 right-0 mx-3 bg-green-950 border border-green-500 p-3 z-30 animate-pulse">
            <div className="flex items-center justify-between">
              <p className="text-green-400 text-xs font-mono flex-1">
                TIP: TAP AXIS LABELS TO EDIT
              </p>
              <button
                onClick={() => {
                  setShowAxisTip(false);
                  localStorage.setItem('hasSeenAxisTip', 'true');
                }}
                className="text-green-500 hover:text-green-300 text-xs ml-2"
              >
                [OK]
              </button>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isGeneratingItem && (
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[60]">
            <div className="bg-black bg-opacity-90 border-2 border-green-500 p-6 rounded pointer-events-none">
              <p className="text-green-500 text-base animate-pulse glow">
                MANIFESTING...
              </p>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="absolute bottom-20 left-0 right-0 mx-4 bg-red-950 border border-red-900 p-3 z-30">
            <p className="text-red-500 text-xs font-mono">{error}</p>
          </div>
        )}

        {/* Edit axis label overlay */}
        {editingAxis && (
          <div className="absolute inset-0 bg-black bg-opacity-95 z-[60] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
              <div className="text-green-500 text-xs glow mb-3 text-center leading-relaxed">
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
                className="w-full bg-black border border-green-900 text-green-500 px-4 py-3 text-base mb-4"
                style={{ fontFamily: '"Courier New", monospace' }}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={saveAxisEdit}
                  disabled={!editValue.trim()}
                  className="flex-1 bg-green-900 text-green-500 px-4 py-3 hover:bg-green-800 disabled:opacity-50 glow text-sm"
                  style={{ fontFamily: '"Courier New", monospace' }}
                >
                  [SAVE]
                </button>
                <button
                  onClick={() => setEditingAxis(null)}
                  className="flex-1 bg-black border border-green-900 text-green-500 px-4 py-3 hover:border-green-700 glow text-sm"
                  style={{ fontFamily: '"Courier New", monospace' }}
                >
                  [CANCEL]
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Place item overlay */}
      {isPlacingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="text-green-500 text-sm glow mb-4 text-center">
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
              className="w-full bg-black border border-green-900 text-green-500 px-4 py-3 text-base mb-4"
              style={{ fontFamily: '"Courier New", monospace' }}
              autoFocus
              placeholder="e.g., Tokyo Metro..."
            />
            <div className="flex gap-2">
              <button
                onClick={handlePlaceItem}
                disabled={!placementInput.trim()}
                className="flex-1 bg-green-900 text-green-500 px-4 py-3 hover:bg-green-800 disabled:opacity-50 glow text-sm"
                style={{ fontFamily: '"Courier New", monospace' }}
              >
                [PLACE]
              </button>
              <button
                onClick={() => {
                  setIsPlacingItem(false);
                  setPlacementInput('');
                }}
                className="flex-1 bg-black border border-green-900 text-green-500 px-4 py-3 hover:border-green-700 glow text-sm"
                style={{ fontFamily: '"Courier New", monospace' }}
              >
                [CANCEL]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom drawer for selected item */}
      {showDrawer && selectedPoint && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => {
              setShowDrawer(false);
              setDrawerExpanded(false);
            }}
          />
          <div
            className="fixed bottom-0 left-0 right-0 bg-black border-t-2 border-green-500 z-50 transition-all duration-300"
            style={{
              maxHeight: drawerExpanded ? '50vh' : 'auto',
            }}
          >
            {/* Collapsed header - always visible */}
            <div
              className="p-4 flex items-center justify-between cursor-pointer"
              onClick={() => setDrawerExpanded(!drawerExpanded)}
            >
              <div className="flex-1">
                <h3 className="text-green-500 font-bold text-base glow">
                  {selectedPoint.name}
                  {selectedPoint.isImpossible && (
                    <span className="ml-2 text-xs text-red-500">[IMPOSSIBLE]</span>
                  )}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDrawer(false);
                    setDrawerExpanded(false);
                  }}
                  className="text-green-500 hover:text-green-300 text-xs"
                >
                  [CLOSE]
                </button>
                <span className="text-green-500 text-lg">
                  {drawerExpanded ? '▼' : '▲'}
                </span>
              </div>
            </div>

            {/* Expanded content - scrollable */}
            {drawerExpanded && (
              <div className="px-4 pb-4 overflow-y-auto" style={{ maxHeight: 'calc(50vh - 80px)' }}>
                <p className="text-green-400 text-xs mb-3">
                  COORDS: ({selectedPoint.x}, {selectedPoint.y})
                </p>

                {selectedPoint.isImpossible ? (
                  <p className="text-red-400 text-sm leading-relaxed">
                    {renderTextWithLinks(selectedPoint.impossibleExplanation || selectedPoint.description)}
                  </p>
                ) : (
                  <>
                    <p className="text-green-300 text-sm leading-relaxed mb-4">
                      {renderTextWithLinks(selectedPoint.description)}
                    </p>
                    <div className="flex items-start justify-between gap-4">
                      <details className="text-xs text-green-600 flex-1">
                        <summary className="cursor-pointer hover:text-green-400">[REASONING]</summary>
                        <p className="mt-2 pl-2 border-l border-green-800 text-green-500">
                          {renderTextWithLinks(selectedPoint.reasoning)}
                        </p>
                      </details>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(selectedPoint.id);
                        }}
                        className="text-red-500 hover:text-red-400 text-xs whitespace-nowrap"
                      >
                        [DELETE]
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Input overlay */}
      {showInputOverlay && (
        <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col p-4">
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-md">
              <div className="text-green-500 text-sm glow mb-4 text-center">
                CURIO.SPACE // NEURAL CARTOGRAPHY SYSTEM v1.0
              </div>

              {inputMode === 'subject' ? (
                <>
                  <form onSubmit={handleSubmit} className="mb-3">
                    <div className="flex items-center mb-2 bg-black border border-green-900 p-3">
                      <span className="text-green-500 mr-2 glow">&gt;</span>
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="enter subject..."
                        className="flex-1 bg-transparent text-green-500 focus:outline-none placeholder-green-800 border-0 focus:ring-0 text-base"
                        disabled={isGeneratingAxes || isGeneratingSubject}
                        autoFocus
                        style={{
                          fontFamily: '"Courier New", monospace',
                          boxShadow: 'none',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </form>
                  <div className="flex justify-end relative" data-more-menu>
                    <button
                      onClick={() => setShowMoreMenu(!showMoreMenu)}
                      className="text-green-700 hover:text-green-500 text-sm px-4 py-2"
                    >
                      [MORE ▼]
                    </button>

                    {showMoreMenu && (
                      <div className="absolute top-full right-0 mt-1 bg-black border border-green-900 z-10 min-w-[180px]">
                        <button
                          onClick={() => {
                            handleGenerateSubject();
                            setShowMoreMenu(false);
                          }}
                          disabled={isGeneratingAxes || isGeneratingSubject}
                          className="w-full text-left px-4 py-3 text-green-500 hover:bg-green-900 text-sm disabled:opacity-50 border-b border-green-900"
                        >
                          [SURPRISE ME]
                        </button>
                        <button
                          onClick={() => {
                            setInputMode('items');
                            setShowMoreMenu(false);
                          }}
                          className="w-full text-left px-4 py-3 text-green-500 hover:bg-green-900 text-sm border-b border-green-900"
                        >
                          [FROM 3 ITEMS]
                        </button>
                        <label className="block w-full text-left px-4 py-3 text-green-500 hover:bg-green-900 text-sm cursor-pointer">
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
              <>
                <div className="space-y-3 mb-3">
                  {[0, 1, 2].map((index) => (
                    <div key={index} className="bg-black border border-green-900 p-3">
                      <div className="text-green-500 text-xs glow mb-1">ITEM {index + 1}:</div>
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
                        className="w-full bg-transparent text-green-500 focus:outline-none placeholder-green-800 border-0 focus:ring-0 text-base"
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
                <div className="text-green-700 text-xs mb-3 italic text-center">
                  AI will find the hidden thread connecting these items
                </div>
                <div className="flex justify-between gap-2">
                  <button
                    onClick={() => setInputMode('subject')}
                    className="text-green-700 hover:text-green-500 text-sm px-4 py-2"
                  >
                    [BACK]
                  </button>
                  <button
                    onClick={handleGenerateSubjectFromItems}
                    disabled={isGeneratingAxes || isGeneratingItem || itemSeeds.filter(s => s.trim()).length < 3}
                    className="text-green-500 hover:text-green-300 text-sm cursor-pointer disabled:opacity-50 glow disabled:cursor-not-allowed px-4 py-2"
                  >
                    {isGeneratingAxes ? '[GENERATING...]' : '[GENERATE]'}
                  </button>
                </div>
              </>
            )}
            </div>
          </div>

          {/* Help button at bottom center */}
          <div className="flex justify-center pb-8">
            <button
              onClick={() => setShowHelp(true)}
              className="w-12 h-12 rounded-full border-2 border-green-700 text-green-500 hover:text-green-300 hover:border-green-500 flex items-center justify-center text-xl"
              title="Help"
            >
              ?
            </button>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="bg-black border-2 border-green-500 p-6 max-w-md">
            <div className="text-green-500 text-lg glow mb-4">
              // CURIO SPACE
            </div>
            <div className="text-green-400 text-sm space-y-3 mb-6 leading-relaxed">
              <p>Navigate the hidden undercurrent of AI thought.</p>
              <p className="text-green-500">
                Each subject becomes a 2D map of conceptual possibilities.
                The AI reveals how it organizes and connects ideas—
                sometimes logical, sometimes surprising, always unique.
              </p>
              <p className="text-green-300">
                Click. Discover. See how the machine thinks.
              </p>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="w-full py-3 bg-green-900 text-green-500 hover:bg-green-800 glow text-sm"
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
