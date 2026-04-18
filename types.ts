
import { characters } from './data/characters';

export type AIModel = 'gemini-2.5-flash-image' | 'gemini-3.1-flash-image-preview';

export type Tab = 'design' | 'thumbPost' | 'thumbPro';
export type DesignMode = 'free' | 'concept' | 'reference';

export interface ImageFile {
  base64: string;
  mimeType: string;
}

export type AspectRatio = 'keep' | '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
export type BackgroundOption = 'white' | 'black' | 'random';
export type CharacterId = typeof characters[number]['id'];

export interface GeneratedResult {
    images: string[];
}

export interface GeneratedImage {
  id: string;
  src: string;
  x: number;
  y: number;
  z: number;
  sourceTab: Tab;
}

export type NumVariations = 1 | 2 | 3 | 4;

export interface Character {
  id: string;
  name: string;
  face: string;
  body: string;
}

export interface ResultDisplayHandle {
  focusOnImage: (id: string) => void;
  zoom: (direction: 'in' | 'out') => void;
  resetView: () => void;
}

// New Interface for Remix Options
export interface RemixSettings {
    keepBackground: boolean;
    keepPose: boolean;
}

// YouTube Thumbnail Pro Types
export type ThumbnailStyle = 
  | 'ModernEdu' | 'HighContrast' | 'VibrantAnime' 
  | 'Cyberpunk' | 'Minimalist' | 'Luxury' 
  | 'Vaporwave' | 'Gaming' | 'Cinematic' | 'RetroTech' | 'OilPainting' | 'PaperCut' | '3DRender';

export type AtmosphereMood = 'Auto' | 'Energetic' | 'Mysterious' | 'Warm' | 'Professional' | 'Dark' | 'Whimsical' | 'Brutalist';
export type VisualEffect = 'None' | 'Glitch' | 'SpeedLines' | 'Particles' | 'LensFlare' | 'NeonGlow' | 'Halftone' | 'DustOverlay';
export type LightingStyle = 'Standard' | 'RimLight' | 'Backlight' | 'SoftGlow' | 'Volumetric' | 'Studio' | 'NeonRim';
export type ColorGrade = 'None' | 'TealOrange' | 'BlackWhite' | 'RetroFilm' | 'Sepia' | 'Vivid' | 'Pastel';
export type CompositionStyle = 'Auto' | 'RuleOfThirds' | 'Diagonal' | 'GoldenRatio' | 'Centered' | 'TopHeavy';

export type SubjectPosition = 'Left' | 'Right' | 'Center' | 'Auto';
export type StrokeColor = 'White' | 'Orange' | 'Yellow' | 'None';
export type FontStyle = 'Modern Sans' | 'Classic Serif' | 'Manga Brush' | 'Handwriting' | 'Impact Bold';
export type LogoPosition = 'TopLeft' | 'TopRight' | 'BottomLeft' | 'BottomRight';

export type ImageQuality = 'Auto' | '1K' | '2K' | '4K';
export type SocialPlatform = 'Auto' | 'YouTube' | 'YouTubeShorts' | 'InstagramPost' | 'InstagramStory' | 'FacebookPost' | 'TikTok';

export interface ThumbnailConfig {
  isReferenceMode: boolean;
  style: ThumbnailStyle;
  mood: AtmosphereMood;
  vfx: VisualEffect;
  lighting: LightingStyle;
  colorGrade: ColorGrade;
  composition: CompositionStyle;
  fontStyle: FontStyle;
  headline: string;
  subHeadline: string;
  description: string;
  footer: string;
  customPrompt: string;
  subjectImage: ImageFile | null;
  bgImage: ImageFile | null;
  logoImage: ImageFile | null;
  referenceTemplate: ImageFile | null;
  logoPosition: LogoPosition;
  position: SubjectPosition;
  strokeColor: StrokeColor;
  primaryColor: string;
  iconKeywords: string;
  // New fields
  quality: ImageQuality;
  socialPlatform: SocialPlatform;
  lockTextToLine: boolean;
}

// Editor Types
export interface SelectionBox {
    x: number;
    y: number;
    width: number;
    height: number;
}
