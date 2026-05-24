/**
 * AI Usage Lab — playbooks + templates (Sprint 31).
 *
 * The lab extends the curriculum from Learn → Apply → Verify into
 * Learn → Apply → Verify → Test. Each playbook is a testing recipe
 * the reader runs themselves before integrating a model; each
 * template is a paste-ready Markdown planning document.
 *
 * Discipline:
 *   - Playbooks teach how to test, never which model is best.
 *   - Templates are generic planning tools, not safety guarantees.
 *   - No scoring, no ranking, no benchmark publishing, no
 *     production-readiness claims, no compliance certification.
 *   - Pure local data — no fetch, no Date.now, no secrets.
 */

export type LabPlaybookSlug =
  | "prompt-testing-basics"
  | "structured-output-testing"
  | "long-context-testing"
  | "multimodal-input-testing"
  | "automation-workflow-testing"
  | "model-regression-testing";

export type LabTemplateSlug =
  | "model-evaluation-plan"
  | "prompt-test-matrix"
  | "automation-risk-checklist";

export type LabPlaybookDifficulty = "beginner" | "intermediate";

export interface LabPlaybookRoute {
  label: string;
  href: string;
}

export interface LabObservationRubricRow {
  dimension: string;
  whatToLookFor: string;
  whatToRecord: string;
}

export interface LabPlaybook {
  slug: LabPlaybookSlug;
  title: string;
  summary: string;
  difficulty: LabPlaybookDifficulty;
  estimatedMinutes: number;
  goal: string;
  whenToUse: string[];
  prerequisites: LabPlaybookRoute[];
  testSetup: string[];
  minimumTestSet: string[];
  promptVariants: string[];
  observationsToRecord: string[];
  failureModes: string[];
  stopConditions: string[];
  outputs: string[];
  relatedTemplates: LabTemplateSlug[];
  relatedRoutes: LabPlaybookRoute[];
  policyNote: string;
  /** Sprint 34 — an example of how NOT to run this test. */
  weakTestExample?: string[];
  /** Sprint 34 — an example of a stronger version of the same test. */
  strongerTestExample?: string[];
  /** Sprint 34 — observation rubric with no scoring or rating language. */
  observationRubric?: LabObservationRubricRow[];
  /** Sprint 34 — what to capture in the decision brief afterwards. */
  briefNote?: string[];
}

export interface LabTemplateSection {
  title: string;
  body: string[];
}

export interface LabTemplate {
  slug: LabTemplateSlug;
  title: string;
  summary: string;
  format: "markdown";
  sections: LabTemplateSection[];
  policyNote: string;
}

// ---------------------------------------------------------------------------
// Playbooks. Each one is a checklist-driven testing recipe — generic
// enough to use against any candidate model, specific enough to be
// useful before integration.
// ---------------------------------------------------------------------------

