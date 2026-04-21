
import React, { useState, useCallback, useEffect } from 'react';
import { useI18n, Language } from '../i18n';
import type { CharacterId, GeneratedImage, ImageFile, AspectRatio, AIModel } from '../types';
import { generateThumbVideoImages } from '../services/geminiService';
import { characters } from '../data/characters';
import { LightboxModal } from './LightboxModal';
import { ImageEditorModal } from './ImageEditorModal';
import { ThumbVideoControls } from './ThumbVideoControls';
import { WandIcon, MaximizeIcon, TrashIcon, DownloadIcon, CheckIcon } from '../constants';

// Internal components for this tab
const ProgressBar: React.FC = () => {
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
         <h3 className="text-base font-semibold text-slate-200">{t('aiCreative')}</h3>
      </div>
    );
  };
  

const GridImageItem: React.FC<{
    image: GeneratedImage;
    onView: (src: string) => void;
    onEdit: (image: GeneratedImage) => void;
    onDelete: (id: string) => void;
    onDownload: (src: string) => void;
}> = ({ image, onView, onEdit, onDelete, onDownload }) => {
    const { t } = useI18n();
    const buttonClass = "p-2 bg-black/40 text-white rounded-full hover:bg-black/60 backdrop-blur-sm";

    return (
        <div className="relative group bg-slate-300 dark:bg-zinc-900 rounded-lg overflow-hidden border border-slate-300 dark:border-white/10 shadow-md">
            <img src={image.src} alt={`Thumbnail ${image.id}`} className="w-full h-full object-cover" />
            <div className="absolute top-2 right-2 flex flex-col items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button onClick={() => onEdit(image)} className={`${buttonClass} hover:bg-orange-500/80`} title={t('editImage')} > <WandIcon className="w-5 h-5" /> </button>
                <button onClick={() => onView(image.src)} className={`${buttonClass} hover:bg-orange-500/80`} title={t('viewDetail')} > <MaximizeIcon className="w-5 h-5" /> </button>
                <button onClick={() => onDownload(image.src)} className={`${buttonClass} hover:bg-green-500/80`} title={t('downloadImage')} > <DownloadIcon className="w-5 h-5" /> </button>
                <button onClick={() => onDelete(image.id)} className={`${buttonClass} hover:bg-red-500/80`} title={t('deleteImage')} > <TrashIcon className="w-5 h-5" /> </button>
            </div>
        </div>
    );
};

const Placeholder: React.FC = () => {
    const { t } = useI18n();
    return (
        <div className="w-full h-full flex flex-col justify-center items-center text-center p-4 text-slate-600 dark:text-zinc-400">
            <h3 className="text-xl font-semibold mb-4">{t('thumbVideoPlaceholderTitle')}</h3>
            <div className="max-w-lg text-left mt-4 bg-white/10 dark:bg-black/20 backdrop-blur-lg rounded-2xl p-6 flex flex-col gap-4 shadow-2xl border border-white/20 dark:border-white/10">
                <p className="text-sm text-slate-700 dark:text-zinc-300">{t('thumbVideoPlaceholderNote1')}</p>
                <p className="text-sm text-slate-700 dark:text-zinc-300">{t('thumbVideoPlaceholderNote2')}</p>
                <p className="text-sm text-slate-700 dark:text-zinc-300">{t('thumbVideoPlaceholderNote3')}</p>
            </div>
        </div>
    );
}

// Main component
interface ThumbVideoTabProps {
    images: GeneratedImage[];
    onAddImages: (images: Omit<GeneratedImage, 'sourceTab'>[], sourceTab: 'thumbVideo') => void;
    onImageEditSave: (data: { mask: string, prompt: string }) => void;
    onDeleteImage: (id: string) => void;
    onDownloadImage: (src: string) => void;
    characterId: CharacterId;
    onCharacterChange: (id: CharacterId) => void;
    model: AIModel;
    language: Language;
}

