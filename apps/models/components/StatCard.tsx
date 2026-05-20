export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  // Numeric / short values render large; narrative values (like the
  // canonical unverified-data label) shrink so the card height stays
  // even and the page still reads as a stats strip rather than mixed
  // prose.
  const isNarrative = value.length > 6;
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-card transition hover:border-primary/30 hover:shadow-elevated">
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-0.5 bg-accent-gradient opacity-70"
      />
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p
        className={
          isNarrative
            ? "mt-2 line-clamp-2 text-sm font-medium italic leading-snug text-muted-foreground"
            : "mt-2 text-3xl font-semibold tabular-nums leading-none tracking-tight text-foreground"
        }
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
