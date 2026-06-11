// Prisma connectivity error codes: can't reach / timed out / connection closed.
const DB_UNREACHABLE_CODES = new Set([
  "P1000",
  "P1001",
  "P1002",
  "P1008",
  "P1017",
]);

export const DB_UNREACHABLE_MESSAGE =
  "Can't reach the database right now. Check your connection (a VPN or proxy may be blocking it) and try again.";

export function isDbUnreachable(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as { code: unknown }).code === "string" &&
    DB_UNREACHABLE_CODES.has((err as { code: string }).code)
  );
}
