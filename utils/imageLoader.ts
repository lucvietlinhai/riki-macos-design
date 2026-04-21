export const resizeImage = async (base64Str: string, maxDimension: number = 768): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            let width = img.width;
            let height = img.height;

            if (width <= maxDimension && height <= maxDimension && base64Str.startsWith('data:image/jpeg')) {
                // If it's already jpeg and small enough, no need to re-encode
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
            // Fill with white background (in case of PNG transparency being lost in JPEG conversion)
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            
            // Use image/jpeg with 0.8 quality to significantly reduce payload size
            resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = () => resolve(base64Str);
        img.src = base64Str;
    });
};

export const fetchImageAsBase64 = async (src: string): Promise<string> => {
    if (src.startsWith('data:image')) {
        return src;
    }
    
    // Ensure the path is absolute relative to the site root for reliability
    const fetchUrl = (src.startsWith('/') && !src.startsWith('//')) 
        ? `${window.location.origin}${src}` 
        : src;

    try {
        const response = await fetch(fetchUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${fetchUrl} (Status: ${response.status})`);
        }
        
        const contentType = response.headers.get('content-type');
        if (contentType && !contentType.startsWith('image/')) {
            throw new Error(`Fetched resource is not an image: ${fetchUrl} (Type: ${contentType})`);
        }

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
