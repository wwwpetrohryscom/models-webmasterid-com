/**
 * Role-based learning paths — Sprint 30 AI usage curriculum.
 *
 * The catalogue's lessons (lib/lessons.ts) explain individual
 * verified-data concepts; the exercises (lib/learning-exercises.ts)
 * route those concepts through the workflow surfaces and produce
 * evidence artifacts. A learning path stitches both into a sequenced
 * curriculum for one role:
 *
 *   role-based path → lessons → exercises → workflows → artifacts
 *
 * Positioning: AI usage learning platform powered by verified model
 * intelligence. Each path frames "Learn → Apply → Verify".
 *
 * Discipline:
 *   - Paths are guidance, never certifications.
 *   - No completion state, no accounts, no progress tracking, no
 *     mastery/winner claims, no SEO/automation guarantees.
 *   - Path steps reference existing lesson slugs, existing exercise
 *     slugs, or canonical workflow routes — paths never introduce a
 *     parallel UI for the same workflow.
 *   - Every path lists what the reader will learn, what they will
 *     build, the evidence artifacts they will end with, the tools
 *     they will use, and an explicit "does not promise" list.
 */

import { getLesson, type LessonSlug } from "./lessons";
import {
  getLearningExercise,
  type LearningExerciseSlug,
} from "./learning-exercises";

export type LearningPathSlug =
  | "beginner"
  | "developer"
  | "product-manager"
  | "governance"
  | "automation-specialist";

export type LearningPathAudience =
  | "newcomer"
  | "developer"
  | "product"
  | "governance"
  | "automation";

export type LearningPathDifficulty = "beginner" | "intermediate";

export type LearningPathStep =
  | {
      type: "lesson";
      slug: LessonSlug;
      title: string;
      purpose: string;
      estimatedMinutes: number;
    }
  | {
      type: "exercise";
      slug: LearningExerciseSlug;
      title: string;
      purpose: string;
      estimatedMinutes: number;
    }
  | {
      type: "workflow";
      href: string;
      title: string;
      purpose: string;
      estimatedMinutes: number;
    };

export interface LearningPathTool {
  label: string;
  href: string;
  purpose: string;
}

export interface LearningPath {
  slug: LearningPathSlug;
  title: string;
  audience: LearningPathAudience;
  audienceLabel: string;
  summary: string;
  estimatedMinutes: number;
  difficulty: LearningPathDifficulty;
  whatYouWillLearn: string[];
  whatYouWillBuild: string[];
  evidenceArtifacts: string[];
  prerequisites: string[];
  steps: LearningPathStep[];
  toolsUsed: LearningPathTool[];
  doesNotPromise: string[];
  policyNote: string;
}

// ---------------------------------------------------------------------------
// Step builders. They resolve titles from the lesson + exercise registries
// so any rename in either file flows through to the paths automatically.
// ---------------------------------------------------------------------------

const LESSON_READ_MINUTES = 5;

function lessonStep(
  slug: LessonSlug,
  purpose: string,
  minutes: number = LESSON_READ_MINUTES
): LearningPathStep {
  const lesson = getLesson(slug);
  if (!lesson) {
    throw new Error(
      `learning-paths: lesson slug "${slug}" missing from registry — fix lib/lessons.ts before adding this path step.`
    );
  }
  return {
    type: "lesson",
    slug,
    title: lesson.title,
    purpose,
    estimatedMinutes: minutes,
  };
}

function exerciseStep(
  slug: LearningExerciseSlug,
  purpose: string
): LearningPathStep {
  const exercise = getLearningExercise(slug);
  if (!exercise) {
    throw new Error(
      `learning-paths: exercise slug "${slug}" missing from registry — fix lib/learning-exercises.ts before adding this path step.`
    );
  }
  return {
    type: "exercise",
    slug,
    title: exercise.title,
    purpose,
    estimatedMinutes: exercise.estimatedMinutes,
  };
}

