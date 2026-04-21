import fs from 'fs';
import path from 'path';

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace src={something} with src={something || undefined} if it's not already handled
    // regex to match src={var} and not src={var || undefined}
    // we need to be careful with complex expressions
    
    // Instead of regex, let's just surgically replace known patterns:
    content = content.replace(/src=\{image\.src\}/g, "src={image.src || undefined}");
    content = content.replace(/src=\{imageSrc\}/g, "src={imageSrc || undefined}");
    content = content.replace(/src=\{preview\}/g, "src={preview || undefined}");
    content = content.replace(/src=\{image\.base64\}/g, "src={image.base64 || undefined}");
    content = content.replace(/src=\{scene\.videoUrl\}/g, "src={scene.videoUrl || undefined}");
    content = content.replace(/src=\{scene\.generatedImage\}/g, "src={scene.generatedImage || undefined}");
    content = content.replace(/src=\{char\.face\}/g, "src={char.face || undefined}");
    content = content.replace(/src=\{config\.subjectImage\.base64\}/g, "src={config.subjectImage?.base64 || undefined}");
    content = content.replace(/src=\{config\.subjectImage\?\.base64\}/g, "src={config.subjectImage?.base64 || undefined}");
    content = content.replace(/src=\{config\.referenceTemplate\.base64\}/g, "src={config.referenceTemplate?.base64 || undefined}");
    content = content.replace(/src=\{config\.referenceTemplate\?\.base64\}/g, "src={config.referenceTemplate?.base64 || undefined}");
    content = content.replace(/src=\{characters\.find\(c => c\.id === characterId\)\?\.face\}/g, "src={characters.find(c => c.id === characterId)?.face || undefined}");
    content = content.replace(/src=\{referenceImages\[0\]\.base64\}/g, "src={referenceImages[0]?.base64 || undefined}");
    content = content.replace(/src=\{resultImage\}/g, "src={resultImage || undefined}");
    
    fs.writeFileSync(filePath, content);
}

const dir = 'components';
const files = fs.readdirSync(dir);
for (const file of files) {
    if (file.endsWith('.tsx')) {
        replaceInFile(path.join(dir, file));
    }
}
// Also process App.tsx if any
replaceInFile('App.tsx');
console.log("Replaced all src occurrences with || undefined fallback.");
