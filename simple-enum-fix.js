const fs = require('fs');
const path = require('path');

const modelsDir = './src/models';

// Función para arreglar enums en un archivo
function fixEnumsInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Buscar y reemplazar todos los patrones de enum
    const originalContent = content;

    // Patrón: type: "enum", enum: [algo] o CompanyType o lo que sea
    content = content.replace(/type:\s*["']enum["'],\s*enum:\s*[^,}]+,?/g, 'type: "varchar"');
    
    // Si hubo cambios
    if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ Fixed enums in: ${path.basename(filePath)}`);
        changed = true;
    }
    
    return changed;
}

// Obtener lista de archivos entity
const files = fs.readdirSync(modelsDir)
    .filter(file => file.endsWith('.entity.ts'))
    .map(file => path.join(modelsDir, file));

console.log('🔧 Fixing enum types in entity files...');

let totalFixed = 0;
files.forEach(file => {
    if (fixEnumsInFile(file)) {
        totalFixed++;
    }
});

console.log(`🎉 Fixed ${totalFixed} entity files!`);