const fs = require('fs');
const path = require('path');

// Script para convertir enums a varchar en SQLite
const modelsDir = './src/models';

function convertEnumsInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Buscar patrones de enum y reemplazarlos
    const enumPattern = /type:\s*["']enum["'],\s*enum:\s*\[[^\]]+\],?\s*(default:\s*[^,}]+,?)?/g;
    
    content = content.replace(enumPattern, (match) => {
        modified = true;
        // Extraer el valor default si existe
        const defaultMatch = match.match(/default:\s*([^,}]+)/);
        const defaultValue = defaultMatch ? `default: ${defaultMatch[1]}` : '';
        
        return `type: "varchar", ${defaultValue}`.replace(/,\s*,/g, ',').replace(/,\s*$/, '');
    });

    if (modified) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ Converted enums in: ${filePath}`);
    }
}

// Leer todos los archivos .entity.ts
fs.readdirSync(modelsDir)
    .filter(file => file.endsWith('.entity.ts'))
    .forEach(file => {
        const filePath = path.join(modelsDir, file);
        convertEnumsInFile(filePath);
    });

console.log('🎉 Enum conversion completed!');