export const ThumbVideoTab: React.FC<ThumbVideoTabProps> = (props) => {
    const { 
        images, onAddImages, onImageEditSave, onDeleteImage, onDownloadImage,
        characterId, onCharacterChange, model, language 
    } = props;

    const { t } = useI18n();
    const [postContent, setPostContent] = useState('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
    const [includeText, setIncludeText] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasShownTextWarning, setHasShownTextWarning] = useState(false);
    const [showTextConfirmDialog, setShowTextConfirmDialog] = useState(false);
    
    // Modal states
    const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
    const [lightboxImageSrc, setLightboxImageSrc] = useState<string | null>(null);
    const [showImageEditorModal, setShowImageEditorModal] = useState<boolean>(false);
    const [editingImage, setEditingImage] = useState<GeneratedImage | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const handleGenerate = useCallback(async () => {
        const selectedCharacter = characters.find(c => c.id === characterId);
        if (!selectedCharacter || !postContent.trim()) return;
        
        setIsLoading(true);
        setError(null);
        
        const bodyMimeType = selectedCharacter.body.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
        const faceMimeType = selectedCharacter.face.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
        const characterImage: ImageFile = { base64: selectedCharacter.body, mimeType: bodyMimeType };
        const faceReference: ImageFile = { base64: selectedCharacter.face, mimeType: faceMimeType };
        
        try {
            const results = await generateThumbVideoImages(characterImage, faceReference, characterId, postContent, aspectRatio, model, language, includeText);
            const newImages = results.map((base64, index) => ({
                id: `vid_thumb_${Date.now()}_${index}`,
                src: `data:image/png;base64,${base64}`,
                x: 0, y: 0, z: Date.now() + index 
            }));
            images.forEach(img => onDeleteImage(img.id));
            onAddImages(newImages, 'thumbVideo');
        } catch (e: any) {
            if (e.message === "API_KEY_MISSING") {
                window.dispatchEvent(new CustomEvent('showApiKeyModal'));
            } else {
                setError(e.message || t('errorNoImage'));
            }
        } finally {
            setIsLoading(false);
        }
    }, [characterId, postContent, aspectRatio, model, language, includeText, t, onAddImages, onDeleteImage, images]);

     const handleIncludeTextToggle = (newValue: boolean) => {
        if (newValue && !hasShownTextWarning) {
            setShowTextConfirmDialog(true);
        } else {
            setIncludeText(newValue);
        }
    };

    const handleConfirmTextInclusion = () => {
        setIncludeText(true);
        setHasShownTextWarning(true);
        setShowTextConfirmDialog(false);
    };

    const handleCancelTextInclusion = () => {
        setShowTextConfirmDialog(false);
    };
    
    const handleOpenLightbox = (src: string) => {
        setIsLightboxOpen(true);
        setLightboxImageSrc(src);
    };

    const handleOpenImageEditor = (image: GeneratedImage) => {
        setEditingImage(image);
        setShowImageEditorModal(true);
    };

     useEffect(() => {
        const parentLoading = document.body.classList.contains('is-editing');
        setIsEditing(parentLoading);
    }, []);

    const gridColsClass = aspectRatio === '16:9' ? 'sm:grid-cols-2' : 'sm:grid-cols-4';
    const aspectClass = aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[9/16]';

    return (
        <div className="w-full h-full flex flex-col bg-slate-200 dark:bg-zinc-950 dot-grid">
            <main className="flex-grow p-4 md:p-6 lg:p-8 overflow-y-auto">
                <div className="max-w-5xl mx-auto h-full">
                    {error && (
                        <div className="mb-4 p-4 text-center bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
                            <p><strong>{t('generationFailed')}:</strong> {error}</p>
                        </div>
                    )}
                    
                    {images.length === 0 && !isLoading && <Placeholder />}

                    {isLoading && (
                        <div className={`grid grid-cols-1 ${gridColsClass} gap-4 md:gap-6`}>
                            {Array(4).fill(0).map((_, i) => (
                                <div key={i} className={`relative ${aspectClass} bg-slate-300 dark:bg-zinc-900 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-400 dark:border-zinc-600`}>
                                    <ProgressBar />
                                </div>
                            ))}
                        </div>
                    )}

                    {!isLoading && images.length > 0 && (
                        <div className={`grid grid-cols-1 ${gridColsClass} gap-4 md:gap-6`}>
                            {images.map(item => (
                                <div key={item.id} className={aspectClass}>
                                    <GridImageItem 
                                        image={item}
                                        onView={handleOpenLightbox}
                                        onEdit={handleOpenImageEditor}
                                        onDelete={onDeleteImage}
                                        onDownload={onDownloadImage}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <footer className="flex-shrink-0 z-20">
                <ThumbVideoControls
                    postContent={postContent}
                    onPostContentChange={setPostContent}
                    characterId={characterId}
                    onCharacterChange={onCharacterChange}
                    aspectRatio={aspectRatio}
                    onAspectRatioChange={setAspectRatio}
                    onGenerate={handleGenerate}
                    isLoading={isLoading}
                    includeText={includeText}
                    onIncludeTextChange={handleIncludeTextToggle}
                />
            </footer>
            {isLightboxOpen && lightboxImageSrc && (
                <LightboxModal imageSrc={lightboxImageSrc} onClose={() => setIsLightboxOpen(false)} />
            )}
            {showImageEditorModal && (
                <ImageEditorModal
                    image={editingImage}
                    onClose={() => setShowImageEditorModal(false)}
                    onSave={onImageEditSave}
                    isLoading={isEditing}
                />
            )}
             {showTextConfirmDialog && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={handleCancelTextInclusion}>
                    <div className="bg-white dark:bg-zinc-900 border border-slate-300 dark:border-white/10 rounded-lg shadow-2xl w-full max-w-md flex flex-col" onClick={e => e.stopPropagation()}>
                        <header className="p-4 border-b border-slate-200 dark:border-white/10">
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-zinc-200">{t('textInImageWarningTitle')}</h2>
                        </header>
                        <main className="p-4">
                            <p className="text-sm text-slate-600 dark:text-zinc-300">{t('textInImageWarningMessage')}</p>
                        </main>
                        <footer className="p-3 border-t border-slate-200 dark:border-white/10 flex justify-end items-center gap-3 bg-slate-50 dark:bg-zinc-900/50 rounded-b-lg">
                            <button onClick={handleCancelTextInclusion} className="py-2 px-4 text-sm font-semibold rounded-md transition-colors duration-200 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-zinc-600 dark:hover:bg-slate-500 dark:text-zinc-200">
                                {t('cancel')}
                            </button>
                            <button onClick={handleConfirmTextInclusion} className="py-2 px-4 text-sm font-semibold rounded-md transition-colors duration-200 bg-orange-500 text-white shadow-md shadow-orange-500/30 hover:bg-orange-600 flex items-center gap-2">
                                <CheckIcon className="w-4 h-4" />
                                {t('confirm')}
                            </button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
};
