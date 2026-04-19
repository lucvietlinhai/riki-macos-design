
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { ImageFile, GeneratedResult, ThumbnailConfig, AspectRatio, BackgroundOption, NumVariations, CharacterId, AIModel, SelectionBox, DesignMode, RemixSettings } from "../types";
import { translations, Language } from "../i18n";

const getAIClient = () => {
    // 1. Try local storage first (user provided)
    // 2. Fallback to process.env.GEMINI_API_KEY (Server/Antigravity environment)
    // 3. Fallback to process.env.API_KEY
    // 4. Fallback to VITE_GEMINI_API_KEY (Client-side env fallback if somehow exposed)
    const key = localStorage.getItem('gemini_api_key') 
                || (typeof process !== 'undefined' ? (process.env.GEMINI_API_KEY || process.env.API_KEY) : undefined) 
                || import.meta.env.VITE_GEMINI_API_KEY;
                
    if (!key) {
        // Since we are likely in a browser, trigger the API key modal event if needed
        window.dispatchEvent(new CustomEvent('showApiKeyModal'));
        throw new Error("API_KEY_MISSING");
    }
    return new GoogleGenAI({ apiKey: key });
};

const fileToGenerativePart = (file: ImageFile) => {
  const base64Data = file.base64.startsWith('data:') ? file.base64.split(',')[1] : file.base64;
  return { inlineData: { data: base64Data, mimeType: file.mimeType } };
};

// Helper to crop image/mask based on selection box before sending to AI
const cropImageToSelection = async (base64Image: string, selection: SelectionBox): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = selection.width;
            canvas.height = selection.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) { reject("Canvas error"); return; }
            
            // Draw cropped portion
            ctx.drawImage(img, selection.x, selection.y, selection.width, selection.height, 0, 0, selection.width, selection.height);
            resolve(canvas.toDataURL('image/png').split(',')[1]);
        };
        img.onerror = reject;
        img.src = base64Image.startsWith('data:') ? base64Image : `data:image/png;base64,${base64Image}`;
    });
};

export const enhancePromptWithAI = async (shortPrompt: string, characterId: string, lang: Language): Promise<string> => {
    const ai = getAIClient();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `You are an expert AI image generation prompt engineer. The user wants to generate an image of a mascot character named "${characterId}".
User's brief idea: "${shortPrompt}"

Expand this brief idea into a highly detailed, descriptive, and vivid paragraph written in English (regardless of the input language) optimized for an image generation AI.
Include descriptions of the character's pose, distinct facial expression, the camera angle (e.g., dynamic low angle, 3/4 view), dramatic lighting (e.g., neon rim lights, cinematic shadows), and the environment/background. Keep it under 60 words.

IMPORTANT: Return ONLY the enhanced prompt string. No conversational text, no quotes, no explanations.`
        });
        const enhanced = response.text || shortPrompt;
        if (enhanced.includes("Failed to call") || enhanced.trim() === "") {
            throw new Error(`AI generated error fallback: ${enhanced}`);
        }
        return enhanced.trim().replace(/^"/, '').replace(/"$/, '');
    } catch (e) {
        console.error("Failed to enhance prompt", e);
        throw e; // Throw so UI can catch it and handle appropriately
    }
};

