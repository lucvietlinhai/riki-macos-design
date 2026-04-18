
import React, { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { ArtboardIcon, DownloadIcon, PlusIcon, MinusIcon, RefreshIcon, InfoCircleIcon, MaximizeIcon, WandIcon, DropIcon } from '../constants';
import type { GeneratedImage, ResultDisplayHandle } from '../types';
import { CanvasControls } from './CanvasControls';
import { useI18n } from '../i18n';
import { removeBackground } from '../utils/imageUtils';
import confetti from 'canvas-confetti';
import { useTheme } from '../theme';

interface ResultDisplayProps {
  isLoading: boolean;
  error: string | null;
  onErrorClose: () => void;
  generatedImages: GeneratedImage[];
  progress: number;
  loadingMessage: string;
  onDownload: (src: string) => void;
  onImageMove: (id: string, x: number, y: number) => void;
  onBringToFront: (id: string) => void;
  onEdit: (image: GeneratedImage) => void;
  pendingImages: { id: string; x: number; y: number }[];
  selectedImageId: string | null;
  onSelectImage: (id: string) => void;
  isSpacePanning: boolean;
  onViewDetail: (src: string) => void;
  onUpdateImageSrc?: (id: string, newSrc: string) => void;
  onDelete?: (id: string) => void;
}

const ProgressBar: React.FC<{ progress: number; message: string }> = ({ progress, message }) => {
  const { t } = useI18n();

  return (
    <div 
      className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col justify-center items-center p-8 text-center rounded-lg border border-white/10 z-10"
      role="status"
      aria-label={t('aiCreative')}
    >
      <div className="relative w-28 h-28 flex items-center justify-center mb-4">
        <svg className="animate-spin h-14 w-14 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <WandIcon className="absolute w-6 h-6 text-white/80" />
      </div>
       <h3 className="text-lg font-semibold text-slate-200">{t('aiCreative')}</h3>
       <div className="relative h-10 w-full max-w-xs flex items-center justify-center overflow-hidden">
         <p className="text-sm text-slate-300 transition-opacity duration-300 absolute" key={message}>
            {message}
         </p>
      </div>
    </div>
  );
}

const Placeholder: React.FC = () => {
    const { t } = useI18n();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    return (
        <div className="w-full h-full flex flex-col justify-center items-center text-center p-4 text-slate-600 dark:text-zinc-400">
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-zinc-300' : 'text-slate-900'}`}>{t('canvasReady')}</h3>
            <div className={`max-w-lg text-left mt-8 ${isDark ? 'bg-black/20 border-white/10' : 'bg-white border-slate-200 shadow-xl'} backdrop-blur-lg rounded-2xl p-4 flex flex-start gap-4 border`}>
                <div className="flex-shrink-0 pt-0.5">
                    <InfoCircleIcon className={`w-6 h-6 ${isDark ? 'text-yellow-400' : 'text-black'}`} />
                </div>
                <div className={isDark ? 'text-zinc-300' : 'text-slate-700'}>
                    <p className="text-sm">
                        <strong>{t('note')}</strong> {t('note1')}
                    </p>
                    <p className="text-sm mt-2">
                        {t('note2')}
                    </p>
                    <p className="text-xs mt-2 text-center">{t('note3')} <a href="http://zalo.me/0987895715" target="_blank" className={`font-bold ${isDark ? 'text-yellow-300' : 'text-black hover:underline'}`}><strong>{t('here')}</strong></a></p>
                </div>
            </div>
        </div>
    );
};

const PendingImageItem: React.FC<{ position: { x: number, y: number }, z: number, progress: number, message: string }> = ({ position, z, progress, message }) => {
    const { t } = useI18n();
    return (
        <div
            style={{ position: 'absolute', left: `${position.x}px`, top: `${position.y}px`, zIndex: z, touchAction: 'none' }}
            className="relative rounded-lg overflow-hidden flex items-center justify-center transition-all duration-300 ease-in-out w-[512px] h-[512px] aspect-square"
            aria-label={t('generatingImage')}
        >
            <ProgressBar progress={progress} message={message} />
        </div>
    );
}

const ImageItem: React.FC<{
  image: GeneratedImage;
  onDownload: (src: string) => void;
  onImageMove: (id: string, x: number, y: number) => void;
  onBringToFront: (id: string) => void;
  onEdit: (image: GeneratedImage) => void;
  scale: number;
  isSelected: boolean;
  onSelectImage: (id: string) => void;
  onViewDetail: (src: string) => void;
  onUpdateImageSrc?: (id: string, newSrc: string) => void;
  onDelete?: (id: string) => void;
}> = (props) => {
  const { 
      image, onDownload, onImageMove, onBringToFront, onEdit, scale, isSelected, 
      onSelectImage, onViewDetail, onUpdateImageSrc, onDelete
    } = props;

  const { t } = useI18n();
  const { theme } = useTheme();
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  
  const handleRemoveBg = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!onUpdateImageSrc || isRemovingBg) return;
      setIsRemovingBg(true);
      try {
          const newSrc = await removeBackground(image.src);
          confetti({
                particleCount: 50,
                spread: 40,
                origin: { y: 0.8 },
                colors: theme === 'dark' ? ['#f97316', '#fb923c', '#fdba74'] : ['#000000', '#333333', '#666666']
          });
          onUpdateImageSrc(image.id, newSrc);
      } catch (err) {
          console.error("Remove bg failed", err);
          // Alert removed because it blocks in iframe
      } finally {
          setIsRemovingBg(false);
      }
  };

  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const itemStartPosRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragThreshold = 5;
  
  const startDrag = useCallback((clientX: number, clientY: number) => {
    onBringToFront(image.id);
    
    isDraggingRef.current = false;
    dragStartPosRef.current = { x: clientX, y: clientY };
    itemStartPosRef.current = { x: image.x, y: image.y };

    const handleMove = (moveClientX: number, moveClientY: number) => {
        const dx = moveClientX - dragStartPosRef.current.x;
        const dy = moveClientY - dragStartPosRef.current.y;

        if (!isDraggingRef.current && (Math.abs(dx) > dragThreshold || Math.abs(dy) > dragThreshold)) {
            isDraggingRef.current = true;
            document.body.classList.add('cursor-grabbing');
        }
        if (isDraggingRef.current) {
            onImageMove(image.id, itemStartPosRef.current.x + dx / scale, itemStartPosRef.current.y + dy / scale);
        }
    };
    const handleEnd = () => {
        if (!isDraggingRef.current) { onSelectImage(image.id); }
        isDraggingRef.current = false;
        document.body.classList.remove('cursor-grabbing');
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
    };

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => e.touches[0] && handleMove(e.touches[0].clientX, e.touches[0].clientY);
    const onMouseUp = handleEnd;
    const onTouchEnd = handleEnd;

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mouseleave', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    
  }, [onBringToFront, onImageMove, onSelectImage, image.id, image.x, image.y, scale]);
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    startDrag(e.clientX, e.clientY);
  };
  
  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.stopPropagation();
    const touch = e.touches[0];
    startDrag(touch.clientX, touch.clientY);
  };
  
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${image.x}px`,
    top: `${image.y}px`,
    zIndex: image.z,
    touchAction: 'none',
  };

  const isDark = theme === 'dark';
  const buttonClass = `p-2 ${isDark ? 'bg-black/40 text-white border-white/10' : 'bg-white/80 text-black border-slate-200 shadow-sm'} rounded-full hover:scale-110 shadow-md transform border transition-all`;

  return (
    <div 
        style={style}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className={`group relative cursor-grab flex-shrink-0 transition-transform duration-300 ease-in-out w-[512px] h-[512px] 
            ${isSelected ? `ring-2 ${isDark ? 'ring-orange-500' : 'ring-black'} ring-offset-4 ${isDark ? 'ring-offset-slate-900' : 'ring-offset-slate-200'} rounded-lg shadow-2xl` : ''}
          `}
    >
        <div className={`relative w-full h-full ${isDark ? 'bg-black/20' : 'bg-white'} rounded-md overflow-hidden shadow-lg dark:shadow-2xl shadow-slate-400/40 dark:shadow-black/40`}>
            <img src={image.src} alt={t('generatedMascot')} className="w-full h-full object-contain pointer-events-none select-none" />
            <div className="absolute top-3 right-3 flex flex-wrap justify-end p-2 gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-full max-w-[80%]">
                {onUpdateImageSrc && (
                    <button 
                        onMouseDown={e => e.stopPropagation()}
                        onTouchStart={e => e.stopPropagation()}
                        onClick={handleRemoveBg} 
                        disabled={isRemovingBg}
                        className={`${buttonClass} ${isDark ? 'hover:bg-orange-500/80' : 'hover:bg-black/10'} disabled:opacity-50`} 
                        title="Xoá phông nền" 
                    >
                        {isRemovingBg ? <div className={`w-5 h-5 border-2 ${isDark ? 'border-white/30 border-t-white' : 'border-black/30 border-t-black'} rounded-full animate-spin`}></div> : <DropIcon className="w-5 h-5" />}
                    </button>
                )}
                {onDelete && (
                    <button 
                        onMouseDown={e => e.stopPropagation()}
                        onTouchStart={e => e.stopPropagation()}
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            onDelete(image.id); 
                        }} 
                        className={`${buttonClass} hover:bg-red-500/80 hover:text-white`} 
                        title={t('deleteImage') || 'Xóa ảnh'} 
                    > 
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" width="24" height="24" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg>
                    </button>
                )}
                <button onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()} onClick={() => onEdit(image)} className={`${buttonClass} ${isDark ? 'hover:bg-orange-500/80' : 'hover:bg-black/10'}`} title={t('editImage')} > <WandIcon className="w-5 h-5" /> </button>
                <button onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()} onClick={() => onViewDetail(image.src)} className={`${buttonClass} ${isDark ? 'hover:bg-orange-500/80' : 'hover:bg-black/10'}`} title={t('viewDetail')} > <MaximizeIcon className="w-5 h-5" /> </button>
                <button onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()} onClick={() => onDownload(image.src)} className={`${buttonClass} hover:bg-green-500/80 hover:text-white`} title={t('downloadImage')} > <DownloadIcon className="w-5 h-5" /> </button>
            </div>
        </div>
    </div>
  );
};


export const ResultDisplay = forwardRef<ResultDisplayHandle, ResultDisplayProps>((props, ref) => {
  const { 
    isLoading, error, onErrorClose, generatedImages, 
    progress, loadingMessage, onDownload, onImageMove, onBringToFront, onEdit,
    pendingImages, selectedImageId, onSelectImage, onViewDetail, isSpacePanning
  } = props;
  
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ startX: 0, startY: 0, startPanX: 0, startPanY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();

  const handleZoom = useCallback((direction: 'in' | 'out') => {
      const container = containerRef.current;
      if (!container) return;
      const { width, height } = container.getBoundingClientRect();
      const factor = direction === 'in' ? 1.2 : 1 / 1.2;
      const newScale = Math.max(0.2, Math.min(5, scale * factor));
      
      const centerX = width / 2;
      const centerY = height / 2;

      const mousePointX = (centerX - pan.x) / scale;
      const mousePointY = (centerY - pan.y) / scale;

      const newPanX = centerX - mousePointX * newScale;
      const newPanY = centerY - mousePointY * newScale;

      setScale(newScale);
      setPan({ x: newPanX, y: newPanY });
  }, [scale, pan.x, pan.y]);

  const handleResetView = useCallback(() => {
      setScale(1);
      setPan({ x: 0, y: 0 });
  }, []);

  useImperativeHandle(ref, () => ({
    focusOnImage: (id: string) => {
        const image = generatedImages.find(img => img.id === id);
        const container = containerRef.current;
        if (!image || !container) return;

        const IMAGE_WIDTH = 512;
        const IMAGE_HEIGHT = 512;

        const { width: containerWidth, height: containerHeight } = container.getBoundingClientRect();
        
        const newScale = 1;
        const newPanX = (containerWidth / 2) - (image.x + IMAGE_WIDTH / 2) * newScale;
        const newPanY = (containerHeight / 2) - (image.y + IMAGE_HEIGHT / 2) * newScale;

        setScale(newScale);
        setPan({ x: newPanX, y: newPanY });
        onBringToFront(id);
    },
    zoom: handleZoom,
    resetView: handleResetView
  }));

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const zoomSpeed = 0.1;
    const delta = e.deltaY > 0 ? -1 : 1;
    const newScale = Math.max(0.2, Math.min(5, scale + delta * zoomSpeed * scale));
    
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const mousePointX = (mouseX - pan.x) / scale;
    const mousePointY = (mouseY - pan.y) / scale;

    const newPanX = mouseX - mousePointX * newScale;
    const newPanY = mouseY - mousePointY * newScale;
    
    setScale(newScale);
    setPan({ x: newPanX, y: newPanY });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget || (e.button !== 1 && !(isSpacePanning && e.button === 0))) {
        if(e.target === e.currentTarget) {
            onSelectImage(''); 
        }
        return;
    }
    e.preventDefault();
    document.body.classList.add('cursor-grabbing');
    setIsPanning(true);
    panStartRef.current = { startX: e.clientX, startY: e.clientY, startPanX: pan.x, startPanY: pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    e.preventDefault();
    const dx = e.clientX - panStartRef.current.startX;
    const dy = e.clientY - panStartRef.current.startY;
    setPan({ x: panStartRef.current.startPanX + dx, y: panStartRef.current.startPanY + dy });
  };

  const handleMouseUp = () => {
    document.body.classList.remove('cursor-grabbing');
    setIsPanning(false);
  };
  
  if (generatedImages.length === 0 && !isLoading && pendingImages.length === 0) {
      return (
          <div className="w-full h-full flex items-center justify-center" onClick={() => onSelectImage('')}>
              {!error && <Placeholder />}
              {error && (
                  <div className="relative rounded-lg overflow-hidden flex flex-col items-center justify-center w-[512px] p-4 text-center bg-red-500/10 dark:bg-red-900/20 backdrop-blur-xl border border-red-500/20 text-red-600 dark:text-red-200">
                      <p className="font-semibold">{t('generationFailed')}</p>
                      <p className="text-sm mt-1">{error}</p>
                  </div>
              )}
          </div>
      );
  }

  if (generatedImages.length === 0 && isLoading) {
    return (
      <div className="w-full h-full relative">
        <ProgressBar progress={progress} message={loadingMessage} />
      </div>
    );
  }

  return (
    <div 
        ref={containerRef}
        className={`w-full h-full absolute top-0 left-0 overflow-hidden ${isPanning || isSpacePanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
    >
      <div 
        className="transition-transform duration-75 ease-out"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transformOrigin: '0 0' }}
      >
        {generatedImages.map((image) => (
            <ImageItem
                key={image.id}
                image={image}
                onDownload={onDownload}
                onImageMove={onImageMove}
                onBringToFront={onBringToFront}
                onEdit={onEdit}
                scale={scale}
                isSelected={selectedImageId === image.id}
                onSelectImage={onSelectImage}
                onViewDetail={onViewDetail}
                onUpdateImageSrc={props.onUpdateImageSrc}
                onDelete={props.onDelete}
            />
        ))}
         {pendingImages.map(image => (
            <PendingImageItem
              key={image.id}
              position={image}
              z={generatedImages.length + 1}
              progress={progress}
              message={loadingMessage}
            />
          ))}
      </div>
       <CanvasControls 
            onZoomIn={() => handleZoom('in')}
            onZoomOut={() => handleZoom('out')}
            onResetView={handleResetView}
        />
       {error && !isLoading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50" onClick={onErrorClose}>
           <div className="relative rounded-2xl overflow-hidden flex flex-col items-center justify-center transition-all duration-300 ease-in-out w-full max-w-lg p-6 bg-red-500/10 dark:bg-red-900/20 backdrop-blur-xl border border-red-500/20 text-red-700 dark:text-red-200 shadow-2xl">
                <p className="font-semibold text-lg">{t('generationFailed')}</p>
                <p className="text-sm text-center mt-2">{error}</p>
                <button onClick={onErrorClose} className="mt-4 bg-red-500 text-white px-4 py-1.5 rounded-lg font-semibold hover:bg-red-600 transition-colors">{t('close')}</button>
           </div>
        </div>
      )}
    </div>
  );
});
