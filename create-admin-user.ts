import { dataSource } from './app-data-source';
import { User } from './src/models/user.entity';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

async function createAdminUser() {
    try {
        console.log('🔄 Inicializando conexión a la base de datos...');
        await dataSource.initialize();
        console.log('✅ Conexión establecida y tablas creadas');

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
        
    } catch (error: any) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
            console.log('✅ Conexión cerrada');
        }
    }
}

// Ejecutar el script
createAdminUser().catch(console.error);