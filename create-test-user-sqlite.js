const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function createTestUser() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database('spikes.db');

        // Hash de la contraseña "123456"
        const password = bcrypt.hashSync('123456', 10);
        const uuid = uuidv4();

        const query = `
            INSERT OR REPLACE INTO user (
                uuid, name, firstSurname, secondSurname, username, email, password, 
                isManager, groupId, parentGroupId, leadPriorities, startDate, days, time
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            null, // parentGroupId
            '[]', // leadPriorities (JSON)
            null, // startDate
            null, // days
            null  // time
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
}

createTestUser().catch(console.error);