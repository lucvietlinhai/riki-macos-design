import React from 'react';
import type { StoryArcState, StoryScene, CharacterId, AIModel, ImageFile } from '../types';
import { LoadingSpinner, WandIcon, RefreshIcon, TypographyIcon, PlusIcon, SettingsIcon, TrashIcon, MaximizeIcon } from '../constants';
import { useI18n } from '../i18n';
import { useTheme } from '../theme';
import { analyzeStoryToScenes, generateStorySceneImage, generateSceneVideo } from '../services/geminiService';
import { VideoIcon, PlayIcon } from '../constants';
import { characters } from '../data/characters';

interface StoryArcTabProps {
  state: StoryArcState;
  onStateChange: (state: StoryArcState) => void;
  characterId: CharacterId;
  onCharacterChange: (id: CharacterId) => void;
  model: AIModel;
  onImageGenerated: (src: string) => void;
  onViewDetail?: (src: string) => void;
}

export const StoryArcTab: React.FC<StoryArcTabProps> = ({
  state,
  onStateChange,
  characterId,
  onCharacterChange,
  model,
  onImageGenerated,
  onViewDetail
}) => {
  const { t, language } = useI18n();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [showCharacterPopover, setShowCharacterPopover] = React.useState(false);
  const characterButtonRef = React.useRef<HTMLButtonElement>(null);
  const characterPopoverRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAnalyzeStory = async () => {
    if (!state.fullStory.trim()) return;
    setIsAnalyzing(true);
    try {
      const scenes = await analyzeStoryToScenes(state.fullStory, language);
      onStateChange({ ...state, scenes });
    } catch (e) {
      console.error("Analysis failed", e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateSingleScene = async (sceneId: string, currentScenes: StoryScene[]): Promise<string | null> => {
    const idx = currentScenes.findIndex(s => s.id === sceneId);
    if (idx === -1) return null;
    const scene = currentScenes[idx];
    const prevImg = idx > 0 ? currentScenes[idx - 1].generatedImage : undefined;

    try {
      const character = characters.find(c => c.id === characterId)!;
      const characterImage: ImageFile = { base64: character.body, mimeType: 'image/png' };
      const faceReference: ImageFile = { base64: character.face, mimeType: 'image/png' };

      const base64 = await generateStorySceneImage(
        scene,
        characterImage,
        faceReference,
        characterId,
        model,
        state.aspectRatio,
        prevImg
      );
      return `data:image/png;base64,${base64}`;
    } catch (e) {
      console.error("Single scene generation failed", e);
      return null;
    }
  };

  const handleGenerateScene = async (sceneId: string) => {
    // Local copy for the single update
    const updatedScenes = state.scenes.map(s =>
      s.id === sceneId ? { ...s, isLoading: true } : s
    );
    onStateChange({ ...state, scenes: updatedScenes });

    const imageUrl = await generateSingleScene(sceneId, state.scenes);

    const nextScenes = state.scenes.map(s =>
      s.id === sceneId ? { ...s, generatedImage: imageUrl || s.generatedImage, isLoading: false } : s
    );
    onStateChange({ ...state, scenes: nextScenes });
    if (imageUrl) onImageGenerated(imageUrl);
  };

  const handleGenerateVideo = async (sceneId: string) => {
    const scene = state.scenes.find(s => s.id === sceneId);
    if (!scene || !scene.generatedImage) return;

    const updatedScenes = state.scenes.map(s =>
      s.id === sceneId ? { ...s, isVideoLoading: true } : s
    );
    onStateChange({ ...state, scenes: updatedScenes });

    try {
      const videoUrl = await generateSceneVideo(scene, scene.generatedImage, state.aspectRatio);
      
      const nextScenes = state.scenes.map(s =>
        s.id === sceneId ? { ...s, videoUrl, isVideoLoading: false } : s
      );
      onStateChange({ ...state, scenes: nextScenes });
    } catch (e) {
      console.error("Video generation failed", e);
      const nextScenes = state.scenes.map(s =>
        s.id === sceneId ? { ...s, isVideoLoading: false } : s
      );
      onStateChange({ ...state, scenes: nextScenes });
    }
  };

  const handleUpdateScenePrompt = (sceneId: string, newPrompt: string) => {
    const updatedScenes = state.scenes.map(s => 
      s.id === sceneId ? { ...s, imagePrompt: newPrompt } : s
    );
    onStateChange({ ...state, scenes: updatedScenes });
  };

  const handleDeleteScene = (sceneId: string) => {
    const nextScenes = state.scenes.filter(s => s.id !== sceneId).map((s, idx) => ({
        ...s,
        chapterNumber: idx + 1
    }));
    onStateChange({ ...state, scenes: nextScenes });
  };

  const [isGeneratingAll, setIsGeneratingAll] = React.useState(false);
  const [isGeneratingAllVideos, setIsGeneratingAllVideos] = React.useState(false);
  const [isContinuing, setIsContinuing] = React.useState(false);

  const handleGenerateAllVideos = async () => {
    if (state.scenes.length === 0 || isGeneratingAllVideos) return;
    setIsGeneratingAllVideos(true);

    for (let i = 0; i < state.scenes.length; i++) {
        const scene = state.scenes[i];
        if (!scene.generatedImage || scene.videoUrl) continue;
        await handleGenerateVideo(scene.id);
    }
    setIsGeneratingAllVideos(false);
  };

  const handleGenerateAll = async () => {
    if (state.scenes.length === 0 || isGeneratingAll) return;
    setIsGeneratingAll(true);

    let currentScenes = [...state.scenes];

    for (let i = 0; i < currentScenes.length; i++) {
        const scene = currentScenes[i];
        if (scene.generatedImage) continue;

        // 1. Set individual loading
        currentScenes = currentScenes.map(s => s.id === scene.id ? { ...s, isLoading: true } : s);
        onStateChange({ ...state, scenes: currentScenes });

        // 2. Wait for current scene generation to finish before moving to next
        const imageUrl = await generateSingleScene(scene.id, currentScenes);

        if (!imageUrl) {
            // 3a. Error occurred: update current scene loading state and STOP everything
            currentScenes = currentScenes.map(s => s.id === scene.id ? { ...s, isLoading: false } : s);
            onStateChange({ ...state, scenes: currentScenes });
            break; // STOP loop on first error
        }

        // 3b. Handle success: update current scene and move to next
        currentScenes = currentScenes.map(s =>
            s.id === scene.id ? { ...s, generatedImage: imageUrl, isLoading: false } : s
        );
        onStateChange({ ...state, scenes: currentScenes });
        onImageGenerated(imageUrl);
    }

    setIsGeneratingAll(false);
  };

  const handleAddEmptyScene = () => {
    const newScene: StoryScene = {
        id: `scene-manual-${Date.now()}`,
        chapterNumber: state.scenes.length + 1,
        title: `${t('storyArcScene')} ${state.scenes.length + 1}`,
        description: '',
        imagePrompt: ''
    };
    onStateChange({ ...state, scenes: [...state.scenes, newScene] });
  };

  const handleAutoMagic = async () => {
    if (isContinuing) return;
    setIsContinuing(true);
    try {
        const { continueStoryFromScenes } = await import('../services/geminiService');
        const nextScene = await continueStoryFromScenes(state.scenes, language);
        onStateChange({ ...state, scenes: [...state.scenes, nextScene] });
    } catch (e) {
        console.error("Auto magic failed", e);
    } finally {
        setIsContinuing(false);
    }
  };

  const accentClass = isDark ? 'bg-orange-600' : 'bg-black';
  const sidebarBg = isDark ? 'bg-zinc-950' : 'bg-white';
  const contentBg = isDark ? 'bg-zinc-900' : 'bg-slate-50';
  const borderClass = isDark ? 'border-white/5' : 'border-slate-200';

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Sidebar: Left Side */}
      <aside className={`w-[340px] flex-shrink-0 border-r ${sidebarBg} ${borderClass} flex flex-col z-30 shadow-xl overflow-y-auto scrollbar-thin`}>
        <div className="p-6 space-y-8">
            <div className="space-y-4">
                <h3 className={`text-xs font-black uppercase tracking-[0.2em] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                    {t('settings')}
                </h3>
                
                {/* Character Selection */}
                <div className="space-y-3">
                    <label className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{t('chooseCharacter')}</label>
                    <div className="relative">
                        <button 
                            ref={characterButtonRef} 
                            onClick={() => setShowCharacterPopover(p => !p)} 
                            className={`flex items-center justify-between w-full px-4 py-3 rounded-xl border ${isDark ? 'bg-zinc-900 border-white/10' : 'bg-slate-50 border-slate-200'} transition-all`}
                        >
                            <div className="flex items-center gap-3">
                                <img src={characters.find(c => c.id === characterId)?.face} className="w-8 h-8 rounded-full bg-slate-200 dark:bg-zinc-800" alt="Mascot" />
                                <span className={`text-sm font-bold uppercase ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>{characters.find(c => c.id === characterId)?.name}</span>
                            </div>
                            <SettingsIcon className="w-4 h-4 opacity-40" />
                        </button>
                        {showCharacterPopover && (
                            <div ref={characterPopoverRef} className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-zinc-900 rounded-xl shadow-2xl p-2 z-50 border border-slate-200 dark:border-white/10">
                                {characters.map(char => (
                                    <button
                                        key={char.id}
                                        onClick={() => { onCharacterChange(char.id); setShowCharacterPopover(false); }}
                                        className={`flex items-center gap-3 p-2 rounded-lg w-full text-left transition-colors ${characterId === char.id ? `${accentClass} text-white` : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300'}`}
                                    >
                                        <img src={char.face} className="w-8 h-8 rounded-full bg-slate-200 dark:bg-zinc-700" alt={char.name} />
                                        <span className="text-sm font-semibold">{char.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Aspect Ratio Selection */}
                <div className="space-y-3 pt-4">
                    <label className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{t('aspectRatio')}</label>
                    <div className="flex bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl border dark:border-white/5">
                        <button 
                            onClick={() => onStateChange({ ...state, aspectRatio: '16:9' })}
                            className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${state.aspectRatio === '16:9' ? `${accentClass} text-white shadow-md` : 'text-slate-500 hover:text-slate-900 dark:text-zinc-500 dark:hover:text-zinc-200'}`}
                        >
                            16:9 (Landscape)
                        </button>
                        <button 
                            onClick={() => onStateChange({ ...state, aspectRatio: '9:16' })}
                            className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${state.aspectRatio === '9:16' ? `${accentClass} text-white shadow-md` : 'text-slate-500 hover:text-slate-900 dark:text-zinc-500 dark:hover:text-zinc-200'}`}
                        >
                            9:16 (Portrait)
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-4 pt-6">
                <h3 className={`text-xs font-bold uppercase tracking-[0.2em] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                    {t('storyArcTitle')}
                </h3>
                <div className={`rounded-2xl border ${isDark ? 'bg-zinc-900 border-white/5' : 'bg-slate-50 border-slate-200'} p-4 space-y-4`}>
                    <textarea
                        value={state.fullStory}
                        onChange={(e) => onStateChange({ ...state, fullStory: e.target.value })}
                        placeholder={t('storyArcPlaceholder')}
                        rows={10}
                        className={`w-full bg-transparent border-none focus:ring-0 resize-none text-sm font-normal leading-relaxed ${isDark ? 'text-zinc-200 placeholder-zinc-800' : 'text-slate-700 placeholder-slate-300'}`}
                    />
                    <button
                        onClick={handleAnalyzeStory}
                        disabled={isAnalyzing || !state.fullStory.trim()}
                        className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold uppercase text-xs tracking-widest transition-all ${
                        isAnalyzing || !state.fullStory.trim() 
                            ? 'bg-slate-200 dark:bg-zinc-800 text-slate-400 cursor-not-allowed' 
                            : `${accentClass} text-white shadow-xl hover:scale-[1.02] active:scale-95`
                        }`}
                    >
                        {isAnalyzing ? <LoadingSpinner /> : <WandIcon className="w-4 h-4" />}
                        {t('storyArcAnalyze')}
                    </button>
                    
                    {state.scenes.length > 0 && (
                        <div className="pt-2 space-y-3">
                            <button
                                onClick={handleGenerateAll}
                                disabled={isGeneratingAll || state.scenes.every(s => !!s.generatedImage)}
                                className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold uppercase text-xs tracking-widest transition-all border-2 ${
                                    isGeneratingAll || state.scenes.every(s => !!s.generatedImage)
                                        ? 'border-slate-200 text-slate-400 cursor-not-allowed'
                                        : `${isDark ? 'border-orange-600 text-orange-500 hover:bg-orange-600/10' : 'border-black text-black hover:bg-black/5'}`
                                }`}
                            >
                                {isGeneratingAll ? <LoadingSpinner /> : <RefreshIcon className="w-4 h-4" />}
                                {t('storyArcAutoGenerate')}
                            </button>
                            
                            <div className="flex gap-2 items-start p-3 rounded-lg bg-orange-500/5 border border-orange-500/10">
                                <div className="mt-0.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                </div>
                                <p className="text-[10px] font-medium leading-relaxed text-slate-500 dark:text-zinc-500">
                                    {t('storyArcStyleConsistency')}: AI sẽ sử dụng phân cảnh trước đó làm tham chiếu để đảm bảo sự đồng nhất về nhân vật và bối cảnh.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </aside>

      {/* Main Content: Right Side */}
      <main className={`flex-grow h-full overflow-y-auto scrollbar-thin p-8 ${contentBg}`}>
        <div className="max-w-4xl mx-auto space-y-12">
            {state.scenes.length > 0 ? (
                <div className="relative border-l-2 border-slate-200 dark:border-zinc-800 ml-4 pl-8 space-y-12 pb-20">
                    {state.scenes.map((scene, i) => (
                        <div key={scene.id} className="relative group animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                            {/* Timeline Dot */}
                            <div className={`absolute -left-[45px] top-6 w-8 h-8 rounded-full border-4 ${isDark ? 'bg-zinc-900 border-zinc-900' : 'bg-white border-slate-50'} flex items-center justify-center font-bold text-lg ${isDark ? 'text-zinc-600' : 'text-slate-300'}`}>
                                {i + 1}
                            </div>

                            <div className={`rounded-[32px] border transition-all duration-300 ${isDark ? 'bg-zinc-950 border-white/5 hover:border-white/10' : 'bg-white border-slate-200 hover:border-slate-300'} shadow-sm overflow-hidden`}>
                                <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h4 className={`text-xs font-bold uppercase tracking-[0.2em] ${isDark ? 'text-orange-500' : 'text-slate-400'}`}>
                                                {t('storyArcScene')} {i + 1}
                                            </h4>
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => handleDeleteScene(scene.id)}
                                                    className={`p-2 rounded-xl hover:bg-red-500/10 text-red-500/40 hover:text-red-500 transition-colors`}
                                                    title={t('storyArcDeleteScene')}
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                                <button className={`p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                                                    <TypographyIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <h3 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{scene.title}</h3>
                                            <p className={`text-sm leading-relaxed font-normal opacity-80 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>{scene.description}</p>
                                        </div>
                                        
                                        <div className={`p-5 rounded-2xl ${isDark ? 'bg-zinc-900 shadow-inner' : 'bg-slate-50 shadow-inner'} border border-transparent group-hover:border-slate-200 dark:group-hover:border-white/10 transition-all`}>
                                            <label className="text-[10px] font-bold uppercase text-slate-400 dark:text-zinc-600 mb-3 block tracking-widest">{t('storyArcPrompt')}</label>
                                            <textarea
                                                value={scene.imagePrompt}
                                                onChange={(e) => handleUpdateScenePrompt(scene.id, e.target.value)}
                                                rows={3}
                                                className={`w-full bg-transparent border-none focus:ring-0 resize-none text-xs italic font-serif leading-relaxed p-0 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}
                                            />
                                        </div>

                                        <div className="pt-4 space-y-4">
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleGenerateScene(scene.id)}
                                                    disabled={scene.isLoading || (i > 0 && !state.scenes[i-1].generatedImage)}
                                                    className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${
                                                        scene.isLoading || (i > 0 && !state.scenes[i-1].generatedImage)
                                                            ? 'bg-slate-200 dark:bg-zinc-800 text-slate-400 cursor-not-allowed opacity-50' 
                                                            : `${accentClass} text-white shadow-xl hover:shadow-orange-600/20 active:scale-95`
                                                    }`}
                                                >
                                                    {scene.isLoading ? <LoadingSpinner /> : (scene.generatedImage ? <RefreshIcon className="w-5 h-5" /> : <WandIcon className="w-5 h-5" />)}
                                                    {scene.generatedImage ? t('storyArcRegenerate') : t('generate')}
                                                </button>

                                                {scene.generatedImage && (
                                                    <button
                                                        onClick={() => handleGenerateVideo(scene.id)}
                                                        disabled={scene.isVideoLoading}
                                                        className={`px-6 flex items-center justify-center gap-3 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${
                                                            scene.isVideoLoading
                                                                ? 'bg-slate-200 dark:bg-zinc-800 text-slate-400 cursor-not-allowed'
                                                                : `${isDark ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white'} shadow-xl hover:shadow-blue-600/20 active:scale-95`
                                                        }`}
                                                        title={t('storyArcGenerateVideo')}
                                                    >
                                                        {scene.isVideoLoading ? <LoadingSpinner /> : <VideoIcon className="w-5 h-5" />}
                                                    </button>
                                                )}
                                            </div>
                                            
                                            {i > 0 && !state.scenes[i-1].generatedImage && (
                                                <p className="mt-2 text-[10px] text-center text-slate-400 dark:text-zinc-600 font-medium italic">
                                                    * Cần tạo ảnh phân cảnh trước đó để duy trì đồng nhất
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div 
                                        className={`relative ${state.aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[9/16]'} rounded-3xl overflow-hidden border ${isDark ? 'bg-black border-white/5' : 'bg-slate-100 border-slate-200'} flex items-center justify-center shadow-inner group/img transition-all ${scene.generatedImage ? 'hover:shadow-2xl' : ''}`}
                                    >
                                        {scene.videoUrl ? (
                                            <video 
                                                src={scene.videoUrl} 
                                                controls 
                                                autoPlay 
                                                loop 
                                                className="w-full h-full object-cover"
                                            />
                                        ) : scene.generatedImage ? (
                                            <>
                                                <img 
                                                    src={scene.generatedImage} 
                                                    alt={scene.title} 
                                                    onClick={() => onViewDetail?.(scene.generatedImage!)}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110 cursor-zoom-in"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                                    <div className="p-3 rounded-full bg-white/20 backdrop-blur-md border border-white/30 transform scale-50 group-hover/img:scale-100 transition-all duration-300">
                                                        <MaximizeIcon className="w-6 h-6 text-white" />
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center space-y-4 opacity-20">
                                                <div className="p-6 rounded-full border-2 border-dashed border-current flex items-center justify-center max-w-fit mx-auto">
                                                    <WandIcon className="w-10 h-10" />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-[0.3em] block">{t('aiCreative')}</span>
                                            </div>
                                        )}
                                        {(scene.isLoading || scene.isVideoLoading) && (
                                            <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center z-10 gap-4">
                                                <LoadingSpinner className="w-12 h-12 text-orange-500" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 animate-pulse">
                                                    {scene.isVideoLoading ? t('generatingVideo') : t('generatingImage')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    <div className="flex flex-col sm:flex-row gap-4 mt-12 mb-20">
                        <button 
                            onClick={handleAddEmptyScene}
                            disabled={state.scenes.length > 0 && (!state.scenes[state.scenes.length - 1].title || !state.scenes[state.scenes.length - 1].imagePrompt)}
                            className={`flex-1 flex items-center gap-4 px-8 py-6 rounded-3xl border-2 border-dashed ${isDark ? 'border-zinc-800 text-zinc-700 hover:border-zinc-600 hover:text-zinc-400 bg-zinc-950/30' : 'border-slate-200 text-slate-300 hover:border-slate-400 hover:text-slate-500 bg-white/30'} transition-all justify-center group hover:scale-[1.02] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed`}
                        >
                            <div className="p-2 rounded-full border-2 border-current">
                                <PlusIcon className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <span className="font-black uppercase text-[10px] tracking-widest block">{t('storyArcAddScene')}</span>
                                <span className="text-[9px] opacity-60">Thủ công</span>
                            </div>
                        </button>

                        <button 
                            onClick={handleAutoMagic}
                            disabled={isContinuing || (state.scenes.length > 0 && !state.scenes[state.scenes.length - 1].generatedImage)}
                            className={`flex-1 flex items-center gap-4 px-8 py-6 rounded-3xl border-2 border-dashed ${isDark ? 'border-orange-500/20 text-orange-500/40 hover:border-orange-500/40 hover:text-orange-500 bg-orange-500/5' : 'border-orange-200 text-orange-300 hover:border-orange-400 hover:text-orange-500 bg-orange-50/30'} transition-all justify-center group hover:scale-[1.02] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed`}
                        >
                            <div className="p-2 rounded-full border-2 border-current">
                                {isContinuing ? <LoadingSpinner className="w-5 h-5" /> : <WandIcon className="w-5 h-5" />}
                            </div>
                            <div className="text-left">
                                <span className="font-black uppercase text-[10px] tracking-widest block">AI Magic</span>
                                <span className="text-[9px] opacity-60">Tự động phát triển truyện</span>
                            </div>
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-10 animate-in fade-in duration-1000">
                    <div className={`relative p-12 rounded-full ${isDark ? 'bg-zinc-950/50' : 'bg-white shadow-2xl'}`}>
                        <div className="absolute inset-0 rounded-full bg-orange-500/10 blur-3xl animate-pulse" />
                        <WandIcon className={`w-20 h-20 relative z-10 ${isDark ? 'text-zinc-800' : 'text-slate-100'}`} />
                    </div>
                    <div className="space-y-4 max-w-md">
                        <h3 className={`text-3xl font-black tracking-tight ${isDark ? 'text-zinc-300' : 'text-slate-900'}`}>{t('storyArcEmpty')}</h3>
                        <p className={`text-sm font-medium leading-relaxed ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>
                            {t('storyArcPlaceholder')}
                        </p>
                    </div>
                </div>
            )}
        </div>
      </main>
    </div>
  );
};
