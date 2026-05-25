/**
 * Outcome use cases — Sprint 36.
 *
 * Outcome-driven landing pages that map real user problems onto the
 * existing learning paths, exercises, lab playbooks, prompt sets,
 * workflow kits, and evidence routes. Each outcome page:
 *
 *   - Names the problem the reader is trying to solve.
 *   - Lists who it is for.
 *   - Routes the reader through Learn → Apply → Verify → Test →
 *     Package using existing surfaces.
 *   - Ends by naming the artifacts the reader will end with.
 *
 * Discipline:
 *   - Pure local data — no fetch, no Date.now, no process.env.
 *   - No model rankings, no recommendations, no winner claims.
 *   - No SEO ranking guarantees, no compliance certification,
 *     no production-readiness guarantees.
 *   - Every outcome page links into existing routes only — no
 *     parallel UI.
 */

export type OutcomeUseCaseSlug =
  | "ai-model-evaluation-for-developers"
  | "ai-model-selection-for-product-teams"
  | "ai-automation-testing"
  | "ai-model-governance-review"
  | "llm-prompt-evaluation"
  | "structured-output-testing";

export interface OutcomeUseCaseResource {
  label: string;
  href: string;
  purpose: string;
}

export interface OutcomeUseCaseWorkflowStep {
  step: number;
  label: string;
  href: string;
  output: string;
}

export interface OutcomeUseCase {
  slug: OutcomeUseCaseSlug;
  title: string;
  headline: string;
  summary: string;
  audienceSlug?: string;
  problem: string[];
  whoThisIsFor: string[];
  whatToLearn: OutcomeUseCaseResource[];
  exercises: OutcomeUseCaseResource[];
  labPlaybooks: OutcomeUseCaseResource[];
  promptSets: OutcomeUseCaseResource[];
  workflowKits: OutcomeUseCaseResource[];
  evidenceArtifacts: string[];
  suggestedWorkflow: OutcomeUseCaseWorkflowStep[];
  doesNotPromise: string[];
}