function workflowStep(
  href: string,
  title: string,
  purpose: string,
  minutes: number = 5
): LearningPathStep {
  return {
    type: "workflow",
    href,
    title,
    purpose,
    estimatedMinutes: minutes,
  };
}

function totalMinutes(steps: LearningPathStep[]): number {
  return steps.reduce((sum, s) => sum + s.estimatedMinutes, 0);
}

// Reusable tools for the toolsUsed section. The href + purpose are
// stable across paths so any rename of a workspace flows through.
const TOOL_LEARN: LearningPathTool = {
  href: "/learn",
  label: "Learn hub",
  purpose: "Concept lessons that explain each verified field.",
};
const TOOL_EXERCISES: LearningPathTool = {
  href: "/learn/exercises",
  label: "Exercises",
  purpose: "Practical workflows that end with evidence artifacts.",
};
const TOOL_SELECT: LearningPathTool = {
  href: "/select",
  label: "Selection workspace",
  purpose: "Filter the catalogue by use case, lifecycle, verification.",
};
const TOOL_COMPARE: LearningPathTool = {
  href: "/compare/build",
  label: "Comparison builder",
  purpose: "Render verified fields side by side for 2–4 models.",
};
const TOOL_BRIEFS: LearningPathTool = {
  href: "/briefs/build",
  label: "Decision brief builder",
  purpose: "Export a Markdown or JSON evidence brief.",
};
const TOOL_SOURCES: LearningPathTool = {
  href: "/sources",
  label: "Citation registry",
  purpose: "Every primary-source URL the catalogue references.",
};
const TOOL_COVERAGE: LearningPathTool = {
  href: "/coverage",
  label: "Coverage audit",
  purpose: "Per-provider verified-field counts and citation density.",
};
const TOOL_REVERIFICATION: LearningPathTool = {
  href: "/reverification",
  label: "Reverification queue",
  purpose: "Sources due for manual re-check with retrievedAt dates.",
};

// ---------------------------------------------------------------------------
// Path construction.
// ---------------------------------------------------------------------------

function buildBeginnerPath(): LearningPath {
  const steps: LearningPathStep[] = [
    lessonStep(
      "how-to-choose-ai-model",
      "Frame the decision workflow before opening the catalogue."
    ),
    lessonStep(
      "context-window",
      "Understand the verified field most beginners over-weight."
    ),
    lessonStep(
      "model-lifecycle",
      "Treat lifecycle as a hard gate, not a footnote."
    ),
    exerciseStep(
      "build-first-shortlist",
      "End with a /select URL that captures your filter choices."
    ),
    exerciseStep(
      "compare-context-windows",
      "End with a /compare/build URL that renders verified context fields side by side."
    ),
    exerciseStep(
      "create-decision-brief",
      "End with a paste-ready Markdown evidence brief."
    ),
    exerciseStep(
      "check-source-freshness",
      "End with a freshness checklist for the citations you depend on."
    ),
  ];
  return {
    slug: "beginner",
    title: "AI model basics for careful users",
    audience: "newcomer",
    audienceLabel: "Newcomer to AI model selection",
    summary:
      "Three foundational readings + four practical exercises. Walks from a use case to a paste-ready evidence brief plus a freshness checklist. Built for readers new to the catalogue.",
    estimatedMinutes: totalMinutes(steps),
    difficulty: "beginner",
    whatYouWillLearn: [
      "How to frame an AI model selection workflow before opening the catalogue.",
      "What a verified context window guarantees — and what it does not.",
      "What active / preview / deprecated / retired lifecycle states actually mean.",
      "Why the catalogue records data gaps as the unverified-data label rather than guessing.",
    ],
    whatYouWillBuild: [
      "A /select URL that opens your shortlist for any teammate.",
      "A /compare/build URL that renders verified context fields side by side.",
      "A Markdown decision brief paste-ready for a PR or design doc.",
      "A freshness checklist scoped to the citations you depend on.",
    ],
    evidenceArtifacts: [
      "Shortlist URL",
      "Comparison URL",
      "Markdown evidence brief",
      "Source freshness checklist",
    ],
    prerequisites: [],
    steps,
    toolsUsed: [
      TOOL_LEARN,
      TOOL_EXERCISES,
      TOOL_SELECT,
      TOOL_COMPARE,
      TOOL_BRIEFS,
      TOOL_SOURCES,
      TOOL_REVERIFICATION,
    ],
    doesNotPromise: [
      "Picking which model is best for your workload.",
      "A completion certificate, badge, or score.",
      "A substitute for your own workload-specific testing.",
    ],
    policyNote:
      "Guidance, not certification. There is no completion state, no account, no certificate — the artifacts you produce are the proof of completion.",
  };
}

