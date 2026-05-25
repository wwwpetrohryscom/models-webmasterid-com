/**
 * Workflow kits — Sprint 35.
 *
 * A workflow kit packages an existing role-based learning path,
 * the lessons it depends on, the exercises that route through the
 * workspaces, the matching lab playbooks, the evaluation prompt
 * sets, and the Markdown templates into a single role-based
 * "work document" the reader can follow and export.
 *
 *   audience → path → lessons → exercises → lab → prompts/templates → brief
 *
 * Discipline:
 *   - Pure local data — no fetch, no Date.now, no process.env.
 *   - No model rankings, no recommendations, no winner claims.
 *   - No SEO ranking guarantees, no compliance certification,
 *     no production-readiness guarantees.
 *   - Markdown exports are static and noindex.
 */

import type { AudienceSlug } from "./audiences";

export type WorkflowKitSlug =
  | "developer-model-evaluation"
  | "automation-workflow-testing"
  | "product-model-selection"
  | "governance-review";

export type WorkflowKitDifficulty = "beginner" | "intermediate";

export interface WorkflowKitLink {
  label: string;
  href: string;
}

export interface WorkflowKitRouteStep {
  step: number;
  title: string;
  instruction: string;
  route: string;
  output: string;
}

export interface WorkflowKitSectionRoute {
  label: string;
  href: string;
  purpose: string;
}

export interface WorkflowKitSection {
  title: string;
  body: string[];
  routes: WorkflowKitSectionRoute[];
}

export interface WorkflowKit {
  slug: WorkflowKitSlug;
  title: string;
  summary: string;
  audienceSlug: AudienceSlug;
  difficulty: WorkflowKitDifficulty;
  estimatedMinutes: number;
  goal: string;
  whatYouWillProduce: string[];
  prerequisites: WorkflowKitLink[];
  workflow: WorkflowKitRouteStep[];
  requiredLessons: string[];
  requiredExercises: string[];
  requiredPlaybooks: string[];
  requiredPromptSets: string[];
  requiredTemplates: string[];
  finalChecklist: string[];
  evidenceRoutes: WorkflowKitLink[];
  doesNotPromise: string[];
}

