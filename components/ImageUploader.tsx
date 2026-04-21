
import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { ImageFile } from '../types';
import { UploadIcon } from '../constants';
import { useI18n } from '../i18n';

interface ImageUploaderProps {
  title: string;
  description: string;
  onImageSelect: (file: ImageFile | null) => void;
  defaultImage?: string;
}

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

export const ImageUploader: React.FC<ImageUploaderProps> = ({ title, description, onImageSelect, defaultImage }) => {
  const [preview, setPreview] = useState<string | null>(defaultImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useI18n();

  useEffect(() => {
    setPreview(defaultImage || null);
  }, [defaultImage]);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate Format
      const supportedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (!supportedTypes.includes(file.type)) {
          alert(`${t('unsupportedFormat')} ${t('suggestedFormats')}`);
          event.target.value = '';
          return;
      }

      if (file.size > 4 * 1024 * 1024) { // 4MB limit for Gemini API
        alert(t('fileTooLarge'));
        event.target.value = '';
        return;
      }
      const base64 = await toBase64(file);
      setPreview(base64);
      onImageSelect({ base64, mimeType: file.type });
    }
  }, [onImageSelect, t]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onImageSelect(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-2">
      <div 
        onClick={handleClick}
        className="relative w-full aspect-square bg-slate-900/50 border-2 border-dashed border-slate-600 rounded-xl flex flex-col justify-center items-center text-center p-2 cursor-pointer hover:border-teal-500 hover:bg-slate-800/60 transition-colors duration-300 group"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
        />
        {preview ? (
          <>
            <img src={preview || undefined} alt={t('referenceImage')} className="max-h-full max-w-full object-contain rounded-md" />
            <button
              onClick={handleClear}
              className="absolute top-1.5 right-1.5 bg-red-600/80 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
              aria-label={t('removeImage')}
            >
              X
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <UploadIcon className="w-6 h-6 text-slate-500 group-hover:text-teal-400 transition-colors" />
            <p className="text-xs">{description}</p>
          </div>
        )}
      </div>
    </div>
  );
};