function buildDeveloperPath(): LearningPath {
  const steps: LearningPathStep[] = [
    lessonStep(
      "hosted-vs-first-party",
      "Separate the model creator from the billing provider before you integrate."
    ),
    lessonStep(
      "multimodal-input",
      "Confirm the input channels the catalogue actually verifies."
    ),
    lessonStep(
      "structured-output",
      "Distinguish JSON mode from structured output from tool calling."
    ),
    lessonStep(
      "testing-ai-models",
      "Read the testing framework the catalogue does not run for you."
    ),
    exerciseStep(
      "map-hosted-provider",
      "End with a creator + billing platform + data-gap note for a hosted model."
    ),
    exerciseStep(
      "create-decision-brief",
      "End with a Markdown brief covering the technical fields your reviewer needs."
    ),
    exerciseStep(
      "plan-external-model-test",
      "End with a written test plan that pairs the brief with workload-specific tests."
    ),
    workflowStep(
      "/compare/build?useCase=hosted-inference",
      "Open the hosted-inference comparison builder",
      "Pre-seed the builder so the verified hosted-availability + hosted-pricing fields land in your evidence."
    ),
    workflowStep(
      "/briefs/build?useCase=hosted-inference",
      "Open the hosted-inference brief builder",
      "Pre-seed the brief builder so the evidence pack stays consistent with the comparison."
    ),
  ];
  return {
    slug: "developer",
    title: "Technical model evaluation before integration",
    audience: "developer",
    audienceLabel: "Engineer preparing an integration",
    summary:
      "Four readings + three exercises + two pre-seeded workflows. Walks the verified fields a developer needs (hosted creator vs host, modality channels, structured generation, the testing framework) and ends with a comparison URL, an evidence brief, and a written external test plan.",
    estimatedMinutes: totalMinutes(steps),
    difficulty: "intermediate",
    whatYouWillLearn: [
      "How the catalogue separates model creator from billing provider.",
      "Why marketing copy is not enough to assume modality support.",
      "The difference between JSON mode, structured output, and tool calling.",
      "Which workload-specific tests the catalogue cannot run for you.",
    ],
    whatYouWillBuild: [
      "A hosted-provider mapping note (creator + host + data gap).",
      "A pre-seeded /compare/build URL for hosted inference.",
      "A Markdown evidence brief covering the technical evaluation fields.",
      "A written external test plan paired with the brief.",
    ],
    evidenceArtifacts: [
      "Hosted-provider mapping note",
      "Verified comparison URL",
      "Decision evidence brief",
      "External test plan",
    ],
    prerequisites: [
      "You have read /learn/how-to-choose-ai-model OR walked the beginner path.",
      "You can name the model you are evaluating — even tentatively.",
    ],
    steps,
    toolsUsed: [
      TOOL_LEARN,
      TOOL_EXERCISES,
      TOOL_COMPARE,
      TOOL_BRIEFS,
      TOOL_SOURCES,
      TOOL_COVERAGE,
    ],
    doesNotPromise: [
      "A recommended hosting platform.",
      "Asserted latency, throughput, or uptime numbers.",
      "Production readiness without your own tests.",
    ],
    policyNote:
      "The path does not certify a model, recommend a hosting platform, or assert latency / throughput / uptime. It surfaces the verified fields you need to evaluate and leaves the workload-specific testing to you.",
  };
}

