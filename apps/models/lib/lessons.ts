/**
 * Lesson registry — Sprint 28 learning layer.
 *
 * The catalogue's verified-data backbone (models, providers, pricing
 * references, hosted availability, source freshness, reverification
 * queue) gets a teaching layer in front of it. Each lesson:
 *
 *   - Explains a single AI-model-selection concept in plain language.
 *   - Names which verified catalogue fields the reader should inspect
 *     after the lesson — never which model to pick.
 *   - Links to the canonical workflow surfaces (/select, /compare/build,
 *     /briefs/build, /sources, /reverification, /coverage).
 *   - Lives behind one stable slug under /learn so SEO + sitemap stay
 *     deterministic.
 *
 * Discipline:
 *   - No "best", "winner", "cheapest", "fastest", "guaranteed",
 *     "certified" claims.
 *   - No fabricated benchmark scores.
 *   - No model recommendation. Lessons frame inspection workflows,
 *     not endorsements.
 *   - Examples come from the typed local data layer only.
 */
/**
 * The topical groupings lessons fall into ("model fundamentals",
 * "pricing and hosted", etc.). These are *not* the role-based
 * learning paths (Sprint 30) — those live in `lib/learning-paths.ts`.
 */
export type LessonGroupSlug =
  | "model-fundamentals"
  | "pricing-and-hosted"
  | "comparison-methodology"
  | "governance-and-sources"
  | "testing-workflow";

export type LessonSlug =
  | "how-to-choose-ai-model"
  | "context-window"
  | "hosted-vs-first-party"
  | "pricing-references"
  | "model-lifecycle"
  | "testing-ai-models"
  | "multimodal-input"
  | "structured-output"
  | "status-aware-selection"
  | "benchmark-limitations";

export interface LessonGroup {
  slug: LessonGroupSlug;
  title: string;
  description: string;
  lessonSlugs: LessonSlug[];
}

export interface LessonApplyLink {
  href: string;
  label: string;
  purpose: string;
}

/**
 * Sprint 34 teaching fields — optional content blocks rendered by
 * the lesson layout when present. The fields are illustrative,
 * generic, and never assert a model recommendation.
 */
export interface LessonTeachingExample {
  situation: string;
  decision: string;
  fields: string[];
  nextRoutes: Array<{ label: string; href: string }>;
}

export interface LessonBadBetterExample {
  weak: string[];
  better: string[];
  explanation: string;
}

export interface LessonArtifactExample {
  title: string;
  body: string[];
}

export interface LessonWorkflowBridgeStep {
  label: string;
  href: string;
  purpose: string;
}

export interface LessonSummary {
  slug: LessonSlug;
  title: string;
  oneLine: string;
  group: LessonGroupSlug;
  /** Workflow routes this lesson asks the reader to apply next. */
  applyRoutes: LessonApplyLink[];
  /** Other lessons that pair naturally with this one. */
  relatedLessonSlugs: LessonSlug[];
  /** Date this lesson copy was last reviewed for accuracy. */
  updatedDate: string;
  /** Sprint 34 — illustrative teaching scenario. */
  teachingExample?: LessonTeachingExample;
  /** Sprint 34 — weak vs better approach to the lesson concept. */
  badBetterExample?: LessonBadBetterExample;
  /** Sprint 34 — example artifact the reader will produce. */
  artifactExample?: LessonArtifactExample;
  /** Sprint 34 — concept → workflow bridge steps. */
  workflowBridge?: LessonWorkflowBridgeStep[];
  /** Sprint 34 — review checklist before moving on. */
  reviewChecklist?: string[];
}

const APPLY_SELECT: LessonApplyLink = {
  href: "/select",
  label: "Open the selection workspace",
  purpose:
    "Narrow a source-backed shortlist using verified catalogue fields.",
};

const APPLY_COMPARE: LessonApplyLink = {
  href: "/compare/build",
  label: "Compare verified fields side by side",
  purpose:
    "Render up to four models against each other from the typed data layer.",
};

const APPLY_BRIEF: LessonApplyLink = {
  href: "/briefs/build",
  label: "Export an evidence decision brief",
  purpose:
    "Generate a paste-ready Markdown or JSON brief — evidence, not a recommendation.",
};

const APPLY_SOURCES: LessonApplyLink = {
  href: "/sources",
  label: "Inspect the citation registry",
  purpose:
    "Open every primary source the catalogue references for a model or pricing row.",
};

const APPLY_REVERIFICATION: LessonApplyLink = {
  href: "/reverification",
  label: "Walk the reverification queue",
  purpose:
    "See which sources are due for manual re-check and when each was last verified.",
};

const APPLY_COVERAGE: LessonApplyLink = {
  href: "/coverage",
  label: "Audit per-provider coverage",
  purpose:
    "Inspect verified-field counts and citation density for every provider.",
};

const APPLY_DEMOS: LessonApplyLink = {
  href: "/demos",
  label: "Try a guided demo",
  purpose:
    "Walk the same workflow end-to-end using one of three pre-packaged route plans.",
};

