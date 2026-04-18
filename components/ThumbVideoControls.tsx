import React from 'react';
import type { CharacterId, AspectRatio } from '../types';
import { LoadingSpinner, WandIcon, LandscapeIcon, PortraitIcon, TypographyIcon } from '../constants';
import { characters } from '../data/characters';
import { useI18n } from '../i18n';
import { Switch } from './Switch';
import { useTheme } from '../theme';

interface ThumbVideoControlsProps {
  postContent: string;
  onPostContentChange: (value: string) => void;
  characterId: CharacterId;
  onCharacterChange: (id: CharacterId) => void;
  aspectRatio: AspectRatio;
  onAspectRatioChange: (ratio: AspectRatio) => void;
  onGenerate: () => void;
  isLoading: boolean;
  includeText: boolean;
  onIncludeTextChange: (value: boolean) => void;
}

export const ThumbVideoControls: React.FC<ThumbVideoControlsProps> = ({
  postContent,
  onPostContentChange,
  characterId,
  onCharacterChange,
  aspectRatio,
  onAspectRatioChange,
  onGenerate,
  isLoading,
  includeText,
  onIncludeTextChange,
}) => {
  const { t } = useI18n();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [showCharacterPopover, setShowCharacterPopover] = React.useState(false);
  const characterButtonRef = React.useRef<HTMLButtonElement>(null);
  const characterPopoverRef = React.useRef<HTMLDivElement>(null);
  const [showTextPopover, setShowTextPopover] = React.useState(false);
  const textButtonRef = React.useRef<HTMLButtonElement>(null);
  const textPopoverRef = React.useRef<HTMLDivElement>(null);

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
      if (
        textPopoverRef.current &&
        !textPopoverRef.current.contains(event.target as Node) &&
        textButtonRef.current &&
        !textButtonRef.current.contains(event.target as Node)
      ) {
        setShowTextPopover(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const isReady = postContent.trim().length > 0;
  const aspectRatioOptions: {id: AspectRatio, icon: React.FC<{className?: string}>, label: string}[] = [
    {id: '16:9', icon: LandscapeIcon, label: t('aspectRatio16_9_label') }, 
    {id: '9:16', icon: PortraitIcon, label: t('aspectRatio9_16_label')}
];

  return (
    <div className="flex flex-col items-center gap-2 p-4 bg-slate-100 dark:bg-zinc-950 border-t border-slate-300 dark:border-white/10">
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-2 rounded-2xl border border-slate-300/80 dark:border-white/10/80 relative shadow-lg">
          <div className="flex items-center gap-2">
            <div className="relative">
                <button ref={characterButtonRef} onClick={() => setShowCharacterPopover(p => !p)} title={t('chooseCharacter')} className="p-1 text-slate-700 hover:text-slate-900 dark:text-gray-300 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                    <img src={characters.find(c => c.id === characterId)?.face} className="w-8 h-8 rounded-full bg-slate-200 dark:bg-zinc-700 border border-slate-300 dark:border-zinc-600" alt="Current character" />
                </button>
                {showCharacterPopover && (
                    <div ref={characterPopoverRef} className="absolute bottom-full left-0 mb-3 w-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-xl shadow-2xl p-2 space-y-2 border border-slate-300/80 dark:border-white/10/80">
                        <label className="text-slate-600 dark:text-gray-400 font-medium text-xs px-1">{t('chooseCharacter')}</label>
                        {characters.map(char => (
                            <button
                                key={char.id}
                                onClick={() => { onCharacterChange(char.id); setShowCharacterPopover(false); }}
                                className={`flex items-center justify-between p-1.5 rounded-md w-full text-left transition-colors ${characterId === char.id ? (isDark ? 'bg-orange-600 text-white' : 'bg-black text-white') : 'text-slate-700 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                                title={char.id === 'hankimo' || char.id === 'rikimi' ? "Đang bảo trì" : ""}
                            >
                                <div className="flex items-center gap-2">
                                    <img src={char.face} className="w-8 h-8 rounded-full bg-slate-200 dark:bg-zinc-700" alt={char.name} />
                                    <span className={`text-sm font-semibold ${char.id === 'hankimo' || char.id === 'rikimi' ? 'opacity-50' : ''}`}>{char.name}</span>
                                </div>
                                {(char.id === 'hankimo' || char.id === 'rikimi') && (
                                    <span className={`text-[8px] font-bold ${isDark ? 'text-orange-500 bg-orange-100 dark:bg-orange-900/40' : 'text-slate-500 bg-slate-100'} px-1.5 py-0.5 rounded uppercase ml-1`}>Bảo trì</span>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
             <div className="relative">
                <button ref={textButtonRef} onClick={() => setShowTextPopover(p => !p)} title={t('includeTextInImage')} className="p-2 text-slate-700 hover:text-slate-900 dark:text-gray-300 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                    <TypographyIcon className="w-5 h-5" />
                </button>
                {showTextPopover && (
                    <div ref={textPopoverRef} className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-xl shadow-2xl p-4 border border-slate-300/80 dark:border-white/10/80">
                        <Switch
                            label={t('includeTextInImage')}
                            enabled={includeText}
                            onChange={onIncludeTextChange}
                        />
                    </div>
                )}
            </div>
            
            <div className="flex-grow bg-slate-200/50 dark:bg-zinc-700/50 rounded-lg flex items-center pr-2">
              <textarea
                rows={2}
                className="flex-grow bg-transparent border-none focus:ring-0 focus:outline-none resize-none p-2.5 text-slate-800 dark:text-gray-200 placeholder-slate-500 dark:placeholder-gray-400"
                placeholder={t('thumbVideoPlaceholder')}
                value={postContent}
                onChange={(e) => onPostContentChange(e.target.value)}
              />
              <div className="flex-shrink-0 border-l border-slate-300 dark:border-zinc-600 ml-2 pl-2 flex items-center gap-1">
                 <span className="text-xs font-medium text-slate-600 dark:text-zinc-400 mr-1">{t('aspectRatioVideo')}:</span>
                 {aspectRatioOptions.map(option => {
                     const Icon = option.icon;
                     return (
                        <button
                            key={option.id}
                            onClick={() => onAspectRatioChange(option.id)}
                            title={option.label}
                            className={`p-2 rounded-md transition-colors ${aspectRatio === option.id ? 'bg-slate-400/50 dark:bg-zinc-950/50 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-gray-300 hover:bg-slate-300/50 dark:hover:bg-slate-600/50'}`}
                        >
                           <Icon className="w-5 h-5" />
                        </button>
                     )
                 })}
              </div>
            </div>

            <button
              onClick={onGenerate}
              disabled={isLoading || !isReady}
              className={`text-white p-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 ${isDark ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30 hover:shadow-orange-500/40' : 'bg-black hover:bg-zinc-800 shadow-black/10 hover:shadow-black/20'}`}
              title={t('generate')}
            >
              {isLoading ? <LoadingSpinner /> : <WandIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};