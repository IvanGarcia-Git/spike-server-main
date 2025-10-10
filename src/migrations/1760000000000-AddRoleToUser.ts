import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddRoleToUser1760000000000 implements MigrationInterface {
    name = 'AddRoleToUser1760000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Agregar columna role a la tabla user
        await queryRunner.addColumn("user", new TableColumn({
            name: "role",
            type: "varchar",
            length: "50",
            default: "'colaborador'",
            isNullable: false
        }));

        // Actualizar usuarios existentes basándose en isManager
        // Admin: usuarios con isManager = true
        // Agente y Colaborador: usuarios con isManager = false (por defecto 'colaborador')
        await queryRunner.query(`
            UPDATE user
            SET role = CASE
                WHEN isManager = 1 THEN 'admin'
                ELSE 'colaborador'
            END
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("user", "role");
    }
}
