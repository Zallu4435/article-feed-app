import dotenv from "dotenv";
import dns from "dns";
import AppDataSource from "./src/lib/datasource";

// Load environment variables for CLI usage
dotenv.config({ path: ".env.local" });
dotenv.config();

// Prefer IPv4 resolution
if ((dns as any).setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

export { AppDataSource };
