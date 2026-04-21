export const resizeImage = async (base64Str: string, maxDimension: number = 1024): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            let width = img.width;
            let height = img.height;

            if (width <= maxDimension && height <= maxDimension) {
                resolve(base64Str);
                return;
            }

            if (width > height) {
                if (width > maxDimension) {
                    height *= maxDimension / width;
                    width = maxDimension;
                }
            } else {
                if (height > maxDimension) {
                    width *= maxDimension / height;
                    height = maxDimension;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(base64Str);
                return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve(base64Str);
        img.src = base64Str;
    });
};

export const fetchImageAsBase64 = async (src: string): Promise<string> => {
    if (src.startsWith('data:image')) {
        return src;
    }
    
    try {
        const response = await fetch(src);
        if (!response.ok) throw new Error(`Failed to fetch image: ${src} (Status: ${response.status})`);
        const blob = await response.blob();
        
        const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    resolve(reader.result);
                } else {
                    reject(new Error('FileReader result is not a string'));
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });

        // Always attempt a resize/sanitize pass to ensure the format is standard and size is reasonable
        return await resizeImage(base64);
    } catch (error) {
        console.error("Error fetching image as base64:", error);
        throw error;
    }
};
