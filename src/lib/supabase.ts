import type { SupabaseConfig } from '@/types';

export const getSupabaseConfig = (): SupabaseConfig => {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing Supabase configuration. Check your environment variables.");
  }

  return {
    url,
    anonKey,
    serviceRoleKey,
  };
};

export const validateDatabaseUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === "postgresql:" && urlObj.hostname.includes("supabase.co");
  } catch {
    return false;
  }
};

export const getConnectionInfo = () => {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    return {
      status: "not_configured",
      message: "DATABASE_URL not set",
    };
  }

  if (validateDatabaseUrl(databaseUrl)) {
    return {
      status: "configured",
      message: "Supabase connection string is valid",
      isSupabase: true,
    };
  }

  return {
    status: "configured",
    message: "Database connection string is set",
    isSupabase: false,
  };
};
