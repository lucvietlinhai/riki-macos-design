
import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { LoadingSpinner, WandIcon, UndoIcon, TrashIcon, XIcon, PencilIcon, EyeIcon, HandIcon, PlusIcon, CheckIcon, UploadIcon, PhotoIcon } from '../constants';
import { useI18n } from '../i18n';
import type { GeneratedImage, SelectionBox, ImageFile } from '../types';

// Icons
const EraserIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M19 20h-10.5l-4.21 -4.3a1 1 0 0 1 0 -1.41l10 -10a1 1 0 0 1 1.41 0l5 5a1 1 0 0 1 0 1.41l-9.2 9.3" />
      <path d="M18 13.3l-6.3 -6.3" />
    </svg>
);

const SelectIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <path d="M8 8m0 2a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2z" />
        <path d="M8 4l0 .01" /><path d="M4 4l0 .01" /><path d="M4 8l0 .01" /><path d="M4 12l0 .01" /><path d="M4 16l0 .01" /><path d="M8 16l0 .01" /><path d="M12 16l0 .01" />
        <path d="M16 16l0 .01" /><path d="M20 16l0 .01" /><path d="M20 12l0 .01" /><path d="M20 8l0 .01" /><path d="M20 4l0 .01" /><path d="M16 4l0 .01" /><path d="M12 4l0 .01" />
    </svg>
);

const CommentIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <path d="M3 20l1.3 -3.9a9 8 0 1 1 3.4 2.9l-4.7 1" />
        <path d="M12 12l0 .01" />
        <path d="M8 12l0 .01" />
        <path d="M16 12l0 .01" />
    </svg>
);

const UndoImageIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <path d="M12 13h-5l2 2" /><path d="M9 11l-2 2" />
        <path d="M16.5 13h1.5a4 4 0 0 1 0 8h-2" />
    </svg>
);

const RedoImageIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <path d="M12 13h5l-2 2" /><path d="M15 11l2 2" />
        <path d="M7.5 13h-1.5a4 4 0 0 0 0 8h2" />
    </svg>
);


interface ImageEditorModalProps {
    onClose: () => void;
    onSave: (data: { mask: string, prompt: string, selection?: SelectionBox, referenceImages?: ImageFile[] }) => void;
    isLoading: boolean;
    image: GeneratedImage | null;
}

