import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddSoftDeleteToFile1769018944359 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Verificar y agregar columna deletedAt si no existe
        const fileTable = await queryRunner.getTable("file");

        if (fileTable && !fileTable.findColumnByName("deletedAt")) {
            await queryRunner.addColumn(
                "file",
                new TableColumn({
                    name: "deletedAt",
                    type: "datetime",
                    isNullable: true,
                    default: null,
                })
            );
        }

        if (fileTable && !fileTable.findColumnByName("destacado")) {
            await queryRunner.addColumn(
                "file",
                new TableColumn({
                    name: "destacado",
                    type: "boolean",
                    default: false,
                })
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const fileTable = await queryRunner.getTable("file");

        if (fileTable && fileTable.findColumnByName("deletedAt")) {
            await queryRunner.dropColumn("file", "deletedAt");
        }

        if (fileTable && fileTable.findColumnByName("destacado")) {
            await queryRunner.dropColumn("file", "destacado");
        }
    }
}
