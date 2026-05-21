/** Server-side ID generator. Uses crypto.randomUUID() (Node 19+). */
export function genId(): string {
  return crypto.randomUUID();
}