const PLAYBOOKS: LabPlaybook[] = [
  {
    slug: "prompt-testing-basics",
    title: "Prompt testing basics",
    summary:
      "The minimum prompt-testing routine to run against a shortlisted model before integration. Defines a representative prompt set, structured observations, and concrete failure modes — no benchmark scores.",
    difficulty: "beginner",
    estimatedMinutes: 25,
    goal: "Decide whether a shortlisted model passes your own prompt rubric before you wire it into anything.",
    whenToUse: [
      "You have 1–4 candidate models from the selection workspace and need to compare them on your own prompts.",
      "You want a repeatable testing routine that does not depend on published benchmark scores.",
      "You need an evidence trail your reviewer can read independently.",
    ],
    prerequisites: [
      { label: "/learn/how-to-choose-ai-model", href: "/learn/how-to-choose-ai-model" },
      { label: "/learn/testing-ai-models", href: "/learn/testing-ai-models" },
      {
        label: "A shortlist URL from /select",
        href: "/select",
      },
    ],
    testSetup: [
      "Open the candidate models in tabs and confirm each one is in an active lifecycle state.",
      "Pick the inference region you will use in production — run tests from that region whenever possible.",
      "Set a fixed system prompt for the suite so prompt variance does not contaminate model variance.",
      "Decide ahead of time which sampling parameters (temperature, top_p, max_tokens) you will hold constant.",
    ],
    minimumTestSet: [
      "5–10 representative prompts drawn from your real workload (or close stand-ins).",
      "At least one happy-path prompt, one edge-case prompt, and one adversarial prompt per category you ship.",
      "A short rubric per prompt that names the acceptance criteria — not a numeric score.",
    ],
    promptVariants: [
      "Same prompt, three temperatures (for example 0.0, 0.3, 0.7) to see how the model behaves under sampling.",
      "Same prompt, varied system prompt length to surface instruction-following degradation.",
      "Same prompt, with and without retrieved context to see how the model handles RAG noise.",
    ],
    observationsToRecord: [
      "Pass / fail against each acceptance criterion, with a short rationale.",
      "Wall-clock latency from your environment for each call (note the region you ran from).",
      "Input + output token counts so you can project cost from the pricing reference.",
      "Refusal rate and any structured-output validity failures.",
    ],
    failureModes: [
      "Model passes the happy path but fails on adversarial input — typical when the candidate model lags on safety training.",
      "Model passes single-shot but degrades when you chain prompts.",
      "Structured output is valid JSON but does not match your schema constraints.",
      "Latency spikes mid-suite — confirm whether it is the model, the region, or your retry strategy.",
    ],
    stopConditions: [
      "Stop and re-scope if a candidate fails on more than one happy-path prompt — the catalogue's verified fields say nothing about prompt-level reliability.",
      "Stop and request reverification if the model's lifecycle field shifts to deprecated during the run.",
      "Stop and document if you cannot replicate a result twice in a row — non-determinism is itself evidence.",
    ],
    outputs: [
      "A Markdown evidence brief listing acceptance results per prompt per model.",
      "A short note attached to your /briefs/build export naming which prompts you actually ran.",
    ],
    relatedTemplates: ["prompt-test-matrix", "model-evaluation-plan"],
    relatedRoutes: [
      { label: "Evaluation prompt library", href: "/lab/prompts" },
      { label: "Decision brief builder", href: "/briefs/build" },
      { label: "Reverification queue", href: "/reverification" },
      { label: "Citation registry", href: "/sources" },
    ],
    policyNote:
      "The playbook teaches you to test. It does not score the model for you, does not certify the model for any regulatory regime, and does not declare a winner.",
    weakTestExample: [
      "Run one happy-path prompt at default temperature, eyeball the output, and ship.",
      "Skip recording outputs verbatim.",
      "Pretend a single positive result generalises across prompt categories.",
    ],
    strongerTestExample: [
      "Run 5–10 representative prompts spanning happy / edge / adversarial / refusal categories.",
      "Hold sampling parameters constant and record the values.",
      "Capture every output verbatim before applying acceptance criteria.",
      "Note non-determinism across reruns instead of hiding it.",
    ],
    observationRubric: [
      {
        dimension: "Acceptance against rubric",
        whatToLookFor:
          "Does the output meet the pre-agreed acceptance criteria for the prompt category?",
        whatToRecord:
          "Pass / fail per criterion, with a short rationale — not a numeric score.",
      },
      {
        dimension: "Latency",
        whatToLookFor:
          "Wall-clock latency from your environment for each call.",
        whatToRecord:
          "Median and tail latency per prompt, with the region you ran from.",
      },
      {
        dimension: "Token usage",
        whatToLookFor:
          "Input vs output token counts per call.",
        whatToRecord:
          "Counts per prompt, so the cost projection later can use the pricing reference.",
      },
      {
        dimension: "Refusal / structured failure",
        whatToLookFor:
          "Refusal rate and any structured-output validity failures.",
        whatToRecord:
          "Counts per category plus a short note on why each failure happened.",
      },
    ],
    briefNote: [
      "Embed the prompt set + acceptance criteria so the brief is self-contained.",
      "Record per-prompt outcomes instead of a single rolled-up percentage.",
      "Attach the verbatim outputs for failures so the reviewer can replay them.",
      "Note any prompts that triggered the stop condition and why.",
    ],
  },
  {
    slug: "structured-output-testing",
    title: "Structured output testing",
    summary:
      "How to validate JSON mode, structured output, and tool calls against your real schema before depending on the model in a pipeline.",
    difficulty: "intermediate",
    estimatedMinutes: 30,
    goal: "Confirm a candidate model produces schema-conformant output reliably enough for the parser downstream.",
    whenToUse: [
      "You are wiring the model into an automation that depends on a fixed schema.",
      "You have read the structured-output lesson and need to validate the verified feature claim against your own schema.",
      "You need to compare two candidates on schema reliability without ranking them on a generic benchmark.",
    ],
    prerequisites: [
      { label: "/learn/structured-output", href: "/learn/structured-output" },
      { label: "/learn/testing-ai-models", href: "/learn/testing-ai-models" },
      {
        label: "A real schema (JSON Schema or function/tool definition)",
        href: "/learn/structured-output",
      },
    ],
    testSetup: [
      "Choose the structured-generation surface that matches your candidate (JSON mode, structured output, tool calling).",
      "Pin your schema in a file — every run uses the exact same schema bytes.",
      "Pick a strict validator (Ajv, Pydantic, zod, your own) and run validation on every response.",
      "Capture the raw response before validation so you can replay failures.",
    ],
    minimumTestSet: [
      "10–20 prompts covering the schema's common, edge, and adversarial shapes.",
      "A prompt that asks the model to refuse — verify refusal still emits valid schema if your contract requires it.",
      "A prompt with conflicting instructions — verify the model picks one shape rather than emitting hybrid output.",
    ],
    promptVariants: [
      "Same prompt, schema field reordering, to surface ordering-dependent failures.",
      "Same prompt, schema with optional fields removed, to confirm the model does not invent values.",
      "Same prompt, low and high temperature, to measure schema reliability under sampling.",
    ],
    observationsToRecord: [
      "Schema validity rate per candidate, per prompt category.",
      "Field-level failure modes (missing fields, extra fields, type mismatch, enum violation).",
      "Latency overhead of structured generation vs free-form generation for the same prompt.",
      "How the candidate behaves when the schema is malformed (does it refuse, hallucinate, or hang?).",
    ],
    failureModes: [
      "Model emits valid JSON that fails enum validation — likely tokenizer or alignment issue.",
      "Model adds extra fields the schema disallows — common with newer snapshots.",
      "Model truncates output mid-structure when max_tokens is hit.",
      "Tool-call surface returns arguments as strings when the schema requires numbers.",
    ],
    stopConditions: [
      "Stop and re-scope if schema validity drops below your acceptance threshold across happy-path prompts.",
      "Stop and document if the same schema fails on one candidate and passes on another — that is selection evidence, not a recommendation.",
    ],
    outputs: [
      "A Markdown evidence brief listing per-prompt validity for each candidate.",
      "The exact schema bytes used in the suite, attached for reproducibility.",
    ],
    relatedTemplates: ["prompt-test-matrix", "model-evaluation-plan"],
    relatedRoutes: [
      { label: "Comparison builder", href: "/compare/build" },
      { label: "Decision brief builder", href: "/briefs/build" },
    ],
    policyNote:
      "Schema validity is workload-specific. The playbook does not validate your schema for compliance or safety, and does not declare which model is best for structured generation.",
    weakTestExample: [
      "Eyeball one JSON response and declare the integration ready.",
      "Skip running every response through a strict validator.",
      "Vary the schema, the prompt, and the sampling parameters all at once and call the result a single test.",
    ],
    strongerTestExample: [
      "Pin the exact schema bytes and reuse them across every run.",
      "Run a strict validator (Ajv / Pydantic / zod) on every response before logging.",
      "Vary one dimension at a time so failures attribute to a single change.",
      "Capture raw responses pre-validation so failures replay deterministically.",
    ],
    observationRubric: [
      {
        dimension: "Schema validity",
        whatToLookFor:
          "Whether the response passes a strict validator against your real schema.",
        whatToRecord:
          "Pass / fail per prompt with the raw response captured alongside.",
      },
      {
        dimension: "Field-level failure mode",
        whatToLookFor:
          "Missing fields, extra fields, type mismatches, enum violations.",
        whatToRecord:
          "Per-prompt failure category and an example excerpt.",
      },
      {
        dimension: "Latency overhead",
        whatToLookFor:
          "Latency delta between structured and free-form generation for the same prompt.",
        whatToRecord:
          "Median delta per prompt category in milliseconds.",
      },
      {
        dimension: "Behaviour under malformed schema",
        whatToLookFor:
          "Does the model refuse, hallucinate, or hang when handed a malformed schema?",
        whatToRecord:
          "Per-case observation with the malformed input captured.",
      },
    ],
    briefNote: [
      "Attach the schema bytes so the brief is reproducible.",
      "Record validity rate per prompt category, not as a single percentage.",
      "List field-level failure modes the parser would have to absorb.",
      "Capture latency overhead so the reviewer knows what structured generation costs.",
    ],
  },
  {
    slug: "long-context-testing",
    title: "Long-context testing",
    summary:
      "How to test long-prompt behaviour past the catalogue's verified context window — recall, instruction adherence, and cost growth — without trusting a marketing number.",
    difficulty: "intermediate",
    estimatedMinutes: 35,
    goal: "Decide whether a candidate model holds up at the prompt size your real workload sends.",
    whenToUse: [
      "Your prompts plus retrieved context plus expected output approach the verified context window.",
      "You need to understand cost growth at large prompt sizes before committing.",
      "You suspect the model's effective context is smaller than its advertised context.",
    ],
    prerequisites: [
      { label: "/learn/context-window", href: "/learn/context-window" },
      { label: "/learn/pricing-references", href: "/learn/pricing-references" },
      {
        label: "A shortlist filtered by verified context window",
        href: "/select",
      },
    ],
    testSetup: [
      "Build a prompt scaffold that lets you append filler tokens to grow the prompt without changing the question.",
      "Pin a deterministic token counter so prompt sizes are comparable across runs.",
      "Capture per-call latency separately from any RAG retrieval latency.",
      "Have the pricing reference and unit semantics open so cost projections stay honest.",
    ],
    minimumTestSet: [
      "The same question asked at 4k / 32k / 128k / 256k+ token prompt sizes (cap at the verified context window).",
      "A recall-style prompt where the answer is buried at start, middle, and end of the input.",
      "An instruction-adherence prompt where the system prompt and the buried instruction disagree.",
    ],
    promptVariants: [
      "Filler placement — same total tokens, but the answer sits at start, middle, or end.",
      "Retrieval shuffling — same chunks, different order, to test order sensitivity.",
      "Compression — the same answer with and without irrelevant context.",
    ],
    observationsToRecord: [
      "Pass / fail per recall position.",
      "Latency growth as prompt size grows.",
      "Cost growth as prompt size grows (input vs output tokens, separately).",
      "Whether output structure degrades as prompt size grows.",
    ],
    failureModes: [
      "Model passes the recall test at start but degrades severely mid-prompt.",
      "Cost scales superlinearly because the provider tiers pricing on prompt length.",
      "Latency hits a hard ceiling above a certain prompt size.",
      "The model truncates output silently when the input nears the verified context limit.",
    ],
    stopConditions: [
      "Stop and re-scope if the model degrades below your acceptance rate at prompt sizes you actually need.",
      "Stop and document if cost growth violates your finance ceiling — that is selection evidence.",
    ],
    outputs: [
      "A Markdown evidence brief listing recall and cost behaviour per prompt size per candidate.",
      "A short cost projection note attached to /briefs/build for reviewer pickup.",
    ],
    relatedTemplates: ["prompt-test-matrix", "model-evaluation-plan"],
    relatedRoutes: [
      { label: "Long-context demo", href: "/demos/long-context-analysis" },
      { label: "Decision brief builder", href: "/briefs/build" },
    ],
    policyNote:
      "Long-context behaviour is workload-specific. The playbook does not assert a model's effective context length and does not rank candidates by long-prompt cost.",
    weakTestExample: [
      "Fill the prompt to the verified context window with random tokens and assume recall stays constant.",
      "Skip varying the answer position inside the prompt.",
      "Ignore cost growth at large prompt sizes.",
    ],
    strongerTestExample: [
      "Build a scaffold that grows the prompt while pinning the question.",
      "Test recall with the answer at the start, middle, and end of the input.",
      "Capture cost behaviour separately for input vs output tokens.",
      "Cap the test at the verified context window, not the marketing one.",
    ],
    observationRubric: [
      {
        dimension: "Recall by position",
        whatToLookFor:
          "Whether the model surfaces the buried answer regardless of its position in the input.",
        whatToRecord:
          "Pass / fail per position bucket, with the prompt scaffold captured.",
      },
      {
        dimension: "Latency growth",
        whatToLookFor:
          "Latency as prompt size grows.",
        whatToRecord:
          "Latency observation per prompt-size bucket, with the region you ran from.",
      },
      {
        dimension: "Cost growth",
        whatToLookFor:
          "Cost growth as prompt size grows (input vs output tokens, separately).",
        whatToRecord:
          "Per-call token counts mapped to the pricing reference; flag any tier change.",
      },
      {
        dimension: "Output structure degradation",
        whatToLookFor:
          "Whether structured-output reliability or instruction following degrades at large prompt sizes.",
        whatToRecord:
          "Per-bucket failure modes with example outputs.",
      },
    ],
    briefNote: [
      "Embed the scaffold and the answer-position protocol so the brief is reproducible.",
      "Record recall by prompt-size bucket rather than a single rolled-up figure.",
      "Pair cost growth observations with the pricing reference + retrievedAt date.",
      "Note any prompt size where the model truncated output silently.",
    ],
  },
  {
    slug: "multimodal-input-testing",
    title: "Multimodal input testing",
    summary:
      "How to test image, audio, video, and PDF input channels against your real assets — never against marketing copy.",
    difficulty: "intermediate",
    estimatedMinutes: 30,
    goal: "Confirm that a candidate model handles the modality your workload actually sends, on assets that resemble your production traffic.",
    whenToUse: [
      "Your application sends image, audio, video, or PDF input.",
      "You need to confirm the model accepts your real asset format, not just the demo format.",
      "You need to understand failure modes when an asset is malformed or partial.",
    ],
    prerequisites: [
      { label: "/learn/multimodal-input", href: "/learn/multimodal-input" },
      {
        label: "A shortlist filtered by verified modality",
        href: "/select?modality=image-in",
      },
      {
        label: "10–20 representative assets from your real workload",
        href: "/learn/multimodal-input",
      },
    ],
    testSetup: [
      "Verify the modality channel is present as a verified field on the candidate model — if not, the test confirms whether the gap is real.",
      "Confirm the API surface accepts the asset encoding you plan to send (base64, URL, multi-part, signed-link).",
      "Cap asset sizes at your real workload's 95th percentile, not the API's documented maximum.",
      "Capture asset hashes so failures are reproducible.",
    ],
    minimumTestSet: [
      "5–10 happy-path assets representative of your typical traffic.",
      "2–3 edge-case assets (low resolution, low bitrate, scanned PDFs, multi-page documents).",
      "2–3 adversarial assets (malformed, partial, mismatched MIME type).",
    ],
    promptVariants: [
      "Same asset, different question framings — surfaces prompt-vs-asset attribution failures.",
      "Same asset, with and without an OCR pre-pass when relevant.",
      "Same asset, fed via two different transports (URL vs base64) to surface transport-dependent failures.",
    ],
    observationsToRecord: [
      "Pass / fail per asset class against your acceptance rubric.",
      "Whether the model refuses, hallucinates, or returns a useful error on adversarial input.",
      "Latency vs the same prompt without the multimodal asset.",
      "Cost per asset broken down by token unit if pricing is asymmetric across modalities.",
    ],
    failureModes: [
      "The model passes happy-path assets but silently falls back to text-only when the image fails to decode.",
      "Audio transcription drifts on accented speech the model was not trained on.",
      "PDF parsing returns body text but drops headers, footers, or table structure.",
      "The model invents content for blank pages or silent audio.",
    ],
    stopConditions: [
      "Stop and re-scope if the candidate fails on assets that match your real traffic distribution.",
      "Stop and document if the model silently degrades modality — silent fallbacks are integration hazards.",
    ],
    outputs: [
      "A Markdown evidence brief with per-asset-class pass rates.",
      "A list of asset hashes attached for replay.",
    ],
    relatedTemplates: ["prompt-test-matrix", "model-evaluation-plan"],
    relatedRoutes: [
      { label: "Multimodal use case", href: "/use-cases/multimodal-input" },
      { label: "Comparison builder", href: "/compare/build" },
    ],
    policyNote:
      "Modality support is workload-specific. The playbook does not declare which model is best for any modality and does not certify accessibility, accuracy, or safety of the model's outputs.",
    weakTestExample: [
      "Send one demo-quality image and assume real assets behave the same.",
      "Skip the silent-fallback test.",
      "Skip asset-size validation.",
    ],
    strongerTestExample: [
      "Send 5–10 happy-path assets matched to your real workload distribution.",
      "Include adversarial assets (malformed, low resolution, partial).",
      "Probe explicitly for silent fallback (model returns text-only without erroring).",
      "Capture asset hashes so failures replay.",
    ],
    observationRubric: [
      {
        dimension: "Happy-path accuracy",
        whatToLookFor:
          "Whether the model handles representative assets against your rubric.",
        whatToRecord:
          "Pass / fail per asset with a rationale, plus the asset hash.",
      },
      {
        dimension: "Adversarial behaviour",
        whatToLookFor:
          "Refusal, hallucination, or useful error on malformed / partial assets.",
        whatToRecord:
          "Per-asset category outcome and a short note on safety implications.",
      },
      {
        dimension: "Silent fallback",
        whatToLookFor:
          "Whether the model silently drops to text-only when the modality fails.",
        whatToRecord:
          "Yes / no per case with the response that triggered the observation.",
      },
      {
        dimension: "Latency vs text-only baseline",
        whatToLookFor:
          "Latency delta vs the same prompt without the multimodal asset.",
        whatToRecord:
          "Median delta per asset class.",
      },
    ],
    briefNote: [
      "Record per-asset-class pass rates instead of a single accuracy number.",
      "List asset hashes alongside outcomes so failures are reproducible.",
      "Flag any silent fallback explicitly — silent fallback is an integration hazard.",
      "Capture the latency delta vs text-only.",
    ],
  },
  {
    slug: "automation-workflow-testing",
    title: "Automation workflow testing",
    summary:
      "How to test a model inside an automation loop — chained prompts, retries, downstream parsers, regression surface — before letting it run unattended.",
    difficulty: "intermediate",
    estimatedMinutes: 40,
    goal: "Confirm a candidate model behaves safely inside an unattended automation, including failure modes the prompt-testing playbook does not cover.",
    whenToUse: [
      "You are wiring the model into a scheduled job, queue worker, or pipeline.",
      "You need to validate behaviour when retries, timeouts, and downstream parsers come into play.",
      "You want a regression-aware test plan that catches silent quality drops.",
    ],
    prerequisites: [
      { label: "/learn/testing-ai-models", href: "/learn/testing-ai-models" },
      { label: "/learn/path/automation-specialist", href: "/learn/path/automation-specialist" },
      {
        label: "A documented automation pipeline you can describe in 1 page",
        href: "/learn/path/automation-specialist",
      },
    ],
    testSetup: [
      "Map the automation pipeline end to end — input source, model step, downstream parser, output destination.",
      "Decide which steps are idempotent and which are not — non-idempotent steps need stricter guards.",
      "Pick a representative shadow run set and a small canary set you can run repeatedly.",
      "Pin a representative workload size (jobs per hour, prompts per job) so cost projections stay honest.",
    ],
    minimumTestSet: [
      "20–50 shadow jobs that mirror real production input distribution.",
      "5–10 deliberate adversarial jobs (corrupt input, partial input, hostile input).",
      "A small canary set you re-run after every snapshot rotation to catch regressions.",
    ],
    promptVariants: [
      "Same job, two candidate models, to surface candidate-specific failure modes.",
      "Same job, two snapshots of the same model, to surface version drift.",
      "Same job, with and without retries, to confirm retries do not amplify errors.",
    ],
    observationsToRecord: [
      "Pass / fail per shadow job against your acceptance rubric.",
      "Retry rate, retry success rate, and final failure rate.",
      "Downstream parser error rate — sometimes the model is fine and the parser is wrong.",
      "End-to-end latency including retry overhead.",
      "Per-job cost projection rolled up to your expected daily volume.",
    ],
    failureModes: [
      "The model passes single-shot prompts but the retry loop amplifies a malformed output.",
      "Downstream parser tolerates one model's quirks and breaks on another — selection evidence.",
      "Job succeeds on the canary set but degrades on shadow traffic — production distribution mismatch.",
      "Latency is fine median but tail latency exceeds your queue timeout.",
    ],
    stopConditions: [
      "Stop and re-scope if retry rate exceeds your acceptance ceiling during shadow runs.",
      "Stop and document if the same job passes the canary set and fails the shadow set — investigate input distribution drift.",
    ],
    outputs: [
      "A Markdown evidence brief covering shadow-run pass rate, retry behaviour, and tail latency.",
      "An automation runbook section listing the canary set and the regression schedule.",
    ],
    relatedTemplates: ["automation-risk-checklist", "model-evaluation-plan"],
    relatedRoutes: [
      { label: "Automation specialist path", href: "/learn/path/automation-specialist" },
      { label: "Decision brief builder", href: "/briefs/build" },
    ],
    policyNote:
      "The playbook teaches automation-aware testing — it does not certify the automation, does not guarantee reliability, and does not assert SEO or business outcomes.",
    weakTestExample: [
      "Run one shadow job and call the automation ready for unattended use.",
      "Skip the canary set design.",
      "Skip the retry-amplification test.",
      "Treat downstream parser errors as 'model bugs'.",
    ],
    strongerTestExample: [
      "Run 20–50 shadow jobs that match real production input distribution.",
      "Run 5–10 deliberate adversarial jobs.",
      "Test with and without retries to confirm retries do not amplify malformed outputs.",
      "Distinguish model failure from downstream parser failure in the logs.",
    ],
    observationRubric: [
      {
        dimension: "Shadow-run acceptance",
        whatToLookFor:
          "Whether shadow jobs meet your acceptance rubric.",
        whatToRecord:
          "Pass / fail per job with the rubric criteria captured.",
      },
      {
        dimension: "Retry behaviour",
        whatToLookFor:
          "Retry rate, retry success rate, final failure rate.",
        whatToRecord:
          "Counts per job category and an example of a retry-amplified failure if any.",
      },
      {
        dimension: "Downstream parser interaction",
        whatToLookFor:
          "Whether the parser tolerates the model's output shape.",
        whatToRecord:
          "Parser error rate plus example inputs that broke the parser.",
      },
      {
        dimension: "Tail latency",
        whatToLookFor:
          "End-to-end latency including retry overhead.",
        whatToRecord:
          "Median + p95 + max per job category, with the queue timeout for reference.",
      },
    ],
    briefNote: [
      "Embed the shadow-run protocol so the brief is reproducible.",
      "Pair shadow-run acceptance with retry behaviour — they interact.",
      "Record tail latency, not just median.",
      "Document the canary suite and regression cadence.",
    ],
  },
  {
    slug: "model-regression-testing",
    title: "Model regression testing",
    summary:
      "How to run a small, repeatable canary suite after every snapshot rotation so silent regressions surface before production traffic notices.",
    difficulty: "intermediate",
    estimatedMinutes: 30,
    goal: "Catch a silent regression introduced by a snapshot rotation before downstream users hit it.",
    whenToUse: [
      "Your provider rotates model snapshots without changing the API model name.",
      "Your automation runs unattended for hours or days at a time.",
      "You have an evidence brief from a previous selection round and want to keep it honest.",
    ],
    prerequisites: [
      { label: "/learn/testing-ai-models", href: "/learn/testing-ai-models" },
      { label: "/learn/model-lifecycle", href: "/learn/model-lifecycle" },
      {
        label: "A previous evidence brief from /briefs/build",
        href: "/briefs/build",
      },
    ],
    testSetup: [
      "Freeze a canary suite of 10–25 prompts that exercises the behaviours your application depends on.",
      "Store reference outputs from the snapshot you originally selected — keep them out of source control if they contain real data.",
      "Schedule the canary suite to run on a regular cadence (every release, every snapshot bump, or every 24 hours).",
      "Wire alerting that fires when canary pass rate drops below your floor.",
    ],
    minimumTestSet: [
      "10–25 representative prompts you also ran in the original selection.",
      "At least one prompt per behaviour your application depends on (recall, format, refusal, modality).",
    ],
    promptVariants: [
      "Same prompt, same parameters, two snapshots — reference vs current.",
      "Same prompt with and without retrieved context to separate model drift from retrieval drift.",
    ],
    observationsToRecord: [
      "Pass / fail per prompt against reference output (or rubric, if exact match is not appropriate).",
      "Latency drift over time.",
      "Cost drift over time (input/output token shifts can move cost without changing pricing).",
      "Lifecycle field changes against /reverification.",
    ],
    failureModes: [
      "Pass rate drops sharply on one prompt category — likely targeted regression.",
      "Pass rate drops gradually across categories — likely a generic snapshot drift.",
      "Cost climbs while pass rate stays flat — verbose-output drift.",
      "The provider deprecates the snapshot mid-run — confirm with the catalogue's lifecycle field.",
    ],
    stopConditions: [
      "Stop and re-evaluate if pass rate drops below your floor on any release.",
      "Stop and re-verify if the catalogue's lifecycle field shifts to deprecated for the snapshot under test.",
    ],
    outputs: [
      "A Markdown evidence delta listing the prompts that regressed.",
      "An updated decision brief if the regression triggers a re-selection.",
    ],
    relatedTemplates: ["prompt-test-matrix", "model-evaluation-plan"],
    relatedRoutes: [
      { label: "Reverification queue", href: "/reverification" },
      { label: "Decision brief builder", href: "/briefs/build" },
    ],
    policyNote:
      "The canary suite catches drift; it does not certify the model. A passing canary is not production readiness, and a failing canary is not a vendor allegation — investigate before escalating.",
    weakTestExample: [
      "Run a freeform smoke test ad-hoc and call it a regression check.",
      "Skip storing reference outputs from the originally-selected snapshot.",
      "Treat a single failing canary as a vendor issue without investigating.",
    ],
    strongerTestExample: [
      "Freeze a canary suite of 10–25 prompts covering the behaviours the application depends on.",
      "Store reference outputs (or rubric criteria) for comparison.",
      "Schedule the suite on a regular cadence and wire alerting against a documented pass-rate floor.",
      "Investigate a failing canary against /reverification before escalating.",
    ],
    observationRubric: [
      {
        dimension: "Per-prompt drift",
        whatToLookFor:
          "Whether each canary prompt still meets the reference expectation.",
        whatToRecord:
          "Pass / fail per prompt with rationale, not a rolled-up percentage.",
      },
      {
        dimension: "Latency drift",
        whatToLookFor:
          "Whether latency for the canary set has shifted from the baseline.",
        whatToRecord:
          "Median + tail latency per canary run, compared to baseline.",
      },
      {
        dimension: "Cost drift",
        whatToLookFor:
          "Input / output token ratio shifts for the same prompts.",
        whatToRecord:
          "Token counts per canary run plus any unit-cost change to flag.",
      },
      {
        dimension: "Lifecycle drift",
        whatToLookFor:
          "Whether the catalogue's lifecycle field for the snapshot has shifted.",
        whatToRecord:
          "Lifecycle status + retrievedAt at each canary run; flag any change.",
      },
    ],
    briefNote: [
      "Embed the canary set + reference rubric so the regression record is self-contained.",
      "Pair drift observations with the snapshot ID under test.",
      "List the pass-rate floor and the action taken on breaches.",
      "Cross-reference any failing canary with /reverification before treating it as a vendor allegation.",
    ],
  },
];