export const lessons: LessonSummary[] = [
  {
    slug: "how-to-choose-ai-model",
    title: "How to choose an AI model",
    oneLine:
      "A workflow for picking which AI model to test next — start from your use case, inspect verified fields, export an evidence brief.",
    group: "model-fundamentals",
    applyRoutes: [APPLY_SELECT, APPLY_COMPARE, APPLY_BRIEF, APPLY_SOURCES],
    relatedLessonSlugs: [
      "context-window",
      "pricing-references",
      "model-lifecycle",
      "testing-ai-models",
    ],
    updatedDate: "2026-05-24",
    teachingExample: {
      situation:
        "A team needs to add an AI model to summarise customer support tickets weekly. They have not yet defined the model selection workflow.",
      decision:
        "Which 2–3 candidate models should we evaluate this quarter, and what evidence will we record?",
      fields: [
        "Lifecycle status (active only)",
        "Verified context window vs typical ticket length",
        "Pricing reference + retrieval date",
        "Hosted vs first-party availability",
        "Source freshness on the citations",
      ],
      nextRoutes: [
        { label: "/use-cases", href: "/use-cases" },
        { label: "/select", href: "/select" },
        { label: "/briefs/build", href: "/briefs/build" },
      ],
    },
    badBetterExample: {
      weak: [
        "Open the most recent vendor blog post.",
        "Pick the model the blog headlines.",
        "Skip lifecycle / pricing / source verification.",
        "Ship and hope the snapshot does not rotate during launch.",
      ],
      better: [
        "Name the use case and its acceptance rubric.",
        "Filter the catalogue to active lifecycle + verified pricing.",
        "Compare 2–4 candidates on verified fields side by side.",
        "Export a Markdown brief listing fields, gaps, sources, freshness.",
      ],
      explanation:
        "The weak approach optimises for novelty. The better approach optimises for an auditable trail your reviewer can read independently.",
    },
    artifactExample: {
      title: "Decision brief excerpt — shortlist note",
      body: [
        "## Shortlist (illustrative)",
        "Use case: support-ticket summarisation",
        "Candidates: <model-A>, <model-B>, <model-C> (slugs from /select)",
        "",
        "Verified fields per candidate:",
        "- Lifecycle: active (cite source)",
        "- Context window: <tokens> (cite source, retrievedAt)",
        "- Hosted availability: yes / no",
        "- Pricing reference: <unit> + retrievedAt",
        "",
        "Open data gaps:",
        "- Max output tokens not stated for <model-C> (unverified-data label)",
        "",
        "Next step: open /compare/build for the three slugs and export brief.",
      ],
    },
    workflowBridge: [
      {
        label: "Learn the concept",
        href: "/learn/how-to-choose-ai-model",
        purpose: "Frame the decision workflow before opening the catalogue.",
      },
      {
        label: "Apply in /select",
        href: "/select",
        purpose: "Narrow a source-backed shortlist by use case + lifecycle.",
      },
      {
        label: "Verify in /sources",
        href: "/sources",
        purpose: "Read the primary-source citation for each verified field.",
      },
      {
        label: "Test with /lab",
        href: "/lab",
        purpose: "Run the prompt-testing playbook against the shortlist.",
      },
    ],
    reviewChecklist: [
      "I can name the use case and the acceptance rubric.",
      "Every candidate's lifecycle field is verified active.",
      "Every candidate has at least one verified pricing reference or an explicit gap noted.",
      "I have a /select URL I can share with a teammate.",
      "I have NOT named a winner — only candidates with evidence.",
    ],
  },
  {
    slug: "context-window",
    title: "Context windows explained",
    oneLine:
      "What a context window means, what it does not guarantee, and which verified fields to inspect before assuming a model fits your prompt.",
    group: "model-fundamentals",
    applyRoutes: [APPLY_SELECT, APPLY_COMPARE, APPLY_SOURCES],
    relatedLessonSlugs: [
      "how-to-choose-ai-model",
      "pricing-references",
      "testing-ai-models",
    ],
    updatedDate: "2026-05-24",
    teachingExample: {
      situation:
        "An application sends 80–200 page PDFs into the model along with a short instruction. The team is trying to decide whether the prompt size is comfortably inside the candidate's verified limits.",
      decision:
        "Does the prompt + retrieved context + expected output stay inside the candidate's verified context window AND its verified max-output cap?",
      fields: [
        "Verified context window",
        "Verified max output tokens (separate field)",
        "Pricing reference for the prompt-size tier",
        "Modality channels (PDF vs image vs text)",
      ],
      nextRoutes: [
        {
          label: "/select?useCase=long-context-analysis",
          href: "/select?useCase=long-context-analysis",
        },
        { label: "/compare/build", href: "/compare/build" },
        {
          label: "/lab/long-context-testing",
          href: "/lab/long-context-testing",
        },
      ],
    },
    badBetterExample: {
      weak: [
        "Pick the model with the largest published context window.",
        "Skip max-output verification.",
        "Assume recall is constant across the window.",
        "Treat marketing copy as a verified field.",
      ],
      better: [
        "Inspect the verified context window AND the verified max-output cap.",
        "Confirm the pricing reference for prompt-size tiers, if any.",
        "Run the long-context testing playbook on representative prompts.",
        "Record where recall degrades in your evidence brief.",
      ],
      explanation:
        "Context window is a necessary condition, not a sufficient one. The better approach surfaces the workload-specific behaviour the catalogue cannot measure for you.",
    },
    artifactExample: {
      title: "Long-context shortlist note",
      body: [
        "## Long-context shortlist (illustrative)",
        "Workload: PDFs averaging 100k tokens + 8k expected output",
        "",
        "| Candidate | Context (verified) | Max output (verified) | Source URL | retrievedAt |",
        "| --- | --- | --- | --- | --- |",
        "| <model-A> | <tokens> | <tokens> | <provider docs> | <date> |",
        "| <model-B> | <tokens> | unverified-data | <provider docs> | <date> |",
        "",
        "Notes:",
        "- <model-B> has no published max output — flag for external test.",
        "- Both candidates pass the verified context check for our 100k prompts.",
      ],
    },
    workflowBridge: [
      {
        label: "Learn the concept",
        href: "/learn/context-window",
        purpose: "Understand what context window does and does not guarantee.",
      },
      {
        label: "Apply in /select",
        href: "/select?useCase=long-context-analysis",
        purpose: "Filter the catalogue by verified context window for your workload.",
      },
      {
        label: "Verify in /sources",
        href: "/sources",
        purpose: "Read the provider documentation behind each context value.",
      },
      {
        label: "Test in /lab",
        href: "/lab/long-context-testing",
        purpose: "Run the long-context testing playbook against your candidates.",
      },
    ],
    reviewChecklist: [
      "I can name the verified context window for each candidate (or note it is unverified).",
      "I separately know each candidate's verified max output cap.",
      "I have not assumed the largest window is automatically the best fit.",
      "I have a /compare/build URL with the candidates rendered side by side.",
      "I plan to run the long-context testing playbook before integration.",
    ],
  },
  {
    slug: "hosted-vs-first-party",
    title: "Hosted vs first-party AI models",
    oneLine:
      "Why the model creator and the billing provider are usually different, and how the catalogue keeps the two separate.",
    group: "pricing-and-hosted",
    applyRoutes: [APPLY_SELECT, APPLY_COMPARE, APPLY_SOURCES],
    relatedLessonSlugs: ["pricing-references", "how-to-choose-ai-model"],
    updatedDate: "2026-05-24",
    teachingExample: {
      situation:
        "An engineer reads two cost estimates for the same model — one from the creator's docs, one from a third-party hosting platform — and they differ.",
      decision:
        "Which pricing reference should the finance projection use, and how should it be sourced?",
      fields: [
        "Model creator (providerSlug)",
        "Hosted availability records per platform",
        "Hosted model ID on each platform (often different from canonical)",
        "First-party pricing reference + retrievedAt",
        "Hosted pricing reference + retrievedAt per platform",
      ],
      nextRoutes: [
        {
          label: "/select?useCase=hosted-inference",
          href: "/select?useCase=hosted-inference",
        },
        { label: "/pricing", href: "/pricing" },
        { label: "/sources", href: "/sources" },
      ],
    },
    badBetterExample: {
      weak: [
        "Pick the lowest number across all pricing surfaces.",
        "Assume the model creator's terms apply to the hosted platform.",
        "Reuse the creator's model ID in the hosted API call.",
        "Skip the hosted retrievedAt date.",
      ],
      better: [
        "Trace each pricing row back to the source that issued the invoice.",
        "Confirm hosted availability + hosted model ID per platform.",
        "Record creator vs billing provider as separate fields in the brief.",
        "Capture retrievedAt for both first-party and hosted rows.",
      ],
      explanation:
        "The lowest displayed number can come from a platform you are not actually integrating with. The better approach keeps creator and host distinct so the finance projection cannot collapse them.",
    },
    artifactExample: {
      title: "Hosted-provider mapping note",
      body: [
        "## Hosted mapping (illustrative)",
        "Model creator: <creator-slug>",
        "",
        "Hosted availability records:",
        "- Host: <platform-A> · hostedModelId: <slug-A> · pricing: <unit> · retrievedAt: <date>",
        "- Host: <platform-B> · hostedModelId: <slug-B> · pricing: unverified-data · retrievedAt: n/a",
        "",
        "Data gap: <platform-B> pricing not yet retrieved — flag for /reverification.",
        "Integration target: <platform-A>. Finance projection uses <platform-A> pricing only.",
      ],
    },
    workflowBridge: [
      {
        label: "Learn the concept",
        href: "/learn/hosted-vs-first-party",
        purpose: "Separate the model creator from the billing provider.",
      },
      {
        label: "Apply in /select",
        href: "/select?useCase=hosted-inference&hostedAvailability=true",
        purpose: "Filter to models with verified hosted availability.",
      },
      {
        label: "Verify in /sources",
        href: "/sources",
        purpose: "Trace each pricing row back to its primary source.",
      },
      {
        label: "Test in /lab",
        href: "/lab/structured-output-testing",
        purpose: "Confirm host-specific behaviour against your schema before integration.",
      },
    ],
    reviewChecklist: [
      "Creator and billing provider are recorded as separate fields in my notes.",
      "I have the hosted model ID for the platform I will actually call.",
      "I have a hosted pricing reference with a retrievedAt date.",
      "I have flagged any host-side data gap for /reverification.",
      "I have NOT ranked hosting platforms by price.",
    ],
  },
  {
    slug: "pricing-references",
    title: "AI model pricing references explained",
    oneLine:
      "Why catalogue pricing rows are references, not quotes — and how to read them without ranking models by price.",
    group: "pricing-and-hosted",
    applyRoutes: [APPLY_COMPARE, APPLY_SOURCES, APPLY_BRIEF],
    relatedLessonSlugs: [
      "hosted-vs-first-party",
      "context-window",
      "how-to-choose-ai-model",
    ],
    updatedDate: "2026-05-24",
    teachingExample: {
      situation:
        "Finance asks for a monthly cost projection across three candidate models. The catalogue shows pricing rows with retrievedAt dates that range from two weeks to three months old.",
      decision:
        "Which pricing rows are fresh enough to use in the projection, and which must be re-verified first?",
      fields: [
        "Pricing reference per candidate (with unit)",
        "RetrievedAt date per row",
        "Currency",
        "Reverification queue entry (if any)",
        "First-party vs hosted distinction",
      ],
      nextRoutes: [
        { label: "/pricing", href: "/pricing" },
        { label: "/sources", href: "/sources" },
        { label: "/reverification", href: "/reverification" },
      ],
    },
    badBetterExample: {
      weak: [
        "Treat the catalogue's pricing rows as a live invoice quote.",
        "Sort candidates by lowest per-token rate.",
        "Ignore the retrievedAt date on each row.",
        "Mix first-party and hosted rows in the same comparison.",
      ],
      better: [
        "Treat every row as a sourced reference with a retrievedAt date.",
        "Compare on unit semantics, not just numeric values.",
        "Re-verify rows older than your freshness threshold before quoting.",
        "Keep first-party and hosted rows in separate sections.",
      ],
      explanation:
        "Pricing volatility means even fresh rows go stale quickly. The better approach makes the freshness state part of the projection rather than hiding it.",
    },
    artifactExample: {
      title: "Pricing-reference note for finance review",
      body: [
        "## Pricing reference (illustrative)",
        "Candidate: <slug>",
        "Source URL: <provider pricing page>",
        "RetrievedAt: <date>",
        "",
        "Per-unit reference (verbatim from the source):",
        "- Input: <amount> per <unit>",
        "- Output: <amount> per <unit>",
        "- Cache (if applicable): <amount> per <unit>",
        "",
        "Freshness: <fresh / review-due / stale> (per /reverification)",
        "Caveat: Reference, not a live quote. Re-verify before signing a contract.",
      ],
    },
    workflowBridge: [
      {
        label: "Learn the concept",
        href: "/learn/pricing-references",
        purpose: "Read pricing rows as references, not invoiceable quotes.",
      },
      {
        label: "Apply in /pricing",
        href: "/pricing",
        purpose: "Inspect verified pricing rows with retrievedAt dates.",
      },
      {
        label: "Verify in /reverification",
        href: "/reverification",
        purpose: "Confirm whether any pricing row is flagged stale.",
      },
      {
        label: "Test in /briefs/build",
        href: "/briefs/build",
        purpose: "Embed the pricing reference + retrievedAt in the brief.",
      },
    ],
    reviewChecklist: [
      "Every pricing row in my notes has a retrievedAt date.",
      "Unit semantics are recorded alongside numeric values.",
      "I have NOT ranked candidates by per-token price.",
      "Stale rows are listed for /reverification before reuse.",
      "First-party and hosted rows are kept in separate sections of the brief.",
    ],
  },
  {
    slug: "model-lifecycle",
    title: "Model lifecycle: active, deprecated, retired",
    oneLine:
      "What active, preview, deprecated, and retired mean for a model — and why lifecycle should gate integration decisions.",
    group: "governance-and-sources",
    applyRoutes: [APPLY_SELECT, APPLY_REVERIFICATION, APPLY_COVERAGE],
    relatedLessonSlugs: [
      "how-to-choose-ai-model",
      "testing-ai-models",
      "pricing-references",
    ],
    updatedDate: "2026-05-24",
    teachingExample: {
      situation:
        "A team is preparing a Q3 launch that depends on a model snapshot. The catalogue lists the snapshot's lifecycle as 'deprecated' with a retirement date in early Q4.",
      decision:
        "Is there enough runway to ship on this snapshot, or should the team migrate before launch?",
      fields: [
        "Lifecycle status (verified field)",
        "Retirement date if any",
        "Migration target named by the provider (if published)",
        "Source citation + retrievedAt",
      ],
      nextRoutes: [
        { label: "/select?lifecycle=active", href: "/select?lifecycle=active" },
        { label: "/coverage", href: "/coverage" },
        { label: "/reverification", href: "/reverification" },
      ],
    },
    badBetterExample: {
      weak: [
        "Treat lifecycle as a footnote, not a gate.",
        "Integrate the deprecated snapshot 'just for now'.",
        "Skip checking for a published migration target.",
        "Discover the retirement date during incident response.",
      ],
      better: [
        "Confirm lifecycle is verified active before integrating.",
        "If deprecated, record the retirement date in the brief and design a migration window.",
        "Check whether the provider published a successor snapshot.",
        "Subscribe the source to /reverification so changes surface early.",
      ],
      explanation:
        "Lifecycle is the field most likely to bite during launch week. Treating it as a gate puts the migration plan in the design doc instead of in the incident postmortem.",
    },
    artifactExample: {
      title: "Lifecycle review note",
      body: [
        "## Lifecycle review (illustrative)",
        "Candidate: <slug>",
        "Lifecycle status: <active / preview / deprecated / retired>",
        "Retirement date: <date or n/a>",
        "Source URL: <provider docs>",
        "RetrievedAt: <date>",
        "",
        "Provider-named successor: <slug or 'not stated'>",
        "Integration timeline buffer: <days/weeks until retirement>",
        "Action: <proceed / migrate-first / re-scope>",
      ],
    },
    workflowBridge: [
      {
        label: "Learn the concept",
        href: "/learn/model-lifecycle",
        purpose: "Read lifecycle as an integration gate, not a footnote.",
      },
      {
        label: "Apply in /select",
        href: "/select?lifecycle=active",
        purpose: "Filter the catalogue to active-only candidates first.",
      },
      {
        label: "Verify in /coverage",
        href: "/coverage",
        purpose: "Audit the provider's recent deprecation history.",
      },
      {
        label: "Test in /lab",
        href: "/lab/model-regression-testing",
        purpose: "Schedule a regression suite to catch silent snapshot rotations.",
      },
    ],
    reviewChecklist: [
      "Lifecycle for the integration target is verified active OR I have a documented migration plan.",
      "Any retirement date is recorded in the brief.",
      "I checked whether the provider named a successor snapshot.",
      "The source citation has a retrievedAt date.",
      "The relevant source is on /reverification cadence appropriate to the launch timeline.",
    ],
  },
  {
    slug: "testing-ai-models",
    title: "How to test an AI model before integration",
    oneLine:
      "After the shortlist: how to run your own prompt, latency, rate-limit, cost, and compliance tests — using the evidence brief as the pack you ship to reviewers.",
    group: "testing-workflow",
    applyRoutes: [APPLY_BRIEF, APPLY_DEMOS, APPLY_REVERIFICATION],
    relatedLessonSlugs: [
      "how-to-choose-ai-model",
      "model-lifecycle",
      "pricing-references",
    ],
    updatedDate: "2026-05-24",
    teachingExample: {
      situation:
        "The catalogue produced a shortlist + brief, but the team is about to integrate without running its own workload-specific tests.",
      decision:
        "What is the smallest test plan that meaningfully reduces the integration risk before launch?",
      fields: [
        "Prompt set (5–10 representative prompts)",
        "Acceptance rubric per prompt category",
        "Pinned sampling parameters",
        "Pricing reference for the cost projection",
        "Lifecycle status (gate the timeline)",
      ],
      nextRoutes: [
        { label: "/lab", href: "/lab" },
        { label: "/lab/prompt-testing-basics", href: "/lab/prompt-testing-basics" },
        { label: "/lab/prompts", href: "/lab/prompts" },
      ],
    },
    badBetterExample: {
      weak: [
        "Run a happy-path prompt once and ship.",
        "Estimate cost from a single token count.",
        "Measure latency from a developer laptop.",
        "Skip the regression test after launch.",
      ],
      better: [
        "Run 5–10 representative prompts with a pre-agreed acceptance rubric.",
        "Project cost from your actual traffic mix.",
        "Measure latency from the region the application will serve.",
        "Schedule a small canary suite to detect snapshot drift after launch.",
      ],
      explanation:
        "Real workload behaviour shows up only in workload-specific tests. The better approach replaces anecdote with a small, repeatable test plan that survives a snapshot rotation.",
    },
    artifactExample: {
      title: "External test plan note",
      body: [
        "## External test plan (illustrative)",
        "Candidate: <slug> @ <snapshot>",
        "Region: <inference-region>",
        "",
        "Test set (5–10 prompts):",
        "- P-01 happy path · rubric: <criteria>",
        "- P-02 edge case · rubric: <criteria>",
        "- P-03 adversarial · rubric: <criteria>",
        "",
        "Sampling: temperature <value>, top_p <value>, max_tokens <value>",
        "Cost projection: <prompts/day> × <input+output tokens> × <pricing-ref>",
        "Regression cadence: every release OR weekly canary",
        "Reviewer sign-off required: <names/roles>",
      ],
    },
    workflowBridge: [
      {
        label: "Learn the concept",
        href: "/learn/testing-ai-models",
        purpose: "Read the testing framework the catalogue does not run for you.",
      },
      {
        label: "Apply in /briefs/build",
        href: "/briefs/build",
        purpose: "Attach the test plan to the evidence brief.",
      },
      {
        label: "Verify in /sources",
        href: "/sources",
        purpose: "Re-check the citations the brief depends on before launch.",
      },
      {
        label: "Test in /lab",
        href: "/lab/prompt-testing-basics",
        purpose: "Walk the minimum prompt-testing routine end to end.",
      },
    ],
    reviewChecklist: [
      "I have 5–10 representative prompts with acceptance criteria.",
      "Sampling parameters are pinned and recorded.",
      "Cost projection uses a fresh pricing reference.",
      "Latency is measured from the inference region we will serve.",
      "A regression suite is scheduled after launch.",
    ],
  },
  {
    slug: "multimodal-input",
    title: "Multimodal input: image, audio, video, PDF",
    oneLine:
      "How the catalogue records which models accept image, audio, video, or PDF input — and why marketing copy is not enough to assume support.",
    group: "model-fundamentals",
    applyRoutes: [APPLY_SELECT, APPLY_COMPARE, APPLY_SOURCES],
    relatedLessonSlugs: [
      "how-to-choose-ai-model",
      "context-window",
      "structured-output",
    ],
    updatedDate: "2026-05-24",
    teachingExample: {
      situation:
        "An application needs to extract data from scanned invoices uploaded as PDFs. The team has shortlisted three candidates described in marketing as 'multimodal'.",
      decision:
        "Which candidates have a verified PDF input channel, and which silently fall back to text-only?",
      fields: [
        "Verified modality channels (text-in, image-in, audio-in, video-in, etc.)",
        "Explicit PDF support (if enumerated by the provider)",
        "Input transport accepted (URL, base64, multipart)",
        "Documented size or page caps",
      ],
      nextRoutes: [
        { label: "/select?modality=image-in", href: "/select?modality=image-in" },
        {
          label: "/use-cases/multimodal-input",
          href: "/use-cases/multimodal-input",
        },
        { label: "/lab/multimodal-input-testing", href: "/lab/multimodal-input-testing" },
      ],
    },
    badBetterExample: {
      weak: [
        "Trust the word 'multimodal' on the marketing page.",
        "Assume PDF support if image support is listed.",
        "Skip the silent-fallback test.",
        "Skip asset-size validation.",
      ],
      better: [
        "Confirm modality channels are an enumerated, verified field.",
        "Test each candidate against a representative sample of your assets.",
        "Probe for silent fallbacks (model returns text-only without erroring).",
        "Cap asset sizes at your real workload's 95th percentile.",
      ],
      explanation:
        "Silent modality fallback is the most expensive multimodal failure mode because it produces plausible-looking text instead of an error. The better approach surfaces the fallback before integration.",
    },
    artifactExample: {
      title: "Modality verification note",
      body: [
        "## Modality verification (illustrative)",
        "Workload: scanned-invoice extraction (PDFs, 2–8 pages)",
        "",
        "| Candidate | image-in | pdf-in | source URL | retrievedAt |",
        "| --- | --- | --- | --- | --- |",
        "| <model-A> | verified | verified | <docs> | <date> |",
        "| <model-B> | verified | unverified-data | <docs> | <date> |",
        "",
        "Test plan additions:",
        "- For <model-B>, run a 5-PDF sample to confirm whether PDF support is implicit.",
        "- Record any silent fallback to text-only.",
      ],
    },
    workflowBridge: [
      {
        label: "Learn the concept",
        href: "/learn/multimodal-input",
        purpose: "Confirm the input channels the catalogue actually verifies.",
      },
      {
        label: "Apply in /select",
        href: "/select?modality=image-in",
        purpose: "Filter the catalogue to models with verified image input.",
      },
      {
        label: "Verify in /sources",
        href: "/sources",
        purpose: "Read the modality citation behind each model's verified channels.",
      },
      {
        label: "Test in /lab",
        href: "/lab/multimodal-input-testing",
        purpose: "Run the multimodal input testing playbook on your real assets.",
      },
    ],
    reviewChecklist: [
      "Each candidate's modality channels are an enumerated, verified field.",
      "I have a test plan for assets matching my real traffic distribution.",
      "I will probe each candidate for silent text-only fallback.",
      "Asset-size caps match my workload's 95th percentile.",
      "I have NOT inferred PDF support from generic 'multimodal' copy.",
    ],
  },
  {
    slug: "structured-output",
    title: "Structured output, JSON mode, and tool use",
    oneLine:
      "The difference between structured output, JSON mode, and tool/function calling — and what is currently verified in the catalogue.",
    group: "model-fundamentals",
    applyRoutes: [APPLY_COMPARE, APPLY_SOURCES, APPLY_COVERAGE],
    relatedLessonSlugs: [
      "multimodal-input",
      "how-to-choose-ai-model",
      "testing-ai-models",
    ],
    updatedDate: "2026-05-24",
    teachingExample: {
      situation:
        "A pipeline depends on the model returning JSON that matches a fixed schema. The team needs to confirm the candidate honours an explicit schema rather than just returning valid-looking JSON.",
      decision:
        "Which structured-generation surface (JSON mode, structured output, tool calling) does the candidate actually verify, and against what schema features?",
      fields: [
        "Features field (catalogue capability tag)",
        "API surface name (response_format, tool_choice, etc.)",
        "Schema vocabulary supported",
        "Source citation for the capability",
      ],
      nextRoutes: [
        { label: "/compare/build", href: "/compare/build" },
        { label: "/lab/structured-output-testing", href: "/lab/structured-output-testing" },
        {
          label: "/lab/prompts/structured-extraction",
          href: "/lab/prompts/structured-extraction",
        },
      ],
    },
    badBetterExample: {
      weak: [
        "Treat 'JSON mode' as equivalent to schema-conformant output.",
        "Skip schema validation on the response.",
        "Use one provider's schema vocabulary against another's API.",
        "Assume tool calling works because JSON mode is listed.",
      ],
      better: [
        "Distinguish JSON mode, structured output, and tool calling explicitly.",
        "Validate every response against your real schema with a strict validator.",
        "Confirm the schema vocabulary the candidate accepts (subset of JSON Schema, etc.).",
        "Test each capability in isolation against your real prompts.",
      ],
      explanation:
        "The three capabilities have different API surfaces and different failure modes. The better approach catches schema-shape drift that JSON-syntax checks miss.",
    },
    artifactExample: {
      title: "Structured-output inspection note",
      body: [
        "## Structured-output inspection (illustrative)",
        "Candidate: <slug>",
        "Capability listed (verified): <json-mode / structured-output / tool-calling>",
        "API surface: <response_format / tools / function_call>",
        "Schema bytes used in trial: <hash or filename>",
        "",
        "Trial results (5 prompts):",
        "- P-01 schema-valid: yes",
        "- P-02 schema-valid: no — extra field <name> outside schema",
        "- P-03 schema-valid: yes",
        "- P-04 schema-valid: yes",
        "- P-05 schema-valid: no — type mismatch on <field>",
        "",
        "Action: surface schema failures in the brief; do not infer integration-ready.",
      ],
    },
    workflowBridge: [
      {
        label: "Learn the concept",
        href: "/learn/structured-output",
        purpose: "Distinguish JSON mode, structured output, and tool calling.",
      },
      {
        label: "Apply in /compare/build",
        href: "/compare/build",
        purpose: "Compare verified feature tags across candidates.",
      },
      {
        label: "Verify in /coverage",
        href: "/coverage",
        purpose: "Audit per-provider feature coverage and citation density.",
      },
      {
        label: "Test in /lab",
        href: "/lab/structured-output-testing",
        purpose: "Run the structured-output testing playbook + prompt set.",
      },
    ],
    reviewChecklist: [
      "I have named which structured-generation surface I depend on.",
      "I have a fixed schema and a strict validator.",
      "I have run the structured-extraction prompt set against the candidate.",
      "I have NOT assumed tool calling works because JSON mode is listed.",
      "Schema failures are recorded in the brief, not collapsed to a percentage.",
    ],
  },
  {
    slug: "status-aware-selection",
    title: "Status-aware model selection",
    oneLine:
      "Why vendor-reported status pages and independent probes are kept separate — and when status should gate a model decision.",
    group: "governance-and-sources",
    applyRoutes: [APPLY_SELECT, APPLY_SOURCES, APPLY_REVERIFICATION],
    relatedLessonSlugs: [
      "model-lifecycle",
      "how-to-choose-ai-model",
      "testing-ai-models",
    ],
    updatedDate: "2026-05-24",
    teachingExample: {
      situation:
        "An incident on the provider's status surface says 'partially degraded' but the catalogue's independent probe records normal responses for the same window.",
      decision:
        "Which signal does the team treat as load-bearing for the integration decision, and what gets recorded?",
      fields: [
        "Vendor-reported status (per provider status page)",
        "Independent probe observations (per /api/status/<provider>)",
        "Observation timestamps",
        "Provider docs that define the status surface",
      ],
      nextRoutes: [
        { label: "/status", href: "/status" },
        {
          label: "/research/ai-provider-status-monitoring",
          href: "/research/ai-provider-status-monitoring",
        },
        { label: "/docs/status-observations", href: "/docs/status-observations" },
      ],
    },
    badBetterExample: {
      weak: [
        "Treat the vendor status page as ground truth without checking the probe.",
        "Read observations as an uptime percentage.",
        "Skip the host's status signal when integrating a hosted model.",
        "Reconcile vendor + probe signals silently in your notes.",
      ],
      better: [
        "Keep vendor-reported status and independent probes as separate signals.",
        "Treat observations as timestamps + response shapes, not SLAs.",
        "For hosted models, read the host's status surface AND the creator's.",
        "Record any disagreement between signals as an explicit data point.",
      ],
      explanation:
        "Vendor status pages can lag actual incidents. Keeping signals separate makes the disagreement a data point your reviewer can investigate instead of a hidden assumption.",
    },
    artifactExample: {
      title: "Status observation note",
      body: [
        "## Status observation (illustrative)",
        "Window: <ISO start> to <ISO end>",
        "",
        "Vendor-reported status (per provider page):",
        "- <status> · message: <verbatim>",
        "",
        "Independent probe (per /api/status/<provider>):",
        "- Observations: <n> · response shapes: <summary>",
        "",
        "Disagreement: <yes/no — describe>",
        "Action: <continue / escalate to provider / surface in brief>",
      ],
    },
    workflowBridge: [
      {
        label: "Learn the concept",
        href: "/learn/status-aware-selection",
        purpose: "Separate vendor-reported status from the independent probe.",
      },
      {
        label: "Apply in /status",
        href: "/status",
        purpose: "Inspect both signals side by side per provider.",
      },
      {
        label: "Verify in /sources",
        href: "/sources",
        purpose: "Trace the citation behind the vendor status surface.",
      },
      {
        label: "Test in /lab",
        href: "/lab/model-regression-testing",
        purpose: "Schedule canary observations alongside model regression checks.",
      },
    ],
    reviewChecklist: [
      "Vendor status and independent probe signals are recorded separately.",
      "Observations are NOT presented as an uptime percentage.",
      "For hosted models, the host's status signal is included.",
      "Any signal disagreement is a recorded data point.",
      "Status is gated to the workloads where it actually matters.",
    ],
  },
  {
    slug: "benchmark-limitations",
    title: "Why benchmark scores can mislead",
    oneLine:
      "Contamination, prompt variance, version drift, and why the catalogue does not publish provider-reported benchmark scores casually.",
    group: "comparison-methodology",
    applyRoutes: [APPLY_COMPARE, APPLY_SOURCES, APPLY_DEMOS],
    relatedLessonSlugs: [
      "how-to-choose-ai-model",
      "testing-ai-models",
      "structured-output",
    ],
    updatedDate: "2026-05-24",
    teachingExample: {
      situation:
        "A vendor blog cites a benchmark figure that appears stronger than the team's prior workload-specific evaluation. The team is asked whether to switch candidates based on the new figure.",
      decision:
        "Does the vendor's benchmark methodology meet our reproducibility bar, and how should the figure be treated in our brief?",
      fields: [
        "Benchmark definition (catalogue entity)",
        "Provider's published methodology",
        "Snapshot tested",
        "Our own workload acceptance rubric",
      ],
      nextRoutes: [
        { label: "/benchmarks", href: "/benchmarks" },
        {
          label: "/research/benchmark-limitations",
          href: "/research/benchmark-limitations",
        },
        { label: "/lab/prompts/instruction-following", href: "/lab/prompts/instruction-following" },
      ],
    },
    badBetterExample: {
      weak: [
        "Switch candidates based on a vendor-cited benchmark figure.",
        "Treat one provider's numbers as comparable to another's.",
        "Skip the methodology check.",
        "Assume newer snapshot = better benchmark.",
      ],
      better: [
        "Confirm the benchmark definition the vendor cited matches the one the team cares about.",
        "Check whether the methodology is independently reproducible.",
        "Recognise prompt-variance and version-drift effects in your interpretation.",
        "Rely on workload-specific tests; benchmark figures are not selection evidence on their own.",
      ],
      explanation:
        "Without independently reproducible methodology, a benchmark figure is a marketing artifact. The better approach uses the benchmark definition as a vocabulary, not as a comparable score.",
    },
    artifactExample: {
      title: "Benchmark interpretation note",
      body: [
        "## Benchmark interpretation (illustrative)",
        "Cited figure: <verbatim quote>",
        "Source: <vendor URL>",
        "Benchmark definition referenced: <name + canonical link>",
        "",
        "Methodology check:",
        "- Snapshot tested: <slug>",
        "- Prompt templates published: <yes / no>",
        "- Independent reproduction available: <yes / no>",
        "",
        "Interpretation: <treat as marketing artifact / treat as reproducible signal>",
        "Decision impact: <none, until workload-specific tests support it>",
      ],
    },
    workflowBridge: [
      {
        label: "Learn the concept",
        href: "/learn/benchmark-limitations",
        purpose: "Understand why catalogue benchmarks are definitions, not scores.",
      },
      {
        label: "Apply in /benchmarks",
        href: "/benchmarks",
        purpose: "Read the benchmark definition before reading any cited figure.",
      },
      {
        label: "Verify in /sources",
        href: "/sources",
        purpose: "Trace any cited figure back to its primary source + methodology.",
      },
      {
        label: "Test in /lab",
        href: "/lab/prompts/instruction-following",
        purpose: "Run your own evaluation prompt set instead of trusting a published score.",
      },
    ],
    reviewChecklist: [
      "I can name the benchmark definition referenced — not just the figure.",
      "I checked whether the methodology is independently reproducible.",
      "I have NOT used the figure as selection evidence on its own.",
      "Workload-specific tests will drive the decision.",
      "Any figure in the brief is paired with the methodology caveat.",
    ],
  },
];

