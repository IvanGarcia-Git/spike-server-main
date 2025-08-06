const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function createSimpleUser() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database('spikes.db');

        // Primero ver la estructura de la tabla
        db.all("PRAGMA table_info(user);", (err, rows) => {
            if (err) {
                console.error('Error getting table info:', err);
                reject(err);
                return;
            }

            console.log('📋 Estructura de tabla user:');
            const columns = rows.map(row => row.name);
            console.log(columns.join(', '));

            // Crear usuario solo con campos esenciales
            const password = bcrypt.hashSync('123456', 10);
            const uuid = uuidv4();

            const query = `
                INSERT OR REPLACE INTO user (
                    uuid, name, firstSurname, secondSurname, username, email, password, 
                    isManager, groupId, leadPriorities
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const values = [
                uuid,
                'Admin',
                'Usuario',
                'Prueba', 
                'admin',
                'test@test.com',
                password,
                1, // isManager = true
                1, // groupId = 1 (Super Admin)
                '[]' // leadPriorities (JSON)
            ];

            db.run(query, values, function(err) {
                if (err) {
                    console.error('Error creating user:', err);
                    reject(err);
                } else {
                    console.log('✅ Usuario de prueba creado exitosamente!');
                    console.log('📧 Email: test@test.com');
                    console.log('👤 Username: admin'); 
                    console.log('🔑 Password: 123456');
                    console.log('👑 Super Admin: Sí (groupId: 1)');
                    resolve();
                }
            });

            db.close();
        });
    });
}

createSimpleUser().catch(console.error);