import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Load both .env and .env.local (Next.js convention). .env.local wins.
config({ path: ".env" });
config({ path: ".env.local", override: true });

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: { url },
});
