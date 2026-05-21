import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });
  const users = await db.user.findMany({
    select: { id: true, email: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  console.log(`Found ${users.length} user(s):`);
  for (const u of users) console.log(`  ${u.createdAt.toISOString()}  ${u.email}  (${u.id})`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
