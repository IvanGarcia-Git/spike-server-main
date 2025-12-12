import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class MakeTaskStartDateNullable1765000000000 implements MigrationInterface {
    name = 'MakeTaskStartDateNullable1765000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Make startDate column nullable in task table
        // This migration uses TypeORM's changeColumn which works with both MySQL and SQLite
        const table = await queryRunner.getTable("task");
        if (table) {
            const startDateColumn = table.findColumnByName("startDate");
            if (startDateColumn && !startDateColumn.isNullable) {
                await queryRunner.changeColumn("task", "startDate", new TableColumn({
                    name: "startDate",
                    type: startDateColumn.type,
                    isNullable: true
                }));
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert: make startDate NOT NULL (setting existing NULL values to current time first)
        const isSqlite = queryRunner.connection.options.type === "sqljs" ||
                         queryRunner.connection.options.type === "sqlite";

        if (isSqlite) {
            await queryRunner.query(`UPDATE task SET startDate = datetime('now') WHERE startDate IS NULL`);
        } else {
            await queryRunner.query(`UPDATE task SET startDate = NOW() WHERE startDate IS NULL`);
        }

        const table = await queryRunner.getTable("task");
        if (table) {
            const startDateColumn = table.findColumnByName("startDate");
            if (startDateColumn) {
                await queryRunner.changeColumn("task", "startDate", new TableColumn({
                    name: "startDate",
                    type: startDateColumn.type,
                    isNullable: false
                }));
            }
        }
    }
}
