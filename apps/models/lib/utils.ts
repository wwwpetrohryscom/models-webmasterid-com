export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDateISO(iso: string | null | undefined): string {
  if (!iso) return "Data not yet verified.";
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return "Data not yet verified.";
  }
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "Data not yet verified.";
  try {
    const then = new Date(iso).getTime();
    const now = Date.now();
    const diffMs = now - then;
    const minutes = Math.round(diffMs / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} h ago`;
    const days = Math.round(hours / 24);
    return `${days} d ago`;
  } catch {
    return "Data not yet verified.";
  }
}

export function formatUsd(value: number | null | undefined): string {
  if (value === null || value === undefined) return "Data not yet verified.";
  if (value === 0) return "Free";
  if (value < 0.01) {
    return `$${value.toFixed(4)}`;
  }
  return `$${value.toFixed(2)}`;
}

export function unknownLabel(): string {
  return "Data not yet verified.";
}
