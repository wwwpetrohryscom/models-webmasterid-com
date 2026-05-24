/**
 * Learning exercises — Sprint 29 practical layer.
 *
 * Each exercise is a structured workflow that walks a reader from a
 * lesson concept into the verified-data product surfaces, producing a
 * concrete evidence artifact at the end (a shortlist URL, a comparison
 * URL, a brief export, or a source/freshness note).
 *
 * Discipline:
 *   - No quizzes, no scoring, no "correct answer".
 *   - Never recommend a model. Steps route the reader through the
 *     catalogue and surface the verified fields they should look at.
 *   - Expected outcomes are evidence artifacts, not endorsements.
 *   - Every exercise carries an explicit policy note.
 */

export type LearningExerciseSlug =
  | "build-first-shortlist"
  | "compare-context-windows"
  | "map-hosted-provider"
  | "review-pricing-reference"
  | "inspect-model-lifecycle"
  | "create-decision-brief"
  | "check-source-freshness"
  | "plan-external-model-test";

export type LearningExerciseDifficulty = "beginner" | "intermediate";

export interface LearningExerciseStep {
  title: string;
  instruction: string;
  route: string;
  expectedOutcome: string;
}

export interface LearningExercise {
  slug: LearningExerciseSlug;
  title: string;
  summary: string;
  difficulty: LearningExerciseDifficulty;
  estimatedMinutes: number;
  relatedLessonSlugs: string[];
  goal: string;
  prerequisites: string[];
  steps: LearningExerciseStep[];
  completionChecklist: string[];
  policyNote: string;
  evidenceArtifact: string;
}

