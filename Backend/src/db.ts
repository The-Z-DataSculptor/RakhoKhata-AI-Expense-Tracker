import "dotenv/config";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
// 👇 Point this import to the exact client directory built by Prisma 7
import { PrismaClient } from "../prisma/generated/client"; 

// 1. Initialize the raw PostgreSQL connection pool instance
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// 2. Pass the pool instance into Prisma's native v7 driver adapter
const adapter = new PrismaPg(pool);

// 3. Instantiate the global single client instance using the adapter
const prisma = new PrismaClient({ adapter });

export { prisma };