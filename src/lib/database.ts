import prisma from "./prisma";

let isInitializing = false;
let initializationPromise: Promise<typeof prisma> | null = null;

export const initializeDatabase = async () => {
  if (isInitializing) {
    return initializationPromise;
  }

  isInitializing = true;
  initializationPromise = prisma
    .$queryRawUnsafe("SELECT 1")
    .then(() => {
      console.log("✅ Database connection validated successfully");
      return prisma;
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

export const getDatabase = () => prisma;

export const closeDatabase = async () => {
  await prisma.$disconnect();
  console.log("🔌 Database connection closed");
};

export const checkDatabaseHealth = async () => {
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    return { status: "healthy", timestamp: new Date().toISOString() };
  } catch (error) {
    return {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    };
  }
};

