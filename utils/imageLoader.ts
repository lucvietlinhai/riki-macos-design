export const fetchImageAsBase64 = async (src: string): Promise<string> => {
    if (src.startsWith('data:image')) {
        return src;
    }
    
    try {
        const response = await fetch(src);
        if (!response.ok) throw new Error(`Failed to fetch image: ${src}`);
        const blob = await response.blob();
        
        return new Promise((resolve, reject) => {
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
    } catch (error) {
        console.error("Error fetching image as base64:", error);
        throw error;
    }
};