// ---------------------------------------------------------------------------
// Templates. Markdown planning documents the reader can export and
// adapt. The content is intentionally generic — no model-specific
// numbers, no benchmark claims.
// ---------------------------------------------------------------------------

const TEMPLATES: LabTemplate[] = [
  {
    slug: "model-evaluation-plan",
    title: "Model evaluation plan",
    summary:
      "A blank evaluation plan for a single model + workload pairing. Use one copy per candidate.",
    format: "markdown",
    sections: [
      {
        title: "Identify",
        body: [
          "Workload name:",
          "Candidate model slug (from the catalogue):",
          "Snapshot identifier or version you intend to test:",
          "Hosting platform (creator-direct or hosted):",
        ],
      },
      {
        title: "Scope",
        body: [
          "Primary use case (link to /use-cases/<slug>):",
          "Verified fields you intend to weight:",
          "Data gaps you accept going into the test:",
          "Out-of-scope behaviours (write them down so they do not creep back in):",
        ],
      },
      {
        title: "Test plan",
        body: [
          "Prompt set source and rationale:",
          "Acceptance rubric per prompt category:",
          "Sampling parameters held constant (temperature, top_p, max_tokens):",
          "Region used for latency observation:",
          "Workload size assumed in the cost projection:",
        ],
      },
      {
        title: "Observations",
        body: [
          "Pass / fail summary per category:",
          "Latency observation (median + tail):",
          "Cost projection at expected daily volume:",
          "Notable failure modes:",
        ],
      },
      {
        title: "Decision",
        body: [
          "Does the evidence support proceeding to integration, re-scoping, or rejecting? (Write the reasoning, not just the verdict.)",
          "Open data gaps to close before launch:",
          "Reviewer sign-offs required:",
          "Re-test cadence after launch:",
        ],
      },
    ],
    policyNote:
      "The plan is a planning aid, not a safety validation. Filling it in does not certify the model for production, compliance, or any regulated use.",
  },
  {
    slug: "prompt-test-matrix",
    title: "Prompt test matrix",
    summary:
      "A row-per-prompt matrix you fill in per candidate model. Pair with the model evaluation plan.",
    format: "markdown",
    sections: [
      {
        title: "Matrix legend",
        body: [
          "Use ✓ for pass against the acceptance rubric, ✗ for fail, ? for ambiguous (record why).",
          "Record latency in seconds wall-clock from your environment.",
          "Record cost as input + output tokens; convert to currency later using the catalogue's pricing reference.",
        ],
      },
      {
        title: "Prompt index",
        body: [
          "| ID | Prompt category | Prompt summary | Acceptance rubric |",
          "| --- | --- | --- | --- |",
          "| P-01 | happy path |  |  |",
          "| P-02 | edge case |  |  |",
          "| P-03 | adversarial |  |  |",
          "| P-04 | refusal |  |  |",
          "| P-05 | long context |  |  |",
        ],
      },
      {
        title: "Results per candidate",
        body: [
          "| Prompt ID | Candidate A | Candidate B | Notes |",
          "| --- | --- | --- | --- |",
          "| P-01 |  |  |  |",
          "| P-02 |  |  |  |",
          "| P-03 |  |  |  |",
          "| P-04 |  |  |  |",
          "| P-05 |  |  |  |",
        ],
      },
      {
        title: "Rollup",
        body: [
          "Pass rate per candidate (count, not percentage):",
          "Median latency per candidate:",
          "Notable failure modes per candidate:",
          "Open data gaps surfaced by this matrix:",
        ],
      },
    ],
    policyNote:
      "The matrix does not score candidates against each other. Fill the rollup with observations the reviewer can read; do not collapse the evidence into a single number.",
  },
  {
    slug: "automation-risk-checklist",
    title: "Automation risk checklist",
    summary:
      "A pre-launch risk checklist for automations that depend on a model. Pair with the automation workflow testing playbook.",
    format: "markdown",
    sections: [
      {
        title: "Pipeline scope",
        body: [
          "Input source (what triggers the automation):",
          "Model step (which candidate, which snapshot, which region):",
          "Downstream parser (deterministic or model-assisted):",
          "Output destination (write target, who reads it):",
          "Idempotency guarantees per step:",
        ],
      },
      {
        title: "Failure surface",
        body: [
          "What happens on a model timeout?",
          "What happens on a schema validation failure?",
          "What happens on an unexpected refusal?",
          "What happens on a downstream parser failure?",
          "What is the maximum acceptable retry count?",
        ],
      },
      {
        title: "Observability",
        body: [
          "Are inputs, outputs, and errors logged with correlation IDs?",
          "Is the canary suite scheduled and alerting wired?",
          "Is the catalogue's reverification queue subscribed for the model under test?",
          "Where do operators see drift first?",
        ],
      },
      {
        title: "Guardrails",
        body: [
          "Are PII / sensitive data flows minimised on the input side?",
          "Are outputs reviewed by a human before they go to a customer-facing surface?",
          "Are there hard rate limits, hard cost limits, and a kill switch?",
          "Is there a rollback path if the snapshot rotates?",
        ],
      },
      {
        title: "Approval",
        body: [
          "Reviewer sign-offs required for launch:",
          "Reviewer sign-offs required for snapshot promotion:",
          "Reviewer sign-offs required for prompt edits:",
        ],
      },
    ],
    policyNote:
      "The checklist is a planning aid. It does not certify the automation as safe, does not satisfy any regulatory regime, and does not guarantee operational outcomes.",
  },
];

