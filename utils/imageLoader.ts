export const resolveAssetPath = (path: string | undefined): string | undefined => {
    if (!path) {
        return undefined;
    }
    
    if (path.startsWith('data:image') || path.startsWith('http')) {
        return path;
    }
    
    // Ensure absolute paths from public directory are correctly prefixed with BASE_URL
    if (path.startsWith('/')) {
        const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '');
        return `${baseUrl}${path}`;
    }
    
    return path;
};

export const fetchImageAsBase64 = async (src: string): Promise<string> => {
    if (src.startsWith('data:image')) {
        return src;
    }
    
    const fetchWithTimeout = async (url: string, timeout = 10000) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        try {
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(id);
            return response;
        } catch (e) {
            clearTimeout(id);
            throw e;
        }
    };

    const tryFetch = async (url: string) => {
        const response = await fetchWithTimeout(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${url} (Status: ${response.status} ${response.statusText})`);
        }
        const blob = await response.blob();
        
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    resolve(reader.result);
                } else {
                    reject(new Error('FileReader result is not a string'));
                }
            };
            reader.onerror = () => reject(new Error('FileReader failed to read blob'));
            reader.readAsDataURL(blob);
        });
    };

    // Use strictly resolved path without problematic relative fallbacks
    const targetUrl = resolveAssetPath(src);
    try {
        return await tryFetch(targetUrl);
    } catch (error) {
        console.error(`[ImageLoader] Error loading ${src} from ${targetUrl}:`, error);
        // Do not return 1x1 placeholder, throw to let the caller handle it or fail visibly
        throw error;
    }
};
