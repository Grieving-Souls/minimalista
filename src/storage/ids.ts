/** Random UUID-style ids — never sequential (merge/sync safety). */

export function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
    const n = (Math.random() * 16) | 0;
    const v = ch === "x" ? n : (n & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function nextOrder(items: { order: number }[]): number {
  return items.reduce((max, item) => Math.max(max, item.order), -1) + 1;
}
