'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDashboard } from '../../../context/DashboardContext';

type Track = 'dsa' | 'system_design';
type Mode = 'menu' | 'topic_selected' | 'learn' | 'exercises' | 'workspace' | 'my_solutions';
type Tool = 'select' | 'brush' | 'rectangle' | 'circle' | 'text' | 'eraser';

interface TopicData {
  id: string;
  name: string;
  category: 'dsa' | 'system_design';
}

interface Problem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Med' | 'Hard';
  description: string;
  examples: { 
    input: string; 
    output: string;
    explanation?: string;
  }[];
}

interface Panel {
  id: string;
  dbId?: string;
  language: 'python' | 'java' | 'c#' | 'javascript' | 'algorithm';
  code: string;
  timeComp?: string;
  spaceComp?: string;
  isAnalyzing: boolean;
}

interface SavedSolutionView {
  id: string;
  problemTitle: string;
  language: string;
  codeContent: string;
  timeComplexity: string | null;
  spaceComplexity: string | null;
  createdAt: string;
}

interface EraserCutout {
  points: { x: number; y: number }[];
}

interface CanvasShape {
  id: string;
  type: 'rectangle' | 'circle' | 'text' | 'brush';
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  text?: string;
  points?: { x: number; y: number }[];
  cutouts: EraserCutout[];
}

const LANGUAGE_LABELS: Record<Panel['language'], string> = {
  python: 'Python 3.11',
  java: 'Java v21',
  'c#': 'C# Engine',
  javascript: 'JavaScript',
  algorithm: 'Pseudocode'
};