type Tool = 'select' | 'brush' | 'eraser' | 'pan';
type ViewMode = 'mask' | 'image' | 'both';

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({ onClose, onSave, isLoading, image }) => {
    const { t } = useI18n();
    const containerRef = useRef<HTMLDivElement>(null);
    const bgCanvasRef = useRef<HTMLCanvasElement>(null);
    const drawCanvasRef = useRef<HTMLCanvasElement>(null);
    const cursorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Core State
    const [tool, setTool] = useState<Tool>('select');
    const [lastTool, setLastTool] = useState<Tool>('select'); // Track last tool for Space key toggle
    const [brushSize, setBrushSize] = useState(40);
    const [editPrompt, setEditPrompt] = useState('');
    
    // Canvas History State (Strokes)
    const [history, setHistory] = useState<ImageData[]>([]);
    
    // Image Generation History (Full Images)
    const [imageHistory, setImageHistory] = useState<string[]>([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(-1);

    // Selection & Manipulation
    const [isDrawing, setIsDrawing] = useState(false);
    const [selection, setSelection] = useState<SelectionBox | null>(null);
    const selectionStartRef = useRef<{x: number, y: number} | null>(null);
    const [referenceImages, setReferenceImages] = useState<ImageFile[]>([]);

    // Viewport
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [isSpacePressed, setIsSpacePressed] = useState(false); 
    const panStartRef = useRef({ x: 0, y: 0 });
    const [viewMode, setViewMode] = useState<ViewMode>('both');
    const [aspectRatio, setAspectRatio] = useState<number>(1);
    const [cursorPos, setCursorPos] = useState<{x: number, y: number} | null>(null);
    
    const getContext = (canvas: HTMLCanvasElement | null) => canvas?.getContext('2d', { willReadFrequently: true });

    // --- Image Loading & Syncing ---
    
    // Initialize or Update Image from Props
    useEffect(() => {
        if (!image) return;

        const currentSrc = imageHistory[currentImageIndex];
        
        if (currentImageIndex === -1 || (currentSrc && currentSrc !== image.src)) {
             setImageHistory(prev => {
                 const newHist = [...prev.slice(0, currentImageIndex + 1), image.src];
                 return newHist;
             });
             setCurrentImageIndex(prev => prev + 1);
        }
    }, [image]);

    // Redraw Canvas when Current Image Index Changes
    useEffect(() => {
        if (currentImageIndex === -1 || !imageHistory[currentImageIndex]) return;
        
        const src = imageHistory[currentImageIndex];
        const imageEl = new Image();
        imageEl.crossOrigin = 'anonymous';
        imageEl.src = src;
        
        imageEl.onload = () => {
            const canvases = [bgCanvasRef.current, drawCanvasRef.current];
            
            canvases.forEach(canvas => {
                if (!canvas) return;
                canvas.width = imageEl.width;
                canvas.height = imageEl.height;
            });
            setAspectRatio(imageEl.width / imageEl.height);
            
            const bgCtx = getContext(bgCanvasRef.current);
            if (bgCtx) {
                bgCtx.clearRect(0,0, imageEl.width, imageEl.height);
                bgCtx.drawImage(imageEl, 0, 0);
            }

            const drawCtx = getContext(drawCanvasRef.current);
            if (drawCtx) {
                drawCtx.clearRect(0, 0, imageEl.width, imageEl.height);
                setHistory([drawCtx.getImageData(0, 0, imageEl.width, imageEl.height)]);
            }
            setSelection(null);
            
            if (currentImageIndex === 0) {
                 setZoom(1);
                 setPan({ x: 0, y: 0 });
            }
        };

    }, [currentImageIndex, imageHistory]);


    // --- Image History Navigation ---
    const handleUndoImage = () => {
        if (currentImageIndex > 0) {
            setCurrentImageIndex(prev => prev - 1);
        }
    };

    const handleRedoImage = () => {
        if (currentImageIndex < imageHistory.length - 1) {
            setCurrentImageIndex(prev => prev + 1);
        }
    };


    // --- High Precision Coordinates ---
    const getCoords = (e: React.MouseEvent | React.TouchEvent): { x: number, y: number } => {
        const canvas = drawCanvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        
        const rect = canvas.getBoundingClientRect();
        
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = Math.round((clientX - rect.left) * scaleX);
        const y = Math.round((clientY - rect.top) * scaleY);

        return { x, y };
    };

    // --- Shortcuts & Events ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const activeElement = document.activeElement;
            const isInput = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';

            if (isInput && e.key !== 'Escape') return;

            // Space key logic for Panning
            if (e.code === 'Space' && !e.repeat && !isInput) {
                e.preventDefault();
                setIsSpacePressed(true);
                // Remember current tool if not already panning
                if (tool !== 'pan') {
                    setLastTool(tool);
                    setTool('pan');
                }
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                handleUndo();
            }
            if (e.key === '[') {
                setBrushSize(prev => Math.max(1, prev - 5));
            }
            if (e.key === ']') {
                setBrushSize(prev => Math.min(200, prev + 5));
            }
            if (e.key === 'Escape') {
                onClose();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                handleGenerate();
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault();
                setIsSpacePressed(false);
                setIsPanning(false); 
                // Restore previous tool
                if (lastTool && lastTool !== 'pan') {
                    setTool(lastTool);
                } else if (tool === 'pan') {
                    // Default fallback if no last tool stored (rare)
                    setTool('select');
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [history, onClose, tool, lastTool]); 

    // --- Drawing / Selection Logic ---
    const cursorStyle = tool === 'pan' || isPanning ? 'grab' : tool === 'select' ? 'crosshair' : 'none';

    const startAction = (e: React.MouseEvent | React.TouchEvent) => {
        if (tool === 'pan' || (e as React.MouseEvent).button === 1 || (e as React.MouseEvent).shiftKey) {
            setIsPanning(true);
            const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
            panStartRef.current = { x: clientX - pan.x, y: clientY - pan.y };
            return;
        }

        const { x, y } = getCoords(e);

        if (tool === 'select') {
            selectionStartRef.current = { x, y };
            setSelection(null); 
            setIsDrawing(true);
        } else {
            // Brush / Eraser
            const ctx = getContext(drawCanvasRef.current);
            if (!ctx) return;
            setIsDrawing(true);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y); 
            ctx.stroke();
        }
    };

    const moveAction = (e: React.MouseEvent | React.TouchEvent) => {
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        
        // Update custom cursor position (Screen coordinates)
        setCursorPos({ x: clientX, y: clientY });

        if (isPanning) {
            e.preventDefault();
            setPan({ x: clientX - panStartRef.current.x, y: clientY - panStartRef.current.y });
            return;
        }

        if (!isDrawing) return;
        e.preventDefault();
        const { x, y } = getCoords(e);
        
        if (tool === 'select' && selectionStartRef.current) {
            const startX = selectionStartRef.current.x;
            const startY = selectionStartRef.current.y;
            const width = x - startX;
            const height = y - startY;
            
            setSelection({
                x: width > 0 ? startX : x,
                y: height > 0 ? startY : y,
                width: Math.abs(width),
                height: Math.abs(height)
            });
        } else if (tool === 'brush' || tool === 'eraser') {
            const ctx = getContext(drawCanvasRef.current);
            if (!ctx) return;
            
            ctx.lineWidth = brushSize; 
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            if (tool === 'brush') {
                ctx.globalCompositeOperation = 'source-over';
                ctx.strokeStyle = `rgba(139, 92, 246, 0.6)`;
            } else {
                ctx.globalCompositeOperation = 'destination-out';
            }
            
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    };
    
    const stopAction = () => {
        if (isPanning) {
            setIsPanning(false);
            return;
        }
        if (!isDrawing) return;
        
        if (tool === 'brush' || tool === 'eraser') {
            const ctx = getContext(drawCanvasRef.current);
            ctx?.closePath();
            const canvas = drawCanvasRef.current;
            if (canvas && ctx) {
                // Save state to history after stroke
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                setHistory(prev => {
                    const newHist = [...prev, imageData];
                    // Limit history size to 20 steps
                    if (newHist.length > 20) return newHist.slice(newHist.length - 20);
                    return newHist;
                });
            }
        }
        
        if (tool === 'select' && selection) {
             if (selection.width < 5 || selection.height < 5) setSelection(null); 
        }

        setIsDrawing(false);
        selectionStartRef.current = null;
    };

    // --- Mask & Canvas Ops ---

    const handleUndo = () => {
        if (history.length <= 1) { 
            handleClearMask(); 
            return; 
        }
        
        // Remove the last state
        const newHistory = history.slice(0, -1);
        setHistory(newHistory);
        
        // Restore the previous state
        const lastState = newHistory[newHistory.length - 1];
        const ctx = getContext(drawCanvasRef.current);
        if (ctx && lastState) {
            ctx.clearRect(0, 0, drawCanvasRef.current!.width, drawCanvasRef.current!.height);
            ctx.putImageData(lastState, 0, 0);
        }
    };
    
    const handleClearMask = () => {
        const canvas = drawCanvasRef.current;
        const ctx = getContext(canvas);
        if(canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Reset history to clean state
            setHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)]);
            if(selection) setSelection(null);
        }
    };

    const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        
        Array.from(files).forEach((file: File) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                 setReferenceImages(prev => [...prev, { base64: ev.target?.result as string, mimeType: file.type }]);
            };
            reader.readAsDataURL(file);
        });
    };
    

    const handleGenerate = useCallback(() => {
        if (!editPrompt.trim()) { 
             alert(t('promptPlaceholder')); 
             return; 
        }

        const drawCanvas = drawCanvasRef.current;
        if (!drawCanvas) return;
        
        // 1. Prepare Mask (Black & White)
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = drawCanvas.width;
        maskCanvas.height = drawCanvas.height;
        const maskCtx = getContext(maskCanvas);
        if (!maskCtx) return;

        // Black background (Keep)
        maskCtx.fillStyle = '#000000'; 
        maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
        
        // Check if brush mask exists
        const brushData = getContext(drawCanvas)?.getImageData(0,0,drawCanvas.width, drawCanvas.height);
        let hasBrush = false;
        if (brushData) {
             for(let i=3; i<brushData.data.length; i+=4) {
                 if(brushData.data[i] > 0) { hasBrush = true; break; }
             }
        }

        let finalMaskDataUrl = '';

        if (hasBrush) {
            maskCtx.drawImage(drawCanvas, 0, 0);
            const idata = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
            for (let i = 0; i < idata.data.length; i += 4) {
                if (idata.data[i + 3] > 20) { 
                    idata.data[i] = 255; idata.data[i+1] = 255; idata.data[i+2] = 255; idata.data[i+3] = 255;
                } else {
                    idata.data[i] = 0; idata.data[i+1] = 0; idata.data[i+2] = 0; idata.data[i+3] = 255;
                }
            }
            maskCtx.putImageData(idata, 0, 0);
            finalMaskDataUrl = maskCanvas.toDataURL('image/png');
        } else if (selection) {
            // If only selection, fill selection white
            maskCtx.fillStyle = '#FFFFFF';
            maskCtx.fillRect(selection.x, selection.y, selection.width, selection.height);
            finalMaskDataUrl = maskCanvas.toDataURL('image/png');
        } else {
             // Fallback if user clicked Go with prompt but no mask/selection
             maskCtx.fillStyle = '#FFFFFF';
             maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
             finalMaskDataUrl = maskCanvas.toDataURL('image/png');
        }
        
        onSave({ 
            mask: finalMaskDataUrl, 
            prompt: editPrompt,
            selection: selection || undefined,
            referenceImages: referenceImages
        });
        
        // Clear prompt to be ready for next input
        setEditPrompt('');
        
    }, [editPrompt, selection, referenceImages, onSave]);

    const handleWheel = (e: React.WheelEvent) => {
        // Prevent default zoom if Ctrl/Cmd key is pressed (browser default)
        // But here we want to support zoom without modifier or with specific intent
        // Standard behavior: Wheel scrolls, Ctrl+Wheel zooms.
        // For canvas apps: Wheel often zooms or pans.
        // Let's implement Zoom on Wheel always for better UX in modal.
        
        if (e.target === containerRef.current || (e.target as HTMLElement).closest('canvas')) {
             e.preventDefault();
             // Zoom logic
             const delta = e.deltaY > 0 ? 0.9 : 1.1;
             setZoom(z => Math.max(0.1, Math.min(5, z * delta)));
        }
    };

    if (!image) return null;

    // Calc Cursor Size relative to screen
    const displayBrushSize = brushSize * zoom;

    // Determine active state for 'pan' tool visualization
    const isPanToolActive = tool === 'pan';

    return (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md flex items-center justify-center z-50 overflow-hidden text-slate-200 font-sans">
            <div className="w-full h-full flex flex-col md:flex-row overflow-hidden relative">
                
                {/* Left Toolbar */}
                <div className="w-full md:w-20 bg-black/60 border-b md:border-b-0 md:border-r border-white/10 flex md:flex-col items-center justify-start p-3 gap-6 z-30 shadow-2xl backdrop-blur-md">
                    <div className="flex md:flex-col gap-3 w-full justify-center items-center">
                        <button onClick={() => setTool('select')} className={`p-3 rounded-xl transition-all ${tool === 'select' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`} title="Marquee Select">
                            <SelectIcon className="w-6 h-6" />
                        </button>
                        <button onClick={() => setTool('brush')} className={`relative group p-3 rounded-xl transition-all duration-200 ${tool === 'brush' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 ring-1 ring-white/20' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`} title={t('pen')}>
                            <PencilIcon className="w-6 h-6" />
                        </button>
                        <button onClick={() => setTool('eraser')} className={`p-3 rounded-xl transition-all ${tool === 'eraser' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`} title={t('eraser')}>
                            <EraserIcon className="w-6 h-6" />
                        </button>
                        <div className="w-px h-8 md:w-8 md:h-px bg-white/10 mx-auto"></div>
                        <button onClick={() => setTool('pan')} className={`p-3 rounded-xl transition-all ${isPanToolActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`} title={`${t('panTool')} (Hold Space)`}>
                            <HandIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex md:flex-col gap-3 mt-auto">
                        <div className="flex flex-col gap-1 items-center">
                            <button onClick={handleUndo} disabled={history.length <= 1} className="p-3 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl disabled:opacity-30 transition-all" title={`${t('undo')} Stroke (Ctrl+Z)`}>
                                <UndoIcon className="w-6 h-6" />
                            </button>
                            <span className="text-[9px] text-slate-600">MASK</span>
                        </div>
                        
                        {/* Image History Undo/Redo */}
                         <div className="flex flex-col gap-1 items-center border-t border-white/10 pt-2">
                             <button onClick={handleUndoImage} disabled={currentImageIndex <= 0} className="p-3 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl disabled:opacity-30 transition-all" title="Undo Generation">
                                <UndoImageIcon className="w-6 h-6" />
                            </button>
                            <button onClick={handleRedoImage} disabled={currentImageIndex >= imageHistory.length - 1} className="p-3 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl disabled:opacity-30 transition-all" title="Redo Generation">
                                <RedoImageIcon className="w-6 h-6" />
                            </button>
                            <span className="text-[9px] text-slate-600">IMAGE</span>
                        </div>

                         <button onClick={onClose} className="p-3 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-xl md:hidden" title={t('close')}>
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Center Canvas Area */}
                <div className="flex-grow relative bg-slate-900/50 overflow-hidden flex flex-col">
                    
                    {/* Loading Overlay */}
                    {isLoading && (
                        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                            <LoadingSpinner />
                            <p className="mt-4 text-sm font-semibold tracking-wide animate-pulse">{t('aiCreative')}</p>
                        </div>
                    )}

                    {/* Top Info Bar */}
                    <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start pointer-events-none">
                         <div className="flex gap-2 pointer-events-auto">
                            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md p-2 rounded-xl border border-white/10 shadow-lg">
                                <button onClick={() => setViewMode(viewMode === 'image' ? 'both' : 'image')} className={`p-2 rounded-lg transition-all ${viewMode === 'image' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'}`} title={t('toggleMaskView')}>
                                    <EyeIcon className="w-5 h-5" />
                                </button>
                                <span className="text-xs font-bold text-slate-300 px-2 min-w-[50px] text-center">{Math.round(zoom * 100)}%</span>
                            </div>
                         </div>
                         <button onClick={onClose} className="hidden md:flex pointer-events-auto p-2.5 bg-black/40 hover:bg-red-500/80 text-white rounded-full backdrop-blur border border-white/10 transition-all shadow-lg">
                            <XIcon className="w-5 h-5"/>
                         </button>
                    </div>

                    {/* Custom Cursor Overlay */}
                    {cursorPos && !isPanning && (tool === 'brush' || tool === 'eraser') && (
                        <div 
                            ref={cursorRef}
                            className="fixed pointer-events-none rounded-full border-2 border-white/80 shadow-[0_0_5px_rgba(0,0,0,0.5)] z-[100] mix-blend-difference"
                            style={{
                                width: displayBrushSize,
                                height: displayBrushSize,
                                left: cursorPos.x,
                                top: cursorPos.y,
                                transform: 'translate(-50%, -50%)',
                                transition: 'width 0.1s, height 0.1s'
                            }}
                        />
                    )}

                    {/* Canvas Wrapper */}
                    <div 
                        ref={containerRef}
                        className="flex-grow relative overflow-hidden checkerboard flex justify-center items-center"
                        onWheel={handleWheel}
                        onMouseDown={startAction}
                        onMouseMove={moveAction}
                        onMouseUp={stopAction}
                        onMouseLeave={stopAction}
                        onTouchStart={startAction}
                        onTouchMove={moveAction}
                        onTouchEnd={stopAction}
                        style={{ cursor: cursorStyle, touchAction: 'none' }}
                    >
                        <div 
                            className="relative transition-transform duration-100 ease-linear shadow-2xl"
                            style={{
                                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                                maxWidth: '90%', 
                                maxHeight: '90%',
                                aspectRatio: `${aspectRatio}`,
                            }}
                        >
                            <canvas ref={bgCanvasRef} className="block w-full h-full rounded-sm" style={{ pointerEvents: 'none' }} />

                            {/* Mask Drawing Layer */}
                            <canvas 
                                ref={drawCanvasRef} 
                                className="absolute top-0 left-0 block w-full h-full mix-blend-normal opacity-70 rounded-sm"
                                style={{ display: viewMode === 'image' ? 'none' : 'block' }}
                            />

                            {/* Selection Overlay (Percentage based) */}
                            {selection && drawCanvasRef.current && (
                                <div 
                                    className="absolute border-2 border-white/80 shadow-[0_0_15px_rgba(100,200,255,0.8),inset_0_0_10px_rgba(100,200,255,0.4)] pointer-events-none rounded-sm animate-pulse"
                                    style={{
                                        left: `${(selection.x / drawCanvasRef.current.width) * 100}%`,
                                        top: `${(selection.y / drawCanvasRef.current.height) * 100}%`,
                                        width: `${(selection.width / drawCanvasRef.current.width) * 100}%`,
                                        height: `${(selection.height / drawCanvasRef.current.height) * 100}%`,
                                        zIndex: 10
                                    }}
                                >
                                     {isLoading && <div className="absolute inset-0 bg-indigo-500/20 animate-pulse"></div>}
                                </div>
                            )}
                            
                            {/* Aurora Glow while loading if no selection */}
                            {isLoading && !selection && (
                                 <div className="absolute inset-0 shadow-[inset_0_0_50px_rgba(139,92,246,0.5)] animate-pulse pointer-events-none rounded-sm"></div>
                            )}
                        </div>
                    </div>

                    {/* Controls Bar (Bottom) */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 z-20 pointer-events-none">
                         <div className="bg-black/70 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl pointer-events-auto flex flex-col gap-4">
                             
                             {/* Top Row: Brush Size, Refs, & Swap */}
                             <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('brushSize')}</span>
                                    <input 
                                        type="range" min="1" max="200" value={brushSize} 
                                        onChange={(e) => setBrushSize(Number(e.target.value))}
                                        className="w-24 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Reference Images Button */}
                                    <button 
                                        onClick={() => fileInputRef.current?.click()} 
                                        className={`relative p-1.5 rounded-lg text-xs border flex items-center gap-1 transition-all ${referenceImages.length > 0 ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200' : 'bg-slate-800 hover:bg-slate-700 border-white/10 text-slate-300'}`}
                                        title="Add Reference Images (Style/Object)"
                                    >
                                        <PhotoIcon className="w-3.5 h-3.5"/> 
                                        <span className="hidden sm:inline">Ref Imgs</span>
                                        {referenceImages.length > 0 && <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-indigo-500 text-[8px] font-bold text-white">{referenceImages.length}</span>}
                                    </button>
                                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleReferenceUpload} multiple accept="image/*"/>
                                </div>
                                <div className="flex gap-2">
                                     <button onClick={handleClearMask} className="px-3 py-1.5 bg-slate-800 hover:bg-red-900/40 text-red-300 rounded-lg text-xs font-medium border border-white/5 transition-colors">{t('clear')}</button>
                                </div>
                             </div>

                             {/* Prompt Input Row */}
                             <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <CommentIcon className={`w-5 h-5 ${selection || history.length > 1 ? 'text-indigo-400' : 'text-slate-600'}`} />
                                </div>
                                <input 
                                    type="text"
                                    className="block w-full pl-10 pr-24 py-3 bg-white/5 border border-white/10 rounded-xl text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white/10 transition-all text-white"
                                    placeholder={selection ? "Describe change in selected region..." : "Select area or mask to edit..."}
                                    value={editPrompt}
                                    onChange={(e) => setEditPrompt(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                                />
                                <button 
                                    onClick={handleGenerate}
                                    disabled={isLoading || !editPrompt.trim()}
                                    className="absolute right-1.5 top-1.5 bottom-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 rounded-lg font-bold text-xs transition-all disabled:opacity-0 disabled:scale-90 flex items-center gap-2"
                                    title="Ctrl + Enter"
                                >
                                    <WandIcon className="w-3 h-3" /> Go
                                </button>
                             </div>
                             
                             {/* Context Hint */}
                             {!selection && history.length <= 1 && <p className="text-[10px] text-center text-slate-500 italic">Draw a box or mask to start editing. Hold SPACE to Pan. Scroll to Zoom.</p>}
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
