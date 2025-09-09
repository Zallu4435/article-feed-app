import { DataSource } from "typeorm";
import { User } from "../entities/User";
import { Article } from "../entities/Article";
import { Category } from "../entities/Category";
import { UserPreference } from "../entities/UserPreference";
import { RefreshToken } from "../entities/RefreshToken";
import { EmailVerification } from "../entities/EmailVerification";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  synchronize: process.env.NODE_ENV === "development",
  entities: [User, Article, Category, UserPreference, RefreshToken, EmailVerification],
  migrations: [],
  subscribers: [],
  extra: {
    max: Number(process.env.DB_POOL_MAX || 20),
    connectionTimeoutMillis: Number(process.env.DB_POOL_TIMEOUT || 30000),
    idleTimeoutMillis: 30000,
  },
  connectTimeoutMS: 30000,
  logging: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

export default AppDataSource;