export const labPlaybooks: LabPlaybook[] = PLAYBOOKS;
export const labTemplates: LabTemplate[] = TEMPLATES;

export function getLabPlaybook(slug: string): LabPlaybook | undefined {
  return PLAYBOOKS.find((p) => p.slug === slug);
}

export function getLabTemplate(slug: string): LabTemplate | undefined {
  return TEMPLATES.find((t) => t.slug === slug);
}

export function getLabPlaybooks(): LabPlaybook[] {
  return PLAYBOOKS;
}

export function getLabTemplates(): LabTemplate[] {
  return TEMPLATES;
}

export function getLabPlaybookRoutes(): string[] {
  return PLAYBOOKS.map((p) => `/lab/${p.slug}`);
}

export function getLabTemplateRoutes(): string[] {
  return TEMPLATES.map((t) => `/lab/templates/${t.slug}`);
}

/**
 * Serialise a template into Markdown. Deterministic — no Date.now,
 * no model-specific values, no user input required.
 */
export function labTemplateToMarkdown(template: LabTemplate): string {
  const lines: string[] = [];
  lines.push(`# ${template.title}`);
  lines.push("");
  lines.push(`> ${template.summary}`);
  lines.push("");
  for (const section of template.sections) {
    lines.push(`## ${section.title}`);
    lines.push("");
    for (const body of section.body) {
      lines.push(body);
    }
    lines.push("");
  }
  lines.push("---");
  lines.push("");
  lines.push(`_Policy: ${template.policyNote}_`);
  lines.push("");
  lines.push(
    "_Generated by WebmasterID Models AI Usage Lab. No fabricated metrics. No model recommendations. https://models.webmasterid.com/lab/templates_"
  );
  return lines.join("\n");
}