export const generateYoutubeThumbnail = async (config: ThumbnailConfig, model: AIModel, language: Language): Promise<GeneratedResult> => {
    const ai = getAIClient();

  let styleInstruction = "";
  let layoutInstruction = "";
  let fontInstruction = "";

  // Mapping Social Platform to Aspect Ratios
  const socialRatioMap: Record<string, string> = {
      'Auto': '16:9',
      'YouTube': '16:9',
      'YouTubeShorts': '9:16',
      'InstagramPost': '1:1',
      'InstagramStory': '9:16',
      'FacebookPost': '4:3',
      'TikTok': '9:16'
  };
  
  const targetRatio = socialRatioMap[config.socialPlatform] || '16:9';

  if (config.isReferenceMode && config.referenceTemplate) {
    styleInstruction = `
      REFERENCE IMAGE ANALYSIS AND BLENDING:
      1. STYLE & COLOR: Copy the exact color palette, lighting, and artistic style from the attached "Reference Template".
      2. SUBJECT REPLACEMENT INTEGRATION: Identify the main character's position in the Reference Template. REMOVE that character and REPLACE it with the provided "Main Subject" image.
      3. SEAMLESS BLENDING: Correct the lighting and shadows on the "Main Subject" to perfectly match the original background's environment. Ensure no harsh edges or visible crops.
    `;
    layoutInstruction = `
      4. COMPOSITION: Place my character in the exact spatial position and scale as seen in the reference image.
    `;
    fontInstruction = `
      5. TYPOGRAPHY: Analyze the font style in the reference. Design the new text ("${config.headline}") to match that specific typography vibe.
    `;
  } else {
    const styleMap = {
      ModernEdu: "Modern educational, clean, flat vector style.",
      HighContrast: "High energy, dramatic lighting, deep shadows.",
      VibrantAnime: "Japanese Anime style, vibrant saturated colors.",
      Cyberpunk: "Futuristic, Pink/Blue Neon lighting, dark atmosphere.",
      Minimalist: "Minimalist, lots of white space, elegant.",
      Luxury: "Premium, Gold and Black theme.",
      Vaporwave: "80s retro, pastel colors, glitch effects.",
      Gaming: "Esports style, intense action effects.",
      Cinematic: "Movie poster style, wide color gamut, realistic depth of field.",
      RetroTech: "Old CRT monitor effect, 8-bit vibes, classic tech aesthetic.",
      OilPainting: "Classic oil painting texture, visible brushstrokes.",
      PaperCut: "Layered paper cut-out style with soft drop shadows for depth.",
      '3DRender': "High-end 3D octane render style, realistic materials."
    };
    
    styleInstruction = `
      VISUAL DESIGN:
      - BASE STYLE: ${styleMap[config.style] || styleMap.ModernEdu}
      - ATMOSPHERE: ${config.mood === 'Auto' ? 'Balanced' : config.mood} mood.
      - LIGHTING: ${config.lighting === 'Standard' ? 'Natural' : `Apply a ${config.lighting} effect.`}
      - COLOR PALETTE: Dominated by ${config.primaryColor}. ${config.colorGrade !== 'None' ? `Apply a ${config.colorGrade} color grading.` : ''}
      - EFFECTS: ${config.vfx !== 'None' ? `Include ${config.vfx} visual elements for impact.` : ''}
    `;
    
    layoutInstruction = `
      COMPOSITION & LAYOUT:
      - RULES: ${config.composition === 'Auto' ? 'Follow professional graphic design rules.' : `Use the ${config.composition} layout rule.`}
      - SUBJECT POSITION: Place the main subject at ${config.position === 'Auto' ? 'the best position' : config.position}. ${config.strokeColor !== 'None' ? `Add a ${config.strokeColor} highlight/outline around the subject.` : ''}
    `;
    
    const fontMap = {
      'Modern Sans': "Modern Sans-Serif font, high readability.",
      'Classic Serif': "Elegant Classic Serif font.",
      'Manga Brush': "Strong Japanese Manga brush calligraphy.",
      'Handwriting': "Friendly Handwriting font.",
      'Impact Bold': "Thick, bold Impact font for advertising."
    };
    fontInstruction = `TYPOGRAPHY: Use ${fontMap[config.fontStyle] || fontMap['Modern Sans']}.`;
  }

  // Handle Text Locking
  if (config.lockTextToLine) {
    fontInstruction += `
    STRICT LAYOUT RULE: Text must NOT wrap to a new line.
    - Force "Main Headline" and "Sub Headline" to fit on a SINGLE LINE per element.
    - Automatically reduce/scale down the font size to ensure it fits the width without breaking lines.
    - Do not allow any line breaks in the headline or subheadline text.
    `;
  }

  let logoInstruction = "";
  if (config.logoImage) {
    logoInstruction = `- LOGO: Use the attached logo image and place it at the ${config.logoPosition} corner.`;
  }

  const prompt = `
    CRITICAL TASK: YOU MUST GENERATE A HIGH-RESOLUTION IMAGE. DO NOT RESPOND WITH TEXT.
    
    ${styleInstruction}
    ${layoutInstruction}
    ${fontInstruction}
    ${logoInstruction}

    TEXT CONTENT (Render this text as part of the image art):
    - MAIN HEADLINE: "${config.headline}"
    - SUB HEADLINE: "${config.subHeadline}"
    - DESCRIPTION: "${config.description}"
    - FOOTER/CTA: "${config.footer}"
    
    ADDITIONAL DETAILS:
    - Decor: Add relevant icons for: ${config.iconKeywords}.
    ${config.customPrompt ? `- EXTRA REQUIREMENTS: ${config.customPrompt}` : ""}

    OUTPUT: High resolution, ${targetRatio} ratio, sharp details.
  `;

  const parts: any[] = [{ text: prompt }];
  
  if (config.subjectImage) {
    parts.push({ text: "INPUT IMAGE: Main Character/Subject" });
    parts.push(fileToGenerativePart(config.subjectImage));
  }
  
  if (config.isReferenceMode && config.referenceTemplate) {
    parts.push({ text: "INPUT IMAGE: Reference Template for Style/Layout" });
    parts.push(fileToGenerativePart(config.referenceTemplate));
  } else if (config.bgImage) {
    parts.push({ text: "INPUT IMAGE: Custom Background" });
    parts.push(fileToGenerativePart(config.bgImage));
  }

  if (config.logoImage) {
    parts.push({ text: "INPUT IMAGE: Brand Logo" });
    parts.push(fileToGenerativePart(config.logoImage));
  }
  
  let imageSizeParam: string | undefined = undefined;
  if (model.includes('pro')) {
       if (config.quality === '4K' || config.quality === '2K') {
           imageSizeParam = '2K'; // API max is 2K usually
       } else if (config.quality === '1K') {
           imageSizeParam = '1K';
       }
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: { parts },
      config: { 
          imageConfig: { 
              aspectRatio: targetRatio, 
              ...(imageSizeParam ? { imageSize: imageSizeParam } : {}) 
          } 
      },
    });

    let imageBase64 = "";
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) { imageBase64 = part.inlineData.data; break; }
      }
    }

    if (!imageBase64) {
      const reason = response.candidates?.[0]?.finishReason;
      const textPart = response.candidates?.[0]?.content?.parts?.find(p => p.text)?.text;
      throw new Error(textPart || `AI could not generate image. Reason: ${reason || 'Unknown'}`);
    }

    return { images: [imageBase64] };
  } catch (error: any) {
    console.error("Gemini Service Error:", error);
    throw error;
  }
};