function buildProductManagerPath(): LearningPath {
  const steps: LearningPathStep[] = [
    lessonStep(
      "how-to-choose-ai-model",
      "Align the team on the decision workflow before debating models."
    ),
    lessonStep(
      "pricing-references",
      "Treat catalogue pricing as a sourced reference, not a live quote."
    ),
    lessonStep(
      "model-lifecycle",
      "Make lifecycle a gate on integration timelines, not a footnote."
    ),
    lessonStep(
      "benchmark-limitations",
      "Understand why the catalogue does not publish benchmark scores."
    ),
    exerciseStep(
      "review-pricing-reference",
      "End with a provider/unit/retrievedAt note that finance can sanity-check."
    ),
    exerciseStep(
      "inspect-model-lifecycle",
      "End with a lifecycle risk note for the integration plan."
    ),
    exerciseStep(
      "create-decision-brief",
      "End with the evidence brief that pairs with your testing plan."
    ),
    workflowStep(
      "/select?useCase=governance-review",
      "Open the governance-review shortlist",
      "Pull the catalogue's verification + lifecycle filters so the brief inherits a defensible scope."
    ),
  ];
  return {
    slug: "product-manager",
    title: "Model selection for product use cases",
    audience: "product",
    audienceLabel: "Product manager / technical buyer",
    summary:
      "Four readings + three exercises + one pre-seeded workflow. Walks use-case framing, pricing references, lifecycle gates, and benchmark limits so the team can align on a defensible review — ending with a use-case shortlist, a pricing-reference note, a lifecycle risk note, and the evidence brief.",
    estimatedMinutes: totalMinutes(steps),
    difficulty: "intermediate",
    whatYouWillLearn: [
      "How a use-case framing changes which verified fields the team weights.",
      "How to read a pricing row as a reference, not a live quote.",
      "What deprecation timelines mean for your integration plan.",
      "Why no benchmark score appears in the catalogue.",
    ],
    whatYouWillBuild: [
      "A use-case shortlist the team can review together.",
      "A pricing-reference note that names provider, unit, and retrievedAt.",
      "A lifecycle risk note that flags retirement dates.",
      "A Markdown evidence brief for product or internal review.",
    ],
    evidenceArtifacts: [
      "Use-case shortlist URL",
      "Pricing-reference note",
      "Lifecycle risk note",
      "Markdown evidence brief",
    ],
    prerequisites: [
      "You can name the use case and the constraints (latency, cost ceiling, compliance) the team is optimising for.",
    ],
    steps,
    toolsUsed: [
      TOOL_LEARN,
      TOOL_SELECT,
      TOOL_COMPARE,
      TOOL_BRIEFS,
      TOOL_SOURCES,
    ],
    doesNotPromise: [
      "A recommended model for any product.",
      "A price ranking across providers.",
      "Vendor endorsement or affiliate links.",
    ],
    policyNote:
      "The path is a decision-evidence builder, not a vendor pitch. It does not declare a winner, does not rank by price, and does not assert SLA or compliance posture.",
  };
}

