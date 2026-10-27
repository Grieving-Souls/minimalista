const PALETTE = [
  { bg: "#E8D5C4", fg: "#5C3A22" },
  { bg: "#D5E3D6", fg: "#2A4A32" },
  { bg: "#D6DCEC", fg: "#2A3558" },
  { bg: "#E9D4D2", fg: "#5C2E2A" },
  { bg: "#E6E1C8", fg: "#4A4620" },
  { bg: "#D4E2E6", fg: "#2A444C" },
  { bg: "#E5D8E8", fg: "#4A2E52" },
  { bg: "#E8DCC0", fg: "#5C4A22" },
] as const;

export function avatarColor(domain: string): { bg: string; fg: string } {
  let h = 0;
  for (let i = 0; i < domain.length; i++) {
    h = (h * 31 + domain.charCodeAt(i)) >>> 0;
  }
  return PALETTE[h % PALETTE.length];
}

export function avatarLetter(domain: string): string {
  const ch = domain.replace(/^www\./i, "").charAt(0);
  return (ch || "?").toUpperCase();
}
