export const resolveAssetPath = (path: string): string => {
    if (!path || path.startsWith('data:image') || path.startsWith('http')) {
        return path;
    }
    
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
    
    const fetchWithTimeout = async (url: string, timeout = 5000) => {
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
        if (!response.ok) throw new Error(`Failed to fetch image: ${url} (Status: ${response.status})`);
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
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    try {
        // Try resolved path
        const targetUrl = resolveAssetPath(src);
        
        try {
            return await tryFetch(targetUrl);
        } catch (initialError) {
            // Fallback: if it's an absolute path that failed, try it as a relative path
            if (src.startsWith('/')) {
                const relativeUrl = src.substring(1);
                console.warn(`Initial fetch failed for ${targetUrl}, trying fallback to ${relativeUrl}`);
                return await tryFetch(relativeUrl);
            }
            throw initialError;
        }
    } catch (error) {
        console.error("Error fetching image as base64:", error);
        // Return a transparent 1x1 pixel gif as a last resort to prevent app crash
        return "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    }
};
