/**
 * Audience registry — Sprint 33.
 *
 * Audience-specific entry points for cold visitors. Each audience
 * has a dedicated landing page that names the problems the visitor
 * is most likely to bring, lists the artifacts the platform helps
 * them produce, and routes them into a sequenced learning path +
 * lab playbook + guided demo + workflow surfaces.
 *
 * Discipline:
 *   - No SEO ranking guarantees on the automation-specialists page.
 *   - No compliance certification claims on the governance-teams page.
 *   - No "best for X" copy anywhere.
 *   - Every audience page carries an explicit "does not promise" list.
 *   - Pure local data — no fetch, no Date.now, no process.env.
 */

export type AudienceSlug =
  | "developers"
  | "product-teams"
  | "automation-specialists"
  | "governance-teams";

export interface AudienceLink {
  label: string;
  href: string;
}

export interface AudienceCapability {
  title: string;
  description: string;
  href: string;
}

export interface AudienceArtifactWalkthrough {
  artifact: string;
  howToProduce: string;
  route: string;
}

export interface AudiencePage {
  slug: AudienceSlug;
  title: string;
  headline: string;
  summary: string;
  whoThisIsFor: string[];
  commonProblems: string[];
  whatYouCanDo: AudienceCapability[];
  artifactsYouCanProduce: string[];
  suggestedPath: AudienceLink;
  suggestedLab?: AudienceLink;
  guidedDemo?: AudienceLink;
  evidenceRoutes: AudienceLink[];
  doesNotPromise: string[];
  /** Sprint 34 — illustrative situation the audience is likely to face. */
  exampleSituation?: string;
  /** Sprint 34 — best starting point with rationale (not a recommendation). */
  bestStartingPoint?: {
    label: string;
    href: string;
    reason: string;
  };
  /** Sprint 34 — per-artifact walkthrough of how to produce each artifact. */
  artifactWalkthrough?: AudienceArtifactWalkthrough[];
}

