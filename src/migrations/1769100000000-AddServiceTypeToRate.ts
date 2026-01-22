import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddServiceTypeToRate1769100000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Verificar si la columna ya existe (por si synchronize:true ya la creó)
        const table = await queryRunner.getTable("rate");
        const hasServiceType = table?.columns.find(col => col.name === "serviceType");

        if (!hasServiceType) {
            await queryRunner.addColumn("rate", new TableColumn({
                name: "serviceType",
                type: "varchar",
                length: "20",
                isNullable: true,
            }));
        }

        // Migrar datos: copiar company.type a rate.serviceType
        // Solo para rates que aún no tienen serviceType definido
        await queryRunner.query(`
            UPDATE rate r
            JOIN company c ON r.companyId = c.id
            SET r.serviceType = c.type
            WHERE r.serviceType IS NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No eliminamos la columna en down para evitar pérdida de datos
        // Solo limpiamos los datos migrados si es necesario
        // await queryRunner.dropColumn("rate", "serviceType");
    }

}
