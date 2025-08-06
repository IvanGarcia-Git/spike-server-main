const { DataSource } = require('typeorm');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Configuración de la base de datos (similar a app-data-source.ts)
const dataSource = new DataSource({
    type: "sqlite",
    database: "spikes.db",
    entities: ["src/models/*.entity.ts"],
    synchronize: true, // Esto creará las tablas automáticamente
    logging: true
});

async function createAdminUser() {
    try {
        console.log('🔄 Inicializando conexión a la base de datos...');
        await dataSource.initialize();
        console.log('✅ Conexión establecida y tablas creadas');

        // Importar el modelo User
        const { User } = require('./src/models/user.entity.ts');
        const userRepository = dataSource.getRepository(User);

        // Verificar si ya existe un usuario administrador
        const existingAdmin = await userRepository.findOne({
            where: { username: 'admin' }
        });

        if (existingAdmin) {
            console.log('⚠️  El usuario administrador ya existe:');
            console.log('📧 Email:', existingAdmin.email);
            console.log('👤 Username:', existingAdmin.username);
            console.log('👑 Super Admin: Sí');
            return;
        }

        // Crear nuevo usuario administrador
        const password = bcrypt.hashSync('123456', 10);
        
        const adminUser = userRepository.create({
            uuid: uuidv4(),
            name: 'Admin',
            firstSurname: 'Usuario',
            secondSurname: 'Prueba',
            username: 'admin',
            email: 'test@test.com',
            password: password,
            isManager: true,
            groupId: 1, // Super Admin
            parentGroupId: null,
            leadPriorities: []
        });

        await userRepository.save(adminUser);

        console.log('🎉 ¡Usuario administrador creado exitosamente!');
        console.log('📧 Email: test@test.com');
        console.log('👤 Username: admin');
        console.log('🔑 Password: 123456');
        console.log('👑 Super Admin: Sí (groupId: 1)');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        
        // Si hay error de importación, usar SQL directo
        if (error.message.includes('Cannot resolve')) {
            console.log('🔄 Intentando con SQL directo...');
            await createUserWithSQL();
        }
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
            console.log('✅ Conexión cerrada');
        }
    }
}

async function createUserWithSQL() {
    try {
        const password = bcrypt.hashSync('123456', 10);
        const uuid = uuidv4();

        const query = `
            INSERT OR REPLACE INTO user (
                uuid, name, firstSurname, secondSurname, username, email, password, 
                isManager, groupId, parentGroupId, leadPriorities
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            '[]' // leadPriorities (JSON)
        ];

        await dataSource.query(query, values);
        
        console.log('🎉 ¡Usuario administrador creado exitosamente con SQL!');
        console.log('📧 Email: test@test.com');
        console.log('👤 Username: admin');
        console.log('🔑 Password: 123456');
        console.log('👑 Super Admin: Sí (groupId: 1)');
        
    } catch (error) {
        console.error('❌ Error creando usuario con SQL:', error.message);
    }
}

// Ejecutar el script
createAdminUser().catch(console.error);