function buildGovernancePath(): LearningPath {
  const steps: LearningPathStep[] = [
    lessonStep(
      "model-lifecycle",
      "Read lifecycle as a hard gate on integration risk."
    ),
    lessonStep(
      "status-aware-selection",
      "Separate vendor-reported status from the independent probe."
    ),
    lessonStep(
      "benchmark-limitations",
      "Understand why no benchmark score is published in the catalogue."
    ),
    lessonStep(
      "pricing-references",
      "Read pricing as a sourced reference with a retrievedAt date."
    ),
    exerciseStep(
      "check-source-freshness",
      "End with a checklist of citations that need re-reading."
    ),
    exerciseStep(
      "inspect-model-lifecycle",
      "End with a lifecycle risk note paired with provider deprecation history."
    ),
    exerciseStep(
      "plan-external-model-test",
      "End with the test plan that pairs your review with workload-specific tests."
    ),
    workflowStep(
      "/reverification",
      "Walk the reverification queue",
      "Read the queue filtered by provider so stale citations surface for the review."
    ),
    workflowStep(
      "/coverage",
      "Audit per-provider coverage",
      "Confirm verified-field counts and citation density before sign-off."
    ),
    workflowStep(
      "/sources",
      "Open the citation registry",
      "Trace each evidence claim back to its primary source URL."
    ),
  ];
  return {
    slug: "governance",
    title: "AI model governance and source review",
    audience: "governance",
    audienceLabel: "Governance / risk / compliance reviewer",
    summary:
      "Four readings + three exercises + three audit workflows. Walks lifecycle, status, benchmark limits, pricing, and source freshness so a reviewer can sign off with a defensible evidence trail — never a certification claim.",
    estimatedMinutes: totalMinutes(steps),
    difficulty: "intermediate",
    whatYouWillLearn: [
      "How to use lifecycle state as an integration gate.",
      "How vendor-reported status differs from the independent probe.",
      "Why benchmark scores are intentionally absent from the catalogue.",
      "How pricing references age and where the reverification queue surfaces stale ones.",
    ],
    whatYouWillBuild: [
      "A source freshness checklist scoped to the reviewed provider.",
      "A lifecycle review note with retirement dates.",
      "An explicit data-gap list for external follow-up.",
      "A written external test plan.",
      "A governance review brief paired with the evidence above.",
    ],
    evidenceArtifacts: [
      "Source freshness checklist",
      "Lifecycle review note",
      "Data gap list",
      "External test plan",
      "Governance review brief",
    ],
    prerequisites: [
      "You can name the provider(s) under review and the regime(s) you are reviewing against.",
    ],
    steps,
    toolsUsed: [
      TOOL_LEARN,
      TOOL_EXERCISES,
      TOOL_SOURCES,
      TOOL_COVERAGE,
      TOOL_REVERIFICATION,
      TOOL_BRIEFS,
    ],
    doesNotPromise: [
      "Compliance certification.",
      "Risk approval.",
      "Legal advice.",
      "Vendor endorsement.",
    ],
    policyNote:
      "Verification is not certification. The path produces a sourced evidence trail; the reviewer's organisation owns the approval decision.",
  };
}

