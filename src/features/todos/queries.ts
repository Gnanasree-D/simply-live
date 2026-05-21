import { getLocalDb } from "@/lib/local-db";
import type { TodoEntry } from "@/core/entry/schema";
import { materializeTodo } from "./mappers";

export interface ListTodosOpts {
  onlyOpen?: boolean;
  limit?: number;
}

export async function listTodos(
  opts: ListTodosOpts = {},
): Promise<TodoEntry[]> {
  const rows = await getLocalDb()
    .entries.where("kind")
    .equals("TODO")
    .toArray();
  rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const todos = (opts.limit ? rows.slice(0, opts.limit) : rows).map(
    materializeTodo,
  );
  return opts.onlyOpen ? todos.filter((t) => !t.done) : todos;
}
