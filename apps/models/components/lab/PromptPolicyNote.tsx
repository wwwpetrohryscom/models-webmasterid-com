/**
 * PromptPolicyNote — the explicit "evaluation inputs, not production
 * prompts" callout shared across prompt-library surfaces. Server
 * component, no client JS.
 */
export function PromptPolicyNote() {
  return (
    <section
      aria-label="Prompt library policy"
      className="card-surface space-y-2 p-5 text-sm text-muted-foreground"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        Prompt library policy
      </p>
      <ul className="ml-5 list-disc space-y-1">
        <li>
          These are evaluation inputs, not production prompts. Do
          not paste them into a customer-facing system.
        </li>
        <li>
          No "best prompts" list. The library does not rank prompt
          quality and does not declare a winner.
        </li>
        <li>
          No live model calls on this page. Run prompts in your own
          harness, against your own keys, in your own environment.
        </li>
        <li>
          No guarantee of safety. A passing observation is evidence
          for a single moment in time, not a sign-off.
        </li>
        <li>
          No benchmark replacement. The library teaches structured
          observation; it does not publish numeric scores.
        </li>
        <li>
          No harmful or operational content. Prompts are generic and
          safe; sample text uses fictional names and values.
        </li>
      </ul>
    </section>
  );
}