export const generateMascotImage = async (
    primaryMascot: ImageFile, 
    faceReference: ImageFile, 
    userPrompt: string, 
    background: BackgroundOption, 
    referenceImages: ImageFile[], 
    isSketch: boolean, 
    numVariations: NumVariations, 
    aspectRatio: AspectRatio, 
    characterId: CharacterId, 
    model: AIModel,
    language: Language,
    designMode: DesignMode = 'free',
    remixSettings: RemixSettings = { keepBackground: false, keepPose: false }
  ): Promise<GeneratedResult> => {
    const ai = getAIClient();
    const parts: any[] = [];
    
    // Default Aspect Ratio logic
    let finalAspectRatio = aspectRatio;

    let basePrompt = `TASK: Create a clean 2D flat vector mascot illustration for the character "${characterId}".\n`;
    
    if (designMode === 'concept') {
        // Concept Mode: Generate Character Sheet
        finalAspectRatio = '9:16'; // Force Vertical for ample space
        basePrompt += `
        MODE: CHARACTER SHEET / POSE SET
        LAYOUT REQUIREMENT: Vertical layout (9:16).
        CONTENT:
        1. GRID LAYOUT: Create a neatly arranged set of 6 to 9 distinct character stickers/poses on a single sheet.
        2. SUBJECT VARIATIONS: All items MUST be the character "${characterId}" in different full-body action poses based on the theme: "${userPrompt}". 
           - **CRITICAL**: DO NOT duplicate the same pose. Each sticker MUST feature a completely different body pose, viewing angle (front, profile, 3/4 view, from behind), and facial expression (joy, anger, surprise, neutral, etc.).
           - DO NOT generate random objects or props. 
           - Generate character poses ONLY.
        3. CONSISTENCY: Maintain the exact character identity (colors, costume, proportions) across all 6-9 poses. The reference images are ONLY for identity, NOT for locking the pose.
        4. ARRANGEMENT: Arrange them in a clean grid or artistic layout with sufficient spacing between each character pose.
        
        VISUAL STYLE:
        - 2D flat vector art, clean lines, white border around each character (sticker style).
        - Uniform color palette matching the character.
        - No background elements, just the character stickers on the solid background.
        `;
    } else if (designMode === 'reference') {
        // Reference Mode: Subject Replacement / Style Transfer with Advanced Constraints
        
        basePrompt = `TASK: Re-imagine the attached "Target Style Reference" image by replacing the main subject with the mascot "${characterId}".
        
        INSTRUCTIONS:
        1. ANALYZE REFERENCE: Look at the "Target Style Reference" image. Note its background, lighting, artistic style, and the character's interaction with the environment.
        `;
        
        // Add specific instructions based on Remix Settings
        if (remixSettings.keepBackground) {
            basePrompt += `
        2. BACKGROUND PRESERVATION (CRITICAL): You MUST keep the original background environment, setting, and lighting EXACTLY as they appear in the reference. Do NOT create a new background.
           - Only replace the character itself.
           - Blend the new character into the existing scene realistically (shadows, lighting match).
           `;
        } else {
             basePrompt += `
        2. BACKGROUND: Create a background that matches the *style* and *vibe* of the reference, but you have creative freedom to adapt it to fit the new character.
             `;
        }

        if (remixSettings.keepPose) {
             basePrompt += `
        3. POSE MATCHING (CRITICAL): The new character "${characterId}" MUST adopt the EXACT SAME POSE and body language as the character in the reference image.
           - Match arm positions, leg positions, head tilt, and camera angle.
           - If the original character is holding an object, the new character should hold it too (or a similar prop relevant to the new character).
             `;
        } else {
             basePrompt += `
        3. POSE: The character can have a natural, dynamic pose that fits the scene. It doesn't need to strictly copy the reference pose, but should fit the context.
             `;
        }

        basePrompt += `
        4. SUBJECT IDENTITY: 
           - The new character MUST look like "${characterId}" (same face, costume colors, and body structure provided in "Mascot Body").
           - Maintain the mascot's unique features (e.g., hat, suit details) while adapting to the scene's lighting/style.
           
        5. OUTPUT: A high-quality image that looks like a seamless remix of the reference.
        
        ${userPrompt ? `ADDITIONAL REQUEST: ${userPrompt}` : ''}
        `;
    } else {
        // Free Design Mode (Standard)
        basePrompt += `
        VISUAL STYLE REQUIREMENTS:
        - Format: 2D flat design, vector art style, clean sharp lines, bold solid colors.
        - **CRITICAL - DYNAMIC POSING & CAMERA**: Do NOT copy the stiff pose or camera angle from the reference image. The reference images are strictly for ID/Costume ONLY.
        - Create a completely NEW, dynamic pose that perfectly matches the requested action: "${userPrompt || 'A friendly pose'}". 
        - Freely alter the character's viewing angle (e.g., profile, 3/4 angle, from below/above) and body posture to fit the action.
        - **FACIAL EXPRESSION**: Do NOT copy the default expression from the reference. The facial expression MUST reflect the emotion of the requested action (e.g. laughing, crying, angry, focused, scared).
        - Character Identity: Retain exact costume colors, body proportions, and distinct physical traits from the reference.
        - Background: ${background === 'white' ? 'Clean solid white' : background === 'black' ? 'Solid black' : 'Flat color or simple 2D background'}.
      
        STRICT EXCLUSIONS (NEGATIVE CONSTRAINTS) - DO NOT USE:
        - No 3D, no CGI, no realistic rendering.
        - Avoid Unreal Engine, Blender, Octane styles.
        - No photorealism, no realistic lighting or ray tracing.
        - No depth of field, no blurry backgrounds.
        - No plastic textures, no glossy or shiny surfaces.
        - No smooth 3D gradients or realistic shadows.
        
        OUTPUT: High-quality 2D digital illustration.`;
    }
  
    parts.push({ text: basePrompt });
    
    // Labeling for better AI understanding
    parts.push({ text: "REFERENCE 1 (Mascot Body): Master design for clothing, colors, and proportions. **DO NOT COPY THIS POSE OR ANGLE.**" });
    parts.push(fileToGenerativePart(primaryMascot));
    
    parts.push({ text: "REFERENCE 2 (Mascot Face): Character's facial structure. **DO NOT COPY THIS EXACT EXPRESSION** (unless it matches the prompt)." });
    parts.push(fileToGenerativePart(faceReference));
    
    // Attach additional references
    if (referenceImages.length > 0) {
      if (designMode === 'reference') {
         // In reference mode, the first image is the Target Style Reference
         parts.push({ text: "TARGET STYLE REFERENCE (REPLACE SUBJECT IN THIS IMAGE):" });
         parts.push(fileToGenerativePart(referenceImages[0]));
         
         // If there are more, treat them as extra style guides
         for(let i=1; i<referenceImages.length; i++) {
             parts.push({ text: `ADDITIONAL STYLE GUIDE ${i}:` });
             parts.push(fileToGenerativePart(referenceImages[i]));
         }
      } else {
         // Standard mode references
         referenceImages.forEach((img, i) => {
            parts.push({ text: `REFERENCE: Style/Composition Guide ${i+1}` });
            parts.push(fileToGenerativePart(img));
          });
      }
    }
  
    try {
      // Execute multiple requests in parallel to generate variations
      const tasks = Array(numVariations).fill(null).map(() => 
          ai.models.generateContent({
            model: model,
            contents: { parts },
            config: {
              imageConfig: {
                aspectRatio: finalAspectRatio === 'keep' ? '1:1' : (finalAspectRatio as any),
                ...(model.includes('pro') ? { imageSize: "2K" } : {})
              }
            }
          })
      );

      const responses = await Promise.all(tasks);
      const images: string[] = [];

      responses.forEach(response => {
          if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
              if (part.inlineData?.data) { 
                  images.push(part.inlineData.data); 
                  break; 
              }
            }
          }
      });
  
      if (images.length === 0) throw new Error("AI returned no image data.");
      return { images: images };

    } catch (error: any) {
      throw error;
    }
  };