const KITS: WorkflowKit[] = [
  // -------------------------------------------------------------------
  // developer-model-evaluation
  // -------------------------------------------------------------------
  {
    slug: "developer-model-evaluation",
    title: "Developer model evaluation kit",
    summary:
      "Prepare a source-backed model evaluation plan before integration. Walks the developer learning path, the matching exercises, the prompt-testing + structured-output playbooks, the structured-extraction + instruction-following prompt sets, and the model evaluation plan + prompt test matrix templates.",
    audienceSlug: "developers",
    difficulty: "intermediate",
    estimatedMinutes: 180,
    goal: "End with a Markdown evidence brief plus a written external test plan that pairs verified catalogue fields with workload-specific tests.",
    whatYouWillProduce: [
      "Hosted-provider mapping note",
      "Comparison URL from /compare/build",
      "Model evaluation plan (paste-ready Markdown)",
      "Prompt test matrix with per-candidate observations",
      "Decision evidence brief",
      "External test plan",
    ],
    prerequisites: [
      {
        label: "/learn/path/developer (sequenced path)",
        href: "/learn/path/developer",
      },
      {
        label: "A shortlist of 2–4 candidate model slugs",
        href: "/select",
      },
      {
        label: "A representative prompt set or schema",
        href: "/lab/prompts",
      },
    ],
    workflow: [
      {
        step: 1,
        title: "Walk the developer learning path",
        instruction:
          "Read the four lessons in order so the verified fields the rest of the kit depends on are framed.",
        route: "/learn/path/developer",
        output: "Notes on hosted vs first-party, modality, structured output, testing framework.",
      },
      {
        step: 2,
        title: "Map the hosted provider",
        instruction:
          "Complete the map-hosted-provider exercise. Separate model creator from billing platform per candidate.",
        route: "/learn/exercises/map-hosted-provider",
        output: "Hosted-provider mapping note (creator + host + data gap).",
      },
      {
        step: 3,
        title: "Build the side-by-side comparison",
        instruction:
          "Open /compare/build with the candidate slugs and copy the URL into your notes.",
        route: "/compare/build",
        output: "Comparison URL that opens the same view for any teammate.",
      },
      {
        step: 4,
        title: "Run the prompt-testing playbook",
        instruction:
          "Walk the minimum prompt-testing routine against the candidates in your own harness.",
        route: "/lab/prompt-testing-basics",
        output: "Per-prompt observations recorded against the acceptance rubric.",
      },
      {
        step: 5,
        title: "Run the structured-extraction prompt set",
        instruction:
          "Open the structured-extraction prompt set and run it against your real schema in your harness.",
        route: "/lab/prompts/structured-extraction",
        output: "Per-prompt schema validity record + raw responses.",
      },
      {
        step: 6,
        title: "Fill in the prompt test matrix template",
        instruction:
          "Paste your per-candidate observations into the prompt-test-matrix template.",
        route: "/lab/templates/prompt-test-matrix",
        output: "Markdown matrix attached to the brief.",
      },
      {
        step: 7,
        title: "Generate the decision evidence brief",
        instruction:
          "Open /briefs/build with the candidate slugs and export Markdown.",
        route: "/briefs/build",
        output: "Markdown brief listing verified fields, data gaps, source trail, freshness.",
      },
      {
        step: 8,
        title: "Write the external test plan",
        instruction:
          "Complete the plan-external-model-test exercise. Pair the brief with workload-specific tests.",
        route: "/learn/exercises/plan-external-model-test",
        output: "Written test plan covering prompts, latency, rate limits, cost, compliance, regression.",
      },
    ],
    requiredLessons: [
      "hosted-vs-first-party",
      "structured-output",
      "testing-ai-models",
    ],
    requiredExercises: [
      "map-hosted-provider",
      "create-decision-brief",
      "plan-external-model-test",
    ],
    requiredPlaybooks: [
      "prompt-testing-basics",
      "structured-output-testing",
    ],
    requiredPromptSets: [
      "structured-extraction",
      "instruction-following",
    ],
    requiredTemplates: ["model-evaluation-plan", "prompt-test-matrix"],
    finalChecklist: [
      "Hosted-provider mapping note captured (creator + host + data gap).",
      "Comparison URL saved.",
      "Prompt-testing observations recorded per prompt, not as a single score.",
      "Schema validity record captured for the structured-extraction set.",
      "Decision evidence brief exported in Markdown.",
      "External test plan written, with regression cadence named.",
    ],
    evidenceRoutes: [
      { label: "Selection workspace", href: "/select" },
      { label: "Comparison builder", href: "/compare/build" },
      { label: "Decision brief builder", href: "/briefs/build" },
      { label: "Citation registry", href: "/sources" },
      { label: "Reverification queue", href: "/reverification" },
    ],
    doesNotPromise: [
      "Pick the right model for your integration.",
      "Assert latency, throughput, or uptime.",
      "Certify the model for any regulatory regime.",
      "Replace your own workload-specific testing.",
    ],
  },

  // -------------------------------------------------------------------
  // automation-workflow-testing
  // -------------------------------------------------------------------
  {
    slug: "automation-workflow-testing",
    title: "Automation workflow testing kit",
    summary:
      "Prepare a safe testing workflow for AI-powered automation. Walks the automation-specialist learning path, the structured-output + pricing-references + testing lessons, three exercises, the automation workflow testing + regression playbooks, the automation-robustness + structured-extraction prompt sets, and the automation risk checklist + prompt test matrix templates.",
    audienceSlug: "automation-specialists",
    difficulty: "intermediate",
    estimatedMinutes: 200,
    goal: "End with a safe model-use checklist, a written external test plan with regression cadence, and a decision brief that ships alongside the automation runbook.",
    whatYouWillProduce: [
      "Automation risk checklist",
      "Prompt test matrix with per-candidate observations",
      "Safe model-use checklist for the pipeline under review",
      "External test plan",
      "Decision evidence brief",
    ],
    prerequisites: [
      {
        label: "/learn/path/automation-specialist (sequenced path)",
        href: "/learn/path/automation-specialist",
      },
      {
        label: "A documented automation pipeline (input → model → parser → output)",
        href: "/learn/path/automation-specialist",
      },
      {
        label: "A representative shadow-run set + a small canary set",
        href: "/lab/automation-workflow-testing",
      },
    ],
    workflow: [
      {
        step: 1,
        title: "Walk the automation specialist learning path",
        instruction:
          "Read the path's five lessons + four exercises so structured output, pricing references, and the testing framework land before integration.",
        route: "/learn/path/automation-specialist",
        output: "Notes on structured output, pricing references, lifecycle, testing.",
      },
      {
        step: 2,
        title: "Build the first shortlist",
        instruction:
          "Complete the build-first-shortlist exercise to capture candidate slugs for the automation step.",
        route: "/learn/exercises/build-first-shortlist",
        output: "Shortlist URL the team can re-open before each automation release.",
      },
      {
        step: 3,
        title: "Review the pricing reference",
        instruction:
          "Capture provider/unit/retrievedAt for the candidate pricing rows your cost projection depends on.",
        route: "/learn/exercises/review-pricing-reference",
        output: "Pricing-reference note that finance can sanity-check.",
      },
      {
        step: 4,
        title: "Run the automation workflow testing playbook",
        instruction:
          "Map the pipeline end-to-end, run shadow jobs, capture retry behaviour + tail latency + parser interaction.",
        route: "/lab/automation-workflow-testing",
        output: "Shadow-run observations and a canary suite that detects regressions later.",
      },
      {
        step: 5,
        title: "Run the automation-robustness prompt set",
        instruction:
          "Surface contract drift across allowed categories, missing-value handling, retry decisions, exact-string fallbacks.",
        route: "/lab/prompts/automation-robustness",
        output: "Per-prompt observations recorded with exact-string adherence noted.",
      },
      {
        step: 6,
        title: "Fill the automation risk checklist + prompt test matrix",
        instruction:
          "Adapt both Markdown templates to your pipeline and paste observations from the previous steps.",
        route: "/lab/templates/automation-risk-checklist",
        output: "Filled-in risk checklist + matrix attached to the runbook.",
      },
      {
        step: 7,
        title: "Schedule a regression suite",
        instruction:
          "Walk the model-regression-testing playbook to freeze the canary suite, wire alerting, and document the regression cadence.",
        route: "/lab/model-regression-testing",
        output: "Documented regression schedule plus the canary suite itself.",
      },
      {
        step: 8,
        title: "Generate the decision evidence brief",
        instruction:
          "Open /briefs/build with the candidates the automation will call and export Markdown.",
        route: "/briefs/build",
        output: "Markdown brief paired with the automation runbook.",
      },
      {
        step: 9,
        title: "Write the external test plan",
        instruction:
          "Complete the plan-external-model-test exercise and capture the regression cadence.",
        route: "/learn/exercises/plan-external-model-test",
        output: "Written test plan that ships with the runbook.",
      },
    ],
    requiredLessons: [
      "structured-output",
      "pricing-references",
      "testing-ai-models",
    ],
    requiredExercises: [
      "build-first-shortlist",
      "review-pricing-reference",
      "plan-external-model-test",
    ],
    requiredPlaybooks: [
      "automation-workflow-testing",
      "model-regression-testing",
    ],
    requiredPromptSets: [
      "automation-robustness",
      "structured-extraction",
    ],
    requiredTemplates: [
      "automation-risk-checklist",
      "prompt-test-matrix",
    ],
    finalChecklist: [
      "Pipeline scope mapped end-to-end.",
      "Shadow-run observations recorded with retry behaviour + parser interaction.",
      "Automation risk checklist filled and attached to the runbook.",
      "Canary suite frozen and the regression cadence documented.",
      "Decision evidence brief paired with the runbook.",
      "External test plan written.",
    ],
    evidenceRoutes: [
      { label: "Selection workspace", href: "/select" },
      { label: "Lab playbooks", href: "/lab" },
      { label: "Lab templates", href: "/lab/templates" },
      { label: "Evaluation prompt library", href: "/lab/prompts" },
      { label: "Decision brief builder", href: "/briefs/build" },
    ],
    doesNotPromise: [
      "Guarantee automation reliability.",
      "Improve search-engine traffic or organic rankings.",
      "Substitute for human review on a customer-facing surface.",
      "Approve the pipeline as production-ready.",
    ],
  },

  // -------------------------------------------------------------------
  // product-model-selection
  // -------------------------------------------------------------------
  {
    slug: "product-model-selection",
    title: "Product model selection kit",
    summary:
      "Turn a product use case into a reviewable model selection artifact. Walks the product manager learning path, four lessons covering use-case framing through benchmark limits, three exercises that produce pricing + lifecycle notes + the brief, the prompt-testing + long-context playbooks, two prompt sets, and the model evaluation plan template.",
    audienceSlug: "product-teams",
    difficulty: "intermediate",
    estimatedMinutes: 180,
    goal: "End with a use-case shortlist, a pricing-reference note, a lifecycle risk note, a comparison URL, and a Markdown evidence brief the team can review together.",
    whatYouWillProduce: [
      "Use-case shortlist URL",
      "Pricing-reference note",
      "Lifecycle risk note",
      "Model comparison URL",
      "Decision evidence brief",
    ],
    prerequisites: [
      {
        label: "/learn/path/product-manager (sequenced path)",
        href: "/learn/path/product-manager",
      },
      {
        label: "A named product use case and the constraints (latency, cost, compliance)",
        href: "/use-cases",
      },
      {
        label: "Reviewer list for the brief sign-off",
        href: "/briefs/build",
      },
    ],
    workflow: [
      {
        step: 1,
        title: "Walk the product manager learning path",
        instruction:
          "Read the four lessons (how-to-choose-ai-model, pricing-references, model-lifecycle, benchmark-limitations).",
        route: "/learn/path/product-manager",
        output: "Notes covering use-case framing, pricing references, lifecycle, benchmark limits.",
      },
      {
        step: 2,
        title: "Open the governance-review shortlist",
        instruction:
          "Open /select?useCase=governance-review (or a use-case relevant to the product) and save the URL.",
        route: "/select?useCase=governance-review",
        output: "Use-case shortlist URL that opens the same view for the team.",
      },
      {
        step: 3,
        title: "Review pricing references",
        instruction:
          "Capture the candidate pricing rows the finance projection will depend on.",
        route: "/learn/exercises/review-pricing-reference",
        output: "Pricing-reference note (provider + unit + retrievedAt).",
      },
      {
        step: 4,
        title: "Inspect lifecycle",
        instruction:
          "Capture the candidate lifecycle field, any retirement date, and the provider's named successor (if any).",
        route: "/learn/exercises/inspect-model-lifecycle",
        output: "Lifecycle risk note for the integration plan.",
      },
      {
        step: 5,
        title: "Run the prompt-testing playbook",
        instruction:
          "Run a minimum prompt-test routine against the candidates in your own harness.",
        route: "/lab/prompt-testing-basics",
        output: "Per-prompt observations to attach to the brief.",
      },
      {
        step: 6,
        title: "Fill the model evaluation plan template",
        instruction:
          "Adapt the model evaluation plan template; copy in the shortlist, pricing, lifecycle, and observation notes.",
        route: "/lab/templates/model-evaluation-plan",
        output: "Markdown plan paste-ready for review.",
      },
      {
        step: 7,
        title: "Generate the decision evidence brief",
        instruction:
          "Open /briefs/build with the candidate slugs and export Markdown for the review meeting.",
        route: "/briefs/build",
        output: "Markdown brief with verified fields + data gaps + source trail + freshness.",
      },
    ],
    requiredLessons: [
      "how-to-choose-ai-model",
      "pricing-references",
      "model-lifecycle",
      "benchmark-limitations",
    ],
    requiredExercises: [
      "review-pricing-reference",
      "inspect-model-lifecycle",
      "create-decision-brief",
    ],
    requiredPlaybooks: [
      "prompt-testing-basics",
      "long-context-testing",
    ],
    requiredPromptSets: [
      "summarization-quality",
      "instruction-following",
    ],
    requiredTemplates: ["model-evaluation-plan"],
    finalChecklist: [
      "Use-case shortlist URL is saved.",
      "Pricing-reference note has unit + retrievedAt.",
      "Lifecycle risk note has the retirement date if any.",
      "Per-prompt observations are captured in the evaluation plan.",
      "Decision evidence brief exported in Markdown.",
      "No 'recommendation' or 'winner' section in the brief.",
    ],
    evidenceRoutes: [
      { label: "Use cases", href: "/use-cases" },
      { label: "Selection workspace", href: "/select" },
      { label: "Comparison builder", href: "/compare/build" },
      { label: "Decision brief builder", href: "/briefs/build" },
      { label: "Citation registry", href: "/sources" },
    ],
    doesNotPromise: [
      "Pick the right model for any product.",
      "Provide a live quote — pricing rows are sourced references with a retrievedAt date.",
      "Predict ROI or feature adoption.",
      "Rank vendors by price or speed.",
    ],
  },

  // -------------------------------------------------------------------
  // governance-review
  // -------------------------------------------------------------------
  {
    slug: "governance-review",
    title: "Governance review kit",
    summary:
      "Prepare a source / freshness / lifecycle review package for internal governance discussions. Walks the governance learning path, four lessons (lifecycle, status, benchmark limits, pricing), three exercises that produce the freshness checklist + lifecycle note + test plan, the regression + prompt-testing playbooks, the refusal-boundary + instruction-following prompt sets, and the evaluation plan + automation risk checklist templates.",
    audienceSlug: "governance-teams",
    difficulty: "intermediate",
    estimatedMinutes: 200,
    goal: "End with a source freshness checklist, a lifecycle review note, an explicit data-gap list, a Markdown governance review brief, and a written external testing plan — never a certification.",
    whatYouWillProduce: [
      "Source freshness checklist",
      "Lifecycle review note",
      "Data gap list",
      "Governance review brief",
      "External test plan",
    ],
    prerequisites: [
      {
        label: "/learn/path/governance (sequenced path)",
        href: "/learn/path/governance",
      },
      {
        label: "The providers under review and the regime(s) the review serves",
        href: "/coverage",
      },
      {
        label: "Existing evidence brief (if any) to update",
        href: "/briefs/build",
      },
    ],
    workflow: [
      {
        step: 1,
        title: "Walk the governance learning path",
        instruction:
          "Read the four lessons (model-lifecycle, status-aware-selection, benchmark-limitations, pricing-references).",
        route: "/learn/path/governance",
        output: "Notes covering lifecycle, status, benchmark limits, pricing references.",
      },
      {
        step: 2,
        title: "Check source freshness",
        instruction:
          "Open the reverification queue filtered to the provider under review; export the checklist.",
        route: "/learn/exercises/check-source-freshness",
        output: "Source freshness checklist (Markdown / JSON via the export endpoint).",
      },
      {
        step: 3,
        title: "Inspect model lifecycle",
        instruction:
          "Capture lifecycle state + retirement date + source citation for each model in scope.",
        route: "/learn/exercises/inspect-model-lifecycle",
        output: "Lifecycle review note covering each model + the provider's deprecation history.",
      },
      {
        step: 4,
        title: "Walk the coverage audit",
        instruction:
          "Open /coverage filtered to the provider; list every unverified field that needs external follow-up.",
        route: "/coverage",
        output: "Explicit data-gap list for the review board.",
      },
      {
        step: 5,
        title: "Run the model regression testing playbook",
        instruction:
          "Freeze the canary suite that will catch silent snapshot drift after the review approves.",
        route: "/lab/model-regression-testing",
        output: "Canary suite + documented regression cadence.",
      },
      {
        step: 6,
        title: "Run the refusal-boundary prompt set",
        instruction:
          "Run the refusal-boundary prompts in your harness to surface over-refusal and inappropriate-compliance behaviour.",
        route: "/lab/prompts/refusal-boundary",
        output: "Per-prompt observations recorded for the review record.",
      },
      {
        step: 7,
        title: "Fill the evaluation plan + automation risk checklist templates",
        instruction:
          "Adapt both templates to the review's scope; paste observations from earlier steps.",
        route: "/lab/templates/model-evaluation-plan",
        output: "Two filled Markdown templates attached to the review package.",
      },
      {
        step: 8,
        title: "Generate the governance review brief",
        instruction:
          "Open /briefs/build with the models in scope and export Markdown for the review board.",
        route: "/briefs/build",
        output: "Markdown brief with verified fields + data gaps + freshness + lifecycle.",
      },
      {
        step: 9,
        title: "Write the external test plan",
        instruction:
          "Complete the plan-external-model-test exercise to pair the review with workload-specific tests.",
        route: "/learn/exercises/plan-external-model-test",
        output: "Written external test plan to attach to the review package.",
      },
    ],
    requiredLessons: [
      "model-lifecycle",
      "status-aware-selection",
      "benchmark-limitations",
      "pricing-references",
    ],
    requiredExercises: [
      "check-source-freshness",
      "inspect-model-lifecycle",
      "plan-external-model-test",
    ],
    requiredPlaybooks: [
      "model-regression-testing",
      "prompt-testing-basics",
    ],
    requiredPromptSets: [
      "refusal-boundary",
      "instruction-following",
    ],
    requiredTemplates: [
      "model-evaluation-plan",
      "automation-risk-checklist",
    ],
    finalChecklist: [
      "Source freshness checklist exported per provider in scope.",
      "Lifecycle review note covers every model in scope.",
      "Data gap list is explicit (not implied).",
      "Canary suite + regression cadence are documented.",
      "Governance review brief exported in Markdown.",
      "External test plan written.",
      "No certification or compliance-approval language in any artifact.",
    ],
    evidenceRoutes: [
      { label: "Reverification queue", href: "/reverification" },
      { label: "Coverage audit", href: "/coverage" },
      { label: "Citation registry", href: "/sources" },
      { label: "Decision brief builder", href: "/briefs/build" },
    ],
    doesNotPromise: [
      "Compliance approval or certification.",
      "Legal advice.",
      "Vendor endorsement.",
      "Sign-off on behalf of the reviewer's organisation.",
    ],
  },
];