function buildAutomationSpecialistPath(): LearningPath {
  const steps: LearningPathStep[] = [
    lessonStep(
      "how-to-choose-ai-model",
      "Anchor on the decision workflow before chaining an automation."
    ),
    lessonStep(
      "context-window",
      "Confirm the verified context window covers the prompts your automation will actually send."
    ),
    lessonStep(
      "structured-output",
      "Pick the right structured-generation surface for your downstream parser."
    ),
    lessonStep(
      "pricing-references",
      "Read pricing as a reference so cost projections do not pretend to be quotes."
    ),
    lessonStep(
      "testing-ai-models",
      "Plan the tests that catch silent regressions inside an automation loop."
    ),
    exerciseStep(
      "build-first-shortlist",
      "End with a /select URL the team can re-open before each automation rollout."
    ),
    exerciseStep(
      "review-pricing-reference",
      "End with a provider/unit/retrievedAt note for the cost projection."
    ),
    exerciseStep(
      "create-decision-brief",
      "End with a Markdown brief that pairs with the automation runbook."
    ),
    exerciseStep(
      "plan-external-model-test",
      "End with a written test plan covering the failure modes an automation will hit."
    ),
    workflowStep(
      "/select?useCase=structured-output",
      "Open the structured-output shortlist",
      "Filter the catalogue for verified structured-output capability before integrating into a pipeline."
    ),
    workflowStep(
      "/compare/build?useCase=structured-output",
      "Open the structured-output comparison builder",
      "Render the candidate models side by side on structured-output fields."
    ),
    workflowStep(
      "/briefs/build?useCase=structured-output",
      "Open the structured-output brief builder",
      "Generate the evidence pack that ships with the automation review."
    ),
  ];
  return {
    slug: "automation-specialist",
    title: "Safe AI model use for automation workflows",
    audience: "automation",
    audienceLabel: "Automation builder / SEO operator / technical consultant",
    summary:
      "Five readings + four exercises + three pre-seeded workflows. Built for people wiring AI models into automations: structured outputs, prompt cost projections, regression test plans, and a brief that ships with the automation runbook. Never an automation marketing pitch.",
    estimatedMinutes: totalMinutes(steps),
    difficulty: "intermediate",
    whatYouWillLearn: [
      "How to anchor an automation on a verified-field workflow instead of a leaderboard.",
      "Which structured-generation surface (JSON mode, structured output, tool calling) matches your parser.",
      "How to project automation cost from per-unit pricing references without claiming a live quote.",
      "Which tests catch silent regressions when a snapshot rotates underneath an automation.",
    ],
    whatYouWillBuild: [
      "A safe model-use checklist for the automation under review.",
      "A structured-output inspection note that names the verified API surface.",
      "A cost projection note tied to a pricing reference + retrievedAt date.",
      "A regression-aware external test plan.",
      "A source-backed model selection brief that ships with the runbook.",
    ],
    evidenceArtifacts: [
      "Safe model-use checklist",
      "Structured-output inspection note",
      "Prompt testing plan",
      "Source-backed model selection brief",
      "Automation workflow test plan",
    ],
    prerequisites: [
      "You can describe the automation pipeline at a high level — input source, model step, downstream parser, output destination.",
      "You have a representative prompt set you intend to ship.",
    ],
    steps,
    toolsUsed: [
      TOOL_LEARN,
      TOOL_EXERCISES,
      TOOL_SELECT,
      TOOL_COMPARE,
      TOOL_BRIEFS,
      TOOL_SOURCES,
      TOOL_REVERIFICATION,
    ],
    doesNotPromise: [
      "Guaranteed automation reliability.",
      "SEO ranking gains or traffic outcomes.",
      "Compliance approval for an automated workflow.",
      "Production readiness without external testing.",
    ],
    policyNote:
      "The path teaches careful, source-backed AI use inside an automation. It does not promise automation reliability, SEO outcomes, compliance approval, or production readiness — those remain workload-specific and your team's responsibility.",
  };
}

// Cached at module-load time. Pure local read; safe.
const PATHS: LearningPath[] = [
  buildBeginnerPath(),
  buildDeveloperPath(),
  buildProductManagerPath(),
  buildGovernancePath(),
  buildAutomationSpecialistPath(),
];

export const learningPaths: LearningPath[] = PATHS;

export function getLearningPath(slug: string): LearningPath | undefined {
  return PATHS.find((p) => p.slug === slug);
}

export function getLearningPaths(): LearningPath[] {
  return PATHS;
}

export function getLearningPathSteps(slug: string): LearningPathStep[] {
  return getLearningPath(slug)?.steps ?? [];
}

export function getLearningPathRoutes(): string[] {
  return [
    "/learn/paths",
    ...PATHS.map((p) => `/learn/path/${p.slug}`),
  ];
}

export function getLearningPathsByAudience(
  audience: LearningPathAudience
): LearningPath[] {
  return PATHS.filter((p) => p.audience === audience);
}

export function getLearningPathsForLesson(
  lessonSlug: string
): LearningPath[] {
  return PATHS.filter((p) =>
    p.steps.some((s) => s.type === "lesson" && s.slug === lessonSlug)
  );
}

export function getLearningPathsForExercise(
  exerciseSlug: string
): LearningPath[] {
  return PATHS.filter((p) =>
    p.steps.some((s) => s.type === "exercise" && s.slug === exerciseSlug)
  );
}