export default function ProblemsSection() {
  const [track, setTrack] = useState<Track>('dsa');
  const [mode, setMode] = useState<Mode>('menu');
  const [selectedTopicEntity, setSelectedTopicEntity] = useState<TopicData | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(true);

  // Database State Stores
  const [topicsList, setTopicsList] = useState<TopicData[]>([]);
  const [problemsList, setProblemsList] = useState<Problem[]>([]);
  const [savedSolutions, setSavedSolutions] = useState<SavedSolutionView[]>([]);
  const [loadingTopics, setLoadingTopics] = useState<boolean>(false);
  const [loadingProblems, setLoadingProblems] = useState<boolean>(false);
  const [loadingSolutions, setLoadingSolutions] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Modals & Popups States
  const [tabToCloseId, setTabToCloseId] = useState<string | null>(null);
  const [showAnalyzeModal, setShowAnalyzeModal] = useState<boolean>(false);
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [pendingActionPanelId, setPendingActionPanelId] = useState<string | null>(null);

  // Workspace Panels Tracking Layouts
  const [panels, setPanels] = useState<Panel[]>([]);
  const [activePanelId, setActivePanelId] = useState<string>('');
  const [panelCounter, setPanelCounter] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const inlineInputRef = useRef<HTMLTextAreaElement | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [brushColor, setBrushColor] = useState('#FF6B35'); 
  const [isDrawing, setIsDrawing] = useState(false);
  const [shapes, setShapes] = useState<CanvasShape[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [currentBrushPath, setCurrentBrushPath] = useState<{ x: number; y: number }[]>([]);
  const [activeTextBox, setActiveTextBox] = useState<{ id?: string; x: number; y: number; w: number; h: number; text: string } | null>(null);
  const [showProblemPopup, setShowProblemPopup] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<{ [key: string]: 'idle' | 'saving' | 'saved' | 'error' }>({});
  const [selectedSaveStatus, setSelectedSaveStatus] = useState<'solved' | 'attempted' | 'reviewed'>('attempted');
  const { navigationData, clearNavigation } = useDashboard();

  // FETCH HOOK 1: Sync active list of topics on category modification
  useEffect(() => {
    if (mode !== 'topic_selected') return;
    
    const fetchTopics = async () => {
      setLoadingTopics(true);
      try {
        const response = await fetch(`/api/topics?track=${track}`);
        const data = await response.json();
        if (Array.isArray(data)) setTopicsList(data);
      } catch (err) {
        console.error("Error updating topics:", err);
      } finally {
        setLoadingTopics(false);
      }
    };
    fetchTopics();
  }, [track, mode]);

  // FETCH HOOK 2: Sync problem records under target selected topic entity
  useEffect(() => {
    if (!selectedTopicEntity || mode !== 'exercises') return;

    const fetchProblems = async () => {
      setLoadingProblems(true);
      try {
        const response = await fetch(`/api/problems?topicId=${selectedTopicEntity.id}`);
        const data = await response.json();
        if (Array.isArray(data)) setProblemsList(data);
      } catch (err) {
        console.error("Error fetching workspace challenges:", err);
      } finally {
        setLoadingProblems(false);
      }
    };
    fetchProblems();
  }, [selectedTopicEntity, mode]);

  // FETCH HOOK 3: Hydrate existing workspace solution panels when a problem is launched
useEffect(() => {
  if (!selectedProblem || mode !== 'workspace') return;

  const loadSavedWorkspaces = async () => {
    try {
      const response = await fetch(`/api/solution-panels?problemId=${selectedProblem.id}`);
      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        const loadedPanels: Panel[] = data.map((p, index) => ({
          id: p.id || `panel-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
          dbId: p.id,
          language: p.language,
          code: p.codeContent || '',
          timeComp: p.timeComplexity || undefined,
          spaceComp: p.spaceComplexity || undefined,
          isAnalyzing: false
        }));
        setPanels(loadedPanels);
        setActivePanelId(loadedPanels[0].id);
        setPanelCounter(loadedPanels.length);
      } else {
        const defaultId = `panel-${Date.now()}-0-${Math.random().toString(36).substring(2, 6)}`;
        setPanels([{ 
          id: defaultId, 
          language: 'python', 
          code: '# Type your production system code script here\n', 
          isAnalyzing: false 
        }]);
        setActivePanelId(defaultId);
        setPanelCounter(1);
      }
    } catch (err) {
      console.error('Failed syncing active dashboard buffers:', err);
    }
  };
  loadSavedWorkspaces();
}, [selectedProblem, mode]);

  // FETCH HOOK 4: Load "My Solutions" history dashboard grid
  useEffect(() => {
    if (mode !== 'my_solutions') return;

    const fetchAllSolutionsHistory = async () => {
      setLoadingSolutions(true);
      try {
        const response = await fetch('/api/solution-panels/all');
        const data = await response.json();
        if (Array.isArray(data)) setSavedSolutions(data);
      } catch (err) {
        console.error("Error loading user solutions portfolio index:", err);
      } finally {
        setLoadingSolutions(false);
      }
    };
    fetchAllSolutionsHistory();
  }, [mode]);

  // HOOK 5: Dashboard navigations
  // Handle navigation from dashboard - SINGLE API CALL
  useEffect(() => {
    if (!navigationData) return;

    const fetchNavigationData = async () => {
      try {
        // Build query params
        const params = new URLSearchParams();
        if (navigationData.problemId) {
          params.append('problemId', navigationData.problemId);
        }
        if (navigationData.topicId) {
          params.append('topicId', navigationData.topicId);
        }

        const response = await fetch(`/api/dashboard/navigate?${params.toString()}`);
        const data = await response.json();

        // CASE 1: Navigate to a specific problem
        if (navigationData.problemId && data.problem) {
          setSelectedProblem(data.problem);
          setSelectedTopic(navigationData.problemName!);
          setMode('workspace');
          setIsDrawerOpen(true);
          
          // If solutions exist, load them into panels
          if (data.solutions && data.solutions.length > 0) {
            const loadedPanels = data.solutions.map((p: any, index: number) => ({
              id: p.id || `panel-${Date.now()}-${index}`,
              dbId: p.id,
              language: p.language,
              code: p.codeContent || '',
              timeComp: p.timeComplexity || undefined,
              spaceComp: p.spaceComplexity || undefined,
              isAnalyzing: false
            }));
            setPanels(loadedPanels);
            setActivePanelId(loadedPanels[0]?.id || '');
            setPanelCounter(loadedPanels.length);
          }
          
          clearNavigation();
          return;
        }

        // CASE 2: Navigate to a specific topic
        if (navigationData.topicId && data.topic) {
          setSelectedTopicEntity(data.topic);
          setSelectedTopic(navigationData.topicName!);
          setMode('exercises');
          
          // If problems for this topic were returned, set them
          if (data.problems) {
            setProblemsList(data.problems);
          }
          
          clearNavigation();
          return;
        }
      } catch (err) {
        console.error('Error fetching navigation data:', err);
      }
    };

    fetchNavigationData();
  }, [navigationData]); // Re-run when navigationData changes

  

  // ============================================================================
  // REFACTORED: SEPARATE ANALYZE AND SAVE FUNCTIONALITY
  // ============================================================================

  // ANALYZE COMPLEXITY SEPARATELY - only calculates, no database write
  const executeComplexityAnalysis = (currentPanel: Panel) => {
    setPanels(panels.map(p => p.id === currentPanel.id ? { ...p, isAnalyzing: true } : p));

    setTimeout(() => {
      setPanels(prevPanels => {
        const updated = prevPanels.map(p => {
          if (p.id !== currentPanel.id) return p;
          const codeLower = p.code.toLowerCase();
          let calculatedTime = 'O(N)';
          let calculatedSpace = 'O(1)';

          if (codeLower.includes('for') && (codeLower.includes('nested') || codeLower.match(/for.*for/))) {
            calculatedTime = 'O(N²)';
          } else if (codeLower.includes('binary') || codeLower.includes('while (low') || codeLower.includes('split')) {
            calculatedTime = 'O(log N)';
          }
          if (codeLower.includes('map') || codeLower.includes('set') || codeLower.includes('append(') || codeLower.includes('new array')) {
            calculatedSpace = 'O(N)';
          }
          return { ...p, isAnalyzing: false, timeComp: calculatedTime, spaceComp: calculatedSpace };
        });

        return updated;
      });
    }, 1200);
  };

  const executeDatabaseSave = async (currentPanel: Panel, probId: string, status: string = 'attempted') => {
    // Set saving state for this panel
    setSaveStatus(prev => ({ ...prev, [currentPanel.id]: 'saving' }));
    
    try {
      const response = await fetch('/api/solution-panels/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: probId,
          panelId: currentPanel.id,
          language: currentPanel.language,
          codeContent: currentPanel.code,
          timeComplexity: currentPanel.timeComp || null,
          spaceComplexity: currentPanel.spaceComp || null,
          status: status
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update panel with dbId
        setPanels(prev => prev.map(p => 
          p.id === currentPanel.id ? { ...p, dbId: data.data.id } : p
        ));
        
        setSaveStatus(prev => ({ ...prev, [currentPanel.id]: 'saved' }));
        
        // Auto-revert status after 2 seconds
        setTimeout(() => {
          setSaveStatus(prev => ({ ...prev, [currentPanel.id]: 'idle' }));
        }, 2000);
      } else {
        setSaveStatus(prev => ({ ...prev, [currentPanel.id]: 'error' }));
      }
    } catch (err) {
      console.error('Database write execution failure:', err);
      setSaveStatus(prev => ({ ...prev, [currentPanel.id]: 'error' }));
    }
  };

  // TRIGGER ANALYZE - opens confirmation modal
  const requestComplexityAnalysis = (id: string) => {
    setPendingActionPanelId(id);
    setShowAnalyzeModal(true);
  };

  // TRIGGER SAVE - opens confirmation modal
  const requestManualSave = (id: string) => {
    setPendingActionPanelId(id);
    setShowSaveModal(true);
  };

  // CONFIRM ANALYZE ACTION
  const confirmAnalyzeAction = () => {
    setShowAnalyzeModal(false);
    if (!pendingActionPanelId) return;

    const targetPanel = panels.find(p => p.id === pendingActionPanelId);
    if (targetPanel) {
      executeComplexityAnalysis(targetPanel);
    }
    setPendingActionPanelId(null);
  };

  // CONFIRM SAVE ACTION
  const confirmSaveAction = () => {
    setShowSaveModal(false);
    if (!pendingActionPanelId || !selectedProblem) return;

    const targetPanel = panels.find(p => p.id === pendingActionPanelId);
    if (targetPanel) {
      const status = selectedSaveStatus || 'attempted';
      executeDatabaseSave(targetPanel, selectedProblem.id, status);
    }
    setPendingActionPanelId(null);
  };

  // ============================================================================
  // END OF REFACTORED SECTION
  // ============================================================================

  const triggerDebouncedAutoSave = useCallback((updatedPanel: Panel, probId: string) => {
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    debounceTimeoutRef.current = setTimeout(() => {
      // Auto-save with 'attempted' status
      executeDatabaseSave(updatedPanel, probId, 'attempted');
    }, 1500);
  }, []);

  useEffect(() => {
    if (activeTextBox && inlineInputRef.current) {
      inlineInputRef.current.focus();
    }
  }, [activeTextBox]);

  const drawAllShapes = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    shapes.forEach((shape) => {
      ctx.save();
      ctx.strokeStyle = shape.color;
      ctx.fillStyle = shape.color;
      ctx.lineWidth = shape.type === 'brush' ? 3 : 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (shape.type === 'rectangle') {
        ctx.strokeRect(shape.x, shape.y, shape.w, shape.h);
      } else if (shape.type === 'circle') {
        ctx.beginPath();
        const rx = shape.w / 2;
        const ry = shape.h / 2;
        ctx.ellipse(shape.x + rx, shape.y + ry, Math.abs(rx), Math.abs(ry), 0, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (shape.type === 'brush' && shape.points) {
        if (shape.points.length > 0) {
          ctx.beginPath();
          ctx.moveTo(shape.points[0].x, shape.points[0].y);
          for (let i = 1; i < shape.points.length; i++) {
            ctx.lineTo(shape.points[i].x, shape.points[i].y);
          }
          ctx.stroke();
        }
      } else if (shape.type === 'text' && shape.text) {
        if (activeTextBox && activeTextBox.id === shape.id) {
          ctx.restore();
          return;
        }
        ctx.font = 'bold 12px monospace';
        ctx.textBaseline = 'top';
        const lines = shape.text.split('\n');
        lines.forEach((line, index) => {
          ctx.fillText(line, shape.x + 4, shape.y + 4 + (index * 16), shape.w - 8);
        });
      }

      if (shape.cutouts && shape.cutouts.length > 0) {
        shape.cutouts.forEach(cutout => {
          if (cutout.points.length < 1) return;
          ctx.save();
          ctx.globalCompositeOperation = 'destination-out';
          ctx.strokeStyle = 'rgba(0,0,0,1)';
          ctx.lineWidth = 24; 
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(cutout.points[0].x, cutout.points[0].y);
          if (cutout.points.length === 1) {
            ctx.lineTo(cutout.points[0].x, cutout.points[0].y);
          } else {
            for (let i = 1; i < cutout.points.length; i++) {
              ctx.lineTo(cutout.points[i].x, cutout.points[i].y);
            }
          }
          ctx.stroke();
          ctx.restore();
        });
      }

      if (shape.id === selectedShapeId && activeTool === 'select') {
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = '#38bdf8'; 
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(shape.x - 6, shape.y - 6, shape.w + 12, shape.h + 12);
        ctx.restore();
      }
      ctx.restore();
    });

    if (isDrawing && activeTool !== 'select') {
      ctx.save();
      if (activeTool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.lineWidth = 24;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = activeTool === 'brush' ? 3 : 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }

      if (activeTool === 'rectangle') {
        ctx.strokeRect(startX, startY, dragOffset.x, dragOffset.y);
      } else if (activeTool === 'circle') {
        ctx.beginPath();
        const rx = dragOffset.x / 2;
        const ry = dragOffset.y / 2;
        ctx.ellipse(startX + rx, startY + ry, Math.abs(rx), Math.abs(ry), 0, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (activeTool === 'brush' || activeTool === 'eraser') {
        if (currentBrushPath.length > 0) {
          ctx.beginPath();
          ctx.moveTo(currentBrushPath[0].x, currentBrushPath[0].y);
          currentBrushPath.forEach(pt => ctx.lineTo(pt.x, pt.y));
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  };

  useEffect(() => {
    drawAllShapes();
  }, [shapes, selectedShapeId, isDrawing, dragOffset, currentBrushPath, activeTextBox]);

  const isPointInShape = (x: number, y: number, shape: CanvasShape): boolean => {
    if (shape.type === 'brush' && shape.points) {
      return shape.points.some(p => Math.abs(p.x - x) < 12 && Math.abs(p.y - y) < 12);
    }
    const minX = Math.min(shape.x, shape.x + shape.w);
    const maxX = Math.max(shape.x, shape.x + shape.w);
    const minY = Math.min(shape.y, shape.y + shape.h);
    const maxY = Math.max(shape.y, shape.y + shape.h);
    return x >= minX && x <= maxX && y >= minY && y <= maxY;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (activeTextBox) {
      commitActiveTextBox();
      return;
    }

    setStartX(mouseX);
    setStartY(mouseY);
    setIsDrawing(true);

    if (activeTool === 'select') {
      const targetedShape = [...shapes].reverse().find(s => isPointInShape(mouseX, mouseY, s));
      if (targetedShape) {
        setSelectedShapeId(targetedShape.id);
        setDragOffset({ x: mouseX - targetedShape.x, y: mouseY - targetedShape.y });
      } else {
        setSelectedShapeId(null);
      }
    } else if (activeTool === 'brush' || activeTool === 'eraser') {
      setCurrentBrushPath([{ x: mouseX, y: mouseY }]);
      if (activeTool === 'eraser') {
        executeRealtimeEraserSlice(mouseX, mouseY, [{ x: mouseX, y: mouseY }]);
      }
    }
  };

  const executeRealtimeEraserSlice = (x: number, y: number, currentSegment: { x: number; y: number }[]) => {
    setShapes(prevShapes => prevShapes.map(shape => {
      if (isPointInShape(x, y, shape)) {
        return { ...shape, cutouts: [...shape.cutouts, { points: [...currentSegment] }] };
      }
      return shape;
    }));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (activeTool === 'select' && selectedShapeId) {
      setShapes(shapes.map(shape => {
        if (shape.id !== selectedShapeId) return shape;
        const nextX = mouseX - dragOffset.x;
        const nextY = mouseY - dragOffset.y;
        const dx = nextX - shape.x;
        const dy = nextY - shape.y;

        const updatedCutouts = shape.cutouts.map(cutout => ({
          points: cutout.points.map(p => ({ x: p.x + dx, y: p.y + dy }))
        }));

        if (shape.type === 'brush' && shape.points) {
          return { ...shape, x: nextX, y: nextY, points: shape.points.map(p => ({ x: p.x + dx, y: p.y + dy })), cutouts: updatedCutouts };
        }
        return { ...shape, x: nextX, y: nextY, cutouts: updatedCutouts };
      }));
    } else if (activeTool === 'rectangle' || activeTool === 'circle') {
      setDragOffset({ x: mouseX - startX, y: mouseY - startY });
    } else if (activeTool === 'brush') {
      setCurrentBrushPath(prev => [...prev, { x: mouseX, y: mouseY }]);
    } else if (activeTool === 'eraser') {
      const nextPath = [...currentBrushPath, { x: mouseX, y: mouseY }];
      setCurrentBrushPath(nextPath);
      executeRealtimeEraserSlice(mouseX, mouseY, nextPath.slice(-2));
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const rect = canvasRef.current!.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const w = mouseX - startX;
    const h = mouseY - startY;

    if (activeTool === 'eraser') {
      setCurrentBrushPath([]);
      return;
    }

    if (activeTool === 'rectangle' || activeTool === 'circle') {
      if (Math.abs(w) < 4 || Math.abs(h) < 4) return;
      const newShape: CanvasShape = {
        id: `shape-${Date.now()}`,
        type: activeTool,
        x: w < 0 ? mouseX : startX,
        y: h < 0 ? mouseY : startY,
        w: Math.abs(w),
        h: Math.abs(h),
        color: brushColor,
        cutouts: []
      };
      setShapes(prev => [...prev, newShape]);
      setSelectedShapeId(newShape.id);
    } else if (activeTool === 'brush') {
      if (currentBrushPath.length < 2) return;
      const xs = currentBrushPath.map(p => p.x);
      const ys = currentBrushPath.map(p => p.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs);
      const maxY = Math.max(...ys);

      const newShape: CanvasShape = {
        id: `shape-${Date.now()}`,
        type: 'brush',
        x: minX,
        y: minY,
        w: maxX - minX,
        h: maxY - minY,
        color: brushColor,
        points: currentBrushPath,
        cutouts: []
      };
      setShapes(prev => [...prev, newShape]);
      setSelectedShapeId(newShape.id);
      setCurrentBrushPath([]);
    } else if (activeTool === 'text') {
      const targetW = Math.max(Math.abs(w), 160);
      const targetH = Math.max(Math.abs(h), 60);
      setActiveTextBox({ x: w < 0 ? mouseX : startX, y: h < 0 ? mouseY : startY, w: targetW, h: targetH, text: '' });
    }
  };

  const commitActiveTextBox = () => {
    if (!activeTextBox) return;
    if (activeTextBox.text.trim() === '') {
      if (activeTextBox.id) setShapes(shapes.filter(s => s.id !== activeTextBox.id));
      setActiveTextBox(null);
      return;
    }

    if (activeTextBox.id) {
      setShapes(shapes.map(s => s.id === activeTextBox.id ? { ...s, text: activeTextBox.text } : s));
    } else {
      const newTextShape: CanvasShape = {
        id: `shape-${Date.now()}`,
        type: 'text',
        x: activeTextBox.x,
        y: activeTextBox.y,
        w: activeTextBox.w,
        h: activeTextBox.h,
        color: brushColor,
        text: activeTextBox.text,
        cutouts: []
      };
      setShapes(prev => [...prev, newTextShape]);
    }
    setActiveTextBox(null);
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool !== 'select' || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const targetedShape = [...shapes].reverse().find(s => s.type === 'text' && isPointInShape(mouseX, mouseY, s));
    if (targetedShape) {
      setActiveTextBox({ id: targetedShape.id, x: targetedShape.x, y: targetedShape.y, w: targetedShape.w, h: targetedShape.h, text: targetedShape.text || '' });
    }
  };

  const deleteSelectedShape = () => {
    if (!selectedShapeId) return;
    setShapes(shapes.filter(s => s.id !== selectedShapeId));
    setSelectedShapeId(null);
  };

  const clearCanvasSpace = () => {
    setShapes([]);
    setSelectedShapeId(null);
    setActiveTextBox(null);
  };

  const getToolCursorStyle = () => {
    switch (activeTool) {
      case 'select': return 'default';
      case 'brush': return `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' style='font-size:16px'><text y='16'>✏️</text></svg>") 0 16, pointer`;
      case 'eraser': return `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' style='font-size:16px'><text y='16'>🧽</text></svg>") 8 16, pointer`;
      case 'text': return 'text';
      case 'rectangle':
      case 'circle': return 'crosshair';
      default: return 'default';
    }
  };

// Create new panel
const createNewPanel = () => {
  if (!selectedProblem) return;
  
  // Check if we already have all languages
  const openLanguages = panels.map(p => p.language);
  const available: Panel['language'][] = ['python', 'java', 'c#', 'javascript', 'algorithm'];
  const nextLang = available.find(l => !openLanguages.includes(l));
  
  if (!nextLang) {
    // All languages are already open
    return;
  }

  const newId = `panel-${Date.now()}-${panelCounter}-${Math.random().toString(36).substring(2, 6)}`;
  setPanelCounter(prev => prev + 1);
  
  const newPanel: Panel = { 
    id: newId, 
    language: nextLang, 
    code: `// ${LANGUAGE_LABELS[nextLang]} solution\n`, 
    isAnalyzing: false 
  };
  setPanels([...panels, newPanel]);
  setActivePanelId(newId);
  executeDatabaseSave(newPanel, selectedProblem.id);
};

// Update panel language
const updatePanelLanguage = (id: string, lang: Panel['language']) => {
  if (!selectedProblem) return;
  setPanels(prev => {
    const updated = prev.map(p => 
      p.id === id ? { ...p, language: lang } : p
    );
    const target = updated.find(p => p.id === id);
    if (target) {
      // Save with the new language
      executeDatabaseSave(target, selectedProblem.id);
    }
    return updated;
  });
};

// Update panel code with debounced save
const updatePanelCode = (id: string, text: string) => {
  if (!selectedProblem) return;
  setPanels(prev => {
    const updated = prev.map(p => p.id === id ? { ...p, code: text } : p);
    const target = updated.find(p => p.id === id);
    if (target) {
      triggerDebouncedAutoSave(target, selectedProblem.id);
    }
    return updated;
  });
};

// Request close tab
const requestCloseTab = (e: React.MouseEvent, id: string) => {
  e.stopPropagation();
  setTabToCloseId(id);
};

// Confirm close tab
const confirmCloseTabAction = () => {
  if (!tabToCloseId) return;
  const targetIndex = panels.findIndex(p => p.id === tabToCloseId);
  const updatedPanels = panels.filter(p => p.id !== tabToCloseId);
  setPanels(updatedPanels);
  setTabToCloseId(null);

  if (activePanelId === tabToCloseId && updatedPanels.length > 0) {
    const nextActiveIndex = Math.max(0, targetIndex - 1);
    setActivePanelId(updatedPanels[nextActiveIndex].id);
  }
};

  return (
    <div className="space-y-4 h-full flex flex-col relative overflow-x-hidden">
      
      {/* CONFIRM DISCARD TAB MODAL */}
      {tabToCloseId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white border border-slate-200 shadow-xl rounded-xl p-5 max-w-xs w-full text-center space-y-4">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-[#FF6B35] border border-orange-100">⚠️</div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Discard Code Changes?</h4>
              <p className="text-[11px] text-slate-400 mt-1">Closing this tab will destroy all buffer code variations built inside this tab footprint.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button onClick={() => setTabToCloseId(null)} className="py-1.5 font-semibold rounded-lg border border-slate-200 bg-white text-slate-500 cursor-pointer">Cancel</button>
              <button onClick={confirmCloseTabAction} className="py-1.5 font-semibold rounded-lg bg-red-500 text-white cursor-pointer">Discard Tab</button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM ANALYZE COMPLEXITY MODAL */}
      {showAnalyzeModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white border border-slate-200 shadow-xl rounded-xl p-5 max-w-sm w-full text-center space-y-4">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-100">🔍</div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Analyze Complexity Metrics?</h4>
              <p className="text-xs text-slate-400 mt-1">This will scan your code for time and space complexity patterns. No changes will be saved to the database.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button onClick={() => setShowAnalyzeModal(false)} className="py-2 font-semibold rounded-lg border border-slate-200 bg-white text-slate-500 cursor-pointer hover:bg-slate-50">Cancel</button>
              <button onClick={confirmAnalyzeAction} className="py-2 font-semibold rounded-lg bg-[#FF6B35] text-white cursor-pointer shadow-sm hover:bg-[#E04E1B]">Analyze</button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM SAVE TO DATABASE MODAL */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white border border-slate-200 shadow-xl rounded-xl p-5 max-w-sm w-full text-center space-y-4">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">💾</div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Save Code to Database?</h4>
              <p className="text-xs text-slate-400 mt-1">Your code and complexity metrics will be committed to Supabase and synced to your solutions vault.</p>
            </div>
            
            {/* Status Selection */}
            <div className="text-left">
              <label className="text-xs font-medium text-slate-600 block mb-1.5">Status:</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedSaveStatus('attempted')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    selectedSaveStatus === 'attempted' 
                      ? 'bg-slate-900 text-white border-slate-900' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Attempted
                </button>
                <button
                  onClick={() => setSelectedSaveStatus('reviewed')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    selectedSaveStatus === 'reviewed' 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Reviewed
                </button>
                <button
                  onClick={() => setSelectedSaveStatus('solved')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    selectedSaveStatus === 'solved' 
                      ? 'bg-emerald-600 text-white border-emerald-600' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Solved
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button onClick={() => setShowSaveModal(false)} className="py-2 font-semibold rounded-lg border border-slate-200 bg-white text-slate-500 cursor-pointer hover:bg-slate-50">Cancel</button>
              <button onClick={confirmSaveAction} className="py-2 font-semibold rounded-lg bg-[#10B981] text-white cursor-pointer shadow-sm hover:bg-[#059669]">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* BREADCRUMB NAVIGATION WITH 'MY SOLUTIONS' ELEMENT ADDITION */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-400 bg-white border border-slate-200/60 p-3 rounded-xl shadow-xs select-none">
        <div className="flex items-center gap-1.5">
          <span className="hover:text-slate-800 cursor-pointer transition-colors" onClick={() => setMode('menu')}>PROBLEMS ROUTE</span>
          <span>/</span>
          <span className={`hover:text-slate-800 cursor-pointer transition-colors uppercase font-semibold ${mode === 'my_solutions' ? 'text-slate-800 font-bold' : ''}`} onClick={() => setMode('my_solutions')}>MY SOLUTIONS</span>
          {track && (mode !== 'menu' && mode !== 'my_solutions') && (
            <>
              <span>/</span>
              <span className={`transition-colors uppercase font-bold ${mode !== 'topic_selected' ? 'hover:text-slate-800 cursor-pointer text-slate-400' : 'text-slate-800'}`} onClick={() => setMode('topic_selected')}>{track.replace('_', ' ')}</span>
            </>
          )}
          {selectedTopic && (mode === 'learn' || mode === 'exercises' || mode === 'workspace') && (
            <>
              <span>/</span>
              <span className={`transition-colors uppercase font-bold ${mode !== 'exercises' && mode !== 'learn' ? 'hover:text-slate-800 cursor-pointer text-slate-400' : 'text-slate-800'}`} onClick={() => setMode('exercises')}>{selectedTopic}</span>
            </>
          )}
          {selectedProblem && (mode === 'workspace') && (
            <>
              <span>/</span>
              <span className="text-[#FF6B35] uppercase font-bold">{selectedProblem.title}</span>
            </>
          )}
        </div>
        {mode === 'workspace' && (
          <button onClick={() => setIsDrawerOpen(!isDrawerOpen)} className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold border rounded-lg bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200 cursor-pointer">📋 {isDrawerOpen ? 'Hide Problem' : 'View Problem'}</button>
        )}
      </div>

      {/* TRACK MENU SELECTION */}
      {mode === 'menu' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div onClick={() => { setTrack('dsa'); setMode('topic_selected'); }} className="bg-white border border-slate-200 p-6 rounded-2xl hover:border-[#10B981] transition-all cursor-pointer shadow-sm group text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-50/40 rounded-full translate-x-6 -translate-y-6 flex items-center justify-center font-mono text-2xl font-bold text-[#10B981]/15">DSA</div>
              <span className="text-xl">📊</span>
              <h2 className="text-base font-bold text-slate-900 mt-4">Data Structures & Algorithms</h2>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">Master multi-level indices, linear arrays, vector stacks, queues, and context-free structures.</p>
            </div>
            <div onClick={() => { setTrack('system_design'); setMode('topic_selected'); }} className="bg-white border border-slate-200 p-6 rounded-2xl hover:border-[#FF6B35] transition-all cursor-pointer shadow-sm group text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 h-24 w-24 bg-orange-50/40 rounded-full translate-x-6 -translate-y-6 flex items-center justify-center font-mono text-2xl font-bold text-[#FF6B35]/15">SYS</div>
              <span className="text-xl">⚡</span>
              <h2 className="text-base font-bold text-slate-900 mt-4">System Design Architecture</h2>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">Design resilient edge networks, concurrent load schedulers, state clusters, and message queues.</p>
            </div>
          </div>

          <div onClick={() => setMode('my_solutions')} className="bg-slate-900 border border-slate-950 p-4 rounded-xl text-left cursor-pointer hover:bg-slate-800 transition-all shadow-sm flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">📦 Solutions Vault</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Review your complete synchronized codebase snapshots and complexity metrics portfolio.</p>
            </div>
            <span className="text-sm">→</span>
          </div>
        </div>
      )}

      {/* DYNAMIC TOPICS LIST VIEW */}
      {mode === 'topic_selected' && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-left">Select Structural Domain Segment</h3>
          {loadingTopics ? (
            <div className="text-xs font-mono text-slate-400 animate-pulse text-left">Syncing index structures data...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {topicsList.map((topicItem) => (
                <div key={topicItem.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 text-left">{topicItem.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 text-left">Comprehensive tracking structures engine footprint components.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <button onClick={() => { setSelectedTopic(topicItem.name); setMode('learn'); }} className="py-1.5 px-2 text-xs font-semibold rounded-md border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 cursor-pointer">🎓 Learn</button>
                    <button onClick={() => { setSelectedTopicEntity(topicItem); setSelectedTopic(topicItem.name); setMode('exercises'); }} className="py-1.5 px-2 text-xs font-semibold rounded-md text-white bg-[#10B981] hover:bg-[#059669] cursor-pointer text-center">🧠 Practice</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* LEARNING PARADIGM CONTAINER */}
      {mode === 'learn' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 text-left max-w-4xl mx-auto">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-orange-50 text-[#FF6B35] uppercase border border-orange-100/50">Core Engineering Blueprint</span>
            <h2 className="text-xl font-bold text-slate-900 mt-2">{selectedTopic} Structural Analysis</h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">Linear allocation arrays represent contiguous indexing slots across physical RAM registers mapping directly to instant offset lookups.</p>
          <button onClick={() => setMode('topic_selected')} className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 cursor-pointer">Return to Hub</button>
        </div>
      )}

      {/* DYNAMIC EXERCISES LIST VIEW */}
      {mode === 'exercises' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm">
            <div className="text-left">
              <h3 className="text-sm font-bold text-slate-800">{selectedTopic} Interactive Exercises</h3>
              <p className="text-xs text-slate-400">Select target algorithm nodes below to deploy execution workspaces.</p>
            </div>
          </div>
          {loadingProblems ? (
            <div className="text-xs font-mono text-slate-400 animate-pulse text-left">Querying cluster elements layout...</div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm divide-y divide-slate-100">
              {problemsList.map((prob) => (
                <div key={prob.id} onClick={() => { setSelectedProblem(prob); setMode('workspace'); setIsDrawerOpen(true); }} className="flex items-center gap-4 p-4 hover:bg-slate-50/80 cursor-pointer group text-left">
                  <span className={`text-[10px] font-bold uppercase tracking-wide border px-2 py-0.5 rounded-md min-w-[54px] text-center ${prob.difficulty === 'Easy' ? 'bg-emerald-50 text-[#10B981] border-emerald-100' : 'bg-orange-50 text-[#FF6B35] border-orange-100'}`}>{prob.difficulty}</span>
                  <span className="text-xs font-semibold text-slate-800 flex-1 group-hover:text-slate-900 transition-colors">{prob.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* NEW NAVIGATION PORTAL PANEL: MY SAVED SOLUTIONS VIEW */}
      {mode === 'my_solutions' && (
        <div className="space-y-4 text-left">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Your Synchronized Solutions Vault</h3>
            <p className="text-xs text-slate-400">All code buffers successfully verified and committed via confirmation modals.</p>
          </div>

          {loadingSolutions ? (
            <div className="text-xs font-mono text-slate-400 animate-pulse">Accessing vault records...</div>
          ) : savedSolutions.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-400 font-mono">
              No solutions committed to the active database cluster yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedSolutions.map((sol) => (
                <div key={sol.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800">{sol.problemTitle}</h4>
                      <span className="text-[10px] uppercase font-mono font-bold bg-slate-100 border px-1.5 py-0.5 rounded text-slate-500">{sol.language}</span>
                    </div>
                    <pre className="w-full mt-2 p-2 bg-slate-900 rounded-lg text-[10px] font-mono text-slate-200 overflow-x-auto max-h-32">
                      {sol.codeContent}
                    </pre>
                  </div>
                  <div className="flex items-center gap-2 border-t border-slate-50 pt-2 text-[10px] font-mono">
                    <span className="text-slate-400">Time: <strong className="text-emerald-500">{sol.timeComplexity || 'N/A'}</strong></span>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-400">Space: <strong className="text-emerald-500">{sol.spaceComplexity || 'N/A'}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => setMode('menu')} className="mt-2 text-xs font-semibold px-4 py-2 bg-slate-900 text-white rounded-lg">Return to Dashboard</button>
        </div>
      )}

      {/* CORE WORKSPACE ENVIRONMENT */}
      {selectedProblem && mode === 'workspace' && (
        <div className="flex-1 gap-4 h-[calc(100vh-160px)] max-h-[calc(100vh-160px)] min-h-[480px] relative items-stretch select-none flex animate-fade-in">
          
          {/* SILENT AUTOSAVE STATE FLOATING CHIP */}
          <div className="absolute top-2 right-4 z-40 text-[9px] font-mono px-2 py-0.5 rounded-md border shadow-xs">
            {isSaving ? (
              <span className="text-orange-600 bg-orange-50 border-orange-100 animate-pulse">● Syncing Changes...</span>
            ) : (
              <span className="text-emerald-600 bg-emerald-50 border-emerald-100">✓ Supabase Synced</span>
            )}
          </div>

          {/* PROBLEM DRAWER SLIDER - With Examples and Explanations */}
          <div className={`bg-white border border-slate-200 rounded-xl p-5 shadow-lg flex flex-col justify-between overflow-y-auto text-left absolute z-30 top-0 bottom-0 left-0 w-[290px] transition-all duration-300 transform h-full ${isDrawerOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'}`}>
            <div className="space-y-4">
              {/* Close Button */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <button onClick={() => setIsDrawerOpen(false)} className="text-slate-400 hover:text-slate-700 text-xs font-mono">✕ Close</button>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowProblemPopup(true)} 
                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition-colors"
                    title="Open in popup for better readability"
                  >
                    📖 Expand
                  </button>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                    {selectedProblem.difficulty}
                  </span>
                </div>
              </div>
              
              {/* Problem Title */}
              <h2 className="text-xs font-bold text-slate-900 leading-relaxed">{selectedProblem.title}</h2>
              
              {/* Problem Description */}
              <div className="bg-slate-50/60 p-3 rounded-lg border border-slate-100">
                <p className="text-xs text-slate-600 leading-relaxed">
                  {selectedProblem.description}
                </p>
              </div>
              
              {/* Examples Section with Explanation */}
              {selectedProblem.examples && selectedProblem.examples.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <span>📝 Examples</span>
                    <span className="h-px flex-1 bg-slate-200"></span>
                  </h3>
                  {selectedProblem.examples.map((ex, idx) => (
                    <div key={idx} className="bg-slate-50 rounded-lg border border-slate-100 overflow-hidden">
                      <div className="bg-slate-100/50 px-3 py-1.5 border-b border-slate-100">
                        <span className="text-[9px] font-mono font-bold text-slate-500">Example {idx + 1}</span>
                      </div>
                      <div className="p-3 space-y-2">
                        {/* Input */}
                        <div className="text-[10px] font-mono flex items-start gap-2">
                          <span className="text-slate-400 min-w-[36px] font-bold">Input:</span>
                          <code className="text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 flex-1">
                            {ex.input}
                          </code>
                        </div>
                        
                        {/* Output */}
                        <div className="text-[10px] font-mono flex items-start gap-2">
                          <span className="text-slate-400 min-w-[36px] font-bold">Output:</span>
                          <code className="text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 flex-1">
                            {ex.output}
                          </code>
                        </div>
                        
                        {/* Explanation */}
                        {ex.explanation && (
                          <div className="mt-1 pt-2 border-t border-slate-200/60">
                            <div className="flex items-start gap-2">
                              <span className="text-[10px] font-mono font-bold text-emerald-600 min-w-[36px]">💡 Exp:</span>
                              <div className="text-[10px] text-slate-600 leading-relaxed flex-1">
                                {ex.explanation}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Exit Button */}
            <button onClick={() => setMode('exercises')} className="w-full mt-4 py-1.5 text-center text-xs font-semibold text-slate-400 hover:text-slate-700 bg-slate-50 rounded-lg border border-slate-100 cursor-pointer transition-colors">
              ← Exit Workspace
            </button>
          </div>

          {/* PROBLEM POPUP MODAL - For easier reading */}
          {showProblemPopup && selectedProblem && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header with Show in Sidebar button */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                      {selectedProblem.difficulty}
                    </span>
                    <h2 className="text-sm font-bold text-slate-900">{selectedProblem.title}</h2>
                  </div>
                  <button 
                    onClick={() => { setShowProblemPopup(false); setIsDrawerOpen(true); }} 
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-[#FF6B35] hover:bg-[#E04E1B] rounded-lg transition-colors shadow-sm whitespace-nowrap"
                  >
                    📋 Show in Sidebar
                  </button>
                </div>
                
                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Description */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</h3>
                    <div className="bg-slate-50/60 p-4 rounded-lg border border-slate-100">
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {selectedProblem.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Examples */}
                  {selectedProblem.examples && selectedProblem.examples.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Examples</h3>
                      <div className="space-y-4">
                        {selectedProblem.examples.map((ex, idx) => (
                          <div key={idx} className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                            <div className="bg-slate-100/50 px-4 py-2 border-b border-slate-200">
                              <span className="text-xs font-mono font-bold text-slate-600">Example {idx + 1}</span>
                            </div>
                            <div className="p-4 space-y-3">
                              <div>
                                <span className="text-xs font-mono font-bold text-slate-500 block mb-1">Input:</span>
                                <code className="text-sm font-mono text-slate-700 bg-white px-3 py-2 rounded border border-slate-200 block whitespace-pre-wrap">
                                  {ex.input}
                                </code>
                              </div>
                              <div>
                                <span className="text-xs font-mono font-bold text-slate-500 block mb-1">Output:</span>
                                <code className="text-sm font-mono text-slate-700 bg-white px-3 py-2 rounded border border-slate-200 block whitespace-pre-wrap">
                                  {ex.output}
                                </code>
                              </div>
                              {ex.explanation && (
                                <div className="mt-2 pt-2 border-t border-slate-200/60">
                                  <span className="text-xs font-mono font-bold text-emerald-600 block mb-1">💡 Explanation:</span>
                                  <p className="text-sm text-slate-600 leading-relaxed">
                                    {ex.explanation}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
              </div>
            </div>
          )}

          {/* SPLIT COLS CONTROLLER */}
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 w-full h-full min-h-0 transition-all duration-300 ${isDrawerOpen ? 'lg:pl-[306px]' : 'pl-0'}`}>
            
            {/* LEFT COLUMN: INDEPENDENT SCROLLING WHITEBOARD */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col h-full min-h-0 overflow-hidden">
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 p-2 rounded-xl mb-3 shrink-0 overflow-x-auto gap-2">
                <div className="flex items-center gap-1">
                  {([
                    { id: 'select', label: '🔀 Select' },
                    { id: 'brush', label: '✏️ Brush' },
                    { id: 'eraser', label: '🧽 Eraser' },
                    { id: 'rectangle', label: '⬜ Box' },
                    { id: 'circle', label: '⭕ Circle' },
                    { id: 'text', label: '🔤 Text Box' }
                  ] as const).map((t) => (
                    <button key={t.id} onClick={() => { setActiveTool(t.id); setSelectedShapeId(null); }} className={`px-2 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${activeTool === t.id ? 'bg-[#FF6B35] text-white border-[#FF6B35]' : 'bg-white text-slate-600 border-slate-200'}`}>{t.label}</button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  {selectedShapeId && activeTool === 'select' && (
                    <button onClick={deleteSelectedShape} className="px-2 py-0.5 text-[10px] font-mono font-bold border border-red-200 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 cursor-pointer">🗑️ Delete</button>
                  )}
                  {activeTool !== 'eraser' && (
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setBrushColor('#FF6B35')} className={`w-3.5 h-3.5 rounded-full bg-[#FF6B35] cursor-pointer ${brushColor === '#FF6B35' ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`} />
                      <button onClick={() => setBrushColor('#10B981')} className={`w-3.5 h-3.5 rounded-full bg-[#10B981] cursor-pointer ${brushColor === '#10B981' ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`} />
                      <button onClick={() => setBrushColor('#0f172a')} className={`w-3.5 h-3.5 rounded-full bg-slate-900 cursor-pointer ${brushColor === '#0f172a' ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`} />
                    </div>
                  )}
                  <div className="w-px h-4 bg-slate-200 mx-0.5" />
                  <button onClick={clearCanvasSpace} className="px-2 py-0.5 text-[10px] font-mono font-bold bg-white text-red-500 border border-slate-200 rounded-lg cursor-pointer">RESET</button>
                </div>
              </div>

              <div className="bg-slate-50/50 rounded-xl border border-slate-200/80 overflow-auto relative flex-1 min-h-0 shadow-inner" style={{ cursor: getToolCursorStyle() }}>
                <div className="w-[2000px] h-[2000px] relative bg-white bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]">
                  <canvas ref={canvasRef} width={2000} height={2000} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onDoubleClick={handleDoubleClick} className="absolute inset-0 block bg-transparent touch-none z-10" />
                  {activeTextBox && (
                    <div className="absolute z-30 border border-dashed border-[#FF6B35] bg-white/95 p-1 rounded shadow-xl flex flex-col" style={{ left: activeTextBox.x, top: activeTextBox.y, width: activeTextBox.w, height: activeTextBox.h }}>
                      <textarea ref={inlineInputRef} value={activeTextBox.text} placeholder="Write something..." onChange={(e) => setActiveTextBox({ ...activeTextBox, text: e.target.value })} onBlur={commitActiveTextBox} className="w-full h-full bg-transparent font-mono text-xs font-bold p-1 outline-none text-slate-800 resize-none border-0 leading-normal" style={{ color: brushColor }} />
                      <div className="flex justify-end p-0.5 shrink-0 bg-slate-50 border-t border-slate-100 rounded-b">
                        <button onMouseDown={(e) => { e.preventDefault(); commitActiveTextBox(); }} className="text-[9px] font-mono font-extrabold px-1.5 py-0.5 bg-[#FF6B35] text-white rounded cursor-pointer">SAVE</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: INDEPENDENT SCROLLING COMPILER EDITOR */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col h-full min-h-0 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3 shrink-0">
                <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
                  {panels.map((p) => (
                    <div key={p.id} onClick={() => setActivePanelId(p.id)} className={`flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-lg border cursor-pointer transition-all whitespace-nowrap ${activePanelId === p.id ? 'bg-slate-900 border-slate-900 text-white' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                      <span>{LANGUAGE_LABELS[p.language]}</span>
                      {panels.length > 1 && (
                        <button onClick={(e) => requestCloseTab(e, p.id)} className="text-[10px] h-3.5 w-3.5 flex items-center justify-center rounded-full font-bold">✕</button>
                      )}
                    </div>
                  ))}
                  <button onClick={createNewPanel} className="px-2 py-1 text-[11px] font-bold text-[#10B981] hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap">➕ New Tab</button>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                {panels.map((p) => {
                  if (p.id !== activePanelId) return null;
                  return (
                    <div key={p.id} className="h-full flex flex-col justify-between text-left space-y-4">
                      <div className="flex-1 flex flex-col min-h-0 space-y-2">
                        <div className="flex items-center justify-between shrink-0">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Configure Sandbox Environment</span>
                          <select value={p.language} onChange={(e) => updatePanelLanguage(p.id, e.target.value as Panel['language'])} className="text-[11px] font-semibold bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded outline-none text-slate-700 cursor-pointer">
                            <option value="python">Python 3.11</option>
                            <option value="java">Java v21</option>
                            <option value="c#">C# Engine</option>
                            <option value="javascript">JavaScript</option>
                            <option value="algorithm">Pseudocode</option>
                          </select>
                        </div>
                        
                        <textarea 
                          value={p.code} 
                          onChange={(e) => updatePanelCode(p.id, e.target.value)} 
                          onKeyDown={(e) => {
                            if (e.key === 'Tab') {
                              e.preventDefault();
                              const target = e.currentTarget;
                              const start = target.selectionStart;
                              const end = target.selectionEnd;
                              const tabSpace = '  '; 
                              const newCode = p.code.substring(0, start) + tabSpace + p.code.substring(end);
                              updatePanelCode(p.id, newCode);
                              setTimeout(() => { target.selectionStart = target.selectionEnd = start + tabSpace.length; }, 0);
                            }
                          }}
                          className="w-full flex-1 min-h-[220px] font-mono text-xs bg-slate-900 text-slate-100 p-3.5 rounded-xl border border-slate-950 focus:border-[#FF6B35] outline-none shadow-inner resize-none leading-relaxed overflow-y-auto" 
                          spellCheck={false} 
                        />
                      </div>

                      <div className="space-y-2 pt-3 border-t border-slate-100 shrink-0">
                        {p.timeComp && (
                          <div className="grid grid-cols-2 gap-2 animate-fade-in">
                            <div className="p-2 rounded-lg border border-emerald-100 bg-emerald-50/40">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Time Complex</span>
                              <span className="text-xs font-mono font-bold text-[#10B981]">{p.timeComp}</span>
                            </div>
                            <div className="p-2 rounded-lg border border-emerald-100 bg-emerald-50/40">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Space Complex</span>
                              <span className="text-xs font-mono font-bold text-[#10B981]">{p.spaceComp}</span>
                            </div>
                          </div>
                        )}
                        
                        {/* TWO SEPARATE BUTTONS */}
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={() => requestComplexityAnalysis(p.id)} 
                            disabled={p.isAnalyzing} 
                            className="py-2 rounded-lg bg-[#FF6B35] hover:bg-[#E04E1B] disabled:bg-slate-200 text-white font-semibold text-xs transition-all shadow-md cursor-pointer"
                          >
                            {p.isAnalyzing ? 'Analyzing...' : '🔍 Analyze'}
                          </button>
                          
                          <button 
                            onClick={() => requestManualSave(p.id)} 
                            disabled={saveStatus[p.id] === 'saving'} 
                            className="py-2 rounded-lg bg-[#10B981] hover:bg-[#059669] disabled:bg-slate-200 text-white font-semibold text-xs transition-all shadow-md cursor-pointer"
                          >
                            {saveStatus[p.id] === 'saving' ? 'Saving...' : 
                            saveStatus[p.id] === 'saved' ? '✓ Saved!' : 
                            saveStatus[p.id] === 'error' ? '⚠️ Error' : '💾 Save'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}