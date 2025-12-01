import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

export const dataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  username: process.env.DB_USERNAME || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_DATABASE || "spikes",
  entities: isProduction
    ? ["dist/src/models/*.entity.js"]
    : [__dirname + "/src/models/*.entity.ts"],
  logging: false,
  synchronize: true,
  migrations: ["dist/src/migrations/**/*{.ts,.js}"],
  migrationsTableName: "migration",
  charset: "utf8mb4",
});
