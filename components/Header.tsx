
import React, { useState, useEffect, useRef } from 'react';
import { useI18n, Language } from '../i18n';
import { VietnamFlag, UKFlag, JapanFlag, IndonesiaFlag } from './FlagIcons';
import { useTheme } from '../theme';
import { SunIcon, MoonIcon } from './ThemeIcons';
import { HistoryIcon, InfoCircleIcon, CheckIcon, SettingsIcon, KeyIcon } from '../constants';
import type { AIModel } from '../types';

// Tabler Icon: icon-chevron-down
const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <path d="M6 9l6 6l6 -6" />
  </svg>
);

const flagComponents: Record<Language, React.FC<{ className?: string }>> = {
  vi: VietnamFlag,
  en: UKFlag,
  ja: JapanFlag,
  id: IndonesiaFlag,
};

interface HeaderProps {
  onHistoryClick: () => void;
  onShortcutsClick: () => void;
  onApiKeyClick: () => void;
  isProMode?: boolean;
  model: AIModel;
  onModelChange: (model: AIModel) => void;
}

export const Header: React.FC<HeaderProps> = ({ onHistoryClick, onShortcutsClick, onApiKeyClick, isProMode, model, onModelChange }) => {
  const { language, setLanguage, t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const [isLangPopoverOpen, setIsLangPopoverOpen] = useState(false);
  const [isModelPopoverOpen, setIsModelPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const modelPopoverRef = useRef<HTMLDivElement>(null);
  const modelButtonRef = useRef<HTMLButtonElement>(null);

  const CurrentFlag = flagComponents[language];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsLangPopoverOpen(false);
      }
      if (
        modelPopoverRef.current &&
        !modelPopoverRef.current.contains(event.target as Node) &&
        modelButtonRef.current &&
        !modelButtonRef.current.contains(event.target as Node)
      ) {
        setIsModelPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setIsLangPopoverOpen(false);
  };

  const handleModelChange = async (newModel: AIModel) => {
    if (newModel === 'gemini-3.1-flash-image-preview' && (window as any).aistudio) {
        try {
            const hasKey = await (window as any).aistudio.hasSelectedApiKey();
            
            if (!hasKey) {
                await (window as any).aistudio.openSelectKey();
                const hasKeyAfter = await (window as any).aistudio.hasSelectedApiKey();
                
                if (!hasKeyAfter) {
                    onModelChange('gemini-2.5-flash-image');
                    setIsModelPopoverOpen(false);
                    return;
                }
            }
            
            onModelChange(newModel);
            
        } catch (e) {
            console.error("User cancelled key selection or error", e);
            onModelChange('gemini-2.5-flash-image');
            setIsModelPopoverOpen(false);
            return;
        }
    } else {
        onModelChange(newModel);
        if (newModel === 'gemini-3.1-flash-image-preview' && !localStorage.getItem('gemini_api_key')) {
            onApiKeyClick();
        }
    }
    
    setIsModelPopoverOpen(false);
  };

  const handleSelectKey = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if ((window as any).aistudio) {
        try {
            await (window as any).aistudio.openSelectKey();
        } catch (e) { console.error(e); }
    } else {
        onApiKeyClick();
    }
  };

  const isDark = theme === 'dark';
  const buttonClasses = isDark || isProMode 
    ? "flex items-center justify-center p-2 bg-orange-500/10 backdrop-blur-lg border border-orange-500/20 rounded-lg hover:bg-orange-500/20 transition-all shadow-md group"
    : "flex items-center justify-center p-2 bg-black/5 backdrop-blur-lg border border-slate-200 rounded-lg hover:bg-black/10 transition-colors shadow-md";

  const iconColor = isDark || isProMode ? "text-orange-500 group-hover:text-orange-400" : "text-slate-700";

  return (
    <div className="relative flex items-center gap-2">
        {/* AI Model Selector */}
        <div className="relative">
            <button
                ref={modelButtonRef}
                onClick={() => setIsModelPopoverOpen(prev => !prev)}
                className={`${buttonClasses} gap-2 px-3 py-1.5`}
                title={t('modelLabel')}
            >
                <div className={`w-2 h-2 rounded-full ${model.includes('pro') ? (isDark ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]' : 'bg-black shadow-[0_0_8px_rgba(0,0,0,0.5)]') : 'bg-emerald-500'}`}></div>
                <span className={`text-xs font-bold ${isDark || isProMode ? 'text-orange-400' : 'text-slate-600'}`}>
                    {model.includes('3.1') ? '3.1 Flash' : '2.5 Flash'}
                </span>
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${isModelPopoverOpen ? 'rotate-180' : ''} ${isDark || isProMode ? 'text-orange-500' : 'text-slate-500'}`} />
            </button>

            {isModelPopoverOpen && (
                <div
                    ref={modelPopoverRef}
                    className={`absolute top-full right-0 mt-2 w-72 backdrop-blur-xl rounded-xl shadow-2xl p-2 border z-50 ${isDark || isProMode ? 'bg-zinc-950/95 border-orange-500/30' : 'bg-white border-slate-200'}`}
                >
                    <div className="px-2 py-1 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">{t('modelLabel')}</span>
                    </div>
                    <ul className="space-y-1">
                        <li>
                            <button
                                onClick={() => handleModelChange('gemini-2.5-flash-image')}
                                className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-all ${model === 'gemini-2.5-flash-image' ? (isDark || isProMode ? 'bg-orange-500/20 text-orange-200 border border-orange-500/30' : 'bg-black text-white') : `hover:bg-black/5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}`}
                            >
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold">{t('modelFlash')}</span>
                                    <span className="text-[10px] opacity-60">High speed & Free</span>
                                </div>
                                {model === 'gemini-2.5-flash-image' && <CheckIcon className="w-4 h-4" />}
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => handleModelChange('gemini-3.1-flash-image-preview')}
                                className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-all ${model === 'gemini-3.1-flash-image-preview' ? (isDark || isProMode ? 'bg-orange-500/20 text-orange-200 border border-orange-500/30' : 'bg-black text-white') : `hover:bg-black/5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}`}
                            >
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold">Gemini 3.1 Flash Image</span>
                                    <span className="text-[10px] opacity-60">High Quality & Fidelity</span>
                                </div>
                                {model === 'gemini-3.1-flash-image-preview' && <CheckIcon className="w-4 h-4" />}
                            </button>
                        </li>
                    </ul>
                    {model === 'gemini-3.1-flash-image-preview' && (
                        <div className={`mt-2 pt-2 border-t ${isDark || isProMode ? 'border-orange-500/20' : 'border-slate-100'}`}>
                             <button 
                                onClick={handleSelectKey}
                                className={`w-full flex items-center justify-center gap-2 py-2 px-3 text-[10px] font-bold uppercase tracking-tight rounded-lg transition-all ${isDark ? 'bg-orange-600 hover:bg-orange-500 text-black' : 'bg-black hover:bg-zinc-800 text-white'}`}
                             >
                                <SettingsIcon className="w-3.5 h-3.5" />
                                {t('reconnectBtn')}
                             </button>
                        </div>
                    )}
                </div>
            )}
        </div>

        <button
          onClick={onApiKeyClick}
          className={buttonClasses}
          aria-label={'API Key'}
          title={'Setup API Key'}
      >
          <KeyIcon className={`w-5 h-5 ${iconColor}`} />
      </button>
        <button
          onClick={onHistoryClick}
          className={buttonClasses}
          aria-label={t('history')}
          title={`${t('history')} (Ctrl+H)`}
      >
          <HistoryIcon className={`w-5 h-5 ${iconColor}`} />
      </button>
        <button
          onClick={onShortcutsClick}
          className={buttonClasses}
          aria-label={t('shortcuts')}
          title={t('shortcuts')}
      >
          <InfoCircleIcon className={`w-5 h-5 ${iconColor}`} />
      </button>
      <button
          onClick={toggleTheme}
          className={buttonClasses}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
          {theme === 'dark' ? (
              <SunIcon className={`w-5 h-5 ${isDark || isProMode ? 'text-orange-400' : 'text-slate-700'}`} />
          ) : (
              <MoonIcon className={`w-5 h-5 ${iconColor}`} />
          )}
      </button>
      <div className="relative">
          <button
            ref={buttonRef}
            onClick={() => setIsLangPopoverOpen(prev => !prev)}
            className={`${buttonClasses} gap-2 p-1.5`}
            aria-haspopup="true"
            aria-expanded={isLangPopoverOpen}
          >
            <CurrentFlag className="w-6 h-auto rounded-sm" />
            <ChevronDownIcon className={`w-4 h-4 transition-transform ${isLangPopoverOpen ? 'rotate-180' : ''} ${isProMode ? 'text-orange-500' : 'text-slate-500 dark:text-zinc-400'}`} />
          </button>

          {isLangPopoverOpen && (
          <div
              ref={popoverRef}
              className={`absolute top-full right-0 mt-2 w-auto backdrop-blur-xl rounded-lg shadow-2xl p-1.5 border whitespace-nowrap z-50 ${isProMode ? 'bg-zinc-950/90 border-orange-500/30' : 'bg-white/80 dark:bg-black/30 border-slate-200 dark:border-white/10'}`}
          >
              <ul className="space-y-1">
              {(['vi', 'en', 'ja', 'id'] as Language[]).map((lang) => {
                  const Flag = flagComponents[lang];
                  return (
                  <li key={lang}>
                      <button
                      onClick={() => handleLanguageChange(lang)}
                      className={`w-full flex items-center gap-2 p-1.5 rounded-md text-left text-sm transition-colors ${language === lang ? (isProMode ? 'bg-orange-600 text-black font-bold' : 'bg-orange-600 text-white') : (isProMode ? 'text-orange-500/70 hover:bg-orange-500/20' : 'text-slate-700 dark:text-zinc-300 hover:bg-black/10 dark:hover:bg-white/10')}`}
                      >
                      <Flag className="w-6 h-auto rounded-sm" />
                      <span className="font-medium">{lang.toUpperCase()}</span>
                      </button>
                  </li>
                  );
              })}
              </ul>
          </div>
          )}
      </div>
    </div>
  );
};
