
import React, { useState, useRef, useEffect } from 'react';
import type { ImageFile, BackgroundOption, CharacterId, NumVariations, AspectRatio, DesignMode, RemixSettings } from '../types';
import { LoadingSpinner, SendIcon, SettingsIcon, PencilIcon, AttachmentIcon, WandIcon, UploadIcon, CheckIcon, SpinnerIcon } from '../constants';
import { characters } from '../data/characters';
import { useI18n, Language } from '../i18n';
import type { Translation } from '../i18n';
import { resizeImage } from '../utils/imageLoader';
import { enhancePromptWithAI } from '../services/geminiService';
import { useTheme } from '../theme';

interface PromptControlsProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  background: BackgroundOption;
  onBackgroundChange: (value: BackgroundOption) => void;
  referenceImages: ImageFile[];
  onReferenceImagesChange: (files: ImageFile[]) => void;
  onGenerate: () => void;
  isLoading: boolean;
  isReady: boolean;
  onOpenSketchModal: () => void;
  isSketch: boolean;
  numVariations: NumVariations;
  onNumVariationsChange: (value: NumVariations) => void;
  aspectRatio: AspectRatio;
  onAspectRatioChange: (value: AspectRatio) => void;
  characterId: CharacterId;
  onCharacterChange: (id: CharacterId) => void;
  designMode: DesignMode;
  onDesignModeChange: (mode: DesignMode) => void;
  remixSettings: RemixSettings;
  onRemixSettingsChange: (settings: RemixSettings) => void;
  isSidebar?: boolean;
}

const aspectRatioOptions: { id: AspectRatio; labelKey: keyof Translation }[] = [
  { id: 'keep', labelKey: 'aspectRatioOriginal' },
  { id: '1:1', labelKey: 'aspectRatio1_1' },
  { id: '16:9', labelKey: 'aspectRatio16_9' },
  { id: '9:16', labelKey: 'aspectRatio9_16' },
  { id: '4:3', labelKey: 'aspectRatio4_3' },
  { id: '3:4', labelKey: 'aspectRatio3_4' },
];

const backgroundOptions: { id: BackgroundOption; labelKey: keyof Translation }[] = [
  { id: 'random', labelKey: 'backgroundAuto' },
  { id: 'white', labelKey: 'backgroundWhite' },
  { id: 'black', labelKey: 'backgroundBlack' },
];

const numVariationsOptions: { id: NumVariations; label: string }[] = [
    { id: 1, label: '1' },
    { id: 2, label: '2' },
    { id: 3, label: '3' },
    { id: 4, label: '4' },
];


