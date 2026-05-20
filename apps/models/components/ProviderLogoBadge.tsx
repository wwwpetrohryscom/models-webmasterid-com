const PALETTE: Record<string, string> = {
  openai: "from-emerald-500 to-teal-500",
  anthropic: "from-orange-500 to-amber-500",
  google: "from-blue-500 to-indigo-500",
  meta: "from-blue-600 to-sky-500",
  mistral: "from-rose-500 to-orange-500",
  deepseek: "from-violet-500 to-indigo-500",
  groq: "from-zinc-700 to-zinc-500",
  "together-ai": "from-fuchsia-500 to-pink-500",
};

export function ProviderLogoBadge({
  slug,
  name,
  size = "md",
}: {
  slug: string;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const palette = PALETTE[slug] ?? "from-slate-500 to-slate-400";
  const sizeClasses =
    size === "sm"
      ? "h-6 w-6 text-[10px]"
      : size === "lg"
        ? "h-10 w-10 text-sm"
        : "h-8 w-8 text-xs";
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      aria-hidden="true"
      className={`grid place-items-center rounded-lg bg-gradient-to-br font-semibold text-white ${palette} ${sizeClasses}`}
    >
      {initials}
    </span>
  );
}
