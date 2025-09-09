import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateNoteTable1757405214527 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`note\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`uuid\` varchar(36) NOT NULL DEFAULT (uuid()),
                \`title\` varchar(255) NOT NULL,
                \`content\` text NOT NULL,
                \`isFavorite\` tinyint NOT NULL DEFAULT 0,
                \`folderId\` varchar(255) NULL,
                \`userId\` int NOT NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`),
                INDEX \`IDX_note_userId\` (\`userId\`),
                INDEX \`IDX_note_folderId\` (\`folderId\`),
                CONSTRAINT \`FK_note_user\` FOREIGN KEY (\`userId\`) REFERENCES \`user\` (\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
            ) ENGINE=InnoDB
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS \`note\``);
    }

}
