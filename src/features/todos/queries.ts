import "server-only";
import { db } from "@/lib/db";
import type { TodoEntry } from "@/core/entry/schema";
import { materializeTodo } from "./mappers";

export interface ListTodosOpts {
  onlyOpen?: boolean;
  limit?: number;
}

export async function listTodos(
  userId: string,
  opts: ListTodosOpts = {},
): Promise<TodoEntry[]> {
  const rows = await db.entry.findMany({
    where: { userId, kind: "TODO" },
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 200,
  });
  const todos = rows.map(materializeTodo);
  return opts.onlyOpen ? todos.filter((t) => !t.done) : todos;
}
