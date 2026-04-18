export const removeBackground = async (base64Image: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject("Cannot get canvas context"); return; }
      
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // Sample corners to guess background color
      const corners = [
        [0, 0], [canvas.width - 1, 0], 
        [0, canvas.height - 1], [canvas.width - 1, canvas.height - 1]
      ];
      
      const tl = (0 * canvas.width + 0) * 4;
      const bgR = data[tl], bgG = data[tl+1], bgB = data[tl+2];
      
      const tolerance = 20;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const diff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
        if (diff < tolerance * 3) {
           data[i + 3] = 0; // Set alpha to 0 for background
        }
      }

      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = base64Image;
  });
};