export const learningExercises: LearningExercise[] = [
  {
    slug: "build-first-shortlist",
    title: "Build your first source-backed shortlist",
    summary:
      "Pick a use case, filter the catalogue by verified fields, and end with a shortlist URL you can share with the team.",
    difficulty: "beginner",
    estimatedMinutes: 8,
    relatedLessonSlugs: [
      "how-to-choose-ai-model",
      "context-window",
      "model-lifecycle",
    ],
    goal: "Produce a deterministic shortlist URL that captures which use case, which verified-field filters, and which model order the catalogue surfaced.",
    prerequisites: [
      "Read /learn/how-to-choose-ai-model so the workflow framing makes sense.",
      "Know which workload you are evaluating (long-context, multimodal, hosted, governance, or another existing use case).",
    ],
    steps: [
      {
        title: "Pick a use case",
        instruction:
          "Open the use cases hub and choose the one that matches the workload you are evaluating.",
        route: "/use-cases",
        expectedOutcome:
          "You can name which verified fields the use case asks the catalogue to weight.",
      },
      {
        title: "Open the selection workspace with your use case pre-selected",
        instruction:
          "Visit /select and set the Use case filter, then narrow further by lifecycle (active only) and verified pricing coverage if relevant.",
        route: "/select",
        expectedOutcome:
          "The URL bar now carries your filter selections — copy this URL, it is your shortlist artifact.",
      },
      {
        title: "Read the deterministic order",
        instruction:
          "The shortlist orders by verified field count, active lifecycle, source count, name — never by score. Read the rows top to bottom.",
        route: "/select",
        expectedOutcome:
          "You can describe out loud why each row is ordered where it is, without invoking quality or price as the reason.",
      },
      {
        title: "Open a top-three candidate model page",
        instruction:
          "Click any model name in the shortlist. Read the verified-field rows and the citation count.",
        route: "/models",
        expectedOutcome:
          "You can name at least one data gap (an unverified field) for that model.",
      },
    ],
    completionChecklist: [
      "The shortlist URL is saved.",
      "You can describe why the shortlist ordered itself the way it did.",
      "You named at least one data gap on the top candidate.",
      "You did NOT pick a winner.",
    ],
    policyNote:
      "Shortlists are inspection orderings, not rankings. The exercise produces a URL — never a verdict on which model is best.",
    evidenceArtifact:
      "A /select URL with your use-case + filter parameters that opens the same shortlist for any teammate.",
  },
  {
    slug: "compare-context-windows",
    title: "Compare context windows without ranking models",
    summary:
      "Use the comparison builder to render verified context window + max output tokens for 3–4 candidate models side by side.",
    difficulty: "beginner",
    estimatedMinutes: 7,
    relatedLessonSlugs: ["context-window", "how-to-choose-ai-model"],
    goal: "Render a side-by-side comparison page where the only verified fields you look at are context window and max output tokens — and articulate what those values do not tell you.",
    prerequisites: [
      "Read /learn/context-window so the difference between context window and max output is clear.",
      "Have a list of 3–4 candidate model slugs in mind (your shortlist from the previous exercise, or any active models from /models).",
    ],
    steps: [
      {
        title: "Open the comparison builder",
        instruction:
          "Visit /compare/build and select 3 or 4 candidate models. Optionally set the use-case filter.",
        route: "/compare/build",
        expectedOutcome:
          "The page renders columns for your selected models. The URL captures the selection.",
      },
      {
        title: "Read context window and max output rows",
        instruction:
          "Locate the verified context window and max output token rows. Note which columns render a verified value vs the unverified-data label.",
        route: "/compare/build",
        expectedOutcome:
          "You can describe the spread of context windows and max output limits across the columns — without naming a winner.",
      },
      {
        title: "Open the citation for the largest context window",
        instruction:
          "Click through to the model page for the row with the largest verified context window. Read the citation it points at.",
        route: "/models",
        expectedOutcome:
          "You can name the primary source the catalogue cited for that value and when it was retrieved.",
      },
      {
        title: "Note what context size does not guarantee",
        instruction:
          "Write down (or paste into your notes) the workload-specific behaviours the catalogue does not measure: deep-recall accuracy, instruction-following at length, prompt-size pricing tier impact.",
        route: "/learn/context-window",
        expectedOutcome:
          "Your notes capture at least three things you still need to test in your own environment.",
      },
    ],
    completionChecklist: [
      "The comparison URL is saved.",
      "You can describe the spread of context windows.",
      "You read the source URL for at least one verified value.",
      "You did NOT pick the model with the largest context window as the winner.",
    ],
    policyNote:
      "Context window is a necessary condition, not a sufficient one. The comparison is a substrate for your own tests, not a verdict.",
    evidenceArtifact:
      "A /compare/build URL with 3–4 model slugs that any teammate can open to see the same comparison.",
  },
  {
    slug: "map-hosted-provider",
    title: "Map a hosted provider relationship",
    summary:
      "Pick a hosted model in the catalogue, trace creator vs billing provider, and read the hosted pricing reference's source citation.",
    difficulty: "intermediate",
    estimatedMinutes: 10,
    relatedLessonSlugs: ["hosted-vs-first-party", "pricing-references"],
    goal: "Demonstrate that you can separate model creator from billing provider for a hosted model, and read both pricing references against their own primary sources.",
    prerequisites: [
      "Read /learn/hosted-vs-first-party so the creator-vs-host distinction is clear.",
      "Read /learn/pricing-references so the references-not-quotes framing is in place.",
    ],
    steps: [
      {
        title: "Open the use case that filters for hosted models",
        instruction:
          "Visit /use-cases/hosted-inference and read which verified fields the workflow weights.",
        route: "/use-cases/hosted-inference",
        expectedOutcome:
          "You can name the fields the hosted-inference use case asks the catalogue to surface.",
      },
      {
        title: "Open the hosted-inference selection workspace",
        instruction:
          "Visit /select?useCase=hosted-inference&hostedAvailability=true. Pick any model in the shortlist.",
        route: "/select?useCase=hosted-inference&hostedAvailability=true",
        expectedOutcome:
          "You have a model slug whose record carries at least one hosted availability row.",
      },
      {
        title: "Read the model page for creator vs host",
        instruction:
          "On the model page, identify the providerSlug (creator) and the hosted availability entries (host × hosted model ID × hosted pricing).",
        route: "/models",
        expectedOutcome:
          "You can name the creator and at least one billing platform for the model.",
      },
      {
        title: "Open the citation for one hosted pricing row",
        instruction:
          "Click the citation linked to one hosted pricing reference. Note its retrievedAt date and the URL it points at.",
        route: "/sources",
        expectedOutcome:
          "You can quote the host's pricing page URL and the retrieval date.",
      },
      {
        title: "Note the data gap on the same row",
        instruction:
          "Look for any field on the hosted record that renders the unverified-data label. If pricing is verified but rate limit is not, that gap is your test plan input.",
        route: "/learn/hosted-vs-first-party",
        expectedOutcome:
          "Your notes name at least one field about the host that you still need to confirm externally.",
      },
    ],
    completionChecklist: [
      "You named the model creator and the billing platform separately.",
      "You opened the hosted pricing citation directly.",
      "You wrote down at least one host-side data gap.",
      "You did NOT rank the hosting platforms by price.",
    ],
    policyNote:
      "The exercise produces evidence about how the catalogue separates creator from host — it does not pick a hosting platform for any workload.",
    evidenceArtifact:
      "A /sources citation URL for the hosted pricing reference plus a short note listing the creator, the billing platform, and the data gap.",
  },
  {
    slug: "review-pricing-reference",
    title: "Review a pricing reference safely",
    summary:
      "Open a verified pricing row, read its unit semantics + retrieval date, and walk the reverification queue if it is stale.",
    difficulty: "beginner",
    estimatedMinutes: 6,
    relatedLessonSlugs: ["pricing-references", "hosted-vs-first-party"],
    goal: "Read a pricing reference the way the catalogue intends — as a sourced reference, not a live quote — including unit semantics, retrieval date, and freshness state.",
    prerequisites: [
      "Read /learn/pricing-references so the references-not-quotes framing is in place.",
    ],
    steps: [
      {
        title: "Open the pricing hub",
        instruction:
          "Visit /pricing and pick any row with a verified amount.",
        route: "/pricing",
        expectedOutcome:
          "You have a specific verified pricing reference to inspect.",
      },
      {
        title: "Identify the unit and currency",
        instruction:
          "Read the unit column (input vs output tokens, cache reads vs writes, per-second compute) and the currency. Write both down.",
        route: "/pricing",
        expectedOutcome:
          "You can name the unit semantics — not just the numeric value.",
      },
      {
        title: "Open the citation",
        instruction:
          "Click through to the pricing row's citation. Note the retrievedAt date and confirm the URL is the provider's official pricing page.",
        route: "/sources",
        expectedOutcome:
          "You can quote the source URL and the retrievedAt date.",
      },
      {
        title: "Check the reverification queue for the same source",
        instruction:
          "Visit /reverification?provider=<provider-slug> and confirm whether the same pricing row appears on the queue (stale or review-due).",
        route: "/reverification",
        expectedOutcome:
          "You know whether the catalogue currently flags this row as needing re-check.",
      },
    ],
    completionChecklist: [
      "You named the unit semantics, not just the numeric value.",
      "You opened the pricing citation directly.",
      "You checked the reverification queue for the same source.",
      "You did NOT use the row as a live quote.",
    ],
    policyNote:
      "Pricing rows are references with retrieval dates, not invoices. The exercise produces a sourced note, never a price ranking.",
    evidenceArtifact:
      "A short note with provider, unit, retrievedAt, and queue state — copyable into any pricing review document.",
  },
  {
    slug: "inspect-model-lifecycle",
    title: "Inspect lifecycle before integration",
    summary:
      "Pull lifecycle state for a candidate model, check for retirement date, and add a migration target to your notes if one exists.",
    difficulty: "beginner",
    estimatedMinutes: 5,
    relatedLessonSlugs: ["model-lifecycle", "how-to-choose-ai-model"],
    goal: "Make lifecycle a hard gate on integration decisions instead of a footnote.",
    prerequisites: [
      "Read /learn/model-lifecycle so the four states (active, preview, deprecated, retired) are clear.",
    ],
    steps: [
      {
        title: "Open the selection workspace and filter for active",
        instruction:
          "Visit /select?lifecycle=active and confirm the shortlist only includes active models.",
        route: "/select?lifecycle=active",
        expectedOutcome:
          "Your candidate list contains only models with a verified active lifecycle field.",
      },
      {
        title: "Open one model record",
        instruction:
          "Click any candidate. Read the lifecycle field, its citation, and any retirement date.",
        route: "/models",
        expectedOutcome:
          "You can name the lifecycle state and the date of the citation.",
      },
      {
        title: "Look up the same provider's deprecated entries",
        instruction:
          "Switch the filter to /select?provider=<provider-slug>&lifecycle=deprecated. Note any models the provider has deprecated.",
        route: "/select",
        expectedOutcome:
          "You can describe the provider's recent deprecation cadence — useful context for integration timing.",
      },
      {
        title: "Open the coverage audit",
        instruction:
          "Visit /coverage to see whether the provider's verification + lifecycle coverage is healthy.",
        route: "/coverage",
        expectedOutcome:
          "You can name the verified-field count and citation density for the provider.",
      },
    ],
    completionChecklist: [
      "You confirmed the candidate is in an active lifecycle state.",
      "You read the lifecycle citation.",
      "You checked the provider's deprecation history.",
      "You did NOT integrate a deprecated snapshot 'just for now'.",
    ],
    policyNote:
      "Lifecycle is a gate, not a footnote. The exercise produces a lifecycle note — the catalogue does not assert a migration path for you.",
    evidenceArtifact:
      "A short lifecycle note: state, citation URL, retrievedAt, and any retirement date — paste-ready into a design doc.",
  },
  {
    slug: "create-decision-brief",
    title: "Create a decision evidence brief",
    summary:
      "Use the decision brief builder to generate a paste-ready evidence pack from your shortlist, then export it in Markdown.",
    difficulty: "intermediate",
    estimatedMinutes: 10,
    relatedLessonSlugs: [
      "how-to-choose-ai-model",
      "testing-ai-models",
      "pricing-references",
    ],
    goal: "Produce a Markdown evidence brief that captures verified fields, data gaps, source trails, and freshness — ready for the next reviewer.",
    prerequisites: [
      "Read /learn/how-to-choose-ai-model and /learn/testing-ai-models so the brief framing is clear.",
      "Have a shortlist or comparison URL from the earlier exercises.",
    ],
    steps: [
      {
        title: "Open the decision brief builder",
        instruction:
          "Visit /briefs/build and select 2–4 candidate models, optionally with a use-case filter.",
        route: "/briefs/build",
        expectedOutcome:
          "The page renders the evidence summary, verified fields, data gaps, source trail, and freshness notes.",
      },
      {
        title: "Read the evidence summary",
        instruction:
          "Confirm the brief lists every verified field with its citation, and every data gap as an explicit gap row.",
        route: "/briefs/build",
        expectedOutcome:
          "You can name how many evidence fields are verified vs how many are gaps.",
      },
      {
        title: "Export the brief in Markdown",
        instruction:
          "Open /api/briefs/decision?models=<slug1>,<slug2>&useCase=<slug> to get the Markdown export.",
        route: "/api/briefs/decision",
        expectedOutcome:
          "You have a Markdown file you can paste into a design doc, ticket, or PR description.",
      },
      {
        title: "Read the example brief",
        instruction:
          "Compare your brief to the published example to confirm structure parity.",
        route: "/examples/decision-brief",
        expectedOutcome:
          "You can describe how the catalogue's brief differs from a model recommendation — same fields, no verdict.",
      },
    ],
    completionChecklist: [
      "Your brief lists verified fields with citations.",
      "Your brief lists data gaps explicitly.",
      "Your brief carries a freshness note.",
      "You did NOT add a 'recommendation' section to the brief.",
    ],
    policyNote:
      "The brief is an evidence pack for the next reviewer. It is not a recommendation, and the exercise never adds one.",
    evidenceArtifact:
      "A Markdown brief from /api/briefs/decision that any reviewer can read independently.",
  },
  {
    slug: "check-source-freshness",
    title: "Check source freshness and reverification state",
    summary:
      "Open the sources hub for a provider, identify any stale citations, and walk the reverification queue to see what is due for re-check.",
    difficulty: "beginner",
    estimatedMinutes: 5,
    relatedLessonSlugs: ["pricing-references", "model-lifecycle"],
    goal: "Treat freshness as part of the evidence pack, not an afterthought. End with a list of citations you have personally re-read or queued.",
    prerequisites: [
      "Know which provider you care about. Optional: read /learn/pricing-references first.",
    ],
    steps: [
      {
        title: "Open the sources hub for the provider",
        instruction:
          "Visit /sources?provider=<provider-slug> and inspect the citation table.",
        route: "/sources",
        expectedOutcome:
          "You can see every primary-source URL the catalogue uses for that provider, with retrievedAt dates.",
      },
      {
        title: "Open the reverification queue with the same filter",
        instruction:
          "Visit /reverification?provider=<provider-slug>. Note any citation flagged as review-due or stale.",
        route: "/reverification",
        expectedOutcome:
          "You have a concrete list of citations that need re-reading before you ship.",
      },
      {
        title: "Re-read one stale citation in a real browser",
        instruction:
          "Open the most important stale citation in your own browser and confirm what the provider's page currently says.",
        route: "/sources",
        expectedOutcome:
          "You can quote the current page contents against the catalogue's recorded value.",
      },
      {
        title: "Export the reverification checklist",
        instruction:
          "Open /api/reverification/checklist?format=json or ?format=markdown to capture the queue in a paste-ready form.",
        route: "/api/reverification/checklist",
        expectedOutcome:
          "You have a checklist artifact you can attach to your review notes.",
      },
    ],
    completionChecklist: [
      "You can name which citations are stale for the chosen provider.",
      "You re-read at least one stale citation in a real browser.",
      "You exported the checklist as Markdown or JSON.",
      "You did NOT treat a stale citation as fresh evidence.",
    ],
    policyNote:
      "Freshness is part of the evidence pack. The exercise produces a checklist — the catalogue does not silently mutate stale values.",
    evidenceArtifact:
      "A Markdown or JSON checklist from /api/reverification/checklist scoped to the chosen provider.",
  },
  {
    slug: "plan-external-model-test",
    title: "Plan an external model test",
    summary:
      "Use the brief and the testing lesson to plan your own prompt, latency, rate-limit, and cost validation work for the shortlist.",
    difficulty: "intermediate",
    estimatedMinutes: 12,
    relatedLessonSlugs: ["testing-ai-models", "how-to-choose-ai-model"],
    goal: "Leave the catalogue with a written test plan that pairs the brief with the workload-specific tests only your team can run.",
    prerequisites: [
      "Read /learn/testing-ai-models so the prompt/latency/cost/compliance categories are clear.",
      "Have a brief Markdown export from the create-decision-brief exercise.",
    ],
    steps: [
      {
        title: "Re-open your brief",
        instruction:
          "Re-export the brief from /briefs/build or /api/briefs/decision so you have the current evidence pack.",
        route: "/briefs/build",
        expectedOutcome:
          "Your brief is current as of today's build date.",
      },
      {
        title: "Read the data gaps section",
        instruction:
          "The brief's data-gap list is your test plan input. For each gap, write down which test will resolve it (prompt test, latency test, rate-limit test, cost projection, compliance review).",
        route: "/briefs/build",
        expectedOutcome:
          "Every data gap has a named test that will close it.",
      },
      {
        title: "Add a prompt test",
        instruction:
          "Choose 3–5 real prompts (or representative ones) and a quality rubric. Note where each shortlisted model will be called from.",
        route: "/learn/testing-ai-models",
        expectedOutcome:
          "You have a prompt test plan with at least one acceptance criterion per prompt.",
      },
      {
        title: "Add a cost projection",
        instruction:
          "Multiply your expected traffic mix by each shortlisted model's verified per-unit pricing references. Watch for unit semantics across providers.",
        route: "/learn/pricing-references",
        expectedOutcome:
          "You have a per-model monthly cost projection your finance reviewer can sanity-check.",
      },
      {
        title: "Pair the brief with your test plan",
        instruction:
          "Attach the brief Markdown to your test plan as the catalogue's contribution; your tests are your team's contribution.",
        route: "/examples/decision-brief",
        expectedOutcome:
          "Reviewer pack = brief + test plan. Neither one alone is the artifact.",
      },
    ],
    completionChecklist: [
      "Every data gap in the brief is paired with a planned test.",
      "Prompt test plan has acceptance criteria.",
      "Cost projection accounts for unit semantics.",
      "You did NOT skip compliance review because the model was 'verified'.",
    ],
    policyNote:
      "The exercise produces a test plan — the catalogue does not run your tests for you, and verification is never certification.",
    evidenceArtifact:
      "A written test plan (Markdown or doc) that pairs your brief with the workload-specific tests.",
  },
];

export function getLearningExercise(
  slug: string
): LearningExercise | undefined {
  return learningExercises.find((e) => e.slug === slug);
}

export function getExercisesForLesson(
  lessonSlug: string
): LearningExercise[] {
  return learningExercises.filter((e) =>
    e.relatedLessonSlugs.includes(lessonSlug)
  );
}

export interface LearningExerciseGroup {
  difficulty: LearningExerciseDifficulty;
  label: string;
  exercises: LearningExercise[];
}

export function getLearningExerciseGroups(): LearningExerciseGroup[] {
  return [
    {
      difficulty: "beginner",
      label: "Beginner exercises",
      exercises: learningExercises.filter((e) => e.difficulty === "beginner"),
    },
    {
      difficulty: "intermediate",
      label: "Intermediate exercises",
      exercises: learningExercises.filter(
        (e) => e.difficulty === "intermediate"
      ),
    },
  ];
}

export function getLearningExerciseRoutes(): string[] {
  return learningExercises.map((e) => `/learn/exercises/${e.slug}`);
}
