import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddIssuerFiscalDataToUser1765737699176 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn("user", new TableColumn({
            name: "issuerBusinessName",
            type: "varchar",
            length: "255",
            isNullable: true,
        }));

        await queryRunner.addColumn("user", new TableColumn({
            name: "issuerNif",
            type: "varchar",
            length: "20",
            isNullable: true,
        }));

        await queryRunner.addColumn("user", new TableColumn({
            name: "issuerAddress",
            type: "varchar",
            length: "255",
            isNullable: true,
        }));

        await queryRunner.addColumn("user", new TableColumn({
            name: "issuerCity",
            type: "varchar",
            length: "100",
            isNullable: true,
        }));

        await queryRunner.addColumn("user", new TableColumn({
            name: "issuerPostalCode",
            type: "varchar",
            length: "10",
            isNullable: true,
        }));

        await queryRunner.addColumn("user", new TableColumn({
            name: "issuerCountry",
            type: "varchar",
            length: "50",
            isNullable: true,
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("user", "issuerBusinessName");
        await queryRunner.dropColumn("user", "issuerNif");
        await queryRunner.dropColumn("user", "issuerAddress");
        await queryRunner.dropColumn("user", "issuerCity");
        await queryRunner.dropColumn("user", "issuerPostalCode");
        await queryRunner.dropColumn("user", "issuerCountry");
    }

}