export const workflowKits: WorkflowKit[] = KITS;

export function getWorkflowKit(slug: string): WorkflowKit | undefined {
  return KITS.find((k) => k.slug === slug);
}

export function getWorkflowKits(): WorkflowKit[] {
  return KITS;
}

export function getWorkflowKitRoutes(): string[] {
  return ["/kits", ...KITS.map((k) => `/kits/${k.slug}`)];
}

export function getWorkflowKitsByAudience(
  audienceSlug: AudienceSlug
): WorkflowKit[] {
  return KITS.filter((k) => k.audienceSlug === audienceSlug);
}

/**
 * Serialise a workflow kit to Markdown. Deterministic — no Date.now,
 * no model-specific values, no user input required. Used by the
 * /api/kits/[slug] export endpoint and any other consumer that
 * needs a paste-ready work document.
 */
export function workflowKitToMarkdown(kit: WorkflowKit): string {
  const lines: string[] = [];
  lines.push(`# ${kit.title}`);
  lines.push("");
  lines.push(`> ${kit.summary}`);
  lines.push("");
  lines.push(
    `Audience: ${kit.audienceSlug} · Difficulty: ${kit.difficulty} · Estimated: ${kit.estimatedMinutes} min`
  );
  lines.push("");
  lines.push("## Goal");
  lines.push("");
  lines.push(kit.goal);
  lines.push("");
  lines.push("## What you will produce");
  lines.push("");
  for (const a of kit.whatYouWillProduce) lines.push(`- ${a}`);
  lines.push("");
  lines.push("## Prerequisites");
  lines.push("");
  for (const p of kit.prerequisites)
    lines.push(`- [${p.label}](${p.href})`);
  lines.push("");
  lines.push("## Workflow");
  lines.push("");
  for (const step of kit.workflow) {
    lines.push(`### Step ${step.step} — ${step.title}`);
    lines.push("");
    lines.push(step.instruction);
    lines.push("");
    lines.push(`**Open:** \`${step.route}\``);
    lines.push("");
    lines.push(`**Output:** ${step.output}`);
    lines.push("");
  }
  lines.push("## Required resources");
  lines.push("");
  lines.push("**Lessons:**");
  for (const slug of kit.requiredLessons) lines.push(`- /learn/${slug}`);
  lines.push("");
  lines.push("**Exercises:**");
  for (const slug of kit.requiredExercises)
    lines.push(`- /learn/exercises/${slug}`);
  lines.push("");
  lines.push("**Lab playbooks:**");
  for (const slug of kit.requiredPlaybooks) lines.push(`- /lab/${slug}`);
  lines.push("");
  lines.push("**Evaluation prompt sets:**");
  for (const slug of kit.requiredPromptSets)
    lines.push(`- /lab/prompts/${slug}`);
  lines.push("");
  lines.push("**Templates:**");
  for (const slug of kit.requiredTemplates)
    lines.push(`- /lab/templates/${slug}`);
  lines.push("");
  lines.push("## Final checklist");
  lines.push("");
  for (const c of kit.finalChecklist) lines.push(`- [ ] ${c}`);
  lines.push("");
  lines.push("## Evidence routes");
  lines.push("");
  for (const r of kit.evidenceRoutes)
    lines.push(`- [${r.label}](${r.href})`);
  lines.push("");
  lines.push("## What this kit does not promise");
  lines.push("");
  for (const d of kit.doesNotPromise) lines.push(`- ${d}`);
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push(
    "_Generated by WebmasterID Models. Pure local derivation — no Date.now, no model-specific outputs, no recommendations. https://models.webmasterid.com/kits_"
  );
  return lines.join("\n");
}
