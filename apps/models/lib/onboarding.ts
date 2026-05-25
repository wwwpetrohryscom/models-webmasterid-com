/**
 * Onboarding registry — Sprint 38.
 *
 * Five role-based "Start here" paths the cold-visitor /start page
 * routes into. Each path maps a role onto an existing learning path,
 * an existing kit (where one matches), and the first lesson +
 * exercise + lab playbook the reader should open. The /start
 * experience is pure navigation: no accounts, no quiz scoring, no
 * progress tracking, no recommendations about specific models.
 *
 * Discipline:
 *   - Pure local data — no fetch, no Date.now, no process.env.
 *   - No scoring, no rankings, no winner claims, no
 *     model-specific recommendations.
 *   - Hrefs reference routes that already exist; the onboarding
 *     registry never invents a new product surface.
 */

export type OnboardingRoleSlug =
  | "beginner"
  | "developer"
  | "product"
  | "automation"
  | "governance";

export type OnboardingGoalSlug =
  | "learn-basics"
  | "choose-model"
  | "test-model"
  | "build-automation"
  | "prepare-review"
  | "create-evidence";

export type OnboardingArtifactSlug =
  | "shortlist"
  | "comparison"
  | "decision-brief"
  | "test-plan"
  | "prompt-matrix"
  | "source-checklist"
  | "workflow-kit";

export interface OnboardingRoute {
  label: string;
  href: string;
  purpose: string;
}

export interface OnboardingArtifactCard {
  label: string;
  href: string;
  description: string;
}

export interface OnboardingPath {
  slug: OnboardingRoleSlug;
  title: string;
  summary: string;
  audienceLabel: string;
  firstStep: string;
  estimatedMinutes: number;
  /** Three short orientation bullets shown on the role start page. */
  orientation: {
    learn: string;
    practise: string;
    test: string;
    produce: string;
  };
  startRoutes: {
    learningPath: OnboardingRoute;
    firstLesson: OnboardingRoute;
    firstExercise: OnboardingRoute;
    labPlaybook?: OnboardingRoute;
    kit?: OnboardingRoute;
    resourceFinder: OnboardingRoute;
  };
  artifacts: OnboardingArtifactCard[];
  doesNotPromise: string[];
}

export interface OnboardingGoal {
  slug: OnboardingGoalSlug;
  title: string;
  description: string;
  /** /resources filter the goal card lands on. */
  href: string;
}

export interface OnboardingArtifact {
  slug: OnboardingArtifactSlug;
  title: string;
  description: string;
  /** /resources filter the artifact card lands on. */
  href: string;
}

// ---------------------------------------------------------------------------
// Goal cards — each one routes the reader at a filtered /resources view
// the finder already supports. The goal slug here is the local
// onboarding vocabulary; the href uses the resource finder's wider goal
// vocabulary so a single click lands the reader in the right context.
// ---------------------------------------------------------------------------

const GOALS: OnboardingGoal[] = [
  {
    slug: "learn-basics",
    title: "Learn the basics",
    description:
      "Plain-language concept lessons about how AI model fields behave — context, output limits, pricing references, lifecycle, hosting, status.",
    href: "/resources?goal=learn-basics",
  },
  {
    slug: "choose-model",
    title: "Choose model candidates",
    description:
      "Build a source-backed shortlist using verified catalogue fields. Output is a /select URL anyone can re-open.",
    href: "/resources?goal=choose-model-candidates",
  },
  {
    slug: "test-model",
    title: "Test model behaviour",
    description:
      "Run prompt + structured-output + regression tests in your own harness using the lab playbooks and prompt sets.",
    href: "/resources?goal=test-model-behaviour",
  },
  {
    slug: "build-automation",
    title: "Build an automation workflow",
    description:
      "Test an AI model inside an unattended automation before it runs in production. Shadow runs, canary suite, runbook.",
    href: "/resources?goal=test-automation-workflow",
  },
  {
    slug: "prepare-review",
    title: "Prepare a governance review",
    description:
      "Audit source freshness, lifecycle, refusal-boundary behaviour, and package a Markdown governance review brief.",
    href: "/resources?goal=prepare-governance-review",
  },
  {
    slug: "create-evidence",
    title: "Create evidence",
    description:
      "Package the decision brief or evaluation plan. The platform produces evidence, not recommendations.",
    href: "/resources?goal=document-evidence",
  },
];

