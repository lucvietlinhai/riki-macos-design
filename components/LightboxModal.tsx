import React, { useEffect } from 'react';
import { XIcon } from '../constants';
import { useI18n } from '../i18n';

interface LightboxModalProps {
    imageSrc: string;
    onClose: () => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({ imageSrc, onClose }) => {
    const { t } = useI18n();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);
    
    return (
        <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-start z-[100] p-8 overflow-auto" 
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <button 
                onClick={onClose}
                className="fixed top-4 right-4 p-2 bg-black/30 rounded-full text-white hover:bg-white/20 transition-colors z-[101]"
                aria-label={t('close')}
            >
                <XIcon className="w-6 h-6" />
            </button>
            <div className="flex items-center justify-center min-h-full w-full" onClick={(e) => e.stopPropagation()}>
                <img 
                    src={imageSrc || undefined} 
                    alt={t('generatedMascot')} 
                    className="block rounded-lg shadow-2xl"
                />
            </div>
        </div>
    );
};