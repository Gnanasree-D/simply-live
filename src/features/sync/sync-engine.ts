import { decryptJson, encryptJson } from "@/lib/crypto";
import { getLocalDb, type EntryRow, type GoalRow, type HabitRow, type HabitCategoryRow } from "@/lib/local-db";
import type { Session } from "./auth-context";

interface SyncBlob {
  entries: EntryRow[];
  goals: GoalRow[];
  habits: HabitRow[];
  habitCategories: HabitCategoryRow[];
}

interface ServerState {
  version: number;
  encryptedBlob: string | null;
}

async function authFetch(
  session: Session,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(path, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${session.token}`,
    },
  });
}

async function readAll(): Promise<SyncBlob> {
  const db = getLocalDb();
  const [entries, goals, habits, habitCategories] = await Promise.all([
    db.entries.toArray(),
    db.goals.toArray(),
    db.habits.toArray(),
    db.habitCategories.toArray(),
  ]);
  return { entries, goals, habits, habitCategories };
}

async function replaceAll(blob: SyncBlob): Promise<void> {
  const db = getLocalDb();
  await db.transaction(
    "rw",
    [db.entries, db.goals, db.habits, db.habitCategories],
    async () => {
      await Promise.all([
        db.entries.clear(),
        db.goals.clear(),
        db.habits.clear(),
        db.habitCategories.clear(),
      ]);
      await Promise.all([
        db.entries.bulkAdd(blob.entries),
        db.goals.bulkAdd(blob.goals),
        db.habits.bulkAdd(blob.habits),
        db.habitCategories.bulkAdd(blob.habitCategories),
      ]);
    },
  );
}

function reviveBlob(raw: SyncBlob): SyncBlob {
  // Dates JSON-roundtrip to strings; convert back.
  const toDate = (v: unknown): Date =>
    v instanceof Date ? v : new Date(v as string);
  return {
    entries: raw.entries.map((e) => ({
      ...e,
      createdAt: toDate(e.createdAt),
      updatedAt: toDate(e.updatedAt),
    })),
    goals: raw.goals.map((g) => ({
      ...g,
      createdAt: toDate(g.createdAt),
      updatedAt: toDate(g.updatedAt),
      targetDate: g.targetDate ? toDate(g.targetDate) : null,
    })),
    habits: raw.habits.map((h) => ({
      ...h,
      createdAt: toDate(h.createdAt),
      updatedAt: toDate(h.updatedAt),
    })),
    habitCategories: raw.habitCategories.map((c) => ({
      ...c,
      createdAt: toDate(c.createdAt),
      updatedAt: toDate(c.updatedAt),
    })),
  };
}

let lastKnownVersion = 0;

export async function pullState(session: Session): Promise<void> {
  const res = await authFetch(session, "/api/sync");
  if (!res.ok) throw new Error(`Pull failed (${res.status})`);
  const state = (await res.json()) as ServerState;
  lastKnownVersion = state.version;
  if (!state.encryptedBlob) return; // first-time login
  const decrypted = await decryptJson<SyncBlob>(
    state.encryptedBlob,
    session.key,
  );
  await replaceAll(reviveBlob(decrypted));
}

export async function pushState(session: Session): Promise<void> {
  const blob = await readAll();
  const encryptedBlob = await encryptJson(blob, session.key);
  const res = await authFetch(session, "/api/sync", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ encryptedBlob, ifVersion: lastKnownVersion }),
  });
  if (!res.ok) {
    // 409 = conflict (someone else pushed); re-pull then retry.
    if (res.status === 409) {
      await pullState(session);
      // Caller can re-trigger push if needed.
    }
    throw new Error(`Push failed (${res.status})`);
  }
  const updated = (await res.json()) as { version: number };
  lastKnownVersion = updated.version;
}

let debounceHandle: number | undefined;
let activeSession: Session | null = null;

/** Watch Dexie for mutations and push the encrypted blob after a quiet period. */
export function startSyncEngine(session: Session): () => void {
  activeSession = session;
  const db = getLocalDb();

  const onChange = () => {
    if (typeof window === "undefined") return;
    window.clearTimeout(debounceHandle);
    debounceHandle = window.setTimeout(async () => {
      if (!activeSession) return;
      try {
        await pushState(activeSession);
      } catch (err) {
        // Best-effort: log and keep going. Next mutation will retry.
        console.warn("[sync] push failed:", err);
      }
    }, 1500);
  };

  // Dexie 4: subscribe via per-table CRUD hooks.
  const tables = [db.entries, db.goals, db.habits, db.habitCategories];
  const unsubs: (() => void)[] = [];
  for (const t of tables) {
    const create = () => onChange();
    const update = () => onChange();
    const del = () => onChange();
    t.hook("creating", create);
    t.hook("updating", update);
    t.hook("deleting", del);
    unsubs.push(() => {
      t.hook("creating").unsubscribe(create);
      t.hook("updating").unsubscribe(update);
      t.hook("deleting").unsubscribe(del);
    });
  }

  return () => {
    activeSession = null;
    window.clearTimeout(debounceHandle);
    for (const u of unsubs) u();
  };
}
