import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('.', function(filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.html')) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        let newContent = content.replace(/indigo-/g, 'orange-');
        newContent = newContent.replace(/blue-/g, 'orange-'); // Cover blue buttons too

        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log('Updated', filePath);
        }
    }
});
