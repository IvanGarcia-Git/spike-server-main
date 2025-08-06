const fs = require('fs');
const path = require('path');

const modelsDir = './src/models';

function fixSyntaxInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    const originalContent = content;

    // Arreglar patrones como: type: "varchar" algo: valor (falta coma)
    content = content.replace(/type:\s*"varchar"\s+([a-zA-Z])/g, 'type: "varchar", $1');
    
    if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ Fixed syntax in: ${path.basename(filePath)}`);
        changed = true;
    }
    
    return changed;
}

const files = fs.readdirSync(modelsDir)
    .filter(file => file.endsWith('.entity.ts'))
    .map(file => path.join(modelsDir, file));

console.log('🔧 Fixing syntax errors...');

let totalFixed = 0;
files.forEach(file => {
    if (fixSyntaxInFile(file)) {
        totalFixed++;
    }
});

console.log(`🎉 Fixed syntax in ${totalFixed} files!`);