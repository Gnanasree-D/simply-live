import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signAuthToken } from "@/lib/auth-token";

const Body = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  const user = await db.user.findUnique({
    where: { email: parsed.email },
  });
  // Constant-ish-time: always run a bcrypt compare to avoid leaking
  // existence via response timing.
  const dummyHash =
    "$2b$12$00000000000000000000000000000000000000000000000000000";
  const ok = await bcrypt.compare(
    parsed.password,
    user?.passwordHash ?? dummyHash,
  );
  if (!user || !ok) {
    return NextResponse.json(
      { error: "Wrong email or password." },
      { status: 401 },
    );
  }

  const token = await signAuthToken({ userId: user.id, email: user.email });

  return NextResponse.json({
    token,
    email: user.email,
    kdfSalt: user.kdfSalt,
    recoverySalt: user.recoverySalt ?? "",
  });
}
