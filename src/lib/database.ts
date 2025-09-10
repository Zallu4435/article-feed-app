import AppDataSource from "./datasource";
import "reflect-metadata";

let isInitializing = false;
let initializationPromise: Promise<any> | null = null;

export const initializeDatabase = async () => {

  if (isInitializing) {
    return initializationPromise;
  }

  if (AppDataSource.isInitialized) {
    return AppDataSource;
  }

  isInitializing = true;
  initializationPromise = AppDataSource.initialize()
    .then(() => {
      console.log("✅ Database connection established successfully");
      return AppDataSource;
    })
    .catch((error) => {
      console.error("❌ Error during database initialization:", error);
      throw error;
    })
    .finally(() => {
      isInitializing = false;
    });

  return initializationPromise;
};

export const getDatabase = () => {
  if (!AppDataSource.isInitialized) {
    throw new Error("Database not initialized. Call initializeDatabase() first.");
  }
  return AppDataSource;
};

export const closeDatabase = async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    console.log("🔌 Database connection closed");
  }
};

export const checkDatabaseHealth = async () => {
  try {
    const dataSource = getDatabase();
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.query("SELECT 1");
    await queryRunner.release();
    return { status: "healthy", timestamp: new Date().toISOString() };
  } catch (error) {
    return { 
      status: "unhealthy", 
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    };
  }
};

