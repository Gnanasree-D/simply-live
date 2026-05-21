import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-token";

export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if ("error" in auth) return auth.error;

  const state = await db.syncState.findUnique({
    where: { userId: auth.userId },
  });
  return NextResponse.json({
    version: state?.version ?? 0,
    encryptedBlob: state?.encryptedBlob ?? null,
    updatedAt: state?.updatedAt?.toISOString() ?? null,
  });
}

const PutBody = z.object({
  encryptedBlob: z.string().min(1).max(20_000_000),
  /** The version the client read when it started this update. */
  ifVersion: z.number().int().min(0),
});

export async function PUT(req: Request) {
  const auth = await requireAuth(req);
  if ("error" in auth) return auth.error;

  let parsed;
  try {
    parsed = PutBody.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid sync body" }, { status: 400 });
  }

  const current = await db.syncState.findUnique({
    where: { userId: auth.userId },
    select: { version: true },
  });
  const currentVersion = current?.version ?? 0;

  if (parsed.ifVersion !== currentVersion) {
    return NextResponse.json(
      {
        error: "Sync conflict — server is at a newer version.",
        serverVersion: currentVersion,
      },
      { status: 409 },
    );
  }

  const updated = await db.syncState.upsert({
    where: { userId: auth.userId },
    create: {
      userId: auth.userId,
      encryptedBlob: parsed.encryptedBlob,
      version: 1,
    },
    update: {
      encryptedBlob: parsed.encryptedBlob,
      version: { increment: 1 },
    },
    select: { version: true, updatedAt: true },
  });

  return NextResponse.json({
    version: updated.version,
    updatedAt: updated.updatedAt.toISOString(),
  });
}
