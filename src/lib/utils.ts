export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function initials(name: string): string {
  return name.split(/\s+/).filter((w) => /^[A-Za-z]/.test(w)).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

export function money(n: number): string {
  return `$${n.toLocaleString("en-CA", { maximumFractionDigits: 0 })}`;
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}
