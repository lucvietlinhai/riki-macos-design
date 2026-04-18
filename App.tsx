
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { get, set } from 'idb-keyval';
import { PromptControls } from './components/PromptControls';
import { ResultDisplay } from './components/ResultDisplay';
import { SketchModal } from './components/SketchModal';
import { HistoryModal } from './components/HistoryModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { characters } from './data/characters';
import { generateMascotImage, editMascotImage } from './services/geminiService';
import type { ImageFile, BackgroundOption, GeneratedImage, CharacterId, NumVariations, ResultDisplayHandle, AspectRatio, Tab, AIModel, SelectionBox, DesignMode, RemixSettings } from './types';
import { useI18n } from './i18n';
import type { Language } from './i18n';
import { Header } from './components/Header';
import { useTheme } from './theme';
import { LightboxModal } from './components/LightboxModal';
import { ImageEditorModal } from './components/ImageEditorModal';
import { ThumbPostTab } from './components/ThumbPostTab';
import { ThumbProTab } from './components/ThumbProTab';
import { SettingsIcon } from './constants';


const App: React.FC = () => {
  const { t, language } = useI18n();
  const { theme } = useTheme();
  
  const [activeTab, setActiveTab] = useState<Tab>('design');
  const [globalModel, setGlobalModel] = useState<AIModel>('gemini-2.5-flash-image');

  const loadingMessages = [
    t('loadingMessage1'),
    t('loadingMessage2'),
    t('loadingMessage3'),
    t('loadingMessage4'),
    t('loadingMessage5'),
    t('loadingMessage6'),
  ];

  const [primaryMascot, setPrimaryMascot] = useState<ImageFile | null>(null);
  const [faceReference, setFaceReference] = useState<ImageFile | null>(null);
  const [characterId, setCharacterId] = useState<CharacterId>('rikimo');
  const [prompt, setPrompt] = useState<string>('');
  const [background, setBackground] = useState<BackgroundOption>('random');
  const [numVariations, setNumVariations] = useState<NumVariations>(1);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('keep');
  const [designMode, setDesignMode] = useState<DesignMode>('free'); 
  const [remixSettings, setRemixSettings] = useState<RemixSettings>({ keepBackground: false, keepPose: false }); // New State
  const [referenceImages, setReferenceImages] = useState<ImageFile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isDbLoaded, setIsDbLoaded] = useState<boolean>(false);

  // Load from IndexedDB on mount
  useEffect(() => {
    get<GeneratedImage[]>('rikimo_generated_images').then((val) => {
        if (val && Array.isArray(val)) {
            setGeneratedImages(val);
            // Calculate a high topZ so new images stack correctly
            const maxZ = val.reduce((max, img) => Math.max(max, img.z || 0), 0);
            setTopZ(maxZ + 1);
        }
    }).catch(err => {
        console.error("Failed to load images from DB:", err);
    }).finally(() => {
        setIsDbLoaded(true);
    });
  }, []);

  // Save to IndexedDB when generatedImages change
  useEffect(() => {
    if (isDbLoaded) {
        set('rikimo_generated_images', generatedImages).catch(err => {
            console.error("Failed to save images to DB:", err);
        });
    }
  }, [generatedImages, isDbLoaded]);

  const [progress, setProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [isSketch, setIsSketch] = useState<boolean>(false);
  const [showSketchModal, setShowSketchModal] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);
  const [topZ, setTopZ] = useState<number>(1);
  const [pendingImages, setPendingImages] = useState<{ id: string, x: number, y: number }[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [isSpacePanning, setIsSpacePanning] = useState<boolean>(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [lightboxImageSrc, setLightboxImageSrc] = useState<string | null>(null);
  const [showImageEditorModal, setShowImageEditorModal] = useState<boolean>(false);
  const [editingImage, setEditingImage] = useState<GeneratedImage | null>(null);

  // API Key handling
  const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(false);
  const [apiKeyInput, setApiKeyInput] = useState<string>('');

  // For new tab styling
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState<{left?: number; width?: number}>({});

  const tabs = useMemo(() => [
      { id: 'design', label: t('tabDesign') },
      { id: 'thumbPost', label: t('tabThumbPost') },
      { id: 'thumbPro', label: t('tabThumbPro') },
  ], [t]);

  useEffect(() => {
    const handleShowApiKeyModal = () => setShowApiKeyModal(true);
    window.addEventListener('showApiKeyModal', handleShowApiKeyModal);
    return () => window.removeEventListener('showApiKeyModal', handleShowApiKeyModal);
  }, []);

  const handleSaveApiKey = () => {
    if (apiKeyInput.trim()) {
      localStorage.setItem('gemini_api_key', apiKeyInput.trim());
      setShowApiKeyModal(false);
    }
  };

  useEffect(() => {
     if (showApiKeyModal) {
         setApiKeyInput(localStorage.getItem('gemini_api_key') || '');
     }
  }, [showApiKeyModal]);

  useEffect(() => {
    const activeTabIndex = tabs.findIndex(tab => tab.id === activeTab);
    const activeTabElement = tabsRef.current[activeTabIndex];
    if (activeTabElement) {
        setIndicatorStyle({
            left: activeTabElement.offsetLeft,
            width: activeTabElement.offsetWidth,
        });
    }
  }, [activeTab, tabs]);


  const progressIntervalRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const resultDisplayRef = useRef<ResultDisplayHandle>(null);
  
  useEffect(() => {
    const selectedCharacter = characters.find(c => c.id === characterId);
    if (selectedCharacter) {
      const bodyMimeType = selectedCharacter.body.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
      const faceMimeType = selectedCharacter.face.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';

      setPrimaryMascot({ base64: selectedCharacter.body, mimeType: bodyMimeType });
      setFaceReference({ base64: selectedCharacter.face, mimeType: faceMimeType });
    }
  }, [characterId]);

  const addImagesToHistory = (newImages: Omit<GeneratedImage, 'sourceTab'>[], sourceTab: Tab) => {
    const imagesWithSource: GeneratedImage[] = newImages.map(img => ({ ...img, sourceTab }));
    setGeneratedImages(prev => [...prev, ...imagesWithSource]);
  };
  
  const handleUpdateImageSrc = useCallback((id: string, newSrc: string) => {
      setGeneratedImages(prev => prev.map(img => img.id === id ? { ...img, src: newSrc } : img));
  }, []);

   const handleGenerate = useCallback((lang: Language) => {
    if (isLoading || !primaryMascot || !faceReference || (!prompt.trim() && !isSketch && referenceImages.length === 0) || !primaryMascot.base64 || !faceReference.base64) {
      return;
    }

    const IMAGE_SIZE = 512;
    const GAP = 64;
    const itemsPerRow = 3;
    
    const count = generatedImages.filter(img => img.sourceTab === 'design').length;
    // Calculate pending positions
    const newPendingImages = [];
    for (let i = 0; i < numVariations; i++) {
        const currentTotal = count + i;
        const col = currentTotal % itemsPerRow;
        const row = Math.floor(currentTotal / itemsPerRow);
        const newX = col * (IMAGE_SIZE + GAP) + GAP;
        const newY = row * (IMAGE_SIZE + GAP) + GAP;
        newPendingImages.push({ id: `pending_${Date.now()}_${i}`, x: newX, y: newY });
    }
    
    setPendingImages(newPendingImages);
    setIsLoading(true);
    setError(null);
    startProgressIndicator();

    generateMascotImage(
      primaryMascot,
      faceReference,
      prompt,
      background,
      referenceImages,
      isSketch,
      numVariations,
      aspectRatio,
      characterId,
      globalModel,
      lang,
      designMode,
      remixSettings
    ).then(result => {
        if (result.images && result.images.length > 0) {
            const newImages: GeneratedImage[] = [];
            const currentCount = generatedImages.filter(img => img.sourceTab === 'design').length;
            
            result.images.forEach((imgData, index) => {
                const effectiveIndex = currentCount + index;
                const col = effectiveIndex % itemsPerRow;
                const row = Math.floor(effectiveIndex / itemsPerRow);
                const x = col * (IMAGE_SIZE + GAP) + GAP;
                const y = row * (IMAGE_SIZE + GAP) + GAP;
                
                newImages.push({
                    id: `img_${Date.now()}_${index}`,
                    src: `data:image/png;base64,${imgData}`,
                    x,
                    y,
                    z: topZ + index,
                    sourceTab: 'design'
                });
            });
            
            setGeneratedImages(prev => [...prev, ...newImages]);
            setTopZ(prev => prev + newImages.length);
            if(newImages.length > 0) {
                setSelectedImageId(newImages[newImages.length-1].id);
            }
        } else {
            setError('No image was generated.');
        }
    }).catch(e => {
        if (e.message === "API_KEY_MISSING") {
            setShowApiKeyModal(true);
        } else {
            setError(e.message || 'An unknown error occurred.');
        }
    }).finally(() => {
        stopProgressIndicator();
        setPendingImages([]);
        if(!isSketch) {
            setReferenceImages([]);
        }
    });
  }, [isLoading, primaryMascot, faceReference, prompt, isSketch, referenceImages, generatedImages, topZ, background, numVariations, aspectRatio, characterId, globalModel, designMode, remixSettings]);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      
      if (showImageEditorModal && target?.tagName === 'TEXTAREA') {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          // This modal has its own save handler, don't trigger global generate
        }
        return;
      }
      
      if ((target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        if (activeTab === 'design' && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
             e.preventDefault();
             handleGenerate(language);
        }
        return;
      }
      
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      if (e.key === ' ' && target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsSpacePanning(true);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if(selectedImageId) {
            handleDelete(selectedImageId);
        }
      } else if (isCtrlOrCmd) {
          switch (e.key.toLowerCase()) {
              case '=':
              case '+':
                  if (activeTab === 'design') {
                    e.preventDefault();
                    resultDisplayRef.current?.zoom('in');
                  }
                  break;
              case '-':
                  if (activeTab === 'design') {
                    e.preventDefault();
                    resultDisplayRef.current?.zoom('out');
                  }
                  break;
              case '0':
                  if (activeTab === 'design') {
                    e.preventDefault();
                    resultDisplayRef.current?.resetView();
                  }
                  break;
              case 'h':
                  e.preventDefault();
                  setShowHistoryModal(p => !p);
                  break;
               case 'k':
                  e.preventDefault();
                  if (activeTab === 'design') {
                    setShowSketchModal(p => !p);
                  }
                  break;
          }
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.key === ' ') {
            setIsSpacePanning(false);
        }
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleGenerate, selectedImageId, language, showImageEditorModal, activeTab]);

  const startProgressIndicator = () => {
    setProgress(0);
    setLoadingMessage(loadingMessages[0]);
    let messageIndex = 0;
    
    progressIntervalRef.current = window.setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
            if(progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            return 95;
        }
        const increment = Math.random() * 2;
        return Math.min(prev + increment, 95);
      });

      if (progress > 0 && Math.floor(progress / 20) !== messageIndex) {
        messageIndex = Math.floor(progress / 20);
        setLoadingMessage(loadingMessages[messageIndex % loadingMessages.length]);
      }
    }, 250);
  };

  const stopProgressIndicator = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setProgress(100);
    setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
    }, 500);
  };
  
  const handleSketchSave = (imageBase64: string) => {
    if (imageBase64) {
      setReferenceImages([{ base64: imageBase64, mimeType: 'image/png' }]);
      setIsSketch(true);
      setPrompt(''); 
    }
    setShowSketchModal(false);
  }
  
  const handleReferenceImageChange = (files: ImageFile[]) => {
      setReferenceImages(files);
      if (files.length > 0) {
        setIsSketch(false);
      }
  }
  
  const handleSelectForReference = useCallback((image: GeneratedImage) => {
    setReferenceImages([{ base64: image.src, mimeType: 'image/png' }]);
    setIsSketch(false);
    setPrompt('');
    setShowHistoryModal(false);
    setActiveTab('design'); // Switch back to design tab
  }, []);

  const handleDownload = (imageSrc: string) => {
    if (!imageSrc) return;
    const link = document.createElement('a');
    link.href = imageSrc;
    link.download = `rikimo-art-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = (imageId: string) => {
    setGeneratedImages(prev => prev.filter(img => img.id !== imageId));
    setSelectedImageId(null);
  };
  
  const handleImageMove = (id: string, x: number, y: number) => {
    setGeneratedImages(imgs =>
      imgs.map(img => (img.id === id ? { ...img, x, y } : img))
    );
  };
  
  const handleBringToFront = (id: string) => {
    setGeneratedImages(imgs =>
      imgs.map(img => (img.id === id ? { ...img, z: topZ } : img))
    );
    setTopZ(prev => prev + 1);
  };
  
  const handleSelectImage = useCallback((id: string) => {
    setSelectedImageId(id);
    handleBringToFront(id);
  }, [topZ]);
  
  const handleFocusImage = useCallback((image: GeneratedImage) => {
    setActiveTab(image.sourceTab);
    
    setTimeout(() => {
        if (image.sourceTab === 'design' && resultDisplayRef.current) {
            resultDisplayRef.current.focusOnImage(image.id);
        }
        setSelectedImageId(image.id);
    }, 100);
    setShowHistoryModal(false);
  }, []);

  const handleOpenLightbox = (src: string) => {
    setIsLightboxOpen(true);
    setLightboxImageSrc(src);
  };
  const handleCloseLightbox = () => {
    setIsLightboxOpen(false);
    setLightboxImageSrc(null);
  };

  const handleOpenImageEditor = (image: GeneratedImage) => {
    setEditingImage(image);
    setShowImageEditorModal(true);
  };

  const handleCloseImageEditor = () => {
    setEditingImage(null);
    setShowImageEditorModal(false);
  };

  const handleImageEditSave = ({ mask, prompt: editPrompt, selection, referenceImages: editRefs }: { mask: string, prompt: string, selection?: SelectionBox, referenceImages?: ImageFile[] }) => {
    if (!editingImage || !editPrompt.trim() || !mask) return;

    setIsLoading(true);
    document.body.classList.add('is-editing');
    setError(null);
    setLoadingMessage(t('editing'));
    setProgress(50);

    const originalImageFile: ImageFile = { base64: editingImage.src, mimeType: 'image/png' };
    const maskFile: ImageFile = { base64: mask, mimeType: 'image/png' };

    editMascotImage(originalImageFile, maskFile, editPrompt, globalModel, language, selection, editRefs)
        .then(result => {
            if (result.images && result.images.length > 0) {
                // For edit, we take the first result
                const newImageSrc = `data:image/png;base64,${result.images[0]}`;
                const newTopZ = topZ + 1;
                
                // Update generated images list
                setGeneratedImages(prev => 
                    prev.map(img => {
                        if (img.id === editingImage.id) {
                            return { ...img, src: newImageSrc, z: newTopZ };
                        }
                        return img;
                    })
                );
                
                // Update editingImage to show the result in editor immediately
                setEditingImage(prev => prev ? ({ ...prev, src: newImageSrc, z: newTopZ }) : null);

                setTopZ(newTopZ);
                setSelectedImageId(editingImage.id);
                // Do NOT close editor, allow subsequent edits
            } else {
                setError(t('errorNoImage'));
            }
        })
        .catch(e => {
            setError(e.message || 'An unknown error occurred during editing.');
        })
        .finally(() => {
            setProgress(100);
            document.body.classList.remove('is-editing');
            setTimeout(() => {
                setIsLoading(false);
                setProgress(0);
            }, 500);
        });
  };

  const isReady = !!primaryMascot?.base64 && !!faceReference?.base64 && (prompt.trim().length > 0 || isSketch || referenceImages.length > 0);

  const renderTabContent = () => {
    switch(activeTab) {
        case 'thumbPro':
            return <ThumbProTab onAddImages={addImagesToHistory} model={globalModel} onEdit={handleOpenImageEditor} onViewDetail={handleOpenLightbox} images={generatedImages} />;
        case 'thumbPost':
            return <ThumbPostTab
                        images={generatedImages.filter(img => img.sourceTab === 'thumbPost')}
                        onAddImages={addImagesToHistory}
                        onImageEditSave={handleImageEditSave}
                        onDeleteImage={handleDelete}
                        onDownloadImage={handleDownload}
                        characterId={characterId}
                        onCharacterChange={setCharacterId}
                        model={globalModel}
                        language={language}
                    />;
        case 'design':
        default:
            return (
                <div className="w-full h-full flex flex-row overflow-hidden">
                    <aside className="w-[340px] flex-shrink-0 h-full bg-white dark:bg-zinc-950 border-r border-slate-200 dark:border-white/5 z-30 flex flex-col relative shadow-xl">
                        <div className="flex-grow overflow-y-auto scrollbar-thin">
                            <PromptControls
                                prompt={prompt}
                                onPromptChange={setPrompt}
                                background={background}
                                onBackgroundChange={setBackground}
                                referenceImages={referenceImages}
                                onReferenceImagesChange={handleReferenceImageChange}
                                onGenerate={() => handleGenerate(language)}
                                isLoading={isLoading}
                                isReady={isReady}
                                onOpenSketchModal={() => setShowSketchModal(true)}
                                isSketch={isSketch}
                                numVariations={numVariations}
                                onNumVariationsChange={setNumVariations}
                                aspectRatio={aspectRatio}
                                onAspectRatioChange={setAspectRatio}
                                characterId={characterId}
                                onCharacterChange={setCharacterId}
                                designMode={designMode}
                                onDesignModeChange={setDesignMode}
                                remixSettings={remixSettings}
                                onRemixSettingsChange={setRemixSettings}
                                isSidebar={true}
                            />
                        </div>
                    </aside>
                    <main 
                        ref={canvasRef}
                        className="flex-grow h-full relative overflow-hidden bg-slate-200 dark:bg-zinc-950 dot-grid"
                    >
                        <ResultDisplay
                          ref={resultDisplayRef}
                          isLoading={isLoading}
                          error={error}
                          onErrorClose={() => setError(null)}
                          generatedImages={generatedImages.filter(img => img.sourceTab === 'design')}
                          progress={progress}
                          loadingMessage={loadingMessage}
                          onDownload={handleDownload}
                          onImageMove={handleImageMove}
                          onBringToFront={handleBringToFront}
                          onEdit={handleOpenImageEditor}
                          pendingImages={pendingImages}
                          selectedImageId={selectedImageId}
                          onSelectImage={handleSelectImage}
                          isSpacePanning={isSpacePanning}
                          onViewDetail={handleOpenLightbox}
                          onUpdateImageSrc={handleUpdateImageSrc}
                          onDelete={handleDelete}
                        />
                    </main>
                </div>
            );
    }
  }

  const isProActive = activeTab === 'thumbPro';

  return (
    <div className={`relative w-screen h-screen flex flex-col font-sans overflow-hidden transition-colors duration-500 ${isProActive ? 'bg-black text-white' : 'bg-slate-100 text-slate-900 dark:bg-zinc-950 dark:text-gray-300'}`}>
        <div className={`flex-shrink-0 p-2 flex justify-center items-center gap-2 backdrop-blur-sm z-30 border-b relative transition-all duration-500 ${isProActive ? 'bg-zinc-950/80 border-orange-500/20' : 'bg-white/80 dark:bg-zinc-950/80 border-slate-200 dark:border-white/5'}`}>
            <div className="absolute top-1/2 left-4 -translate-y-1/2 flex items-center gap-2">
                <div className="hidden sm:block">
                    <h1 className={`font-bold text-lg leading-tight transition-colors duration-500`} style={{ fontFamily: "'Lilita One', sans-serif", color: isProActive ? '#f97316' : '' }}>AI RIKI</h1>
                    <p className={`text-xs transition-colors duration-500 ${isProActive ? 'text-orange-500/50' : 'text-slate-500 dark:text-zinc-400'}`}>Phiên bản sử dụng 3.0</p>
                </div>
            </div>
            <div className={`relative flex items-center p-1 rounded-full border shadow-sm overflow-x-auto max-w-[50vw] sm:max-w-none no-scrollbar transition-all duration-500 ${isProActive ? 'bg-black/70 border-orange-500/30' : 'bg-slate-100 dark:bg-zinc-900/70 border-slate-200 dark:border-white/10'}`}>
                <span
                    className={`absolute h-[calc(100%-8px)] top-1 rounded-full transition-all duration-300 ease-in-out shadow-sm ${isProActive ? 'bg-orange-600' : 'bg-white dark:bg-orange-600'}`}
                    style={indicatorStyle}
                />
                {tabs.map((tab, index) => (
                    <button
                        key={tab.id}
                        ref={el => { tabsRef.current[index] = el }}
                        onClick={() => setActiveTab(tab.id as Tab)}
                        className={`relative z-10 px-4 py-1.5 text-sm font-bold rounded-full transition-colors duration-300 outline-none focus:ring-0 whitespace-nowrap ${
                            activeTab === tab.id
                                ? (isProActive ? 'text-black' : 'text-slate-900 dark:text-white')
                                : (isProActive ? 'text-orange-500/60 hover:text-orange-300' : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white')
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className="absolute top-1/2 right-4 -translate-y-1/2">
                <Header 
                    onHistoryClick={() => setShowHistoryModal(true)} 
                    onShortcutsClick={() => setShowShortcutsModal(true)}
                    onApiKeyClick={() => setShowApiKeyModal(true)}
                    isProMode={isProActive}
                    model={globalModel}
                    onModelChange={setGlobalModel}
                />
            </div>
        </div>

        <div className="flex-grow flex relative min-h-0">
          {renderTabContent()}
        </div>

        {showSketchModal && (
            <SketchModal 
                onClose={() => setShowSketchModal(false)}
                onSave={handleSketchSave}
            />
        )}
        
        {showHistoryModal && (
            <HistoryModal
                isOpen={showHistoryModal}
                onClose={() => setShowHistoryModal(false)}
                images={generatedImages}
                onImageClick={handleFocusImage}
                onDownloadClick={handleDownload}
                onDeleteClick={handleDelete}
                onReferenceClick={handleSelectForReference}
                onUpdateImageSrc={handleUpdateImageSrc}
            />
        )}

        {showShortcutsModal && (
            <ShortcutsModal
                isOpen={showShortcutsModal}
                onClose={() => setShowShortcutsModal(false)}
            />
        )}

        {isLightboxOpen && lightboxImageSrc && (
            <LightboxModal 
                imageSrc={lightboxImageSrc}
                onClose={handleCloseLightbox}
            />
        )}
        
        {showImageEditorModal && (
            <ImageEditorModal
                image={editingImage}
                onClose={handleCloseImageEditor}
                onSave={handleImageEditSave}
                isLoading={isLoading}
            />
        )}

        {showApiKeyModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 text-slate-800 dark:text-slate-200">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden max-w-md w-full border border-slate-200 dark:border-white/10 p-6 flex flex-col gap-4">
                    <h2 className="text-xl font-bold">Thiết lập API Key</h2>
                    <p className="text-sm dark:text-slate-400">Vui lòng nhập Gemini API Key của bạn để sử dụng ứng dụng.</p>
                    <input 
                        type="password"
                        placeholder="Nhập API Key ở đây..."
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveApiKey()}
                        className="w-full p-3 rounded-lg border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 dark:text-white outline-none focus:border-orange-500 transition-colors"
                    />
                    <div className="flex justify-end gap-3 mt-2">
                        <button onClick={() => setShowApiKeyModal(false)} className="px-4 py-2 rounded-lg font-medium hover:bg-slate-100 dark:hover:bg-zinc-800">
                            Đóng
                        </button>
                        <button onClick={handleSaveApiKey} disabled={!apiKeyInput.trim()} className="px-6 py-2 rounded-lg font-medium bg-orange-600 text-white hover:bg-orange-500 disabled:opacity-50">
                            Lưu và sử dụng
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default App;