export const editMascotImage = async (
  originalImage: ImageFile, 
  maskImage: ImageFile, 
  userPrompt: string, 
  model: AIModel,
  language: Language,
  selection?: SelectionBox,
  referenceImages?: ImageFile[]
): Promise<GeneratedResult> => {
  const ai = getAIClient();
  
  let finalOriginal = originalImage;
  let finalMask = maskImage;

  // Process Selection Crop if present
  if (selection) {
      const croppedBase64 = await cropImageToSelection(originalImage.base64, selection);
      finalOriginal = { base64: croppedBase64, mimeType: 'image/png' };

      const croppedMaskBase64 = await cropImageToSelection(maskImage.base64, selection);
      finalMask = { base64: croppedMaskBase64, mimeType: 'image/png' };
  }

  // Create inputs
  const parts: any[] = [
    { text: "INSTRUCTION: Modify the image area covered by the white mask based on the description below. Keep the style consistent with the original image (2D flat vector). Seamlessly blend any new objects, correcting lighting and shadows." },
    { text: `CHANGE DESCRIPTION: ${userPrompt}` },
    { text: "ORIGINAL IMAGE:" },
    fileToGenerativePart(finalOriginal),
    { text: "MASK IMAGE (White = Edit, Black = Keep):" },
    fileToGenerativePart(finalMask),
  ];

  if (referenceImages && referenceImages.length > 0) {
      referenceImages.forEach((ref, idx) => {
          parts.push({ text: `REFERENCE IMAGE ${idx + 1} (Use this style/object):` });
          parts.push(fileToGenerativePart(ref));
      });
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts }
    });

    let imageBase64 = "";
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) { imageBase64 = part.inlineData.data; break; }
      }
    }
    if (!imageBase64) throw new Error("No image returned from AI.");
    
    if (selection) {
        const compositeResult = await compositeResultBack(originalImage.base64, imageBase64, selection);
        return compositeResult;
    }

    return { images: [imageBase64] };
  } catch (error: any) {
    throw error;
  }
};