export const PromptControls: React.FC<PromptControlsProps> = (props) => {
  const {
    prompt, onPromptChange, background, onBackgroundChange, referenceImages,
    onReferenceImagesChange, onGenerate, isLoading, isReady,
    onOpenSketchModal, isSketch,
    numVariations, onNumVariationsChange, aspectRatio, onAspectRatioChange,
    characterId, onCharacterChange, designMode, onDesignModeChange, isSidebar,
    remixSettings, onRemixSettingsChange
  } = props;
    
  const { t, language } = useI18n();
  const { theme } = useTheme();
  const [showSettingsPopover, setShowSettingsPopover] = useState(false);
  const [showCharacterPopover, setShowCharacterPopover] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const settingsPopoverRef = useRef<HTMLDivElement>(null);
  const characterButtonRef = useRef<HTMLButtonElement>(null);
  const characterPopoverRef = useRef<HTMLDivElement>(null);

  const handleMagicPrompt = async () => {
      if (!prompt.trim() || isEnhancing) return;
      setIsEnhancing(true);
      try {
          const enhanced = await enhancePromptWithAI(prompt, characterId, language);
          onPromptChange(enhanced);
      } catch (e: any) {
          console.error("Enhance failed", e);
          if (e.message && e.message.includes('API_KEY_MISSING')) {
              window.dispatchEvent(new CustomEvent('showApiKeyModal'));
          } else {
              alert("Lỗi khi kết nối với AI (Magic Prompt). Vui lòng kiểm tra API Key hoặc thử lại sau!");
          }
      } finally {
          setIsEnhancing(false);
      }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Settings popover
      if (
        settingsPopoverRef.current &&
        !settingsPopoverRef.current.contains(event.target as Node) &&
        settingsButtonRef.current &&
        !settingsButtonRef.current.contains(event.target as Node)
      ) {
        setShowSettingsPopover(false);
      }

      // Character popover
      if (
        characterPopoverRef.current &&
        !characterPopoverRef.current.contains(event.target as Node) &&
        characterButtonRef.current &&
        !characterButtonRef.current.contains(event.target as Node)
      ) {
        setShowCharacterPopover(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toBase64 = async (file: File): Promise<string> => {
    const rawB64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
    return await resizeImage(rawB64);
  };

  const handlePaste = async (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (event.clipboardData.files.length > 0) {
      if (referenceImages.length >= 3) {
          alert(t('uploadLimit3'));
          return;
      }
      const file = event.clipboardData.files[0];
      if (file.type.startsWith('image/')) {
        if (file.size > 4 * 1024 * 1024) {
          alert(t('fileTooLarge'));
          return;
        }
        event.preventDefault();
        const base64 = await toBase64(file);
        
        // Use logic similar to file change for reference mode
        if (designMode === 'reference') {
             // In reference mode, we replace or only keep 1
             onReferenceImagesChange([{ base64, mimeType: file.type }]);
        } else {
             onReferenceImagesChange([...referenceImages, { base64, mimeType: file.type }]);
        }
      }
    }
  };
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      // In Reference Mode, we generally only want 1 main reference image
      if (designMode === 'reference') {
           const file = files[0];
           if (file) {
               if (file.size > 4 * 1024 * 1024) {
                   alert(`${t('fileTooLarge')} (${file.name})`);
               } else {
                   const base64 = await toBase64(file);
                   onReferenceImagesChange([{ base64, mimeType: file.type }]);
               }
           }
      } else {
          // Free/Concept Mode - Multi upload
          const currentImageCount = referenceImages.length;
          if (currentImageCount + files.length > 3) {
            alert(t('uploadLimitTotal'));
            return;
          }
      
          const newImages: ImageFile[] = [];
          for (const file of files) {
              if (file.size > 4 * 1024 * 1024) {
                  alert(`${t('fileTooLarge')} (${file.name})`);
                  continue;
              }
              const base64 = await toBase64(file);
              newImages.push({ base64, mimeType: file.type });
          }
      
          if (newImages.length > 0) {
              onReferenceImagesChange([...referenceImages, ...newImages]);
          }
      }
    }
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveReferenceImage = (index: number) => {
    onReferenceImagesChange(referenceImages.filter((_, i) => i !== index));
  }

  const isConceptMode = designMode === 'concept';
  const isReferenceMode = designMode === 'reference';

  // Render Sidebar Version
  if (isSidebar) {
    return (
        <div className="flex flex-col h-full gap-4 p-4 text-slate-700 dark:text-zinc-300">
            {/* 0. Design Mode Selector */}
            <div className="flex bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl">
                 <button 
                    onClick={() => { onDesignModeChange('free'); onReferenceImagesChange([]); }}
                    className={`flex-1 py-2 text-[10px] sm:text-xs font-semibold rounded-lg transition-all ${designMode === 'free' ? 'bg-white dark:bg-zinc-600 shadow-sm text-orange-600 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400'}`}
                 >
                     {t('modeFree')}
                 </button>
                 <button 
                    onClick={() => { onDesignModeChange('concept'); onReferenceImagesChange([]); }}
                    className={`flex-1 py-2 text-[10px] sm:text-xs font-semibold rounded-lg transition-all ${designMode === 'concept' ? 'bg-white dark:bg-zinc-600 shadow-sm text-orange-600 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400'}`}
                 >
                     {t('modeConcept')}
                 </button>
                 <button 
                    onClick={() => { onDesignModeChange('reference'); onReferenceImagesChange([]); }}
                    className={`flex-1 py-2 text-[10px] sm:text-xs font-semibold rounded-lg transition-all ${designMode === 'reference' ? 'bg-white dark:bg-zinc-600 shadow-sm text-orange-600 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400'}`}
                 >
                     {t('modeReference')}
                 </button>
            </div>

            {/* 1. Character & Basic Settings Header */}
            <div className="flex items-center justify-between">
                <div className="relative">
                    <button ref={characterButtonRef} onClick={() => setShowCharacterPopover(p => !p)} className="flex items-center gap-2 p-1.5 pr-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
                         <img 
                            src={characters.find(c => c.id === characterId)?.face || undefined} 
                            className="w-8 h-8 rounded-full bg-slate-200 dark:bg-zinc-700 object-cover" 
                            alt="Current character" 
                            referrerPolicy="no-referrer"
                         />
                         <span className="font-semibold text-sm truncate max-w-[100px]">{characters.find(c => c.id === characterId)?.name}</span>
                    </button>
                     {showCharacterPopover && (
                        <div ref={characterPopoverRef} className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-zinc-900 rounded-xl shadow-xl p-2 space-y-1 border border-slate-200 dark:border-white/10 z-50">
                            {characters.map(char => (
                                <button
                                    key={char.id}
                                    onClick={() => { onCharacterChange(char.id); setShowCharacterPopover(false); }}
                                    className={`flex items-center justify-between p-2 rounded-lg w-full text-left transition-colors ${characterId === char.id ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' : 'hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                    title={char.id === 'hankimo' || char.id === 'rikimi' ? "Đang bảo trì" : ""}
                                >
                                    <div className="flex items-center gap-3">
                                        <img src={char.face || undefined} className="w-8 h-8 rounded-full bg-slate-200 dark:bg-zinc-700" alt={char.name} />
                                        <span className={`text-sm font-medium ${char.id === 'hankimo' || char.id === 'rikimi' ? 'opacity-50' : ''}`}>{char.name}</span>
                                    </div>
                                    {(char.id === 'hankimo' || char.id === 'rikimi') && (
                                        <span className="text-[8px] text-orange-500 font-bold bg-orange-100 dark:bg-orange-900/30 px-1.5 py-0.5 rounded uppercase text-center leading-tight whitespace-nowrap ml-2">Bảo trì</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                 <div className="relative">
                    <button ref={settingsButtonRef} onClick={() => setShowSettingsPopover(p => !p)} className="p-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm text-slate-500 dark:text-zinc-400">
                        <SettingsIcon className="w-5 h-5" />
                    </button>
                    {showSettingsPopover && (
                        <div ref={settingsPopoverRef} className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-zinc-900 rounded-xl shadow-xl p-4 space-y-4 border border-slate-200 dark:border-white/10 z-50">
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('aspectRatio')}</label>
                                <div className={`grid grid-cols-3 gap-1 ${isConceptMode ? 'opacity-50 pointer-events-none' : ''}`}>
                                    {aspectRatioOptions.map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => onAspectRatioChange(option.id)}
                                        className={`px-2 py-1.5 text-xs rounded-md transition-colors border ${aspectRatio === option.id ? 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/30 dark:border-orange-500/30 dark:text-orange-300' : 'border-slate-100 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                    >
                                        {t(option.labelKey)}
                                    </button>
                                    ))}
                                </div>
                                {isConceptMode && <p className="text-[10px] text-orange-500 italic">Locked to 9:16 for Concept Mode</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('background')}</label>
                                <div className="flex bg-slate-100 dark:bg-zinc-950/50 p-1 rounded-lg">
                                    {backgroundOptions.map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => onBackgroundChange(option.id)}
                                        className={`flex-1 py-1.5 text-xs rounded-md transition-all ${background === option.id ? 'bg-white dark:bg-zinc-700 shadow-sm text-slate-800 dark:text-zinc-200 font-medium' : 'text-slate-500 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                    >
                                        {t(option.labelKey)}
                                    </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('numImages')}</label>
                                <div className="flex bg-slate-100 dark:bg-zinc-950/50 p-1 rounded-lg">
                                    {numVariationsOptions.map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => onNumVariationsChange(option.id)}
                                        className={`flex-1 py-1.5 text-xs rounded-md transition-all ${numVariations === option.id ? 'bg-white dark:bg-zinc-700 shadow-sm text-slate-800 dark:text-zinc-200 font-medium' : 'text-slate-500 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                    >
                                        {option.label}
                                    </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* REFERENCE MODE: Dedicated Upload Area + Options */}
            {isReferenceMode && (
                 <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-orange-500 dark:text-orange-400 uppercase tracking-wide">{t('uploadRefImage')}</label>
                        <div onClick={handleUploadClick} className="relative aspect-[4/3] bg-orange-50 dark:bg-orange-900/20 border-2 border-dashed border-orange-200 dark:border-orange-700/50 rounded-xl flex items-center justify-center cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-all group overflow-hidden">
                             {referenceImages.length > 0 ? (
                                 <img src={referenceImages[0]?.base64 || undefined} alt="Ref" className="w-full h-full object-cover" />
                             ) : (
                                 <div className="flex flex-col items-center gap-2 text-orange-400 dark:text-orange-300">
                                     <UploadIcon className="w-8 h-8" />
                                     <span className="text-xs font-medium">{t('attachImage')}</span>
                                 </div>
                             )}
                             
                             {/* Hover overlay to change image */}
                             {referenceImages.length > 0 && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-white text-xs font-bold">{t('attachImage')}</span>
                                </div>
                             )}
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-400 italic text-center px-2">
                            {t('refModeHint')}
                        </p>
                    </div>

                    {/* Remix Options */}
                    <div className="p-3 bg-slate-50 dark:bg-zinc-900/50 rounded-xl border border-slate-200 dark:border-white/10/50 space-y-2">
                        <label className="text-xs font-bold text-slate-600 dark:text-zinc-300 uppercase tracking-wider block mb-1">{t('remixOptionsLabel')}</label>
                        
                        <div 
                            className="flex items-center gap-2 cursor-pointer group"
                            onClick={() => onRemixSettingsChange({...remixSettings, keepBackground: !remixSettings.keepBackground})}
                        >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${remixSettings.keepBackground ? 'bg-orange-500 border-orange-500' : 'border-slate-400 dark:border-zinc-600 bg-white dark:bg-zinc-900'}`}>
                                {remixSettings.keepBackground && <CheckIcon className="w-3 h-3 text-white" />}
                            </div>
                            <span className="text-xs text-slate-600 dark:text-zinc-300 group-hover:text-orange-500 dark:group-hover:text-orange-400">{t('keepBackground')}</span>
                        </div>

                        <div 
                            className="flex items-center gap-2 cursor-pointer group"
                            onClick={() => onRemixSettingsChange({...remixSettings, keepPose: !remixSettings.keepPose})}
                        >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${remixSettings.keepPose ? 'bg-orange-500 border-orange-500' : 'border-slate-400 dark:border-zinc-600 bg-white dark:bg-zinc-900'}`}>
                                {remixSettings.keepPose && <CheckIcon className="w-3 h-3 text-white" />}
                            </div>
                            <span className="text-xs text-slate-600 dark:text-zinc-300 group-hover:text-orange-500 dark:group-hover:text-orange-400">{t('keepPose')}</span>
                        </div>
                    </div>
                 </div>
            )}

            {/* 2. Main Prompt Textarea (Expanded) */}
            <div className="flex-grow flex flex-col min-h-0 relative">
                <div className="flex justify-between items-end mb-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">
                        {isReferenceMode ? t('customPromptLabel') : t('descriptionLabel')}
                    </label>
                    <button 
                        onClick={handleMagicPrompt}
                        disabled={isEnhancing || !prompt.trim()}
                        className={`flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-md shadow-sm transition-all disabled:opacity-50 disabled:grayscale ${theme === 'dark' ? 'bg-gradient-to-r from-orange-400 to-amber-500 text-white hover:from-orange-500 hover:to-amber-600' : 'bg-black text-white hover:bg-zinc-800'}`}
                        title="Tự động viết mô tả chi tiết bằng AI"
                    >
                        {isEnhancing ? <SpinnerIcon className="w-3 h-3 animate-spin" /> : <span>✨</span>}
                        <span>Magic</span>
                    </button>
                </div>
                
                <textarea
                    className={`flex-grow w-full p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-xl resize-none focus:ring-2 outline-none text-sm text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-slate-500 transition-all shadow-sm ${theme === 'dark' ? 'focus:ring-orange-500/50 focus:border-orange-500' : 'focus:ring-black/20 focus:border-black'}`}
                    placeholder={isReferenceMode ? t('promptPlaceholderRef') : t('promptPlaceholder')}
                    value={prompt}
                    onChange={(e) => onPromptChange(e.target.value)}
                    onPaste={handlePaste}
                />
            </div>

            {/* 3. Reference Images (Only show for Free/Concept mode here, Ref mode handles above) */}
             {!isReferenceMode && referenceImages.length > 0 && (
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">{t('referenceImage')}</label>
                    <div className="flex flex-wrap gap-2 p-2 bg-slate-50 dark:bg-zinc-900/50 rounded-xl border border-slate-100 dark:border-white/10/50">
                        {referenceImages.map((image, index) => (
                            <div key={index} className="relative w-16 h-16 bg-white dark:bg-zinc-700 rounded-lg p-1 shadow-sm border border-slate-200 dark:border-zinc-600 group">
                                <img src={image.base64 || undefined} alt={`Ref ${index + 1}`} className="w-full h-full object-contain rounded-md" />
                                <button
                                    onClick={() => handleRemoveReferenceImage(index)}
                                    className="absolute -top-1.5 -right-1.5 bg-white text-red-500 border border-slate-200 rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50"
                                >
                                    &times;
                                </button>
                                {isSketch && referenceImages.length === 1 && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg pointer-events-none">
                                        <PencilIcon className="w-4 h-4 text-white"/>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 4. Action Buttons */}
            <div className="flex flex-col gap-3 mt-auto pt-2 border-t border-slate-200 dark:border-white/5">
                {!isReferenceMode && (
                    <div className="grid grid-cols-2 gap-3">
                         <button onClick={handleUploadClick} className="flex items-center justify-center gap-2 p-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-600 dark:text-zinc-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm">
                            <AttachmentIcon className="w-4 h-4"/> <span>{t('attachImage')}</span>
                        </button>
                        <button onClick={onOpenSketchModal} className="flex items-center justify-center gap-2 p-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-600 dark:text-zinc-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm">
                            <PencilIcon className="w-4 h-4"/> <span>{t('sketch')}</span>
                        </button>
                    </div>
                )}
                
                <button
                    onClick={onGenerate}
                    disabled={isLoading || !isReady || (isReferenceMode && referenceImages.length === 0)}
                    className={`w-full py-3.5 font-bold rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-wide text-sm ${theme === 'dark' ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-500/20' : 'bg-black hover:bg-zinc-800 text-white shadow-black/10'}`}
                >
                    {isLoading ? <LoadingSpinner /> : <WandIcon className="w-5 h-5" />}
                    <span>{t('generate')}</span>
                </button>
            </div>
            
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg, image/webp" multiple={!isReferenceMode} />
        </div>
    );
  }

  return null; // Fallback handled by Sidebar version for now
};
