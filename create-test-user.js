// Script simple para crear un usuario de prueba
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function createTestUser() {
    try {
        // Conectar a MySQL
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'password',
            database: 'spikes_db'
        });

        console.log('Conectado a MySQL');

        // Crear la base de datos si no existe
        await connection.execute('CREATE DATABASE IF NOT EXISTS spikes_db');
        await connection.execute('USE spikes_db');

        // Crear tabla de usuarios básica
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                uuid VARCHAR(36) NOT NULL UNIQUE,
                name VARCHAR(255) NOT NULL,
                firstSurname VARCHAR(255),
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                isManager BOOLEAN DEFAULT FALSE,
                groupId INT DEFAULT 1,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Crear usuario de prueba
        const hashedPassword = await bcrypt.hash('123456', 10);
        const uuid = 'test-user-uuid-12345';

        await connection.execute(`
            INSERT IGNORE INTO users (uuid, name, firstSurname, email, password, isManager, groupId)
            VALUES (?, 'Usuario', 'Prueba', 'test@test.com', ?, true, 1)
        `, [uuid, hashedPassword]);

        console.log('Usuario de prueba creado:');
        console.log('Email: test@test.com');
        console.log('Password: 123456');
        console.log('Es Manager: true');
        console.log('GroupId: 1 (Super Admin)');

        await connection.end();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

createTestUser();