// Helper to composite cropped result back into original
const compositeResultBack = async (fullBase64: string, croppedChunkBase64: string, selection: SelectionBox): Promise<GeneratedResult> => {
    return new Promise((resolve, reject) => {
        const fullImg = new Image();
        const chunkImg = new Image();
        let loaded = 0;
        const onLo = () => {
            loaded++;
            if(loaded === 2) {
                const canvas = document.createElement('canvas');
                canvas.width = fullImg.width;
                canvas.height = fullImg.height;
                const ctx = canvas.getContext('2d');
                if(!ctx) { reject("Canvas fail"); return; }
                
                // Draw original
                ctx.drawImage(fullImg, 0, 0);
                // Draw edited chunk over it
                ctx.drawImage(chunkImg, selection.x, selection.y, selection.width, selection.height);
                
                resolve({ images: [canvas.toDataURL('image/png').split(',')[1]] });
            }
        };
        fullImg.onload = onLo;
        chunkImg.onload = onLo;
        fullImg.src = fullBase64.startsWith('data:') ? fullBase64 : `data:image/png;base64,${fullBase64}`;
        chunkImg.src = `data:image/png;base64,${croppedChunkBase64}`;
    });
};

export const generateThumbPostImages = async (
    characterImage: ImageFile, 
    faceReference: ImageFile, 
    postContent: string, 
    model: AIModel,
    language: Language, 
    includeText: boolean
  ): Promise<string[]> => {
    const ai = getAIClient();
    const prompt = `Design a creative square 2D social media graphic. 
    Style: 2D Flat Vector Art. 
    Mascot: Feature the character using provided body and face images. 
    Topic: ${postContent}. 
    Avoid all 3D, CGI, and realistic rendering. 
    ${includeText ? "Artistically integrate typography related to the topic." : "Do NOT include any text."}`;
  
    const parts = [
      { text: prompt },
      fileToGenerativePart(characterImage),
      fileToGenerativePart(faceReference)
    ];
  
    try {
      const tasks = Array(4).fill(null).map(() => 
        ai.models.generateContent({
          model: model,
          contents: { parts },
          config: { 
              imageConfig: { 
                  aspectRatio: "1:1",
                  ...(model.includes('pro') ? { imageSize: "2K" } : {})
              } 
          }
        })
      );
  
      const responses = await Promise.all(tasks);
      const images: string[] = [];
  
      responses.forEach(res => {
        if (res.candidates?.[0]?.content?.parts) {
          for (const part of res.candidates[0].content.parts) {
            if (part.inlineData?.data) { images.push(part.inlineData.data); break; }
          }
        }
      });
  
      if (images.length === 0) throw new Error("AI failed to generate images.");
      return images;
    } catch (error) {
      console.error("ThumbPost Generation Error:", error);
      throw error;
    }
  };
  
  export const generateThumbVideoImages = async (
    characterImage: ImageFile, 
    faceReference: ImageFile, 
    postContent: string, 
    aspectRatio: AspectRatio, 
    model: AIModel,
    language: Language, 
    includeText: boolean
  ): Promise<string[]> => {
    const ai = getAIClient();
    const prompt = `Create a viral 2D video thumbnail. 
    Style: Eye-catching 2D Flat Illustration. 
    Mascot: Use the provided character body and facial reference. 
    Topic: ${postContent}. 
    Strictly No 3D, No CGI, No photorealism.
    ${includeText ? "Include bold, stylized text for the title." : "Cinematic visual, no text."}`;
  
    const parts = [
      { text: prompt },
      fileToGenerativePart(characterImage),
      fileToGenerativePart(faceReference)
    ];
  
    try {
      const tasks = Array(4).fill(null).map(() => 
        ai.models.generateContent({
          model: model,
          contents: { parts },
          config: { 
              imageConfig: { 
                  aspectRatio: aspectRatio === 'keep' ? '1:1' : (aspectRatio as any),
                  ...(model.includes('pro') ? { imageSize: "2K" } : {}) 
              } 
          }
        })
      );
  
      const responses = await Promise.all(tasks);
      const images: string[] = [];
  
      responses.forEach(res => {
        if (res.candidates?.[0]?.content?.parts) {
          for (const part of res.candidates[0].content.parts) {
            if (part.inlineData?.data) { images.push(part.inlineData.data); break; }
          }
        }
      });
  
      if (images.length === 0) throw new Error("AI failed to generate video thumbnails.");
      return images;
    } catch (error) {
      console.error("ThumbVideo Generation Error:", error);
      throw error;
    }
  };

