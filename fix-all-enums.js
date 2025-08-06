const fs = require('fs');
const glob = require('glob');

// Buscar todos los archivos .entity.ts
const files = glob.sync('./src/models/*.entity.ts');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Patrón 1: type: "enum", enum: Something
    const pattern1 = /type:\s*["']enum["'],\s*enum:\s*[^,}]+,?/g;
    if (pattern1.test(content)) {
        content = content.replace(pattern1, 'type: "varchar"');
        changed = true;
    }

    // Patrón 2: { type: "enum", enum: Something }
    const pattern2 = /\{\s*type:\s*["']enum["'],\s*enum:\s*[^,}]+,?\s*\}/g;
    if (pattern2.test(content)) {
        content = content.replace(pattern2, '{ type: "varchar" }');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content);
        console.log(`✅ Fixed: ${file}`);
    }
});

console.log('🎉 All enum fixes completed!');