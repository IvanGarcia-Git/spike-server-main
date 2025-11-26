import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

export const dataSource = new DataSource({
  type: "sqlite",
  database: process.env.DB_PATH || "spikes.db",
  entities: isProduction
    ? ["dist/src/models/*.entity.js"]
    : [__dirname + "/src/models/*.entity.ts"],
  logging: false,
  synchronize: true,
  migrations: ["dist/src/migrations/**/*{.ts,.js}"],
  migrationsTableName: "migration",
});