export const analyzeStoryToScenes = async (storyText: string, language: Language): Promise<StoryScene[]> => {
    const ai = getAIClient();
    const langMap: Record<Language, string> = {
        vi: 'Vietnamese',
        en: 'English',
        ja: 'Japanese',
        id: 'Indonesian'
    };
    const targetLang = langMap[language] || 'English';

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `You are a creative storyboard artist. Analyze the following story and split it into 3 to 5 logical scenes or chapters for illustration.
            
            Story: "${storyText}"
            
            For each scene, provide:
            1. title: A short title for the chapter in ${targetLang}.
            2. description: A brief emotional description of what is happening (1 sentence) in ${targetLang}.
            3. imagePrompt: A highly descriptive image generation prompt in ${targetLang} that focuses on the environment, mood, and action.
            
            Return the result as a JSON array of objects.
            
            Example Format:
            [
              { "title": "The Arrival", "description": "The character arrives at the mysterious forest.", "imagePrompt": "A lush neon forest with glowing mushrooms..." }
            ]
            
            IMPORTANT: Return ONLY the JSON array. No other text.`
        });
        
        let jsonStr = response.text || "[]";
        // Basic cleanup in case AI adds markdown
        jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(jsonStr);
        
        return parsed.map((item: any, index: number) => ({
            id: `scene-${Date.now()}-${index}`,
            chapterNumber: index + 1,
            title: item.title || `Chapter ${index + 1}`,
            description: item.description || '',
            imagePrompt: item.imagePrompt || ''
        }));
    } catch (e) {
        console.error("Failed to analyze story", e);
        throw e;
    }
};

