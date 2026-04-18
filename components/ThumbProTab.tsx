
import React, { useState, useEffect, useRef } from 'react';
import { useI18n } from '../i18n';
import { 
    LoadingSpinner, WandIcon, DownloadIcon, 
    UploadIcon, PhotoIcon, TrashIcon, SettingsIcon, CheckIcon, XIcon, MaximizeIcon
} from '../constants';
import { generateYoutubeThumbnail } from '../services/geminiService';
import type { 
    ThumbnailConfig, ThumbnailStyle, SubjectPosition, 
    FontStyle, LogoPosition, StrokeColor, GeneratedImage, AIModel, ImageQuality, SocialPlatform
} from '../types';

interface ThumbProTabProps {
    onAddImages: (images: Omit<GeneratedImage, 'sourceTab'>[], sourceTab: 'thumbPro') => void;
    model: AIModel;
    onEdit?: (image: GeneratedImage) => void;
    onViewDetail?: (src: string) => void;
    images?: GeneratedImage[]; // Add this to receive live updates
}

export const ThumbProTab: React.FC<ThumbProTabProps> = ({ onAddImages, model, onEdit, onViewDetail, images }) => {
    const { t, language } = useI18n();
    const [isChecking, setIsChecking] = useState(true);
    const [isKeySelected, setIsKeySelected] = useState<boolean | null>(null);
    
    const [config, setConfig] = useState<ThumbnailConfig>({
        isReferenceMode: false,
        style: 'ModernEdu',
        fontStyle: 'Modern Sans',
        headline: '',
        subHeadline: '',
        description: '',
        footer: '',
        customPrompt: '',
        subjectImage: null,
        bgImage: null,
        logoImage: null,
        referenceTemplate: null,
        logoPosition: 'TopLeft',
        position: 'Auto',
        strokeColor: 'White',
        primaryColor: '#f97316',
        iconKeywords: '',
        quality: 'Auto',
        socialPlatform: 'Auto',
        lockTextToLine: false
    });

    const [isGenerating, setIsGenerating] = useState(false);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [currentImageId, setCurrentImageId] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    
    const subjectInputRef = useRef<HTMLInputElement>(null);
    const bgInputRef = useRef<HTMLInputElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const templateInputRef = useRef<HTMLInputElement>(null);

    // Watch for external updates to the current image (e.g. from Editor Modal)
    useEffect(() => {
        if (currentImageId && images) {
            const found = images.find(img => img.id === currentImageId);
            if (found && found.src !== resultImage) {
                setResultImage(found.src);
            }
        }
    }, [images, currentImageId, resultImage]);

    useEffect(() => {
        const check = async () => {
            try {
                const has = await (window as any).aistudio.hasSelectedApiKey();
                setIsKeySelected(has);
                setIsChecking(false);
            } catch (e) {
                setIsKeySelected(false);
                setIsChecking(false);
            }
        };
        check();
    }, []);

    const handleSelectKey = async () => {
        try {
            await (window as any).aistudio.openSelectKey();
            setIsKeySelected(true);
        } catch (e) { console.error(e); }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: keyof ThumbnailConfig) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Supported MIME Types for Gemini AI
        const supportedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        if (!supportedTypes.includes(file.type)) {
            setError(`${t('unsupportedFormat')} ${t('suggestedFormats')}`);
            // Clear input
            e.target.value = '';
            return;
        }

        if (file.size > 4 * 1024 * 1024) {
             setError(t('fileTooLargeShort'));
             e.target.value = '';
             return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            setConfig(prev => ({ ...prev, [target]: { base64: ev.target?.result as string, mimeType: file.type } }));
            setError(null); // Clear format error if success
        };
        reader.readAsDataURL(file);
    };

    const handleGenerate = async () => {
        if (!config.headline || isGenerating) return;
        setIsGenerating(true);
        setError(null);
        setResultImage(null);
        setCurrentImageId('');

        try {
            const result = await generateYoutubeThumbnail(config, model, language);
            if (result.images && result.images.length > 0) {
                // Take the first image
                const imgData = `data:image/png;base64,${result.images[0]}`;
                setResultImage(imgData);
                const newId = `pro_${Date.now()}`;
                setCurrentImageId(newId);
                onAddImages([{
                    id: newId,
                    src: imgData,
                    x: 0, y: 0, z: Date.now()
                }], 'thumbPro');
            } else {
                throw new Error("AI returned empty result. Please try a different description.");
            }
        } catch (e: any) {
            console.error("Generation error:", e);
            setError(e.message || "An unexpected error occurred.");
            if (e.message?.includes("Requested entity was not found")) setIsKeySelected(false);
        } finally { setIsGenerating(false); }
    };
    
    const handleEditClick = () => {
        if (resultImage && onEdit) {
            // Need to create a proper GeneratedImage object based on current state
            const imgObj: GeneratedImage = {
                id: currentImageId,
                src: resultImage,
                x: 0, y: 0, z: 0,
                sourceTab: 'thumbPro'
            };
            onEdit(imgObj);
        }
    };
    
    const handleViewClick = () => {
        if (resultImage && onViewDetail) {
            onViewDetail(resultImage);
        }
    };

    if (isChecking) return <div className="w-full h-full flex items-center justify-center bg-black"><LoadingSpinner /></div>;

    const isProModelSelected = model === 'gemini-3.1-flash-image-preview';
    const buttonClass = "p-3 bg-black/50 text-white rounded-full hover:bg-black/70 backdrop-blur-md transition-all border border-white/10";

    return (
        <div className="w-full h-full flex flex-col lg:flex-row bg-black overflow-hidden font-sans">
            {/* Sidebar Controls */}
            <div className="w-full lg:w-[420px] bg-zinc-950 border-r border-orange-500/20 flex flex-col overflow-hidden z-10 shadow-2xl">
                <div className="p-4 border-b border-orange-500/10 bg-black flex justify-between items-center">
                    <h2 className="font-black text-orange-500 uppercase tracking-tighter text-lg">PRO DESIGN</h2>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-zinc-500 px-2 py-1 bg-zinc-900 rounded border border-white/5 uppercase">
                            {isProModelSelected ? 'Mode: PRO' : 'Mode: FLASH'}
                        </span>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-orange-600">
                    
                    {/* Mode Tabs */}
                    <div className="bg-zinc-900 p-1.5 rounded-2xl flex gap-1 shadow-inner border border-white/5">
                        <button 
                            onClick={() => setConfig({...config, isReferenceMode: false})}
                            className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${!config.isReferenceMode ? 'bg-orange-600 text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            {t('designModeTab')}
                        </button>
                        <button 
                            onClick={() => setConfig({...config, isReferenceMode: true})}
                            className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${config.isReferenceMode ? 'bg-orange-600 text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            {t('referenceModeTab')}
                        </button>
                    </div>

                    {/* Check if Key is needed for Pro model */}
                    {isProModelSelected && !isKeySelected ? (
                         <div className="p-5 bg-orange-500/10 rounded-2xl border border-orange-500/20 text-center space-y-4">
                            <SettingsIcon className="w-10 h-10 text-orange-500 mx-auto" />
                            <p className="text-xs text-orange-200">{t('connectProDesc')}</p>
                            <button onClick={handleSelectKey} className="w-full py-3 bg-orange-600 text-white font-black rounded-xl hover:bg-orange-500 transition-all text-xs uppercase">
                                {t('connectBtn')}
                            </button>
                         </div>
                    ) : (
                        <>
                            {/* Image Upload Section: Subject & Reference in one row if needed */}
                            <div className="p-5 bg-zinc-900/50 rounded-2xl border border-white/5">
                                <div className={`grid ${config.isReferenceMode ? 'grid-cols-2' : 'grid-cols-1'} gap-4 transition-all duration-300`}>
                                    
                                    {/* Subject Upload */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-orange-400 uppercase tracking-[2px] block truncate">{t('mainSubjectLabel')}</label>
                                        <div onClick={() => subjectInputRef.current?.click()} className="aspect-square bg-black border-2 border-dashed border-zinc-800 hover:border-orange-500/50 rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden transition-all group relative">
                                            {config.subjectImage ? <img src={config.subjectImage.base64} className="w-full h-full object-cover" /> : <UploadIcon className="w-8 h-8 text-zinc-700 group-hover:text-orange-500" />}
                                            <input type="file" ref={subjectInputRef} className="hidden" onChange={e => handleFileUpload(e, 'subjectImage')} accept="image/png, image/jpeg, image/webp" />
                                        </div>
                                    </div>

                                    {/* Reference Upload */}
                                    {config.isReferenceMode && (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-right-4 duration-300">
                                            <label className="text-[10px] font-black text-orange-400 uppercase tracking-[2px] block truncate" title={t('referenceImgLabel')}>{t('referenceImgLabel')}</label>
                                            <div onClick={() => templateInputRef.current?.click()} className="aspect-square bg-black border-2 border-dashed border-zinc-800 hover:border-orange-500/50 rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden group relative">
                                                {config.referenceTemplate ? <img src={config.referenceTemplate.base64} className="w-full h-full object-cover" /> : <PhotoIcon className="w-8 h-8 text-zinc-700 group-hover:text-orange-500" />}
                                                <input type="file" ref={templateInputRef} className="hidden" onChange={e => handleFileUpload(e, 'referenceTemplate')} accept="image/png, image/jpeg, image/webp" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Output Settings (Platform & Quality) */}
                            <div className="p-5 bg-zinc-900/50 rounded-2xl border border-white/5 space-y-4">
                                <label className="text-[10px] font-black text-orange-400 uppercase tracking-[2px]">Output Settings</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                         <span className="text-[10px] text-zinc-400 font-bold uppercase">Ratio / Platform</span>
                                         <select 
                                            className="w-full bg-black border border-zinc-800 text-zinc-300 text-xs p-2.5 rounded-xl focus:border-orange-500 outline-none"
                                            value={config.socialPlatform}
                                            onChange={(e) => setConfig({...config, socialPlatform: e.target.value as SocialPlatform})}
                                         >
                                            <option value="Auto">Auto (Default)</option>
                                            <option value="YouTube">YouTube (16:9)</option>
                                            <option value="FacebookPost">Facebook (4:3)</option>
                                            <option value="InstagramPost">Instagram (1:1)</option>
                                            <option value="InstagramStory">Story (9:16)</option>
                                            <option value="TikTok">TikTok (9:16)</option>
                                         </select>
                                    </div>
                                    <div className={`space-y-1 ${!isProModelSelected ? 'opacity-50' : ''}`}>
                                        <span className="text-[10px] text-zinc-400 font-bold uppercase">Quality (Pro)</span>
                                        <select 
                                            disabled={!isProModelSelected}
                                            title={!isProModelSelected ? "Chỉ hỗ trợ trên model Gemini 3.1 Flash Image" : ""}
                                            className="w-full bg-black border border-zinc-800 text-zinc-300 text-xs p-2.5 rounded-xl focus:border-orange-500 outline-none disabled:cursor-not-allowed"
                                            value={config.quality}
                                            onChange={(e) => setConfig({...config, quality: e.target.value as ImageQuality})}
                                        >
                                            <option value="Auto">Auto</option>
                                            <option value="1K">Standard (1K)</option>
                                            <option value="2K">High Res (2K)</option>
                                            <option value="4K">Ultra (4K/Max)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Visual Styles */}
                            {!config.isReferenceMode && (
                                <div className="p-5 bg-zinc-900/50 rounded-2xl border border-white/5 space-y-4 animate-in fade-in duration-700">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-orange-400 uppercase tracking-[2px]">{t('styleLabel')}</span>
                                        <select className="w-full bg-black border border-zinc-800 text-zinc-300 text-sm p-3 rounded-xl focus:border-orange-500 outline-none transition-all" value={config.style} onChange={e => setConfig({...config, style: e.target.value as ThumbnailStyle})}>
                                            <option value="ModernEdu">{t('styleModern')}</option>
                                            <option value="HighContrast">{t('styleContrast')}</option>
                                            <option value="VibrantAnime">{t('styleAnime')}</option>
                                            <option value="Cyberpunk">{t('styleCyber')}</option>
                                            <option value="Minimalist">{t('styleMinimal')}</option>
                                            <option value="Luxury">{t('styleLuxury')}</option>
                                            <option value="Gaming">{t('styleGaming')}</option>
                                            <option value="Cinematic">{t('styleCinematic')}</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center justify-between pt-2">
                                        <span className="text-[10px] font-black text-orange-400 uppercase tracking-[2px]">{t('colorLabel')}</span>
                                        <input type="color" value={config.primaryColor} onChange={e => setConfig({...config, primaryColor: e.target.value})} className="w-12 h-8 rounded-lg border-none cursor-pointer bg-transparent p-0" />
                                    </div>
                                </div>
                            )}

                            {/* Text Components */}
                            <div className="p-5 bg-zinc-900/50 rounded-2xl border border-white/5 space-y-4">
                                <label className="text-[10px] font-black text-orange-400 uppercase tracking-[2px]">Typography & Content</label>
                                
                                <div className="flex items-center gap-2 pb-2">
                                    <input 
                                        type="checkbox" 
                                        id="lockText" 
                                        checked={config.lockTextToLine}
                                        onChange={(e) => setConfig({...config, lockTextToLine: e.target.checked})}
                                        className="w-4 h-4 rounded border-zinc-700 bg-black text-orange-600 focus:ring-orange-600/50"
                                    />
                                    <label htmlFor="lockText" className="text-xs text-zinc-400 select-none cursor-pointer hover:text-white transition-colors">{t('lockTextToLineLabel')}</label>
                                </div>

                                <div className="space-y-3">
                                    <input className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-sm font-bold text-white focus:border-orange-500 outline-none transition-all" placeholder={t('headlineLabel')} value={config.headline} onChange={e => setConfig({...config, headline: e.target.value})} />
                                    <textarea rows={2} className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-sm text-zinc-300 focus:border-orange-500 outline-none transition-all resize-none" placeholder={t('descriptionLabel')} value={config.description} onChange={e => setConfig({...config, description: e.target.value})} />
                                    <input className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-sm text-zinc-400 focus:border-orange-500 outline-none transition-all" placeholder={t('footerLabel')} value={config.footer} onChange={e => setConfig({...config, footer: e.target.value})} />
                                </div>
                            </div>

                            {/* Extra Settings */}
                            <div className="p-5 bg-zinc-900/50 rounded-2xl border border-white/5 space-y-4 pb-10">
                                <input className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-sm text-zinc-300 focus:border-orange-500 outline-none" placeholder={t('iconLabel')} value={config.iconKeywords} onChange={e => setConfig({...config, iconKeywords: e.target.value})} />
                                <textarea rows={2} className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-sm text-zinc-400 focus:border-orange-500 outline-none resize-none" placeholder={t('customPromptLabel')} value={config.customPrompt} onChange={e => setConfig({...config, customPrompt: e.target.value})} />
                            </div>
                        </>
                    )}
                </div>

                {/* Fixed Generate Button */}
                <div className="p-4 bg-zinc-950 border-t border-orange-500/20 shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
                    <button 
                        onClick={handleGenerate} 
                        disabled={isGenerating || !config.headline || (isProModelSelected && !isKeySelected)} 
                        className="w-full py-5 bg-gradient-to-r from-orange-600 to-orange-400 hover:from-orange-500 hover:to-orange-300 text-black font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale uppercase tracking-[3px] text-sm"
                    >
                        {isGenerating ? <LoadingSpinner /> : <WandIcon className="w-6 h-6" />} {t('generateBtn')}
                    </button>
                </div>
            </div>

            {/* Preview Section */}
            <div className="flex-grow relative flex flex-col bg-zinc-900 items-center justify-center p-6 md:p-12">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                
                {isGenerating ? (
                    <div className="text-center space-y-6">
                        <div className="w-24 h-24 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto shadow-[0_0_50px_rgba(249,115,22,0.3)]"></div>
                        <div className="space-y-2">
                             <p className="text-lg font-black text-orange-500 animate-pulse uppercase tracking-[5px]">{t('rendering')}</p>
                             <p className="text-xs text-zinc-500 uppercase tracking-widest">{isProModelSelected ? 'Optimizing pixels for 2K HDR output' : 'Fast rendering mode'}</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="max-w-md w-full bg-red-950/20 border border-red-500/30 p-8 rounded-3xl text-center space-y-6 animate-in fade-in zoom-in">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                            <XIcon className="w-8 h-8 text-red-500" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-red-500 uppercase">{t('generationFailed')}</h3>
                            <p className="text-sm text-red-200/70">{error}</p>
                        </div>
                        <button 
                            onClick={() => setError(null)}
                            className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all"
                        >
                            Thử lại
                        </button>
                    </div>
                ) : resultImage ? (
                    <div className="w-full max-w-6xl space-y-6 animate-in fade-in zoom-in duration-700">
                        <div className="rounded-[40px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] border-[12px] border-zinc-800/50 backdrop-blur-xl relative group">
                            <img src={resultImage} className="w-full h-auto shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]" />
                            <div className="absolute top-4 right-6 bg-orange-500 text-black text-[10px] font-black px-3 py-1 rounded-full shadow-lg z-20">
                                {isProModelSelected ? 'PRO VERSION' : 'FLASH VERSION'}
                            </div>
                            
                            {/* Overlay Controls */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 z-10">
                                <button onClick={handleEditClick} className={`${buttonClass} hover:bg-indigo-500/80 hover:scale-110`} title={t('editImage')}>
                                    <WandIcon className="w-6 h-6" />
                                </button>
                                <button onClick={handleViewClick} className={`${buttonClass} hover:bg-blue-500/80 hover:scale-110`} title={t('viewDetail')}>
                                    <MaximizeIcon className="w-6 h-6" />
                                </button>
                                <button onClick={() => { const a = document.createElement('a'); a.href = resultImage; a.download = `riki-pro-${Date.now()}.png`; a.click(); }} className={`${buttonClass} hover:bg-green-500/80 hover:scale-110`} title={t('downloadImage')}>
                                    <DownloadIcon className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                        
                        {/* Redundant Download button for mobile/accessibility */}
                        <div className="flex justify-center md:hidden">
                            <button onClick={() => { const a = document.createElement('a'); a.href = resultImage; a.download = `riki-pro-${Date.now()}.png`; a.click(); }} className="group relative flex items-center gap-4 bg-orange-600 px-12 py-5 rounded-2xl font-black shadow-2xl transition-all hover:bg-orange-500 hover:scale-105 text-black uppercase tracking-[2px]">
                                <DownloadIcon className="w-6 h-6" /> {t('downloadBtn')}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center space-y-6 max-w-sm opacity-30 group">
                        <div className="relative">
                            <WandIcon className="w-40 h-40 text-zinc-800 mx-auto transition-all group-hover:text-orange-950 group-hover:scale-110 duration-1000" />
                            <div className="absolute inset-0 bg-orange-500 blur-[100px] opacity-0 group-hover:opacity-10 transition-all"></div>
                        </div>
                        <p className="text-2xl font-black uppercase text-zinc-800 tracking-tighter group-hover:text-zinc-700">{t('waiting')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