// ---------------------------------------------------------------------------
// Artifact cards — each card lands on the corresponding /resources
// artifact filter so the reader sees every surface that helps produce
// the artifact.
// ---------------------------------------------------------------------------

const ARTIFACTS: OnboardingArtifact[] = [
  {
    slug: "shortlist",
    title: "Shortlist",
    description:
      "A /select URL that captures a source-backed shortlist your team can re-open.",
    href: "/resources?artifact=shortlist-url",
  },
  {
    slug: "comparison",
    title: "Comparison",
    description:
      "A /compare/build URL that renders up to four candidate models against verified fields.",
    href: "/resources?artifact=comparison-url",
  },
  {
    slug: "decision-brief",
    title: "Decision brief",
    description:
      "A paste-ready Markdown evidence pack listing verified fields, data gaps, source trail, and hosted availability.",
    href: "/resources?artifact=decision-brief",
  },
  {
    slug: "test-plan",
    title: "External test plan",
    description:
      "A short written test plan that pairs the catalogue evidence with the workload-specific tests the team will run.",
    href: "/resources?artifact=external-test-plan",
  },
  {
    slug: "prompt-matrix",
    title: "Prompt test matrix",
    description:
      "A Markdown scaffold for capturing per-candidate prompt observations without collapsing them to a score.",
    href: "/resources?artifact=prompt-test-matrix",
  },
  {
    slug: "source-checklist",
    title: "Source freshness checklist",
    description:
      "A JSON or Markdown checklist of citations due for re-check, scoped per provider.",
    href: "/resources?artifact=source-freshness-checklist",
  },
  {
    slug: "workflow-kit",
    title: "Workflow kit",
    description:
      "A single Markdown work document that bundles lessons + exercises + lab playbook + prompt set + template for the role.",
    href: "/resources?resourceType=workflow-kit",
  },
];

// ---------------------------------------------------------------------------
// Role paths.
// ---------------------------------------------------------------------------