export const continueStoryFromScenes = async (scenes: StoryScene[], language: Language): Promise<StoryScene> => {
    const ai = getAIClient();
    const langMap: Record<Language, string> = {
        vi: 'Vietnamese',
        en: 'English',
        ja: 'Japanese',
        id: 'Indonesian'
    };
    const targetLang = langMap[language] || 'English';

    const previousContext = scenes.map(s => `Chapter ${s.chapterNumber}: ${s.title} - ${s.description}`).join('\n');

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `You are a creative storyboard artist. Based on the previous chapters of this story, create ONE next logical scene/chapter.
            
            Previous Context:
            ${previousContext}
            
            Provide:
            1. title: A short title for this new chapter in ${targetLang}.
            2. description: A brief emotional description of what is happening (1 sentence) in ${targetLang}.
            3. imagePrompt: A highly descriptive image generation prompt in ${targetLang} that focuses on the environment, mood, and action.
            
            Return the result as a single JSON object.
            
            Format:
            { "title": "Next Step", "description": "The character faces a new challenge.", "imagePrompt": "Description..." }
            
            IMPORTANT: Return ONLY the JSON object. No other text.`
        });
        
        let jsonStr = response.text || "{}";
        jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
        const item = JSON.parse(jsonStr);
        
        return {
            id: `scene-${Date.now()}`,
            chapterNumber: scenes.length + 1,
            title: item.title || `Chapter ${scenes.length + 1}`,
            description: item.description || '',
            imagePrompt: item.imagePrompt || ''
        };
    } catch (e) {
        console.error("Failed to continue story", e);
        throw e;
    }
};

