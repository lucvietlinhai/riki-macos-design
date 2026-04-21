
import React from 'react';
import type { GeneratedImage } from '../types';
import { TrashIcon, CollapseIcon, ExpandIcon, BringToFrontIcon } from '../constants';
import { useI18n } from '../i18n';

interface LayerSidebarProps {
    isOpen: boolean;
    onToggle: () => void;
    generatedImages: GeneratedImage[];
    onLayerClick: (id: string) => void;
    onDelete: (id: string) => void;
    onBringToFront: (id: string) => void;
    selectedImageIds: string[];
}

export const LayerSidebar: React.FC<LayerSidebarProps> = ({ isOpen, onToggle, generatedImages, onLayerClick, onDelete, onBringToFront, selectedImageIds }) => {
    const { t } = useI18n();
    const sortedImages = [...generatedImages].sort((a, b) => b.z - a.z);

    return (
        <aside className={`transition-all duration-300 ease-in-out flex-shrink-0 h-full bg-slate-200/60 dark:bg-zinc-900/50 backdrop-blur-sm border-l border-slate-300/80 dark:border-zinc-600/50 flex flex-col ${isOpen ? 'w-64' : 'w-12'}`}>
            <div className="flex-shrink-0 p-2 border-b border-slate-300/80 dark:border-zinc-600/50 flex items-center justify-center">
                <button 
                    onClick={onToggle} 
                    className="p-2 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/50 dark:hover:bg-slate-700/50 rounded-md"
                    aria-label={isOpen ? t('collapseSidebar') : t('expandSidebar')}
                    title={isOpen ? t('collapseSidebar') : t('expandSidebar')}
                >
                    {isOpen ? <CollapseIcon className="w-5 h-5" /> : <ExpandIcon className="w-5 h-5" />}
                </button>
            </div>
            
            {isOpen && (
                <div className="flex-grow overflow-y-auto scrollbar-thin p-2">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-300 px-2 mb-2">{t('layers')}</h3>
                    {sortedImages.length > 0 ? (
                        <ul className="flex flex-col gap-2">
                            {sortedImages.map((image, index) => (
                                <li 
                                    key={image.id} 
                                    onClick={() => onLayerClick(image.id)}
                                    className={`flex items-center gap-2 p-1.5 rounded-md cursor-pointer transition-colors border-2 ${selectedImageIds.includes(image.id) ? 'border-orange-400 bg-orange-500/20' : 'border-transparent hover:bg-slate-300/50 dark:hover:bg-slate-700/50'}`}
                                >
                                    <img src={image.src || undefined} alt={`${t('imageLayer')} ${index}`} className="w-10 h-10 object-contain rounded bg-white/50 dark:bg-zinc-950/50 flex-shrink-0" />
                                    <span className="text-xs text-slate-600 dark:text-zinc-300 flex-grow truncate">{`${t('imageLayer')} ${image.id.substring(4, 10)}`}</span>
                                    <div className="flex items-center flex-shrink-0">
                                        <button
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onClick={() => onBringToFront(image.id)}
                                            className="p-1.5 text-slate-500 dark:text-zinc-400 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-slate-300/70 dark:hover:bg-slate-900/30 rounded-md"
                                            title={t('bringToFront')}
                                        >
                                            <BringToFrontIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onClick={() => {
                                                if (window.confirm(t('deleteConfirm'))) onDelete(image.id);
                                            }}
                                            className="p-1.5 text-slate-500 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md"
                                            title={t('deleteImage')}
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-xs text-slate-500 dark:text-zinc-400 text-center p-4">{t('noImages')}</p>
                    )}
                </div>
            )}
        </aside>
    );
}