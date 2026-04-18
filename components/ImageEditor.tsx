
import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { LoadingSpinner, WandIcon, UndoIcon, TrashIcon, XIcon, PencilIcon } from '../constants';
import { useI18n } from '../i18n';
import type { GeneratedImage } from '../types';

// Tabler Icon: icon-eraser
const EraserIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M19 20h-10.5l-4.21 -4.3a1 1 0 0 1 0 -1.41l10 -10a1 1 0 0 1 1.41 0l5 5a1 1 0 0 1 0 1.41l-9.2 9.3" />
      <path d="M18 13.3l-6.3 -6.3" />
    </svg>
  );

interface ImageEditorModalProps {
    onClose: () => void;
    onSave: (data: { mask: string, prompt: string }) => void;
    isLoading: boolean;
    image: GeneratedImage | null;
}

type Tool = 'brush' | 'eraser';

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({ onClose, onSave, isLoading, image }) => {
    const { t } = useI18n();
    const containerRef = useRef<HTMLDivElement>(null);
    const bgCanvasRef = useRef<HTMLCanvasElement>(null);
    const drawCanvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [tool, setTool] = useState<Tool>('brush');
    const [brushSize, setBrushSize] = useState(40);
    const [editPrompt, setEditPrompt] = useState('');
    const [history, setHistory] = useState<ImageData[]>([]);

    const getContext = (canvas: HTMLCanvasElement | null) => canvas?.getContext('2d');

    const initializeCanvases = useCallback(() => {
        if (!image) return;
        const imageEl = new Image();
        imageEl.crossOrigin = 'anonymous';
        imageEl.src = image.src;
        imageEl.onload = () => {
            const container = containerRef.current;
            const bgCanvas = bgCanvasRef.current;
            const drawCanvas = drawCanvasRef.current;
            if (!container || !bgCanvas || !drawCanvas) return;

            const aspectRatio = imageEl.width / imageEl.height;
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            let canvasWidth = containerWidth;
            let canvasHeight = containerWidth / aspectRatio;

            if (canvasHeight > containerHeight) {
                canvasHeight = containerHeight;
                canvasWidth = containerHeight * aspectRatio;
            }
            
            [bgCanvas, drawCanvas].forEach(canvas => {
                canvas.width = canvasWidth;
                canvas.height = canvasHeight;
            });
            
            const bgCtx = getContext(bgCanvas);
            if (bgCtx) {
                bgCtx.drawImage(imageEl, 0, 0, canvasWidth, canvasHeight);
            }

            const drawCtx = getContext(drawCanvas);
            if (drawCtx) {
                drawCtx.clearRect(0, 0, canvasWidth, canvasHeight);
                setHistory([drawCtx.getImageData(0, 0, canvasWidth, canvasHeight)]);
            }
        };
    }, [image]);
    
    useLayoutEffect(() => {
        if (image) {
            initializeCanvases();
            window.addEventListener('resize', initializeCanvases);
            return () => window.removeEventListener('resize', initializeCanvases);
        }
    }, [image, initializeCanvases]);

    useEffect(() => {
        if (!image) {
          setEditPrompt('');
          setHistory([]);
        }
    }, [image]);

    const getCoords = (e: React.MouseEvent | React.TouchEvent): { x: number, y: number } => {
        const canvas = drawCanvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const ctx = getContext(drawCanvasRef.current);
        if (!ctx) return;
        setIsDrawing(true);
        const { x, y } = getCoords(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        e.preventDefault();
        const ctx = getContext(drawCanvasRef.current);
        if (!ctx) return;
        const { x, y } = getCoords(e);
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (tool === 'brush') {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = `rgba(236, 72, 153, 0.7)`; // Semi-transparent pink
        } else {
            ctx.globalCompositeOperation = 'destination-out';
        }
        ctx.lineTo(x, y);
        ctx.stroke();
    };
    
    const stopDrawing = () => {
        const ctx = getContext(drawCanvasRef.current);
        if (!ctx || !isDrawing) return;
        ctx.closePath();
        setIsDrawing(false);
        const canvas = drawCanvasRef.current;
        if (canvas) {
            setHistory(prev => [...prev, ctx.getImageData(0, 0, canvas.width, canvas.height)]);
        }
    };

    const handleUndo = () => {
        if (history.length <= 1) return;
        const newHistory = [...history];
        newHistory.pop();
        const lastState = newHistory[newHistory.length - 1];
        const ctx = getContext(drawCanvasRef.current);
        if (ctx && lastState) {
            ctx.putImageData(lastState, 0, 0);
            setHistory(newHistory);
        }
    };
    
    const handleClear = () => {
        const canvas = drawCanvasRef.current;
        const ctx = getContext(canvas);
        if(canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            setHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)]);
        }
    };
    
    const handleSave = useCallback(() => {
        const drawCanvas = drawCanvasRef.current;
        if (!drawCanvas || !editPrompt.trim()) return;

        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = drawCanvas.width;
        maskCanvas.height = drawCanvas.height;
        const maskCtx = getContext(maskCanvas);
        if (!maskCtx) return;

        maskCtx.fillStyle = '#000000'; // Black background
        maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
        
        maskCtx.globalCompositeOperation = 'source-over';
        maskCtx.drawImage(drawCanvas, 0, 0);

        const imageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] > 0) { 
                data[i] = 255; 
                data[i + 1] = 255; 
                data[i + 2] = 255;
            }
        }
        maskCtx.putImageData(imageData, 0, 0);

        onSave({ mask: maskCanvas.toDataURL('image/png'), prompt: editPrompt });
    }, [onSave, editPrompt, drawCanvasRef]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
           if (e.key === 'Escape') {
               e.preventDefault();
               onClose();
           } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
               e.preventDefault();
               if (!isLoading && editPrompt.trim() && history.length > 1) {
                   handleSave();
               }
           }
        };
  
        if (image) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [image, onClose, handleSave, isLoading, editPrompt, history]);

    if (!image) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4" onClick={onClose} aria-modal="true">
            <div 
                className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex-shrink-0 p-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">{t('editImage')}</h2>
                    <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700/50 transition-colors" aria-label={t('close')}>
                        <XIcon className="w-5 h-5" />
                    </button>
                </header>
                <div className="flex-grow flex flex-col p-2 sm:p-3 gap-3 overflow-hidden">
                    <div className="flex-shrink-0 bg-white dark:bg-slate-900/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between gap-4 flex-wrap">
                         <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-700/50 p-1 rounded-md">
                            <button onClick={() => setTool('brush')} title={t('pen')} className={`p-2 rounded-md transition-colors ${tool === 'brush' ? 'bg-white text-indigo-500 dark:bg-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-600'}`} aria-pressed={tool === 'brush'}><PencilIcon className="w-5 h-5" /></button>
                            <button onClick={() => setTool('eraser')} title={t('eraser')} className={`p-2 rounded-md transition-colors ${tool === 'eraser' ? 'bg-white text-indigo-500 dark:bg-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-600'}`} aria-pressed={tool === 'eraser'}><EraserIcon className="w-5 h-5" /></button>
                        </div>
                        <div className="flex items-center gap-2">
                            <label htmlFor="brushSizeModal" className="text-sm font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">{t('brushSize')}</label>
                            <input id="brushSizeModal" type="range" min="5" max="100" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-24 sm:w-32 accent-indigo-500" />
                            <span className="text-sm w-8 text-center bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-1 py-0.5 rounded-md border border-slate-300 dark:border-slate-600">{brushSize}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-700/50 p-1 rounded-md">
                            <button onClick={handleUndo} title={t('undo')} className="p-2 rounded-md text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50" disabled={history.length <= 1}> <UndoIcon className="w-5 h-5" /> </button>
                            <button onClick={handleClear} title={t('clear')} className="p-2 rounded-md text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-600"> <TrashIcon className="w-5 h-5" /> </button>
                        </div>
                    </div>

                    <div ref={containerRef} className="relative flex-grow bg-slate-200 dark:bg-slate-900 rounded-lg overflow-hidden checkerboard flex justify-center items-center">
                        <canvas ref={bgCanvasRef} className="absolute"/>
                        <canvas 
                            ref={drawCanvasRef} 
                            className="absolute cursor-crosshair touch-none"
                            onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                        />
                    </div>
                    
                    <div className="flex-shrink-0 flex flex-col gap-2">
                        <textarea rows={2} className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder-slate-500" placeholder={t('editPlaceholder')} value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} />
                        <div className="flex items-center gap-3">
                            <button onClick={onClose} className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-slate-200 font-bold py-2.5 px-4 rounded-lg transition-all"> {t('cancel')} </button>
                            <button onClick={handleSave} disabled={isLoading || !editPrompt.trim() || history.length <= 1} className="w-full flex items-center justify-center gap-3 bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                {isLoading ? <><LoadingSpinner /><span>{t('editing')}</span></> : <><WandIcon className="w-5 h-5" /><span>{t('generateChanges')}</span></>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};