const PATHS: OnboardingPath[] = [
  // -------------------------------------------------------------------
  // Beginner
  // -------------------------------------------------------------------
  {
    slug: "beginner",
    title: "Beginner",
    summary:
      "New to AI model selection. Start with plain-language lessons, build a first shortlist, then look at sources before considering any integration work.",
    audienceLabel: "Newcomers and curious readers",
    firstStep: "Walk the beginner learning path.",
    estimatedMinutes: 90,
    orientation: {
      learn:
        "Read four concept lessons — how to choose, context windows, hosted vs first-party, pricing references.",
      practise:
        "Build your first source-backed shortlist on /select.",
      test:
        "Skip live testing for now — read the testing-ai-models lesson so you know what tests would look like later.",
      produce:
        "End with a /select shortlist URL and notes on what the verified fields mean for your problem.",
    },
    startRoutes: {
      learningPath: {
        label: "Beginner learning path",
        href: "/learn/path/beginner",
        purpose: "Sequenced lessons + exercises with no prerequisites.",
      },
      firstLesson: {
        label: "How to choose an AI model",
        href: "/learn/how-to-choose-ai-model",
        purpose: "Frame the workflow before opening the catalogue.",
      },
      firstExercise: {
        label: "Build your first shortlist",
        href: "/learn/exercises/build-first-shortlist",
        purpose:
          "Capture a /select URL your team can re-open before each release.",
      },
      resourceFinder: {
        label: "Open beginner resources",
        href: "/resources?audience=beginners",
        purpose: "Every resource tagged for beginners.",
      },
    },
    artifacts: [
      {
        label: "Shortlist URL",
        href: "/select",
        description:
          "A /select URL that captures a source-backed shortlist.",
      },
      {
        label: "Beginner orientation notes",
        href: "/learn/path/beginner",
        description:
          "Your own notes from the four foundational lessons.",
      },
    ],
    doesNotPromise: [
      "Pick a model for you.",
      "Score your understanding.",
      "Issue any kind of certificate or completion badge.",
      "Replace structured testing once you reach an integration decision.",
    ],
  },

  // -------------------------------------------------------------------
  // Developer
  // -------------------------------------------------------------------
  {
    slug: "developer",
    title: "Developer",
    summary:
      "Preparing an integration. Walk the developer path, then open the developer model evaluation kit to bundle lessons, exercises, lab playbook, prompt sets, and templates into a single Markdown work document.",
    audienceLabel: "Engineers preparing an integration",
    firstStep: "Walk the developer learning path.",
    estimatedMinutes: 180,
    orientation: {
      learn:
        "Read how-to-choose-ai-model, hosted-vs-first-party, structured-output, testing-ai-models.",
      practise:
        "Build the comparison and capture a hosted-provider note via the exercises.",
      test:
        "Run prompt-testing-basics + structured-output-testing in your own harness.",
      produce:
        "Export a Markdown decision brief paired with an external test plan.",
    },
    startRoutes: {
      learningPath: {
        label: "Developer learning path",
        href: "/learn/path/developer",
        purpose: "Sequenced developer lessons and exercises.",
      },
      firstLesson: {
        label: "How to choose an AI model",
        href: "/learn/how-to-choose-ai-model",
        purpose: "Frame the workflow before reading per-field lessons.",
      },
      firstExercise: {
        label: "Map the hosted provider",
        href: "/learn/exercises/map-hosted-provider",
        purpose:
          "Separate creator + host + data gap for the candidate set.",
      },
      labPlaybook: {
        label: "Prompt testing basics",
        href: "/lab/prompt-testing-basics",
        purpose:
          "Minimum repeatable prompt-test routine before integration.",
      },
      kit: {
        label: "Developer model evaluation kit",
        href: "/kits/developer-model-evaluation",
        purpose:
          "Single Markdown work document bundling the developer flow.",
      },
      resourceFinder: {
        label: "Open developer resources",
        href: "/resources?audience=developers",
        purpose: "Every resource tagged for developers.",
      },
    },
    artifacts: [
      {
        label: "Decision brief (Markdown)",
        href: "/briefs/build",
        description:
          "Verified-field evidence pack reviewers can read.",
      },
      {
        label: "Prompt test matrix",
        href: "/lab/templates/prompt-test-matrix",
        description: "Per-prompt observations against your rubric.",
      },
      {
        label: "External test plan",
        href: "/learn/exercises/plan-external-model-test",
        description:
          "Workload-specific tests the catalogue cannot run for you.",
      },
    ],
    doesNotPromise: [
      "Pick the right model for the integration.",
      "Assert latency, throughput, or uptime.",
      "Replace workload-specific testing.",
      "Certify the model for any regulatory regime.",
    ],
  },

  // -------------------------------------------------------------------
  // Product
  // -------------------------------------------------------------------
  {
    slug: "product",
    title: "Product",
    summary:
      "Framing a model decision with engineering, finance, and legal. Walk the product manager path, then open the product model selection kit to package the review document.",
    audienceLabel: "Product managers + technical buyers",
    firstStep: "Walk the product manager learning path.",
    estimatedMinutes: 150,
    orientation: {
      learn:
        "Read how-to-choose, pricing-references, model-lifecycle, benchmark-limitations.",
      practise:
        "Capture a pricing reference and a lifecycle note via the exercises.",
      test:
        "Run a light prompt-testing routine to confirm the candidate behaves on your inputs.",
      produce:
        "Export a Markdown brief reviewers can read together.",
    },
    startRoutes: {
      learningPath: {
        label: "Product manager learning path",
        href: "/learn/path/product-manager",
        purpose: "Sequenced product-manager lessons and exercises.",
      },
      firstLesson: {
        label: "Pricing references",
        href: "/learn/pricing-references",
        purpose:
          "Treat pricing rows as references with retrievedAt dates, not live quotes.",
      },
      firstExercise: {
        label: "Review a pricing reference",
        href: "/learn/exercises/review-pricing-reference",
        purpose:
          "Capture provider + unit + retrievedAt that finance can sanity-check.",
      },
      labPlaybook: {
        label: "Prompt testing basics",
        href: "/lab/prompt-testing-basics",
        purpose:
          "Light prompt-testing routine for the candidate set.",
      },
      kit: {
        label: "Product model selection kit",
        href: "/kits/product-model-selection",
        purpose:
          "Single Markdown work document bundling the product flow.",
      },
      resourceFinder: {
        label: "Open product team resources",
        href: "/resources?audience=product-teams",
        purpose: "Every resource tagged for product teams.",
      },
    },
    artifacts: [
      {
        label: "Use-case shortlist URL",
        href: "/select",
        description:
          "Shortlist the team can re-open during review.",
      },
      {
        label: "Pricing-reference note",
        href: "/learn/exercises/review-pricing-reference",
        description: "Source-backed cost projection inputs.",
      },
      {
        label: "Decision brief (Markdown)",
        href: "/briefs/build",
        description: "Brief reviewers will read together.",
      },
    ],
    doesNotPromise: [
      "Recommend a model for the product.",
      "Provide a live invoiceable quote.",
      "Predict ROI or feature adoption.",
      "Rank vendors by price or speed.",
    ],
  },

  // -------------------------------------------------------------------
  // Automation
  // -------------------------------------------------------------------
  {
    slug: "automation",
    title: "Automation",
    summary:
      "Wiring an AI model into an unattended automation. Walk the automation-specialist path, then open the automation workflow testing kit to package shadow runs, canary suite, and runbook.",
    audienceLabel:
      "Automation builders, SEO operators, technical consultants",
    firstStep: "Walk the automation specialist learning path.",
    estimatedMinutes: 200,
    orientation: {
      learn:
        "Read structured-output, pricing-references, testing-ai-models.",
      practise:
        "Build a shortlist and capture a pricing reference for cost projection.",
      test:
        "Run automation-workflow-testing + automation-robustness against your real schema.",
      produce:
        "Ship a runbook paired with an automation risk checklist + external test plan.",
    },
    startRoutes: {
      learningPath: {
        label: "Automation specialist learning path",
        href: "/learn/path/automation-specialist",
        purpose: "Sequenced automation-specialist lessons and exercises.",
      },
      firstLesson: {
        label: "Structured output",
        href: "/learn/structured-output",
        purpose:
          "Distinguish JSON mode, structured output, tool calling.",
      },
      firstExercise: {
        label: "Build first shortlist",
        href: "/learn/exercises/build-first-shortlist",
        purpose:
          "Capture a /select URL the team can re-open before each release.",
      },
      labPlaybook: {
        label: "Automation workflow testing",
        href: "/lab/automation-workflow-testing",
        purpose:
          "Test the model inside the loop — retries, parsers, regression.",
      },
      kit: {
        label: "Automation workflow testing kit",
        href: "/kits/automation-workflow-testing",
        purpose:
          "Single Markdown work document bundling the automation flow.",
      },
      resourceFinder: {
        label: "Open automation specialist resources",
        href: "/resources?audience=automation-specialists",
        purpose: "Every resource tagged for automation specialists.",
      },
    },
    artifacts: [
      {
        label: "Automation risk checklist",
        href: "/lab/templates/automation-risk-checklist",
        description:
          "Pre-launch risk checklist attached to the runbook.",
      },
      {
        label: "Prompt test matrix",
        href: "/lab/templates/prompt-test-matrix",
        description:
          "Per-prompt observations under the automation contract.",
      },
      {
        label: "External test plan",
        href: "/learn/exercises/plan-external-model-test",
        description:
          "Tests that catch silent regressions inside the loop.",
      },
    ],
    doesNotPromise: [
      "Guarantee automation reliability.",
      "Improve search-engine traffic or organic rankings.",
      "Substitute for human review on customer-facing surfaces.",
      "Approve the pipeline as ready for production traffic.",
    ],
  },

  // -------------------------------------------------------------------
  // Governance
  // -------------------------------------------------------------------
  {
    slug: "governance",
    title: "Governance",
    summary:
      "Preparing an internal review for a model already in production. Walk the governance path, then open the governance review kit to package source-freshness audit, lifecycle review, and regression suite.",
    audienceLabel: "Risk, compliance, governance reviewers",
    firstStep: "Walk the governance learning path.",
    estimatedMinutes: 200,
    orientation: {
      learn:
        "Read model-lifecycle, status-aware-selection, benchmark-limitations, pricing-references.",
      practise:
        "Walk the reverification queue and capture a lifecycle review note.",
      test:
        "Run model-regression-testing + refusal-boundary against the candidate.",
      produce:
        "Export a Markdown governance review brief paired with a written external test plan.",
    },
    startRoutes: {
      learningPath: {
        label: "Governance learning path",
        href: "/learn/path/governance",
        purpose: "Sequenced governance lessons and exercises.",
      },
      firstLesson: {
        label: "Model lifecycle",
        href: "/learn/model-lifecycle",
        purpose: "Read lifecycle as an integration gate.",
      },
      firstExercise: {
        label: "Check source freshness",
        href: "/learn/exercises/check-source-freshness",
        purpose:
          "Export a freshness checklist scoped to the provider under review.",
      },
      labPlaybook: {
        label: "Model regression testing",
        href: "/lab/model-regression-testing",
        purpose:
          "Schedule the canary suite that catches silent snapshot drift.",
      },
      kit: {
        label: "Governance review kit",
        href: "/kits/governance-review",
        purpose:
          "Single Markdown work document bundling the governance flow.",
      },
      resourceFinder: {
        label: "Open governance team resources",
        href: "/resources?audience=governance-teams",
        purpose: "Every resource tagged for governance teams.",
      },
    },
    artifacts: [
      {
        label: "Source freshness checklist",
        href: "/reverification",
        description:
          "Citations due for re-check, scoped per provider.",
      },
      {
        label: "Lifecycle review note",
        href: "/learn/exercises/inspect-model-lifecycle",
        description:
          "Lifecycle + retirement date + citation per model in scope.",
      },
      {
        label: "Governance review brief",
        href: "/briefs/build",
        description:
          "Markdown brief paired with the written test plan.",
      },
    ],
    doesNotPromise: [
      "Compliance certification or approval.",
      "Legal advice.",
      "Vendor endorsement.",
      "Sign-off on behalf of the reviewer's organisation.",
    ],
  },
];

// ---------------------------------------------------------------------------
// Public API.
// ---------------------------------------------------------------------------

export const onboardingPaths: OnboardingPath[] = PATHS;
export const onboardingGoals: OnboardingGoal[] = GOALS;
export const onboardingArtifacts: OnboardingArtifact[] = ARTIFACTS;

export function getOnboardingPath(
  slug: string
): OnboardingPath | undefined {
  return PATHS.find((p) => p.slug === slug);
}

export function getOnboardingPaths(): OnboardingPath[] {
  return PATHS;
}

export function getOnboardingRoutes(): string[] {
  return PATHS.map((p) => `/start/${p.slug}`);
}
