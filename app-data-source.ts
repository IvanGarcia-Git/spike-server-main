import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

export const dataSource = new DataSource({
  type: "mysql",
  host: process.env.HOST,
  port: 3306,
  username: process.env.MYSQL_USER,
  password: process.env.MYSQL_USER_PASSWORD,
  database: process.env.MYSQL_DB,
  entities: isProduction
    ? ["dist/src/models/*.entity.js"]
    : [__dirname + "/src/models/*.entity.ts"],
  connectTimeout: 6000,
  logging: false,
  synchronize: false,
  migrations: ["dist/src/migrations/**/*{.ts,.js}"],
  migrationsTableName: "migration",
});
