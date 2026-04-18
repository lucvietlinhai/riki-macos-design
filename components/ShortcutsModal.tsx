import React, { useMemo } from 'react';
import { useI18n } from '../i18n';
import { XIcon } from '../constants';

interface Shortcut {
    action: string;
    keys: string[];
    isCtrl?: boolean;
}

interface ShortcutsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
    const { t } = useI18n();
    const isMac = useMemo(() => navigator.platform.toUpperCase().indexOf('MAC') >= 0, []);
    const ctrlCmdKey = isMac ? t('cmdKey') : t('ctrlKey');

    const shortcuts: Shortcut[] = [
        { action: t('panCanvas'), keys: [t('spaceKey'), '+ Drag'] },
        { action: t('zoomInShortcut'), keys: [ctrlCmdKey, '+'], isCtrl: true },
        { action: t('zoomOutShortcut'), keys: [ctrlCmdKey, '-'], isCtrl: true },
        { action: t('resetView'), keys: [ctrlCmdKey, '0'], isCtrl: true },
        { action: t('generateImageShortcut'), keys: [ctrlCmdKey, 'Enter'], isCtrl: true },
        { action: t('selectImage'), keys: ['Click'] },
        { action: t('deleteImageShortcut'), keys: [t('deleteKey'), t('backspaceKey')] },
        { action: t('openHistoryShortcut'), keys: [ctrlCmdKey, 'H'], isCtrl: true },
        { action: t('openSketchpadShortcut'), keys: [ctrlCmdKey, 'K'], isCtrl: true },
    ];
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose} aria-modal="true">
            <div 
                className="bg-white/10 dark:bg-black/20 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex-shrink-0 p-3 px-4 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-zinc-200">{t('shortcutsTitle')}</h2>
                    <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white hover:bg-white/10 dark:hover:bg-white/10 transition-colors" aria-label={t('close')}>
                        <XIcon className="w-5 h-5" />
                    </button>
                </header>
                <main className="flex-grow p-4 overflow-y-auto scrollbar-thin">
                   <ul className="space-y-2">
                        {shortcuts.map(({ action, keys, isCtrl }) => (
                            <li key={action} className="flex justify-between items-center p-2 bg-black/5 dark:bg-black/20 rounded-md">
                                <span className="text-sm text-slate-700 dark:text-zinc-300">{action}</span>
                                <div className="flex items-center gap-1">
                                    {keys.map((key, index) => (
                                        <React.Fragment key={key}>
                                            <kbd className="px-2 py-1 text-xs font-semibold text-slate-600 dark:text-zinc-300 bg-black/10 border-b-2 border-white/20 dark:border-b-black/40 rounded-md">
                                                {key}
                                            </kbd>
                                            {isCtrl && index < keys.length - 1 && <span className="text-slate-400">+</span>}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </li>
                        ))}
                   </ul>
                </main>
            </div>
        </div>
    );
};
