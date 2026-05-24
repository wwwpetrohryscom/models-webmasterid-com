import type { EvaluationPrompt } from "@/lib/evaluation-prompts";

/**
 * PromptEvaluationTable — renders the full set of evaluation prompts
 * with their purpose, prompt text, expected observation, failure
 * modes, and what-to-record fields. Each prompt is a card; the
 * prompt text itself is wrapped in <pre> so it can be copy-pasted
 * cleanly into the reader's own model harness.
 *
 * Server component, no client JS, no copy-to-clipboard scripts, no
 * live model runner.
 */
export function PromptEvaluationTable({
  prompts,
}: {
  prompts: EvaluationPrompt[];
}) {
  return (
    <ol className="space-y-4 not-prose">
      {prompts.map((p) => (
        <li
          key={p.id}
          className="card-surface space-y-3 p-5 text-sm"
        >
          <div className="flex flex-wrap items-baseline gap-2">
            <span
              aria-hidden="true"
              className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-primary"
            >
              {p.id}
            </span>
            <p className="text-base font-semibold text-foreground">
              {p.title}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Purpose
            </p>
            <p className="mt-1 text-muted-foreground">{p.purpose}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Prompt
            </p>
            <pre className="mt-1 max-h-72 overflow-auto rounded-lg border border-border bg-muted/40 p-3 text-xs leading-relaxed text-foreground">
              <code className="whitespace-pre-wrap">{p.prompt}</code>
            </pre>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Evaluation input, not production prompt. Copy into your
              own model harness; do not run live calls from this page.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Expected observation
            </p>
            <p className="mt-1 text-muted-foreground">
              {p.expectedObservation}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Failure looks like
            </p>
            <ul className="mt-1 ml-5 list-disc space-y-1 text-muted-foreground">
              {p.failureLooksLike.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              What to record
            </p>
            <ul className="mt-1 ml-5 list-disc space-y-1 text-muted-foreground">
              {p.whatToRecord.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        </li>
      ))}
    </ol>
  );
}
