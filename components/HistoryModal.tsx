
import React, { useState, useMemo } from 'react';
import type { GeneratedImage, Tab } from '../types';
import { useI18n } from '../i18n';
import { useTheme } from '../theme';
import { XIcon, DownloadIcon, TrashIcon, PhotoIcon, DropIcon } from '../constants';
import { removeBackground } from '../utils/imageUtils';

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    images: GeneratedImage[];
    onImageClick: (image: GeneratedImage) => void;
    onDownloadClick: (src: string) => void;
    onDeleteClick: (id: string) => void;
    onReferenceClick: (image: GeneratedImage) => void;
    onUpdateImageSrc?: (id: string, src: string) => void;
}

const HistoryTabButton: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
    count: number;
}> = ({ label, isActive, onClick, count }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    
    return (
        <button
            onClick={onClick}
            className={`relative px-3 py-2 text-sm font-semibold rounded-md transition-colors ${
                isActive
                    ? 'bg-slate-200/80 text-slate-800 dark:bg-zinc-700/80 dark:text-zinc-100'
                    : 'text-slate-500 hover:bg-slate-200/50 dark:text-zinc-400 dark:hover:bg-slate-900/50'
            }`}
        >
            {label}
            {count > 0 && (
                <span className={`absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full ${isDark ? 'bg-orange-500 shadow-sm shadow-orange-500/50' : 'bg-black text-white shadow-sm shadow-black/50'} text-xs font-bold transition-colors duration-500`}>
                    {count}
                </span>
            )}
        </button>
    );
};


export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, images, onImageClick, onDownloadClick, onDeleteClick, onReferenceClick, onUpdateImageSrc }) => {
    const { t } = useI18n();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [activeTab, setActiveTab] = useState<Tab>('design');
    const [removingId, setRemovingId] = useState<string | null>(null);

    const buttonClass = `p-2 bg-black/40 text-white rounded-full ${isDark ? 'hover:bg-orange-500/80 shadow-[0_0_15px_rgba(249,115,22,0.3)]' : 'hover:bg-black/10 shadow-lg'} backdrop-blur-sm transition-all`;

    const handleRemoveBg = async (e: React.MouseEvent, image: GeneratedImage) => {
        e.stopPropagation();
        if (!onUpdateImageSrc || removingId) return;
        setRemovingId(image.id);
        try {
            const newSrc = await removeBackground(image.src);
            onUpdateImageSrc(image.id, newSrc);
            // Replace alert with silent success in iframe
        } catch (err) {
            console.error("Remove bg failed", err);
        } finally {
            setRemovingId(null);
        }
    };
    
    const imageCounts = useMemo(() => {
        return images.reduce((acc, img) => {
            acc[img.sourceTab] = (acc[img.sourceTab] || 0) + 1;
            return acc;
        }, {} as Record<Tab, number>);
    }, [images]);

    const filteredImages = useMemo(() => {
        return [...images].filter(img => img.sourceTab === activeTab).sort((a, b) => b.z - a.z);
    }, [images, activeTab]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose} aria-modal="true">
            <div 
                className="bg-white/10 dark:bg-black/20 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl w-[95vw] h-[90vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex-shrink-0 p-3 border-b border-white/10 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-zinc-200">{t('generatedHistory')}</h2>
                         <div className="flex items-center gap-1 bg-black/10 dark:bg-black/30 p-1 rounded-lg">
                            <HistoryTabButton label={t('historyTabDesign')} isActive={activeTab === 'design'} onClick={() => setActiveTab('design')} count={imageCounts.design || 0} />
                            <HistoryTabButton label={t('historyTabThumbPost')} isActive={activeTab === 'thumbPost'} onClick={() => setActiveTab('thumbPost')} count={imageCounts.thumbPost || 0} />
                            <HistoryTabButton label={t('tabStoryArc')} isActive={activeTab === 'storyArc'} onClick={() => setActiveTab('storyArc')} count={imageCounts.storyArc || 0} />
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white hover:bg-white/10 dark:hover:bg-white/10 transition-colors" aria-label={t('close')}>
                        <XIcon className="w-5 h-5" />
                    </button>
                </header>
                <main className="flex-grow p-4 overflow-y-auto scrollbar-thin">
                    {filteredImages.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-4">
                            {filteredImages.map((image) => (
                                <div 
                                    key={image.id}
                                    className="relative group aspect-square bg-black/10 backdrop-blur-md rounded-lg overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-shadow border border-white/10"
                                >
                                    <img 
                                        src={image.src} 
                                        alt={`${t('imageLayer')} ${image.id}`} 
                                        className="w-full h-full object-contain"
                                        onClick={() => onImageClick(image)}
                                    />
                                     <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-wrap items-center justify-center p-2 gap-2">
                                        {activeTab === 'design' && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onReferenceClick(image); }} 
                                                title={t('useAsReference')}
                                                className={buttonClass}
                                            >
                                                <PhotoIcon className="w-5 h-5" />
                                            </button>
                                        )}
                                        {onUpdateImageSrc && (
                                            <button 
                                                onClick={(e) => handleRemoveBg(e, image)} 
                                                title="Xoá nền (Tạo PNG trong suốt)"
                                                disabled={removingId === image.id}
                                                className={`${buttonClass} disabled:opacity-50`}
                                            >
                                                {removingId === image.id ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div> : <DropIcon className="w-5 h-5" />}
                                            </button>
                                        )}
                                         <button 
                                            onClick={(e) => { e.stopPropagation(); onDownloadClick(image.src); }} 
                                            title={t('downloadImage')}
                                            className={`${buttonClass} hover:bg-green-500/80`}
                                         >
                                            <DownloadIcon className="w-5 h-5" />
                                        </button>
                                        <button 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                onDeleteClick(image.id);
                                            }} 
                                            title={t('deleteImage')}
                                            className={`${buttonClass} hover:bg-red-500/80`}
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                         <div className="flex items-center justify-center h-full">
                            <p className="text-slate-500 dark:text-zinc-400">{t('noImages')}</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};
