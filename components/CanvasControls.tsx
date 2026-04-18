
import React from 'react';
import { PlusIcon, MinusIcon, RefreshIcon } from '../constants';
import { useI18n } from '../i18n';

interface CanvasControlsProps {
    onZoomIn: () => void;
    onZoomOut: () => void;
    onResetView: () => void;
}

export const CanvasControls: React.FC<CanvasControlsProps> = ({ onZoomIn, onZoomOut, onResetView }) => {
    const { t } = useI18n();
    const buttonClasses = "p-2 rounded-md text-slate-300 hover:bg-white/10 transition-colors";
    const containerClasses = "flex flex-col items-center gap-1 bg-black/20 backdrop-blur-lg p-1.5 rounded-lg border border-white/10 shadow-lg";

    return (
        <div className="absolute bottom-4 right-4 z-20 flex flex-col items-center gap-2">
            <div className={containerClasses}>
                <button onClick={onZoomIn} title={t('zoomIn')} className={buttonClasses}>
                    <PlusIcon className="w-5 h-5" />
                </button>
                <div className="w-full h-px bg-white/10"></div>
                <button onClick={onZoomOut} title={t('zoomOut')} className={buttonClasses}>
                    <MinusIcon className="w-5 h-5" />
                </button>
            </div>
             <div className={containerClasses}>
                <button onClick={onResetView} title={t('resetView')} className={buttonClasses}>
                    <RefreshIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};