export const generateStorySceneImage = async (
    scene: StoryScene,
    characterImage: ImageFile,
    faceReference: ImageFile,
    characterId: CharacterId,
    model: AIModel,
    aspectRatio: '16:9' | '9:16' = '16:9',
    previousSceneImage?: string
): Promise<string> => {
    const ai = getAIClient();
    let prompt = `Create a 2D flat vector illustration for a story chapter titled "${scene.title}".
    Scene Description: ${scene.description}
    Visual Style: 2D Flat Vector, vibrant, cinematic composition.
    Subject: Feature the character "${characterId}".
    Environment & Action: ${scene.imagePrompt}
    Constraint: No 3D, No CGI, No text in the image. High quality, sharp details.
    `;

    if (previousSceneImage) {
        prompt += `
        CONSISTENCY REQUIREMENT:
        - Refer to the attached "Previous Scene Image". 
        - Maintain the EXACT SAME character appearance (clothing, colors, face).
        - Maintain the background style, lighting, and environmental atmosphere for visual continuity.
        - This new image is the NEXT part of the story, so keep the world cohesive.
        `;
    }
    
    const parts: any[] = [
        { text: prompt },
        { text: "REFERENCE (Mascot Appearance):" },
        fileToGenerativePart(characterImage),
        { text: "REFERENCE (Mascot Face):" },
        fileToGenerativePart(faceReference)
    ];

    if (previousSceneImage) {
        const base64 = previousSceneImage.startsWith('data:') ? previousSceneImage.split(',')[1] : previousSceneImage;
        parts.push({ text: "PREVIOUS SCENE IMAGE (FOR STYLE & CHARACTER CONSISTENCY):" });
        parts.push({ inlineData: { data: base64, mimeType: 'image/png' } });
    }
    
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts },
            config: { 
                imageConfig: { 
                    aspectRatio: aspectRatio,
                    ...(model.includes('pro') ? { imageSize: "2K" } : {})
                } 
            }
        });
        
        let imageBase64 = "";
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData?.data) { imageBase64 = part.inlineData.data; break; }
            }
        }
        if (!imageBase64) throw new Error("No image data returned for story scene.");
        return imageBase64;
    } catch (error) {
        console.error("StoryScene Generation Error:", error);
        throw error;
    }
};
