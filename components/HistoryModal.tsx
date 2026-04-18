
import React, { useState, useMemo } from 'react';
import type { GeneratedImage, Tab } from '../types';
import { useI18n } from '../i18n';
import { XIcon, DownloadIcon, TrashIcon, PhotoIcon } from '../constants';

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    images: GeneratedImage[];
    onImageClick: (image: GeneratedImage) => void;
    onDownloadClick: (src: string) => void;
    onDeleteClick: (id: string) => void;
    onReferenceClick: (image: GeneratedImage) => void;
}

const HistoryTabButton: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
    count: number;
}> = ({ label, isActive, onClick, count }) => (
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
             <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-white text-[10px] font-bold">
                {count}
            </span>
        )}
    </button>
);


export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, images, onImageClick, onDownloadClick, onDeleteClick, onReferenceClick }) => {
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState<Tab>('design');
    
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
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        {activeTab === 'design' && (
                                            <button 
                                                onClick={() => onReferenceClick(image)} 
                                                title={t('useAsReference')}
                                                className="p-2 bg-black/40 text-white rounded-full hover:bg-orange-500/80 backdrop-blur-sm transition-all"
                                            >
                                                <PhotoIcon className="w-5 h-5" />
                                            </button>
                                        )}
                                         <button 
                                            onClick={() => onDownloadClick(image.src)} 
                                            title={t('downloadImage')}
                                            className="p-2 bg-black/40 text-white rounded-full hover:bg-green-500/80 backdrop-blur-sm transition-all"
                                        >
                                            <DownloadIcon className="w-5 h-5" />
                                        </button>
                                         <button 
                                            onClick={() => { if (window.confirm(t('deleteConfirm'))) onDeleteClick(image.id)}} 
                                            title={t('deleteImage')}
                                            className="p-2 bg-black/40 text-white rounded-full hover:bg-red-500/80 backdrop-blur-sm transition-all"
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
