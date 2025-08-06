// Mock authentication service para pruebas rápidas
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();

app.use(cors());
app.use(express.json());

// Usuario de prueba hardcodeado
const TEST_USER = {
    id: 1,
    uuid: 'test-user-uuid-12345',
    name: 'Usuario',
    firstSurname: 'Prueba',
    email: 'test@test.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: "123456"
    isManager: true,
    groupId: 1,
    userEmail: 'test@test.com',
    userUuid: 'test-user-uuid-12345',
    userId: 1
};

// Endpoint de login
app.post('/users/login', async (req, res) => {
    const { username, password } = req.body;
    
    console.log('Login attempt:', { username, password });
    
    // Verificar credenciales (acepta tanto email como username "admin")
    if ((username === 'test@test.com' || username === 'admin') && password === '123456') {
        const token = jwt.sign(
            {
                userId: TEST_USER.id,
                userEmail: TEST_USER.email,
                userUuid: TEST_USER.uuid,
                groupId: TEST_USER.groupId,
                isManager: TEST_USER.isManager
            },
            process.env.JWT_SECRET || '!7Kk1fQdfWWf5',
            { expiresIn: '24h' }
        );
        
        res.json({ jwt: token });
    } else {
        res.status(401).json({ error: 'Credenciales incorrectas' });
    }
});

// Mock endpoint para obtener usuario
app.get('/users/profile/:userId', (req, res) => {
    res.json(TEST_USER);
});

// Mock endpoint para notificaciones
app.get('/notifications', (req, res) => {
    res.json([]);
});

// Otros endpoints básicos que el frontend podría necesitar
app.get('/users/all', (req, res) => {
    res.json([TEST_USER]);
});

app.get('/users/visible-users', (req, res) => {
    res.json({ users: [TEST_USER] });
});

app.listen(3000, () => {
    console.log('🚀 Mock Auth Server running on http://localhost:3000');
    console.log('');
    console.log('=== CREDENCIALES DE PRUEBA ===');
    console.log('Usuario: admin (o test@test.com)');
    console.log('Contraseña: 123456');
    console.log('=============================');
    console.log('');
    console.log('Frontend: http://localhost:4000');
});

module.exports = app;