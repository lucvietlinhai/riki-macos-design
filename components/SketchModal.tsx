import React, { useRef, useEffect, useState, useCallback, useLayoutEffect } from 'react';
import { PencilIcon, TrashIcon, MaximizeIcon, MinimizeIcon, XIcon, UndoIcon } from '../constants';
import { useI18n } from '../i18n';

// Tabler Icon: icon-eraser
const EraserIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <path d="M19 20h-10.5l-4.21 -4.3a1 1 0 0 1 0 -1.41l10 -10a1 1 0 0 1 1.41 0l5 5a1 1 0 0 1 0 1.41l-9.2 9.3" />
    <path d="M18 13.3l-6.3 -6.3" />
  </svg>
);

interface SketchModalProps {
  onClose: () => void;
  onSave: (dataUrl: string) => void;
}

type Tool = 'pen' | 'eraser';

const grayscalePalette: string[] = ['#000000', '#4b5563', '#9ca3af', '#d1d5db', '#e5e7eb', '#f3f4f6', '#ffffff'];


export const SketchModal: React.FC<SketchModalProps> = ({ onClose, onSave }) => {
    const { t } = useI18n();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const lastPointRef = useRef<{ x: number, y: number } | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [history, setHistory] = useState<ImageData[]>([]);

    const [tool, setTool] = useState<Tool>('pen');
    const [brushSize, setBrushSize] = useState(5);
    const [brushColor, setBrushColor] = useState('#000000');
    const [isFullScreen, setIsFullScreen] = useState(false);
    
    const backgroundColor = '#FFFFFF';

    const setupCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        const context = canvas.getContext('2d');
        if (!context) return;
        
        context.scale(dpr, dpr);
        contextRef.current = context;
        
        if (history.length > 0) {
            const lastState = history[history.length - 1];
            // If dimensions changed, redraw the last state scaled
            if (lastState.width !== canvas.width || lastState.height !== canvas.height) {
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');
                if (tempCtx) {
                    tempCanvas.width = lastState.width;
                    tempCanvas.height = lastState.height;
                    tempCtx.putImageData(lastState, 0, 0);
                    context.drawImage(tempCanvas, 0, 0, rect.width, rect.height);
                }
            } else {
                 context.putImageData(lastState, 0, 0);
            }
        } else {
             context.fillStyle = backgroundColor;
             context.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
             setHistory([context.getImageData(0, 0, canvas.width, canvas.height)]);
        }
    }, [history, backgroundColor]);
    
    useLayoutEffect(() => {
        setupCanvas();
        window.addEventListener('resize', setupCanvas);
        return () => {
            window.removeEventListener('resize', setupCanvas);
        };
    }, [setupCanvas, isFullScreen]);

    const getCoords = (e: React.MouseEvent | React.TouchEvent): { x: number, y: number } => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };
    
    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        const ctx = contextRef.current;
        if (!ctx) return;
        const { x, y } = getCoords(e);
        
        setIsDrawing(true);
        lastPointRef.current = { x, y };

        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if (tool === 'pen') {
            const rgb = hexToRgb(brushColor);
            const pencilOpacity = 0.6; 
            ctx.strokeStyle = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${pencilOpacity})` : brushColor;
            ctx.fillStyle = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${pencilOpacity})` : brushColor;
        } else { // eraser
            ctx.strokeStyle = backgroundColor;
            ctx.fillStyle = backgroundColor;
        }
        
        ctx.beginPath();
        ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const stopDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        const ctx = contextRef.current;
        if (!ctx || !isDrawing) return;
        
        ctx.closePath();
        setIsDrawing(false);
        lastPointRef.current = null;

        const canvas = canvasRef.current;
        if (canvas) {
            setHistory(prev => [...prev, ctx.getImageData(0, 0, canvas.width, canvas.height)]);
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        if (!isDrawing || !contextRef.current) return;
        const ctx = contextRef.current;
        const { x, y } = getCoords(e);
        const lastPoint = lastPointRef.current;

        if (!lastPoint) return;
        const midPoint = { x: (lastPoint.x + x) / 2, y: (lastPoint.y + y) / 2 };
        ctx.quadraticCurveTo(lastPoint.x, lastPoint.y, midPoint.x, midPoint.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(midPoint.x, midPoint.y);
        
        lastPointRef.current = { x, y };
    };
    
    const handleClear = useCallback(() => {
        const canvas = canvasRef.current;
        const context = contextRef.current;
        if (canvas && context) {
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            context.fillStyle = backgroundColor;
            context.fillRect(0, 0, rect.width, rect.height);
            setHistory([context.getImageData(0, 0, canvas.width, canvas.height)]);
        }
    }, [backgroundColor]);

    const handleUndo = useCallback(() => {
        if (history.length <= 1) return;
        const newHistory = [...history];
        newHistory.pop();
        const lastState = newHistory[newHistory.length - 1];
        const ctx = contextRef.current;
        if (ctx && lastState) {
            ctx.putImageData(lastState, 0, 0);
            setHistory(newHistory);
        }
    }, [history]);

    const handleSave = useCallback(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const saveCanvas = document.createElement('canvas');
            const saveCtx = saveCanvas.getContext('2d');
            if (!saveCtx) return;
            
            const rect = canvas.getBoundingClientRect();
            const targetSize = 1024;
            saveCanvas.width = targetSize;
            saveCanvas.height = targetSize * (rect.height / rect.width);
            
            saveCtx.fillStyle = '#FFFFFF';
            saveCtx.fillRect(0, 0, saveCanvas.width, saveCanvas.height);
            saveCtx.drawImage(canvas, 0, 0, saveCanvas.width, saveCanvas.height);
            
            onSave(saveCanvas.toDataURL('image/png'));
        }
    }, [onSave]);
    
    const toggleFullScreen = () => {
        setIsFullScreen(p => !p);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (isFullScreen) {
                    setIsFullScreen(false);
                } else {
                    onClose();
                }
                e.preventDefault();
            } else if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                handleUndo();
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                handleSave();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose, handleUndo, handleSave, isFullScreen]);

    const pencilCursor = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' stroke-width='2' stroke='black' fill='none' stroke-linecap='round' stroke-linejoin='round'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M4 20h4l10.5 -10.5a1.5 1.5 0 0 0 -4 -4l-10.5 10.5v4' /><line x1='13.5' y1='6.5' x2='17.5' y2='10.5' /></svg>") 4 20, auto`;
    const canvasCursorStyle = tool === 'pen' ? pencilCursor : 'crosshair';

    const containerClasses = isFullScreen 
        ? "bg-white dark:bg-zinc-900 w-full h-full flex flex-col"
        : "bg-white dark:bg-zinc-900 border border-slate-300 dark:border-white/10 rounded-lg shadow-2xl w-full max-w-4xl flex flex-col h-[95vh]";

    return (
        <div className={isFullScreen ? "fixed inset-0 bg-white dark:bg-zinc-950 z-50 flex flex-col p-0" : "fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"} aria-modal="true" onContextMenu={(e) => e.preventDefault()} onClick={isFullScreen ? undefined : onClose}>
            <div className={containerClasses} onClick={e => e.stopPropagation()}>
                <header className="p-3 border-b border-slate-200 dark:border-white/10 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-zinc-200">{t('sketchpad')}</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={toggleFullScreen} className="p-2 rounded-md text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title={isFullScreen ? t('exitFullscreen') : t('fullscreen')}>
                             {isFullScreen ? <MinimizeIcon className="w-5 h-5" /> : <MaximizeIcon className="w-5 h-5" />}
                        </button>
                        <button onClick={onClose} className="p-2 rounded-md text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" aria-label={t('close')}>
                            <XIcon className="w-5 h-5"/>
                        </button>
                    </div>
                </header>
                
                <div className="flex-shrink-0 p-2 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-900/50 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                    {/* Tools */}
                    <div className="flex items-center gap-1 bg-slate-200 dark:bg-zinc-950/50 p-1 rounded-md">
                       <button onClick={() => setTool('pen')} title={t('pen')} className={`p-2 rounded-md transition-colors ${tool === 'pen' ? 'bg-white text-orange-500 dark:bg-zinc-700 dark:text-white shadow-sm' : 'text-slate-500 dark:text-zinc-400 hover:bg-white/50 dark:hover:bg-slate-700'}`} aria-pressed={tool === 'pen'}><PencilIcon className="w-5 h-5" /></button>
                       <button onClick={() => setTool('eraser')} title={t('eraser')} className={`p-2 rounded-md transition-colors ${tool === 'eraser' ? 'bg-white text-orange-500 dark:bg-zinc-700 dark:text-white shadow-sm' : 'text-slate-500 dark:text-zinc-400 hover:bg-white/50 dark:hover:bg-slate-700'}`} aria-pressed={tool === 'eraser'}><EraserIcon className="w-5 h-5" /></button>
                    </div>
                    
                    {/* Colors */}
                    <div className="flex items-center gap-1.5">
                        {grayscalePalette.map(color => (
                            <button key={color} onClick={() => { setBrushColor(color); setTool('pen'); }} className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${brushColor === color && tool === 'pen' ? 'border-orange-500 ring-2 ring-orange-300' : 'border-slate-300 dark:border-zinc-600'}`} style={{ backgroundColor: color }} aria-label={`${t('selectColor')} ${color}`} />
                        ))}
                    </div>

                     {/* Brush Size */}
                    <div className="flex items-center gap-2">
                        <label htmlFor="brushSize" className="text-sm font-medium text-slate-500 dark:text-zinc-400 sr-only">{t('brushSize')}</label>
                        <PencilIcon className="w-4 h-4 text-slate-400"/>
                        <input id="brushSize" type="range" min="1" max="50" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-24 accent-orange-500" />
                        <span className="text-sm w-8 text-center text-slate-600 dark:text-zinc-300">{brushSize}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 bg-slate-200 dark:bg-zinc-950/50 p-1 rounded-md">
                        <button onClick={handleUndo} title={`${t('undo')} (Ctrl+Z)`} className="p-2 rounded-md text-slate-500 dark:text-zinc-400 hover:bg-white/50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={history.length <= 1}>
                            <UndoIcon className="w-5 h-5" />
                        </button>
                        <button onClick={handleClear} title={t('clearAll')} className="p-2 rounded-md text-slate-500 dark:text-zinc-400 hover:bg-white/50 dark:hover:bg-slate-700 transition-colors">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-2 sm:p-4 flex-grow relative bg-slate-100 dark:bg-zinc-950/50">
                    <canvas
                        ref={canvasRef}
                        className={`w-full h-full bg-white shadow-inner ${isFullScreen ? '' : 'rounded-md'}`}
                        style={{ cursor: canvasCursorStyle }}
                        onMouseDown={startDrawing}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onMouseMove={draw}
                        onTouchStart={startDrawing}
                        onTouchEnd={stopDrawing}
                        onTouchMove={draw}
                    />
                </div>
                <footer className={`p-3 border-t border-slate-200 dark:border-white/10 flex justify-end items-center gap-4 flex-shrink-0 flex-wrap bg-slate-50 dark:bg-zinc-900/50 ${isFullScreen ? '' : 'rounded-b-lg'}`}>
                    <div className="text-xs text-slate-500 dark:text-zinc-400 text-center flex-grow hidden sm:block">
                        {t('shortcuts')}: 
                        <kbd className="font-sans px-1.5 py-0.5 text-xs font-semibold text-slate-600 dark:text-zinc-300 bg-slate-200 dark:bg-zinc-700 border border-slate-300 dark:border-zinc-600 rounded-md">Ctrl+Z</kbd> {t('shortcutUndo')}
                        <span className="mx-1">|</span>
                        <kbd className="font-sans px-1.5 py-0.5 text-xs font-semibold text-slate-600 dark:text-zinc-300 bg-slate-200 dark:bg-zinc-700 border border-slate-300 dark:border-zinc-600 rounded-md">Ctrl+S</kbd> {t('shortcutSave')}
                        <span className="mx-1">|</span>
                        <kbd className="font-sans px-1.5 py-0.5 text-xs font-semibold text-slate-600 dark:text-zinc-300 bg-slate-200 dark:bg-zinc-700 border border-slate-300 dark:border-zinc-600 rounded-md">Esc</kbd> {t('shortcutClose')}
                    </div>
                     <button 
                        onClick={onClose}
                        title={`${t('close')} (Esc)`}
                        className="py-2 px-4 text-sm font-semibold rounded-md transition-colors duration-200 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-zinc-600 dark:hover:bg-slate-500 dark:text-zinc-200 border border-slate-300 dark:border-zinc-500">
                        {t('close')}
                    </button>
                    <button 
                        onClick={handleSave}
                        title={`${t('saveAndUse')} (Ctrl+S)`}
                        className="py-2 px-4 text-sm font-semibold rounded-md transition-colors duration-200 bg-orange-500 text-white shadow-md shadow-orange-500/30 hover:bg-orange-600">
                        {t('saveAndUse')}
                    </button>
                </footer>
            </div>
        </div>
    );
};