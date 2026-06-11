/** One tap logs a standard glass of water. */
export const GLASS_ML = 250;

/**
 * Read a water entry's volume in ml. New entries store `ml`; legacy entries
 * stored `cups` (1 cup = one glass), so fall back by converting on read.
 */
export function readWaterMl(data: { ml?: number; cups?: number }): number {
  if (typeof data.ml === "number") return data.ml;
  if (typeof data.cups === "number") return data.cups * GLASS_ML;
  return 0;
}
