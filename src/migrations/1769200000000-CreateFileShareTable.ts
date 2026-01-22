import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class CreateFileShareTable1769200000000 implements MigrationInterface {
    name = 'CreateFileShareTable1769200000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "file_share",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment",
                    },
                    {
                        name: "fileId",
                        type: "int",
                    },
                    {
                        name: "sharedByUserId",
                        type: "int",
                    },
                    {
                        name: "sharedWithUserId",
                        type: "int",
                    },
                    {
                        name: "permission",
                        type: "varchar",
                        length: "10",
                        default: "'read'",
                    },
                    {
                        name: "createdAt",
                        type: "datetime",
                        default: "CURRENT_TIMESTAMP",
                    },
                ],
            }),
            true
        );

        // Índice único para evitar duplicados
        await queryRunner.createIndex(
            "file_share",
            new TableIndex({
                name: "IDX_FILE_SHARE_UNIQUE",
                columnNames: ["fileId", "sharedWithUserId"],
                isUnique: true,
            })
        );

        // Foreign keys
        await queryRunner.createForeignKey(
            "file_share",
            new TableForeignKey({
                columnNames: ["fileId"],
                referencedColumnNames: ["id"],
                referencedTableName: "file",
                onDelete: "CASCADE",
            })
        );

        await queryRunner.createForeignKey(
            "file_share",
            new TableForeignKey({
                columnNames: ["sharedByUserId"],
                referencedColumnNames: ["id"],
                referencedTableName: "user",
                onDelete: "CASCADE",
            })
        );

        await queryRunner.createForeignKey(
            "file_share",
            new TableForeignKey({
                columnNames: ["sharedWithUserId"],
                referencedColumnNames: ["id"],
                referencedTableName: "user",
                onDelete: "CASCADE",
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("file_share");

        if (table) {
            // Eliminar foreign keys
            const foreignKeys = table.foreignKeys;
            for (const fk of foreignKeys) {
                await queryRunner.dropForeignKey("file_share", fk);
            }
        }

        await queryRunner.dropTable("file_share");
    }
}
