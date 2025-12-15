import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from "typeorm";

export class AddRenewalFieldsToContract1765800000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn("contract", new TableColumn({
            name: "isRenewed",
            type: "boolean",
            default: false,
        }));

        await queryRunner.addColumn("contract", new TableColumn({
            name: "renewedToId",
            type: "int",
            isNullable: true,
        }));

        await queryRunner.createForeignKey("contract", new TableForeignKey({
            columnNames: ["renewedToId"],
            referencedColumnNames: ["id"],
            referencedTableName: "contract",
            onDelete: "SET NULL",
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("contract");
        const foreignKey = table?.foreignKeys.find(fk => fk.columnNames.indexOf("renewedToId") !== -1);
        if (foreignKey) {
            await queryRunner.dropForeignKey("contract", foreignKey);
        }
        await queryRunner.dropColumn("contract", "renewedToId");
        await queryRunner.dropColumn("contract", "isRenewed");
    }

}