const AUDIENCES: AudiencePage[] = [
  // -------------------------------------------------------------------
  // Developers
  // -------------------------------------------------------------------
  {
    slug: "developers",
    title: "For developers",
    headline:
      "Evaluate AI models the way you evaluate any other infrastructure",
    summary:
      "Verified model fields, structured testing playbooks, and Markdown-exportable evidence briefs for engineers preparing an integration. The platform never declares a winner — you decide which candidate fits your workload.",
    whoThisIsFor: [
      "Engineers preparing an AI model integration in a production system.",
      "Teams comparing 2–4 candidate models with verified context, output, and modality fields.",
      "Reviewers who need a paste-ready evidence brief and a written test plan.",
    ],
    commonProblems: [
      "Unclear API model IDs across snapshots, regions, and aliases.",
      "Conflating the model creator with the hosting platform that bills you.",
      "Misreading context window vs max output token limits.",
      "Assuming structured-output reliability without testing your schema.",
      "Shipping an integration before running your own prompt + latency + cost tests.",
    ],
    whatYouCanDo: [
      {
        title: "Read the developer learning path",
        description:
          "Four lessons + three exercises + two pre-seeded workflows + the prompt-testing playbook + the structured-extraction prompt set.",
        href: "/learn/path/developer",
      },
      {
        title: "Run the prompt-testing playbook",
        description:
          "Minimum repeatable prompt-test routine; ends with a Markdown evidence brief.",
        href: "/lab/prompt-testing-basics",
      },
      {
        title: "Inspect hosted vs creator pricing",
        description:
          "Walk the hosted-inference guided demo and confirm the separation between model creator and billing platform.",
        href: "/demos/hosted-inference",
      },
      {
        title: "Generate a comparison + brief",
        description:
          "Build a comparison from your candidate slugs, then export an evidence brief in Markdown.",
        href: "/compare/build",
      },
    ],
    artifactsYouCanProduce: [
      "Shortlist URL from the selection workspace.",
      "Comparison URL from the comparison builder.",
      "Model evaluation plan (paste-ready Markdown).",
      "Prompt test matrix (paste-ready Markdown).",
      "Decision evidence brief.",
    ],
    suggestedPath: {
      label: "Developer learning path",
      href: "/learn/path/developer",
    },
    suggestedLab: {
      label: "Prompt testing basics",
      href: "/lab/prompt-testing-basics",
    },
    guidedDemo: {
      label: "Hosted inference demo",
      href: "/demos/hosted-inference",
    },
    evidenceRoutes: [
      { label: "Selection workspace", href: "/select" },
      { label: "Comparison builder", href: "/compare/build" },
      { label: "Decision brief builder", href: "/briefs/build" },
      { label: "Citation registry", href: "/sources" },
      { label: "Reverification queue", href: "/reverification" },
    ],
    doesNotPromise: [
      "Pick the right model for your workload.",
      "Replace your own prompt, latency, rate-limit, or cost validation.",
      "Assert SLA, uptime, or production-ready status.",
    ],
    exampleSituation:
      "Your team is about to wire a model into a backend service. There is no shortlist on file, no decision brief, and no prompt-testing routine. The PR is open and the deadline is this week.",
    bestStartingPoint: {
      label: "Developer learning path",
      href: "/learn/path/developer",
      reason:
        "The developer path sequences hosted/host separation, modality channels, structured output, and the prompt-testing playbook — the four lessons most likely to break an integration if skipped.",
    },
    artifactWalkthrough: [
      {
        artifact: "Shortlist URL",
        howToProduce:
          "Open /select with the use case and lifecycle=active filter; copy the URL.",
        route: "/select",
      },
      {
        artifact: "Comparison URL",
        howToProduce:
          "Open /compare/build with 3–4 candidate slugs and the relevant useCase filter; copy the URL.",
        route: "/compare/build",
      },
      {
        artifact: "Markdown evidence brief",
        howToProduce:
          "Open /briefs/build with the shortlist slugs and export the Markdown brief.",
        route: "/briefs/build",
      },
      {
        artifact: "External test plan",
        howToProduce:
          "Run the prompt-testing playbook against your candidates and attach the plan to the brief.",
        route: "/lab/prompt-testing-basics",
      },
    ],
  },

  // -------------------------------------------------------------------
  // Product teams
  // -------------------------------------------------------------------
  {
    slug: "product-teams",
    title: "For product teams",
    headline:
      "Turn a product use case into a defensible model decision",
    summary:
      "Use-case framing, pricing references, lifecycle gates, and Markdown evidence briefs for product managers and technical buyers. The platform surfaces verified fields; your team owns the decision.",
    whoThisIsFor: [
      "Product managers framing a model decision with engineering and finance.",
      "Technical buyers building a defensible review document for internal stakeholders.",
      "Cross-functional teams aligning on scope, gaps, and reviewer sign-offs.",
    ],
    commonProblems: [
      "Hype-driven model choice from a single blog post or leaderboard.",
      "Unclear data gaps — what does the catalogue confirm vs what is still your homework?",
      "Mistaking a pricing reference for a live quote.",
      "Missing the lifecycle deadline that lands during integration work.",
      "No internal-review artifact you can attach to a decision doc.",
    ],
    whatYouCanDo: [
      {
        title: "Read the product manager learning path",
        description:
          "Four lessons + three exercises + one pre-seeded workflow. Frames use-case → shortlist → comparison → brief alignment.",
        href: "/learn/path/product-manager",
      },
      {
        title: "Open the model evaluation plan template",
        description:
          "Paste-ready Markdown plan covering scope, test plan, observations, and decision sections.",
        href: "/lab/templates/model-evaluation-plan",
      },
      {
        title: "Walk the long-context analysis demo",
        description:
          "Pre-packaged route plan from use case to evidence brief, anchored on long-context workloads.",
        href: "/demos/long-context-analysis",
      },
      {
        title: "Generate the evidence brief",
        description:
          "Export a paste-ready brief that lists verified fields, data gaps, source trails, and freshness.",
        href: "/briefs/build",
      },
    ],
    artifactsYouCanProduce: [
      "Use-case shortlist URL for the team to review.",
      "Pricing-reference note (provider, unit, retrievedAt).",
      "Lifecycle risk note for the integration plan.",
      "Decision evidence brief.",
    ],
    suggestedPath: {
      label: "Product manager learning path",
      href: "/learn/path/product-manager",
    },
    suggestedLab: {
      label: "Model evaluation plan template",
      href: "/lab/templates/model-evaluation-plan",
    },
    guidedDemo: {
      label: "Long-context analysis demo",
      href: "/demos/long-context-analysis",
    },
    evidenceRoutes: [
      { label: "Use cases", href: "/use-cases" },
      { label: "Selection workspace", href: "/select" },
      { label: "Comparison builder", href: "/compare/build" },
      { label: "Decision brief builder", href: "/briefs/build" },
      { label: "Citation registry", href: "/sources" },
    ],
    doesNotPromise: [
      "Recommend a model for any product.",
      "Rank vendors by price or speed.",
      "Provide a live quote — pricing rows are sourced references with a retrievedAt date.",
      "Predict ROI or feature adoption.",
    ],
    exampleSituation:
      "Engineering wants to ship; finance wants a cost projection; legal wants a lifecycle plan; you need a single document the team can review together this week.",
    bestStartingPoint: {
      label: "Product manager learning path",
      href: "/learn/path/product-manager",
      reason:
        "The product manager path explicitly frames use-case, pricing reference, lifecycle, and benchmark limits — the four lessons reviewers across product, finance, and legal each care about.",
    },
    artifactWalkthrough: [
      {
        artifact: "Use-case shortlist URL",
        howToProduce:
          "Open /select with the use case and verification filter, then share the URL.",
        route: "/select",
      },
      {
        artifact: "Pricing-reference note",
        howToProduce:
          "Open /pricing for each candidate, copy the verbatim values + retrievedAt into a one-page note.",
        route: "/pricing",
      },
      {
        artifact: "Lifecycle risk note",
        howToProduce:
          "Open the model page; copy lifecycle state, retirement date if any, and the source citation.",
        route: "/models",
      },
      {
        artifact: "Markdown evidence brief",
        howToProduce:
          "Open /briefs/build with the candidate slugs and export Markdown for the review meeting.",
        route: "/briefs/build",
      },
    ],
  },

  // -------------------------------------------------------------------
  // Automation specialists (SEO operators, automation builders, consultants)
  // -------------------------------------------------------------------
  {
    slug: "automation-specialists",
    title: "For automation specialists",
    headline:
      "Use AI models inside automations without over-trusting them",
    summary:
      "Source-backed shortlists, structured-output testing, automation risk checklists, and prompt evaluation sets for automation builders, SEO operators, and technical consultants. The platform teaches careful, source-backed AI use inside workflows — never an automation marketing pitch.",
    whoThisIsFor: [
      "Automation builders wiring AI models into pipelines, queues, or schedulers.",
      "Technical consultants reviewing a client's automation before launch.",
      "SEO operators using AI for structured tasks — entity extraction, summarisation, classification — where output drift would cascade.",
    ],
    commonProblems: [
      "Over-trusting a single happy-path model output.",
      "Silent structured-output drift after a snapshot rotation.",
      "Hallucinated values when input fields are missing.",
      "Unattended automation failure modes (retries, downstream parsers, queue timeouts).",
      "Source verification gaps when the automation publishes to a customer surface.",
    ],
    whatYouCanDo: [
      {
        title: "Read the automation specialist learning path",
        description:
          "Five lessons + four exercises + four pre-seeded workflows. Walks safe model use inside automations end to end.",
        href: "/learn/path/automation-specialist",
      },
      {
        title: "Run the automation workflow testing playbook",
        description:
          "Test the model inside the loop — retries, downstream parsers, regression surface — before it runs unattended.",
        href: "/lab/automation-workflow-testing",
      },
      {
        title: "Run the automation-robustness prompt set",
        description:
          "Surface contract drift across allowed categories, missing-value handling, retry decisions, and exact-string fallbacks.",
        href: "/lab/prompts/automation-robustness",
      },
      {
        title: "Open the automation risk checklist",
        description:
          "Pre-launch risk checklist covering pipeline scope, failure surface, observability, guardrails, and approval.",
        href: "/lab/templates/automation-risk-checklist",
      },
    ],
    artifactsYouCanProduce: [
      "Safe model-use checklist for the automation under review.",
      "Automation risk checklist scoped to the pipeline.",
      "Prompt test matrix with per-candidate observations.",
      "Decision evidence brief that ships with the runbook.",
      "Written external test plan with regression cadence.",
    ],
    suggestedPath: {
      label: "Automation specialist learning path",
      href: "/learn/path/automation-specialist",
    },
    suggestedLab: {
      label: "Automation workflow testing playbook",
      href: "/lab/automation-workflow-testing",
    },
    guidedDemo: {
      label: "Hosted inference demo",
      href: "/demos/hosted-inference",
    },
    evidenceRoutes: [
      { label: "Selection workspace", href: "/select" },
      { label: "Comparison builder", href: "/compare/build" },
      { label: "Decision brief builder", href: "/briefs/build" },
      { label: "Lab templates", href: "/lab/templates" },
      { label: "Evaluation prompt library", href: "/lab/prompts" },
    ],
    doesNotPromise: [
      "Improve search-engine traffic or organic rankings.",
      "Guarantee automation reliability.",
      "Substitute for human review on a customer-facing surface.",
      "Approve a pipeline as production-ready.",
    ],
    exampleSituation:
      "A scheduled automation calls a model to classify incoming records and writes results downstream. A snapshot rotation last week silently changed the model's category labels — the parser is now dropping 8% of records.",
    bestStartingPoint: {
      label: "Automation specialist learning path",
      href: "/learn/path/automation-specialist",
      reason:
        "The automation path frames structured output, pricing references, and the automation workflow testing playbook together — so unattended runs surface regressions in the canary suite before they reach downstream consumers.",
    },
    artifactWalkthrough: [
      {
        artifact: "Safe model-use checklist",
        howToProduce:
          "Open the automation risk checklist template and tailor each section to the pipeline under review.",
        route: "/lab/templates/automation-risk-checklist",
      },
      {
        artifact: "Prompt test matrix",
        howToProduce:
          "Run the automation-robustness prompt set in your harness and record per-prompt observations in the matrix.",
        route: "/lab/templates/prompt-test-matrix",
      },
      {
        artifact: "Markdown evidence brief",
        howToProduce:
          "Export the brief from /briefs/build with the candidates and use case the automation depends on.",
        route: "/briefs/build",
      },
      {
        artifact: "External test plan",
        howToProduce:
          "Walk the automation workflow testing playbook and write down the canary suite + regression cadence.",
        route: "/lab/automation-workflow-testing",
      },
    ],
  },

  // -------------------------------------------------------------------
  // Governance teams
  // -------------------------------------------------------------------
  {
    slug: "governance-teams",
    title: "For governance teams",
    headline:
      "Build a defensible AI model review with sourced evidence",
    summary:
      "Lifecycle gates, status observations kept separate from vendor claims, source freshness checks, and Markdown evidence trails for risk, compliance, and governance reviewers. The platform never certifies a model — it surfaces the evidence your team owns the verdict on.",
    whoThisIsFor: [
      "Risk, compliance, and governance reviewers preparing internal approval discussions.",
      "Operators auditing a provider's coverage and freshness before sign-off.",
      "Teams maintaining an internal AI inventory with documented data gaps.",
    ],
    commonProblems: [
      "Stale provider docs cited as current.",
      "Unverified model metrics surfaced as evidence in review documents.",
      "Lifecycle deadlines missed because the deprecation page lives in a separate vendor surface.",
      "Benchmark scores over-claimed as model quality assertions.",
      "Audit trail gaps when an artifact moves between owners.",
    ],
    whatYouCanDo: [
      {
        title: "Read the governance learning path",
        description:
          "Four lessons + three exercises + three audit workflows. Walks lifecycle, status, benchmark limits, and source freshness for a defensible review.",
        href: "/learn/path/governance",
      },
      {
        title: "Open the evaluation guide",
        description:
          "Long-form guide on how playbooks, templates, and prompt sets fit together — and how to avoid overclaiming when summarising results.",
        href: "/lab/evaluation",
      },
      {
        title: "Walk the governance review demo",
        description:
          "Pre-packaged route plan that surfaces lifecycle, sources, freshness, and the reverification queue.",
        href: "/demos/governance-review",
      },
      {
        title: "Build the governance review brief",
        description:
          "Generate a paste-ready Markdown brief listing verified fields, data gaps, source trail, and freshness notes.",
        href: "/briefs/build",
      },
    ],
    artifactsYouCanProduce: [
      "Source freshness checklist scoped to the reviewed provider.",
      "Lifecycle review note with retirement dates.",
      "Explicit data gap list for external follow-up.",
      "Governance review brief paired with the evidence above.",
    ],
    suggestedPath: {
      label: "Governance learning path",
      href: "/learn/path/governance",
    },
    suggestedLab: {
      label: "Evaluation guide",
      href: "/lab/evaluation",
    },
    guidedDemo: {
      label: "Governance review demo",
      href: "/demos/governance-review",
    },
    evidenceRoutes: [
      { label: "Reverification queue", href: "/reverification" },
      { label: "Coverage audit", href: "/coverage" },
      { label: "Citation registry", href: "/sources" },
      { label: "Decision brief builder", href: "/briefs/build" },
    ],
    doesNotPromise: [
      "Certify the model for any regulatory regime.",
      "Provide legal, risk, or compliance approval.",
      "Issue badges, credentials, or sign-offs.",
      "Replace the reviewer's organisation's own approval process.",
    ],
    exampleSituation:
      "An internal review board needs a defensible evidence trail for a model already in production. Citations are months old; lifecycle has shifted; the previous brief no longer matches what the catalogue records.",
    bestStartingPoint: {
      label: "Governance learning path",
      href: "/learn/path/governance",
      reason:
        "The governance path sequences lifecycle, status, benchmark limits, and source freshness — the four lessons that map directly onto the evidence reviewers care about.",
    },
    artifactWalkthrough: [
      {
        artifact: "Source freshness checklist",
        howToProduce:
          "Export the reverification checklist filtered to the provider under review.",
        route: "/reverification",
      },
      {
        artifact: "Lifecycle review note",
        howToProduce:
          "Open each model page and copy the lifecycle field + retirement date + source citation.",
        route: "/models",
      },
      {
        artifact: "Data gap list",
        howToProduce:
          "Walk /coverage for the provider and list every unverified field that needs external follow-up.",
        route: "/coverage",
      },
      {
        artifact: "Governance review brief",
        howToProduce:
          "Generate the brief from /briefs/build with the relevant candidates and use case, then attach the freshness checklist and data-gap list.",
        route: "/briefs/build",
      },
    ],
  },
];

export const audiences: AudiencePage[] = AUDIENCES;

export function getAudience(slug: string): AudiencePage | undefined {
  return AUDIENCES.find((a) => a.slug === slug);
}

export function getAudiences(): AudiencePage[] {
  return AUDIENCES;
}

export function getAudienceRoutes(): string[] {
  return ["/for", ...AUDIENCES.map((a) => `/for/${a.slug}`)];
}