export const lessonGroups: LessonGroup[] = [
  {
    slug: "model-fundamentals",
    title: "Model fundamentals",
    description:
      "What a model record actually contains — identifiers, context window, output limits, modalities, lifecycle, citations.",
    lessonSlugs: [
      "how-to-choose-ai-model",
      "context-window",
      "multimodal-input",
      "structured-output",
    ],
  },
  {
    slug: "pricing-and-hosted",
    title: "Pricing and hosted inference",
    description:
      "How pricing references work, why hosted pricing belongs to the host, and how to compare without ranking by price.",
    lessonSlugs: ["pricing-references", "hosted-vs-first-party"],
  },
  {
    slug: "comparison-methodology",
    title: "Comparison methodology",
    description:
      "How verified-field comparisons are constructed, why the catalogue never declares a winner, and how to read missing values.",
    lessonSlugs: [
      "how-to-choose-ai-model",
      "context-window",
      "benchmark-limitations",
    ],
  },
  {
    slug: "governance-and-sources",
    title: "Governance and source verification",
    description:
      "Lifecycle status, freshness states, the reverification queue, and what a citation actually attests to.",
    lessonSlugs: ["model-lifecycle", "status-aware-selection"],
  },
  {
    slug: "testing-workflow",
    title: "Practical testing workflow",
    description:
      "The work the catalogue cannot do for you: running your own tests against the shortlisted models.",
    lessonSlugs: ["testing-ai-models"],
  },
];

export function getLesson(slug: string): LessonSummary | undefined {
  return lessons.find((l) => l.slug === slug);
}

export function getLessonsForGroup(
  group: LessonGroupSlug
): LessonSummary[] {
  const seen = new Set<string>();
  const def = lessonGroups.find((p) => p.slug === group);
  if (!def) return [];
  const out: LessonSummary[] = [];
  for (const slug of def.lessonSlugs) {
    const lesson = getLesson(slug);
    if (lesson && !seen.has(lesson.slug)) {
      seen.add(lesson.slug);
      out.push(lesson);
    }
  }
  return out;
}

export function getLessonRoutes(): string[] {
  return lessons.map((l) => `/learn/${l.slug}`);
}

export function getRelatedLessons(slug: LessonSlug): LessonSummary[] {
  const lesson = getLesson(slug);
  if (!lesson) return [];
  return lesson.relatedLessonSlugs
    .map((s) => getLesson(s))
    .filter((l): l is LessonSummary => Boolean(l));
}