const OUTCOMES: OutcomeUseCase[] = [
  // -------------------------------------------------------------------
  // AI model evaluation for developers
  // -------------------------------------------------------------------
  {
    slug: "ai-model-evaluation-for-developers",
    title: "AI model evaluation for developers",
    headline:
      "Evaluate AI models before integration without trusting a leaderboard",
    summary:
      "A product-led path through the catalogue for engineers preparing an integration. Walk the developer learning path, run the prompt-testing playbook, fill the model evaluation plan, and export a paste-ready evidence brief. Every step opens an existing route — no parallel UI.",
    audienceSlug: "developers",
    problem: [
      "You need to integrate an AI model in a backend, queue worker, or product surface.",
      "You have no defensible evidence trail today — just a vendor blog and an ad-hoc shortlist.",
      "You want to compare candidates without trusting a third-party leaderboard.",
      "You need to ship a brief plus a written external test plan a reviewer can read.",
    ],
    whoThisIsFor: [
      "Engineers preparing an integration this quarter.",
      "Tech leads triaging which candidate to shortlist.",
      "Reviewers who need a paste-ready evidence brief plus a test plan.",
    ],
    whatToLearn: [
      {
        label: "How to choose an AI model",
        href: "/learn/how-to-choose-ai-model",
        purpose:
          "Frame the workflow before opening the catalogue.",
      },
      {
        label: "Hosted vs first-party",
        href: "/learn/hosted-vs-first-party",
        purpose: "Separate creator from billing platform.",
      },
      {
        label: "Structured output",
        href: "/learn/structured-output",
        purpose:
          "Distinguish JSON mode, structured output, tool calling.",
      },
      {
        label: "Testing AI models",
        href: "/learn/testing-ai-models",
        purpose:
          "Plan the workload-specific tests the catalogue cannot run.",
      },
    ],
    exercises: [
      {
        label: "Map hosted provider",
        href: "/learn/exercises/map-hosted-provider",
        purpose:
          "Separate creator + host + data gap for the candidates.",
      },
      {
        label: "Create decision brief",
        href: "/learn/exercises/create-decision-brief",
        purpose: "Export the Markdown evidence pack.",
      },
      {
        label: "Plan external model test",
        href: "/learn/exercises/plan-external-model-test",
        purpose:
          "Write a test plan that pairs the brief with workload-specific tests.",
      },
    ],
    labPlaybooks: [
      {
        label: "Prompt testing basics",
        href: "/lab/prompt-testing-basics",
        purpose:
          "Minimum repeatable routine before integration.",
      },
      {
        label: "Structured output testing",
        href: "/lab/structured-output-testing",
        purpose:
          "Validate JSON mode / structured output / tool calls against your schema.",
      },
    ],
    promptSets: [
      {
        label: "Structured extraction",
        href: "/lab/prompts/structured-extraction",
        purpose: "Surface schema-extraction failure modes.",
      },
      {
        label: "Instruction following",
        href: "/lab/prompts/instruction-following",
        purpose:
          "Confirm the model honours format + length + uncertainty + forbidden-phrase constraints.",
      },
    ],
    workflowKits: [
      {
        label: "Developer model evaluation kit",
        href: "/kits/developer-model-evaluation",
        purpose:
          "Single Markdown work document that bundles the whole flow.",
      },
    ],
    evidenceArtifacts: [
      "Hosted-provider mapping note",
      "Verified comparison URL",
      "Decision evidence brief (Markdown)",
      "Prompt test matrix (Markdown)",
      "External test plan",
    ],
    suggestedWorkflow: [
      {
        step: 1,
        label: "Walk the developer learning path",
        href: "/learn/path/developer",
        output: "Notes on the four core lessons.",
      },
      {
        step: 2,
        label: "Open the developer workflow kit",
        href: "/kits/developer-model-evaluation",
        output: "Sequenced work document with required resources.",
      },
      {
        step: 3,
        label: "Build the comparison",
        href: "/compare/build",
        output: "Comparison URL pinned in the brief.",
      },
      {
        step: 4,
        label: "Run prompt testing basics",
        href: "/lab/prompt-testing-basics",
        output: "Per-prompt observations against your rubric.",
      },
      {
        step: 5,
        label: "Export the brief",
        href: "/briefs/build",
        output: "Markdown evidence pack.",
      },
    ],
    doesNotPromise: [
      "Pick the right model for the integration.",
      "Assert latency, throughput, or uptime.",
      "Replace your own workload-specific testing.",
      "Certify the model for any regulatory regime.",
    ],
  },

  // -------------------------------------------------------------------
  // AI model selection for product teams
  // -------------------------------------------------------------------
  {
    slug: "ai-model-selection-for-product-teams",
    title: "AI model selection for product teams",
    headline:
      "Turn a product use case into a defensible model selection",
    summary:
      "A product-led path for product managers and technical buyers. Frame the use case, capture pricing references with retrievedAt dates, gate integration on lifecycle, walk a small prompt-testing routine, and export the evidence brief your reviewers will read together.",
    audienceSlug: "product-teams",
    problem: [
      "Engineering wants to ship; finance wants a cost projection; legal wants a lifecycle plan.",
      "There is no single document the team can review together.",
      "Past decisions relied on a vendor blog rather than a sourced evidence trail.",
      "Reviewers cannot trace any number in the brief back to a primary source.",
    ],
    whoThisIsFor: [
      "Product managers framing a model decision with engineering and finance.",
      "Technical buyers building a defensible review document.",
      "Cross-functional teams aligning on scope, gaps, and sign-offs.",
    ],
    whatToLearn: [
      {
        label: "How to choose an AI model",
        href: "/learn/how-to-choose-ai-model",
        purpose: "Align the team on the decision workflow.",
      },
      {
        label: "Pricing references",
        href: "/learn/pricing-references",
        purpose: "Read pricing rows as references, not quotes.",
      },
      {
        label: "Model lifecycle",
        href: "/learn/model-lifecycle",
        purpose: "Make lifecycle a gate on the integration plan.",
      },
      {
        label: "Benchmark limitations",
        href: "/learn/benchmark-limitations",
        purpose:
          "Understand why the catalogue does not publish scores.",
      },
    ],
    exercises: [
      {
        label: "Review pricing reference",
        href: "/learn/exercises/review-pricing-reference",
        purpose:
          "Capture provider + unit + retrievedAt that finance can sanity-check.",
      },
      {
        label: "Inspect model lifecycle",
        href: "/learn/exercises/inspect-model-lifecycle",
        purpose:
          "Capture lifecycle + retirement date for the integration timeline.",
      },
      {
        label: "Create decision brief",
        href: "/learn/exercises/create-decision-brief",
        purpose: "Export the brief reviewers will read together.",
      },
    ],
    labPlaybooks: [
      {
        label: "Prompt testing basics",
        href: "/lab/prompt-testing-basics",
        purpose:
          "Light prompt-testing routine for the candidate set.",
      },
      {
        label: "Long-context testing",
        href: "/lab/long-context-testing",
        purpose:
          "Test recall + cost growth if the workload depends on long prompts.",
      },
    ],
    promptSets: [
      {
        label: "Summarization quality",
        href: "/lab/prompts/summarization-quality",
        purpose:
          "Surface hallucination + over-confident conclusions.",
      },
      {
        label: "Instruction following",
        href: "/lab/prompts/instruction-following",
        purpose:
          "Confirm the model respects format and constraint instructions.",
      },
    ],
    workflowKits: [
      {
        label: "Product model selection kit",
        href: "/kits/product-model-selection",
        purpose:
          "Markdown work document that bundles the whole flow.",
      },
    ],
    evidenceArtifacts: [
      "Use-case shortlist URL",
      "Pricing-reference note",
      "Lifecycle risk note",
      "Decision evidence brief (Markdown)",
    ],
    suggestedWorkflow: [
      {
        step: 1,
        label: "Walk the product manager learning path",
        href: "/learn/path/product-manager",
        output: "Notes on the four foundational lessons.",
      },
      {
        step: 2,
        label: "Open the product model selection kit",
        href: "/kits/product-model-selection",
        output: "Sequenced work document with required resources.",
      },
      {
        step: 3,
        label: "Build the use-case shortlist",
        href: "/select",
        output: "Shortlist URL the team can re-open together.",
      },
      {
        step: 4,
        label: "Export the brief",
        href: "/briefs/build",
        output: "Markdown brief for the review meeting.",
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
  // AI automation testing
  // -------------------------------------------------------------------
  {
    slug: "ai-automation-testing",
    title: "AI automation testing",
    headline:
      "Test an AI model inside an automation before it runs unattended",
    summary:
      "A product-led path for automation builders, SEO operators, and technical consultants. Walk the automation-specialist learning path, run the automation workflow testing playbook, surface contract drift with the automation-robustness prompt set, and ship the runbook with an evidence brief plus a regression-aware test plan.",
    audienceSlug: "automation-specialists",
    problem: [
      "An automation calls an AI model unattended and silent failures cascade downstream.",
      "Structured-output drift after a snapshot rotation breaks a parser without warning.",
      "Retry logic amplifies malformed outputs instead of stopping at the safe failure.",
      "The team has no regression suite to catch silent quality drops.",
    ],
    whoThisIsFor: [
      "Automation builders wiring AI models into pipelines, queues, or schedulers.",
      "Technical consultants reviewing a client's automation before launch.",
      "Operators running structured AI tasks (extraction, classification, summarisation).",
    ],
    whatToLearn: [
      {
        label: "Structured output",
        href: "/learn/structured-output",
        purpose:
          "Pick the right structured-generation surface for your parser.",
      },
      {
        label: "Pricing references",
        href: "/learn/pricing-references",
        purpose:
          "Project cost from per-unit references, not invoices.",
      },
      {
        label: "Testing AI models",
        href: "/learn/testing-ai-models",
        purpose:
          "Plan tests that catch silent regressions inside an automation loop.",
      },
    ],
    exercises: [
      {
        label: "Build first shortlist",
        href: "/learn/exercises/build-first-shortlist",
        purpose:
          "Capture a /select URL the team can re-open before each release.",
      },
      {
        label: "Review pricing reference",
        href: "/learn/exercises/review-pricing-reference",
        purpose: "Capture the cost projection inputs.",
      },
      {
        label: "Plan external model test",
        href: "/learn/exercises/plan-external-model-test",
        purpose:
          "Write the test plan that ships with the automation runbook.",
      },
    ],
    labPlaybooks: [
      {
        label: "Automation workflow testing",
        href: "/lab/automation-workflow-testing",
        purpose:
          "Test the model inside the loop — retries, parsers, regression.",
      },
      {
        label: "Model regression testing",
        href: "/lab/model-regression-testing",
        purpose:
          "Freeze the canary suite that detects silent snapshot drift.",
      },
    ],
    promptSets: [
      {
        label: "Automation robustness",
        href: "/lab/prompts/automation-robustness",
        purpose:
          "Surface contract drift across categories, missing values, retries.",
      },
      {
        label: "Structured extraction",
        href: "/lab/prompts/structured-extraction",
        purpose:
          "Validate schema-extraction reliability against your real schema.",
      },
    ],
    workflowKits: [
      {
        label: "Automation workflow testing kit",
        href: "/kits/automation-workflow-testing",
        purpose:
          "Markdown work document bundling lessons + exercises + lab + prompts.",
      },
    ],
    evidenceArtifacts: [
      "Automation risk checklist",
      "Prompt test matrix",
      "Safe model-use checklist",
      "External test plan",
      "Decision evidence brief",
    ],
    suggestedWorkflow: [
      {
        step: 1,
        label: "Walk the automation specialist path",
        href: "/learn/path/automation-specialist",
        output: "Notes on safe AI use inside automations.",
      },
      {
        step: 2,
        label: "Open the automation workflow testing kit",
        href: "/kits/automation-workflow-testing",
        output:
          "Sequenced work document with required resources.",
      },
      {
        step: 3,
        label: "Run the automation workflow testing playbook",
        href: "/lab/automation-workflow-testing",
        output: "Shadow-run observations + canary suite.",
      },
      {
        step: 4,
        label: "Fill the automation risk checklist",
        href: "/lab/templates/automation-risk-checklist",
        output:
          "Pre-launch risk checklist attached to the runbook.",
      },
      {
        step: 5,
        label: "Export the brief",
        href: "/briefs/build",
        output: "Markdown brief paired with the runbook.",
      },
    ],
    doesNotPromise: [
      "Guarantee automation reliability.",
      "Improve search-engine traffic or organic rankings.",
      "Substitute for human review on a customer-facing surface.",
      "Approve the pipeline as production-ready.",
    ],
  },

  // -------------------------------------------------------------------
  // AI model governance review
  // -------------------------------------------------------------------
  {
    slug: "ai-model-governance-review",
    title: "AI model governance review",
    headline:
      "Build a defensible governance review with sourced evidence",
    summary:
      "A product-led path for risk, compliance, and governance reviewers. Walk the governance learning path, audit source freshness + lifecycle + coverage, run the regression and refusal-boundary suites, and export a Markdown governance review brief paired with a written external testing plan — never a certification.",
    audienceSlug: "governance-teams",
    problem: [
      "Internal review needs a defensible evidence trail for a model already in production.",
      "Citations are months old; lifecycle has shifted; the previous brief no longer matches the catalogue.",
      "The team needs to flag unverified claims and stale sources before approval.",
      "Reviewers cannot reconstruct the original decision without a sourced trail.",
    ],
    whoThisIsFor: [
      "Risk, compliance, and governance reviewers preparing internal approvals.",
      "Operators auditing provider coverage and freshness before sign-off.",
      "Teams maintaining an internal AI inventory with documented data gaps.",
    ],
    whatToLearn: [
      {
        label: "Model lifecycle",
        href: "/learn/model-lifecycle",
        purpose:
          "Read lifecycle as an integration gate.",
      },
      {
        label: "Status-aware selection",
        href: "/learn/status-aware-selection",
        purpose:
          "Separate vendor-reported status from the independent probe.",
      },
      {
        label: "Benchmark limitations",
        href: "/learn/benchmark-limitations",
        purpose:
          "Understand why no benchmark score is published.",
      },
      {
        label: "Pricing references",
        href: "/learn/pricing-references",
        purpose:
          "Read pricing as sourced references with retrievedAt dates.",
      },
    ],
    exercises: [
      {
        label: "Check source freshness",
        href: "/learn/exercises/check-source-freshness",
        purpose:
          "Export a freshness checklist scoped to the provider under review.",
      },
      {
        label: "Inspect model lifecycle",
        href: "/learn/exercises/inspect-model-lifecycle",
        purpose:
          "Capture lifecycle + retirement date + citation per model in scope.",
      },
      {
        label: "Plan external model test",
        href: "/learn/exercises/plan-external-model-test",
        purpose:
          "Pair the review with workload-specific tests.",
      },
    ],
    labPlaybooks: [
      {
        label: "Model regression testing",
        href: "/lab/model-regression-testing",
        purpose:
          "Schedule the canary suite that catches silent snapshot drift.",
      },
      {
        label: "Prompt testing basics",
        href: "/lab/prompt-testing-basics",
        purpose:
          "Light prompt-testing routine for the review.",
      },
    ],
    promptSets: [
      {
        label: "Refusal boundary",
        href: "/lab/prompts/refusal-boundary",
        purpose:
          "Surface over-refusal and inappropriate-compliance behaviour.",
      },
      {
        label: "Instruction following",
        href: "/lab/prompts/instruction-following",
        purpose:
          "Confirm the model respects explicit constraints.",
      },
    ],
    workflowKits: [
      {
        label: "Governance review kit",
        href: "/kits/governance-review",
        purpose:
          "Markdown work document bundling the whole governance flow.",
      },
    ],
    evidenceArtifacts: [
      "Source freshness checklist",
      "Lifecycle review note",
      "Data gap list",
      "Governance review brief",
      "External test plan",
    ],
    suggestedWorkflow: [
      {
        step: 1,
        label: "Walk the governance learning path",
        href: "/learn/path/governance",
        output: "Notes on lifecycle, status, benchmarks, pricing.",
      },
      {
        step: 2,
        label: "Open the governance review kit",
        href: "/kits/governance-review",
        output: "Sequenced work document with required resources.",
      },
      {
        step: 3,
        label: "Walk the reverification queue",
        href: "/reverification",
        output: "Stale citations flagged for re-read.",
      },
      {
        step: 4,
        label: "Audit coverage",
        href: "/coverage",
        output: "Verified-field counts + citation density per provider.",
      },
      {
        step: 5,
        label: "Export the brief",
        href: "/briefs/build",
        output: "Markdown governance review brief.",
      },
    ],
    doesNotPromise: [
      "Compliance certification or approval.",
      "Legal advice.",
      "Vendor endorsement.",
      "Sign-off on behalf of the reviewer's organisation.",
    ],
  },

  // -------------------------------------------------------------------
  // LLM prompt evaluation
  // -------------------------------------------------------------------
  {
    slug: "llm-prompt-evaluation",
    title: "LLM prompt evaluation",
    headline:
      "Evaluate model behaviour with safe, structured prompt sets",
    summary:
      "A product-led path through the evaluation prompt library — six generic, safe prompt sets that surface failure modes (hallucination, schema drift, lost-in-the-middle, instruction skipping, unsafe compliance, contract violation). Run them in your own harness; the catalogue never calls live models on your behalf.",
    problem: [
      "Teams compare AI models by 'vibe' instead of by observed behaviour.",
      "Production prompt drift after a snapshot rotation is invisible without a canary set.",
      "Public benchmark scores are not reproducible enough to drive selection on their own.",
      "There is no shared baseline of evaluation inputs the team can rerun consistently.",
    ],
    whoThisIsFor: [
      "Teams that need a small repeatable prompt set for evaluating candidate models.",
      "Reviewers comparing two candidates on faithful behaviour rather than benchmark headlines.",
      "Operators preparing a regression suite for unattended production use.",
    ],
    whatToLearn: [
      {
        label: "Testing AI models",
        href: "/learn/testing-ai-models",
        purpose:
          "Plan the tests the catalogue cannot run for you.",
      },
      {
        label: "Benchmark limitations",
        href: "/learn/benchmark-limitations",
        purpose:
          "Treat benchmark figures as marketing artifacts without reproducible methodology.",
      },
      {
        label: "Structured output",
        href: "/learn/structured-output",
        purpose:
          "Match the structured-generation surface to your parser.",
      },
    ],
    exercises: [
      {
        label: "Compare context windows",
        href: "/learn/exercises/compare-context-windows",
        purpose:
          "Build a comparison the prompt sets can pair with.",
      },
      {
        label: "Plan external model test",
        href: "/learn/exercises/plan-external-model-test",
        purpose:
          "Write the harness plan the prompt sets feed into.",
      },
    ],
    labPlaybooks: [
      {
        label: "Prompt testing basics",
        href: "/lab/prompt-testing-basics",
        purpose:
          "Minimum repeatable prompt-test routine.",
      },
      {
        label: "Model regression testing",
        href: "/lab/model-regression-testing",
        purpose:
          "Schedule the canary suite that detects silent drift.",
      },
    ],
    promptSets: [
      {
        label: "All evaluation prompt sets",
        href: "/lab/prompts",
        purpose: "Hub of six prompt sets.",
      },
      {
        label: "Summarization quality",
        href: "/lab/prompts/summarization-quality",
        purpose: "Faithful summarisation.",
      },
      {
        label: "Structured extraction",
        href: "/lab/prompts/structured-extraction",
        purpose: "Schema-conformant extraction.",
      },
      {
        label: "Long-context recall",
        href: "/lab/prompts/long-context-recall",
        purpose: "Constraint preservation across long inputs.",
      },
      {
        label: "Instruction following",
        href: "/lab/prompts/instruction-following",
        purpose: "Format + length + uncertainty constraints.",
      },
      {
        label: "Refusal boundary",
        href: "/lab/prompts/refusal-boundary",
        purpose: "Safe boundary-setting behaviour.",
      },
      {
        label: "Automation robustness",
        href: "/lab/prompts/automation-robustness",
        purpose: "Contract drift inside automation loops.",
      },
    ],
    workflowKits: [
      {
        label: "Developer model evaluation kit",
        href: "/kits/developer-model-evaluation",
        purpose: "Includes structured-extraction + instruction-following sets.",
      },
      {
        label: "Automation workflow testing kit",
        href: "/kits/automation-workflow-testing",
        purpose: "Includes automation-robustness + structured-extraction sets.",
      },
    ],
    evidenceArtifacts: [
      "Per-set Markdown export (via /api/lab/prompts/<slug>)",
      "Prompt test matrix (Markdown)",
      "Per-prompt observation record",
      "Canary suite for regression checks",
    ],
    suggestedWorkflow: [
      {
        step: 1,
        label: "Read the evaluation guide",
        href: "/lab/evaluation",
        output: "Framing for what evaluation means here.",
      },
      {
        step: 2,
        label: "Open the evaluation prompt library",
        href: "/lab/prompts",
        output: "Pick the set that matches your behaviour to test.",
      },
      {
        step: 3,
        label: "Open the prompt-test matrix template",
        href: "/lab/templates/prompt-test-matrix",
        output: "Markdown scaffold for per-candidate observations.",
      },
      {
        step: 4,
        label: "Run the prompts in your own harness",
        href: "/learn/testing-ai-models",
        output: "Per-prompt observations recorded verbatim.",
      },
      {
        step: 5,
        label: "Add findings to the decision brief",
        href: "/briefs/build",
        output: "Brief paired with the prompt-set observations.",
      },
    ],
    doesNotPromise: [
      "Score the model for you.",
      "Replace your own red-team or safety audit.",
      "Predict production behaviour from 5–10 prompts.",
      "Substitute for benchmark methodology where independent reproducibility is required.",
    ],
  },

  // -------------------------------------------------------------------
  // Structured output testing
  // -------------------------------------------------------------------
  {
    slug: "structured-output-testing",
    title: "Structured output testing",
    headline:
      "Validate JSON mode, structured output, and tool calling against your real schema",
    summary:
      "A product-led path through structured-generation testing — what gets verified in the catalogue, what your schema requires, and how to surface schema drift before it reaches the parser. Pairs the structured-output lesson + playbook + prompt set with the comparison builder and the brief.",
    problem: [
      "Marketing claims 'JSON mode' and your schema validator still fails.",
      "Schema validity holds at low temperature and drifts at higher sampling.",
      "Different providers honour different subsets of JSON Schema vocabulary.",
      "A snapshot rotation silently changes the structured-output surface.",
    ],
    whoThisIsFor: [
      "Engineers wiring the model into a parser-dependent automation.",
      "Reviewers validating structured-generation reliability before integration.",
      "Operators running regression checks on schema validity after each release.",
    ],
    whatToLearn: [
      {
        label: "Structured output",
        href: "/learn/structured-output",
        purpose:
          "Distinguish JSON mode / structured output / tool calling.",
      },
      {
        label: "Multimodal input",
        href: "/learn/multimodal-input",
        purpose:
          "When your schema spans multiple modalities, confirm the channels.",
      },
      {
        label: "Testing AI models",
        href: "/learn/testing-ai-models",
        purpose:
          "Frame the structured-generation tests inside the broader plan.",
      },
    ],
    exercises: [
      {
        label: "Compare context windows",
        href: "/learn/exercises/compare-context-windows",
        purpose:
          "Build the comparison you will pair structured-output testing with.",
      },
      {
        label: "Create decision brief",
        href: "/learn/exercises/create-decision-brief",
        purpose:
          "Carry the structured-generation observations into the brief.",
      },
    ],
    labPlaybooks: [
      {
        label: "Structured output testing",
        href: "/lab/structured-output-testing",
        purpose:
          "Pinned schema bytes + strict validator + variation protocol.",
      },
      {
        label: "Model regression testing",
        href: "/lab/model-regression-testing",
        purpose:
          "Detect schema drift after a snapshot rotation.",
      },
    ],
    promptSets: [
      {
        label: "Structured extraction",
        href: "/lab/prompts/structured-extraction",
        purpose:
          "Five prompts that surface invented fields + null handling + verbatim qualifiers.",
      },
      {
        label: "Automation robustness",
        href: "/lab/prompts/automation-robustness",
        purpose:
          "Contract drift on allowed categories + missing-value handling + exact-string fallbacks.",
      },
    ],
    workflowKits: [
      {
        label: "Developer model evaluation kit",
        href: "/kits/developer-model-evaluation",
        purpose:
          "Includes the structured-output testing playbook + prompt set.",
      },
      {
        label: "Automation workflow testing kit",
        href: "/kits/automation-workflow-testing",
        purpose:
          "Includes structured-output schema regression coverage.",
      },
    ],
    evidenceArtifacts: [
      "Schema bytes captured alongside results",
      "Per-prompt validator output",
      "Field-level failure mode list",
      "Markdown brief excerpt covering structured-output observations",
    ],
    suggestedWorkflow: [
      {
        step: 1,
        label: "Read the structured-output lesson",
        href: "/learn/structured-output",
        output:
          "Notes distinguishing JSON mode / structured output / tool calling.",
      },
      {
        step: 2,
        label: "Open the structured-output testing playbook",
        href: "/lab/structured-output-testing",
        output:
          "Sequenced playbook with the variation protocol.",
      },
      {
        step: 3,
        label: "Run the structured-extraction prompt set",
        href: "/lab/prompts/structured-extraction",
        output:
          "Per-prompt validator outcomes recorded against your real schema.",
      },
      {
        step: 4,
        label: "Render the comparison",
        href: "/compare/build",
        output:
          "Comparison URL paired with the structured-output observations.",
      },
      {
        step: 5,
        label: "Add findings to the decision brief",
        href: "/briefs/build",
        output:
          "Markdown brief that lists structured-output validity per candidate.",
      },
    ],
    doesNotPromise: [
      "Validate your schema for compliance.",
      "Declare which model is best for structured generation.",
      "Guarantee schema reliability in production traffic.",
      "Replace your own schema-specific regression suite.",
    ],
  },
];

export const outcomeUseCases: OutcomeUseCase[] = OUTCOMES;

export function getOutcomeUseCase(slug: string): OutcomeUseCase | undefined {
  return OUTCOMES.find((o) => o.slug === slug);
}

export function getOutcomeUseCases(): OutcomeUseCase[] {
  return OUTCOMES;
}

export function getOutcomeUseCaseRoutes(): string[] {
  return OUTCOMES.map((o) => `/use-cases/${o.slug}`);
}
