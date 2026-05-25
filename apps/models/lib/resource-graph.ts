/**
 * Resource graph — Sprint 37.
 *
 * A unified navigation index across every product surface (lessons,
 * exercises, learning paths, lab playbooks, lab templates, evaluation
 * prompt sets, workflow kits, outcome pages, audience pages, guided
 * demos, decision-evidence workflows). The resource graph is the
 * registry that powers the /resources finder and the /docs/resource-map
 * documentation page.
 *
 * Discipline:
 *   - Pure local data — no fetch, no Date.now, no process.env.
 *   - Titles + descriptions + hrefs are pulled live from each source
 *     registry so a rename anywhere flows through automatically.
 *   - Stage / audience / goal / artifact tags live ONLY in this file —
 *     this is what the finder routes on.
 *   - No model rankings, no recommendations, no winner claims.
 *   - The graph never scores or sorts resources by "quality".
 */

import { lessons, getLesson } from "@/lib/lessons";
import {
  learningExercises,
  getLearningExercise,
} from "@/lib/learning-exercises";
import { learningPaths, getLearningPath } from "@/lib/learning-paths";
import {
  labPlaybooks,
  labTemplates,
  getLabPlaybook,
  getLabTemplate,
} from "@/lib/lab-playbooks";
import {
  evaluationPromptSets,
  getEvaluationPromptSet,
} from "@/lib/evaluation-prompts";
import { workflowKits, getWorkflowKit } from "@/lib/workflow-kits";
import {
  outcomeUseCases,
  getOutcomeUseCase,
} from "@/lib/outcome-use-cases";
import { audiences, getAudience } from "@/lib/audiences";
import { getGuidedDemos, getGuidedDemo } from "@/lib/guided-demos";

export type ResourceType =
  | "lesson"
  | "exercise"
  | "learning-path"
  | "lab-playbook"
  | "lab-template"
  | "prompt-set"
  | "workflow-kit"
  | "outcome"
  | "audience"
  | "demo"
  | "workflow"
  | "evidence"
  | "reference";

export type ResourceStage =
  | "learn"
  | "apply"
  | "verify"
  | "test"
  | "package";

export type ResourceGoal =
  | "learn-basics"
  | "choose-model-candidates"
  | "compare-models"
  | "test-model-behaviour"
  | "document-evidence"
  | "review-sources"
  | "prepare-governance-review"
  | "test-automation-workflow"
  | "understand-pricing"
  | "understand-hosting"
  | "evaluate-prompts";

export type ResourceArtifact =
  | "shortlist-url"
  | "comparison-url"
  | "decision-brief"
  | "model-evaluation-plan"
  | "prompt-test-matrix"
  | "source-freshness-checklist"
  | "external-test-plan"
  | "automation-risk-checklist"
  | "hosted-provider-note"
  | "lifecycle-review-note";

export type ResourceAudience =
  | "beginners"
  | "developers"
  | "product-teams"
  | "automation-specialists"
  | "governance-teams";

export type ResourceDifficulty = "beginner" | "intermediate";

export interface ResourceNode {
  id: string;
  title: string;
  description: string;
  href: string;
  type: ResourceType;
  stage: ResourceStage;
  audiences: ResourceAudience[];
  goals: ResourceGoal[];
  artifacts: ResourceArtifact[];
  difficulty?: ResourceDifficulty;
  estimatedMinutes?: number;
  related: string[];
}

export interface ResourceFilters {
  audience?: ResourceAudience;
  goal?: ResourceGoal;
  resourceType?: ResourceType;
  stage?: ResourceStage;
  artifact?: ResourceArtifact;
  difficulty?: ResourceDifficulty;
}

interface ResourceTags {
  type: ResourceType;
  stage: ResourceStage;
  audiences: ResourceAudience[];
  goals: ResourceGoal[];
  artifacts: ResourceArtifact[];
  related: string[];
}

// ---------------------------------------------------------------------------
// Tag layer. Keys are `${type}:${slug}` for entries that come from a
// source registry; `workflow:<slug>` / `evidence:<slug>` /
// `reference:<slug>` for entries authored only here.
// ---------------------------------------------------------------------------

const TAGS: Record<string, ResourceTags> = {
  // Lessons ---------------------------------------------------------------
  "lesson:how-to-choose-ai-model": {
    type: "lesson",
    stage: "learn",
    audiences: ["beginners", "developers", "product-teams"],
    goals: ["learn-basics", "choose-model-candidates"],
    artifacts: [],
    related: [
      "lesson:hosted-vs-first-party",
      "exercise:build-first-shortlist",
      "outcome:ai-model-evaluation-for-developers",
    ],
  },
  "lesson:context-window": {
    type: "lesson",
    stage: "learn",
    audiences: ["beginners", "developers"],
    goals: ["learn-basics", "compare-models"],
    artifacts: [],
    related: [
      "exercise:compare-context-windows",
      "playbook:long-context-testing",
    ],
  },
  "lesson:hosted-vs-first-party": {
    type: "lesson",
    stage: "learn",
    audiences: ["beginners", "developers", "product-teams"],
    goals: ["learn-basics", "understand-hosting"],
    artifacts: ["hosted-provider-note"],
    related: [
      "exercise:map-hosted-provider",
      "lesson:pricing-references",
    ],
  },
  "lesson:pricing-references": {
    type: "lesson",
    stage: "learn",
    audiences: ["product-teams", "automation-specialists"],
    goals: ["learn-basics", "understand-pricing"],
    artifacts: [],
    related: [
      "exercise:review-pricing-reference",
      "lesson:hosted-vs-first-party",
    ],
  },
  "lesson:model-lifecycle": {
    type: "lesson",
    stage: "learn",
    audiences: ["product-teams", "governance-teams"],
    goals: ["learn-basics", "prepare-governance-review"],
    artifacts: ["lifecycle-review-note"],
    related: [
      "exercise:inspect-model-lifecycle",
      "lesson:status-aware-selection",
    ],
  },
  "lesson:testing-ai-models": {
    type: "lesson",
    stage: "learn",
    audiences: ["developers", "automation-specialists"],
    goals: ["learn-basics", "test-model-behaviour"],
    artifacts: ["external-test-plan"],
    related: [
      "exercise:plan-external-model-test",
      "playbook:prompt-testing-basics",
    ],
  },
  "lesson:multimodal-input": {
    type: "lesson",
    stage: "learn",
    audiences: ["developers", "product-teams"],
    goals: ["learn-basics", "compare-models"],
    artifacts: [],
    related: ["playbook:multimodal-input-testing"],
  },
  "lesson:structured-output": {
    type: "lesson",
    stage: "learn",
    audiences: ["developers", "automation-specialists"],
    goals: ["learn-basics", "test-model-behaviour"],
    artifacts: [],
    related: [
      "playbook:structured-output-testing",
      "outcome:structured-output-testing",
    ],
  },
  "lesson:status-aware-selection": {
    type: "lesson",
    stage: "learn",
    audiences: ["governance-teams", "automation-specialists"],
    goals: ["learn-basics", "review-sources"],
    artifacts: [],
    related: ["lesson:model-lifecycle"],
  },
  "lesson:benchmark-limitations": {
    type: "lesson",
    stage: "learn",
    audiences: [
      "beginners",
      "developers",
      "product-teams",
      "governance-teams",
    ],
    goals: ["learn-basics", "evaluate-prompts"],
    artifacts: [],
    related: ["lesson:testing-ai-models", "promptset:summarization-quality"],
  },

  // Exercises -------------------------------------------------------------
  "exercise:build-first-shortlist": {
    type: "exercise",
    stage: "apply",
    audiences: ["beginners", "developers", "product-teams"],
    goals: ["choose-model-candidates"],
    artifacts: ["shortlist-url"],
    related: [
      "lesson:how-to-choose-ai-model",
      "exercise:create-decision-brief",
    ],
  },
  "exercise:compare-context-windows": {
    type: "exercise",
    stage: "apply",
    audiences: ["developers", "product-teams"],
    goals: ["compare-models"],
    artifacts: ["comparison-url"],
    related: ["lesson:context-window", "exercise:create-decision-brief"],
  },
  "exercise:map-hosted-provider": {
    type: "exercise",
    stage: "apply",
    audiences: ["developers", "product-teams"],
    goals: ["understand-hosting"],
    artifacts: ["hosted-provider-note"],
    related: ["lesson:hosted-vs-first-party"],
  },
  "exercise:review-pricing-reference": {
    type: "exercise",
    stage: "verify",
    audiences: ["product-teams", "automation-specialists"],
    goals: ["understand-pricing", "document-evidence"],
    artifacts: [],
    related: ["lesson:pricing-references"],
  },
  "exercise:inspect-model-lifecycle": {
    type: "exercise",
    stage: "verify",
    audiences: ["product-teams", "governance-teams"],
    goals: ["prepare-governance-review"],
    artifacts: ["lifecycle-review-note"],
    related: ["lesson:model-lifecycle"],
  },
  "exercise:create-decision-brief": {
    type: "exercise",
    stage: "package",
    audiences: ["developers", "product-teams", "governance-teams"],
    goals: ["document-evidence"],
    artifacts: ["decision-brief"],
    related: [
      "exercise:build-first-shortlist",
      "outcome:ai-model-selection-for-product-teams",
    ],
  },
  "exercise:check-source-freshness": {
    type: "exercise",
    stage: "verify",
    audiences: ["governance-teams"],
    goals: ["review-sources", "prepare-governance-review"],
    artifacts: ["source-freshness-checklist"],
    related: ["reference:reverification", "outcome:ai-model-governance-review"],
  },
  "exercise:plan-external-model-test": {
    type: "exercise",
    stage: "test",
    audiences: ["developers", "automation-specialists", "governance-teams"],
    goals: ["test-model-behaviour", "test-automation-workflow"],
    artifacts: ["external-test-plan"],
    related: ["lesson:testing-ai-models", "playbook:prompt-testing-basics"],
  },

  // Learning paths --------------------------------------------------------
  "path:beginner": {
    type: "learning-path",
    stage: "learn",
    audiences: ["beginners"],
    goals: ["learn-basics"],
    artifacts: [],
    related: ["lesson:how-to-choose-ai-model"],
  },
  "path:developer": {
    type: "learning-path",
    stage: "learn",
    audiences: ["developers"],
    goals: ["learn-basics", "choose-model-candidates", "test-model-behaviour"],
    artifacts: ["decision-brief"],
    related: [
      "outcome:ai-model-evaluation-for-developers",
      "kit:developer-model-evaluation",
    ],
  },
  "path:product-manager": {
    type: "learning-path",
    stage: "learn",
    audiences: ["product-teams"],
    goals: ["learn-basics", "choose-model-candidates", "document-evidence"],
    artifacts: ["decision-brief"],
    related: [
      "outcome:ai-model-selection-for-product-teams",
      "kit:product-model-selection",
    ],
  },
  "path:governance": {
    type: "learning-path",
    stage: "learn",
    audiences: ["governance-teams"],
    goals: ["prepare-governance-review", "review-sources"],
    artifacts: ["source-freshness-checklist", "lifecycle-review-note"],
    related: [
      "outcome:ai-model-governance-review",
      "kit:governance-review",
    ],
  },
  "path:automation-specialist": {
    type: "learning-path",
    stage: "learn",
    audiences: ["automation-specialists"],
    goals: ["test-automation-workflow", "test-model-behaviour"],
    artifacts: ["automation-risk-checklist", "external-test-plan"],
    related: [
      "outcome:ai-automation-testing",
      "kit:automation-workflow-testing",
    ],
  },

  // Lab playbooks --------------------------------------------------------
  "playbook:prompt-testing-basics": {
    type: "lab-playbook",
    stage: "test",
    audiences: ["developers", "product-teams", "automation-specialists"],
    goals: ["test-model-behaviour", "evaluate-prompts"],
    artifacts: ["prompt-test-matrix"],
    related: [
      "template:prompt-test-matrix",
      "promptset:instruction-following",
    ],
  },
  "playbook:structured-output-testing": {
    type: "lab-playbook",
    stage: "test",
    audiences: ["developers", "automation-specialists"],
    goals: ["test-model-behaviour"],
    artifacts: ["prompt-test-matrix"],
    related: [
      "promptset:structured-extraction",
      "outcome:structured-output-testing",
    ],
  },
  "playbook:long-context-testing": {
    type: "lab-playbook",
    stage: "test",
    audiences: ["developers", "product-teams"],
    goals: ["test-model-behaviour", "compare-models"],
    artifacts: ["prompt-test-matrix"],
    related: ["promptset:long-context-recall", "lesson:context-window"],
  },
  "playbook:multimodal-input-testing": {
    type: "lab-playbook",
    stage: "test",
    audiences: ["developers", "product-teams"],
    goals: ["test-model-behaviour"],
    artifacts: ["prompt-test-matrix"],
    related: ["lesson:multimodal-input"],
  },
  "playbook:automation-workflow-testing": {
    type: "lab-playbook",
    stage: "test",
    audiences: ["automation-specialists"],
    goals: ["test-automation-workflow"],
    artifacts: ["automation-risk-checklist", "external-test-plan"],
    related: [
      "template:automation-risk-checklist",
      "promptset:automation-robustness",
      "outcome:ai-automation-testing",
    ],
  },
  "playbook:model-regression-testing": {
    type: "lab-playbook",
    stage: "test",
    audiences: ["automation-specialists", "governance-teams"],
    goals: ["test-model-behaviour", "prepare-governance-review"],
    artifacts: ["prompt-test-matrix", "external-test-plan"],
    related: [
      "promptset:refusal-boundary",
      "outcome:ai-model-governance-review",
    ],
  },

  // Lab templates --------------------------------------------------------
  "template:model-evaluation-plan": {
    type: "lab-template",
    stage: "package",
    audiences: ["developers", "product-teams"],
    goals: ["document-evidence"],
    artifacts: ["model-evaluation-plan"],
    related: ["exercise:create-decision-brief", "evidence:decision-brief"],
  },
  "template:prompt-test-matrix": {
    type: "lab-template",
    stage: "package",
    audiences: ["developers", "product-teams", "automation-specialists"],
    goals: ["document-evidence", "test-model-behaviour"],
    artifacts: ["prompt-test-matrix"],
    related: ["playbook:prompt-testing-basics"],
  },
  "template:automation-risk-checklist": {
    type: "lab-template",
    stage: "package",
    audiences: ["automation-specialists", "governance-teams"],
    goals: ["test-automation-workflow", "prepare-governance-review"],
    artifacts: ["automation-risk-checklist"],
    related: ["playbook:automation-workflow-testing"],
  },

  // Prompt sets ----------------------------------------------------------
  "promptset:summarization-quality": {
    type: "prompt-set",
    stage: "test",
    audiences: ["developers", "product-teams"],
    goals: ["evaluate-prompts", "test-model-behaviour"],
    artifacts: ["prompt-test-matrix"],
    related: ["playbook:prompt-testing-basics"],
  },
  "promptset:structured-extraction": {
    type: "prompt-set",
    stage: "test",
    audiences: ["developers", "automation-specialists"],
    goals: ["evaluate-prompts", "test-model-behaviour"],
    artifacts: ["prompt-test-matrix"],
    related: [
      "playbook:structured-output-testing",
      "outcome:structured-output-testing",
    ],
  },
  "promptset:long-context-recall": {
    type: "prompt-set",
    stage: "test",
    audiences: ["developers", "product-teams"],
    goals: ["evaluate-prompts", "test-model-behaviour"],
    artifacts: ["prompt-test-matrix"],
    related: ["playbook:long-context-testing"],
  },
  "promptset:instruction-following": {
    type: "prompt-set",
    stage: "test",
    audiences: ["developers", "product-teams"],
    goals: ["evaluate-prompts", "test-model-behaviour"],
    artifacts: ["prompt-test-matrix"],
    related: ["playbook:prompt-testing-basics"],
  },
  "promptset:refusal-boundary": {
    type: "prompt-set",
    stage: "test",
    audiences: ["governance-teams"],
    goals: ["evaluate-prompts", "prepare-governance-review"],
    artifacts: ["prompt-test-matrix"],
    related: ["playbook:model-regression-testing"],
  },
  "promptset:automation-robustness": {
    type: "prompt-set",
    stage: "test",
    audiences: ["automation-specialists"],
    goals: ["evaluate-prompts", "test-automation-workflow"],
    artifacts: ["prompt-test-matrix"],
    related: ["playbook:automation-workflow-testing"],
  },

  // Workflow kits --------------------------------------------------------
  "kit:developer-model-evaluation": {
    type: "workflow-kit",
    stage: "package",
    audiences: ["developers"],
    goals: ["choose-model-candidates", "document-evidence"],
    artifacts: [
      "decision-brief",
      "model-evaluation-plan",
      "prompt-test-matrix",
      "external-test-plan",
    ],
    related: [
      "path:developer",
      "outcome:ai-model-evaluation-for-developers",
    ],
  },
  "kit:automation-workflow-testing": {
    type: "workflow-kit",
    stage: "package",
    audiences: ["automation-specialists"],
    goals: ["test-automation-workflow"],
    artifacts: [
      "automation-risk-checklist",
      "prompt-test-matrix",
      "external-test-plan",
    ],
    related: ["path:automation-specialist", "outcome:ai-automation-testing"],
  },
  "kit:product-model-selection": {
    type: "workflow-kit",
    stage: "package",
    audiences: ["product-teams"],
    goals: ["choose-model-candidates", "document-evidence"],
    artifacts: ["decision-brief", "shortlist-url"],
    related: [
      "path:product-manager",
      "outcome:ai-model-selection-for-product-teams",
    ],
  },
  "kit:governance-review": {
    type: "workflow-kit",
    stage: "package",
    audiences: ["governance-teams"],
    goals: ["prepare-governance-review", "review-sources"],
    artifacts: [
      "decision-brief",
      "source-freshness-checklist",
      "lifecycle-review-note",
    ],
    related: ["path:governance", "outcome:ai-model-governance-review"],
  },

  // Outcomes -------------------------------------------------------------
  "outcome:ai-model-evaluation-for-developers": {
    type: "outcome",
    stage: "package",
    audiences: ["developers"],
    goals: ["choose-model-candidates", "document-evidence"],
    artifacts: ["decision-brief", "external-test-plan"],
    related: ["kit:developer-model-evaluation", "path:developer"],
  },
  "outcome:ai-model-selection-for-product-teams": {
    type: "outcome",
    stage: "package",
    audiences: ["product-teams"],
    goals: ["choose-model-candidates", "document-evidence"],
    artifacts: ["decision-brief"],
    related: ["kit:product-model-selection", "path:product-manager"],
  },
  "outcome:ai-automation-testing": {
    type: "outcome",
    stage: "package",
    audiences: ["automation-specialists"],
    goals: ["test-automation-workflow"],
    artifacts: ["automation-risk-checklist", "external-test-plan"],
    related: [
      "kit:automation-workflow-testing",
      "path:automation-specialist",
    ],
  },
  "outcome:ai-model-governance-review": {
    type: "outcome",
    stage: "package",
    audiences: ["governance-teams"],
    goals: ["prepare-governance-review", "review-sources"],
    artifacts: ["source-freshness-checklist", "lifecycle-review-note"],
    related: ["kit:governance-review", "path:governance"],
  },
  "outcome:llm-prompt-evaluation": {
    type: "outcome",
    stage: "test",
    audiences: ["developers", "product-teams"],
    goals: ["evaluate-prompts", "test-model-behaviour"],
    artifacts: ["prompt-test-matrix"],
    related: ["playbook:prompt-testing-basics"],
  },
  "outcome:structured-output-testing": {
    type: "outcome",
    stage: "test",
    audiences: ["developers", "automation-specialists"],
    goals: ["test-model-behaviour"],
    artifacts: ["prompt-test-matrix"],
    related: ["playbook:structured-output-testing"],
  },

  // Audiences ------------------------------------------------------------
  "audience:developers": {
    type: "audience",
    stage: "learn",
    audiences: ["developers"],
    goals: ["learn-basics", "choose-model-candidates", "test-model-behaviour"],
    artifacts: [],
    related: ["path:developer", "outcome:ai-model-evaluation-for-developers"],
  },
  "audience:product-teams": {
    type: "audience",
    stage: "learn",
    audiences: ["product-teams"],
    goals: ["choose-model-candidates", "document-evidence"],
    artifacts: [],
    related: [
      "path:product-manager",
      "outcome:ai-model-selection-for-product-teams",
    ],
  },
  "audience:automation-specialists": {
    type: "audience",
    stage: "learn",
    audiences: ["automation-specialists"],
    goals: ["test-automation-workflow"],
    artifacts: [],
    related: [
      "path:automation-specialist",
      "outcome:ai-automation-testing",
    ],
  },
  "audience:governance-teams": {
    type: "audience",
    stage: "learn",
    audiences: ["governance-teams"],
    goals: ["prepare-governance-review", "review-sources"],
    artifacts: [],
    related: ["path:governance", "outcome:ai-model-governance-review"],
  },

  // Demos ----------------------------------------------------------------
  "demo:long-context-analysis": {
    type: "demo",
    stage: "apply",
    audiences: ["developers", "product-teams"],
    goals: ["compare-models", "choose-model-candidates"],
    artifacts: ["comparison-url", "shortlist-url"],
    related: ["playbook:long-context-testing", "lesson:context-window"],
  },
  "demo:hosted-inference": {
    type: "demo",
    stage: "apply",
    audiences: ["developers", "product-teams"],
    goals: ["understand-hosting", "choose-model-candidates"],
    artifacts: ["hosted-provider-note", "shortlist-url"],
    related: ["lesson:hosted-vs-first-party", "exercise:map-hosted-provider"],
  },
  "demo:governance-review": {
    type: "demo",
    stage: "verify",
    audiences: ["governance-teams"],
    goals: ["prepare-governance-review", "review-sources"],
    artifacts: ["source-freshness-checklist"],
    related: [
      "exercise:check-source-freshness",
      "outcome:ai-model-governance-review",
    ],
  },

  // Workflow / evidence / reference entries authored only here -----------
  "workflow:select": {
    type: "workflow",
    stage: "apply",
    audiences: [
      "beginners",
      "developers",
      "product-teams",
      "automation-specialists",
      "governance-teams",
    ],
    goals: ["choose-model-candidates"],
    artifacts: ["shortlist-url"],
    related: ["exercise:build-first-shortlist"],
  },
  "workflow:compare-build": {
    type: "workflow",
    stage: "apply",
    audiences: ["developers", "product-teams"],
    goals: ["compare-models"],
    artifacts: ["comparison-url"],
    related: ["exercise:compare-context-windows"],
  },
  "workflow:briefs-build": {
    type: "workflow",
    stage: "package",
    audiences: ["developers", "product-teams", "governance-teams"],
    goals: ["document-evidence"],
    artifacts: ["decision-brief"],
    related: [
      "exercise:create-decision-brief",
      "evidence:decision-brief",
    ],
  },
  "evidence:decision-brief": {
    type: "evidence",
    stage: "package",
    audiences: ["developers", "product-teams", "governance-teams"],
    goals: ["document-evidence"],
    artifacts: ["decision-brief"],
    related: ["workflow:briefs-build"],
  },
  "reference:sources": {
    type: "reference",
    stage: "verify",
    audiences: ["governance-teams", "product-teams"],
    goals: ["review-sources"],
    artifacts: [],
    related: ["reference:reverification"],
  },
  "reference:coverage": {
    type: "reference",
    stage: "verify",
    audiences: ["governance-teams", "product-teams"],
    goals: ["review-sources"],
    artifacts: [],
    related: ["reference:sources"],
  },
  "reference:reverification": {
    type: "reference",
    stage: "verify",
    audiences: ["governance-teams"],
    goals: ["review-sources"],
    artifacts: ["source-freshness-checklist"],
    related: ["exercise:check-source-freshness"],
  },
};

// ---------------------------------------------------------------------------
// Authored entries for resources without a source-registry lookup.
// ---------------------------------------------------------------------------

interface AuthoredEntry {
  title: string;
  description: string;
  href: string;
  difficulty?: ResourceDifficulty;
  estimatedMinutes?: number;
}

const AUTHORED: Record<string, AuthoredEntry> = {
  "workflow:select": {
    title: "Selection workspace",
    description:
      "Narrow a source-backed shortlist using verified catalogue fields. Output is a /select URL anyone can re-open.",
    href: "/select",
  },
  "workflow:compare-build": {
    title: "Comparison builder",
    description:
      "Render up to four candidate models side by side against verified fields. Output is a /compare/build URL.",
    href: "/compare/build",
  },
  "workflow:briefs-build": {
    title: "Decision brief builder",
    description:
      "Build a paste-ready Markdown evidence brief from the verified catalogue. Output is a /briefs/build URL plus the Markdown.",
    href: "/briefs/build",
  },
  "evidence:decision-brief": {
    title: "Example decision brief",
    description:
      "Worked example produced by the same buildDecisionBrief() helper as the live builder.",
    href: "/examples/decision-brief",
  },
  "reference:sources": {
    title: "Citation registry",
    description:
      "Every primary-source citation backing a verified value in the catalogue. Filter by provider or source type.",
    href: "/sources",
  },
  "reference:coverage": {
    title: "Coverage audit",
    description:
      "Per-provider verified-field counts + citation density across the entity graph.",
    href: "/coverage",
  },
  "reference:reverification": {
    title: "Reverification queue",
    description:
      "Citations due for manual re-check, with the date each source was last verified.",
    href: "/reverification",
  },
};

// ---------------------------------------------------------------------------
// Builders that resolve titles + descriptions + hrefs live from each
// source registry. If a slug is renamed there, the resource node here
// updates automatically.
// ---------------------------------------------------------------------------

function buildLessonNode(slug: string): ResourceNode | null {
  const lesson = getLesson(slug);
  const tags = TAGS[`lesson:${slug}`];
  if (!lesson || !tags) return null;
  return {
    id: `lesson:${slug}`,
    title: lesson.title,
    description: lesson.oneLine,
    href: `/learn/${slug}`,
    type: tags.type,
    stage: tags.stage,
    audiences: tags.audiences,
    goals: tags.goals,
    artifacts: tags.artifacts,
    difficulty: "beginner",
    related: tags.related,
  };
}

function buildExerciseNode(slug: string): ResourceNode | null {
  const ex = getLearningExercise(slug);
  const tags = TAGS[`exercise:${slug}`];
  if (!ex || !tags) return null;
  return {
    id: `exercise:${slug}`,
    title: ex.title,
    description: ex.summary,
    href: `/learn/exercises/${slug}`,
    type: tags.type,
    stage: tags.stage,
    audiences: tags.audiences,
    goals: tags.goals,
    artifacts: tags.artifacts,
    difficulty: ex.difficulty,
    estimatedMinutes: ex.estimatedMinutes,
    related: tags.related,
  };
}

function buildPathNode(slug: string): ResourceNode | null {
  const p = getLearningPath(slug);
  const tags = TAGS[`path:${slug}`];
  if (!p || !tags) return null;
  return {
    id: `path:${slug}`,
    title: p.title,
    description: p.summary,
    href: `/learn/path/${slug}`,
    type: tags.type,
    stage: tags.stage,
    audiences: tags.audiences,
    goals: tags.goals,
    artifacts: tags.artifacts,
    difficulty: p.difficulty,
    estimatedMinutes: p.estimatedMinutes,
    related: tags.related,
  };
}

function buildPlaybookNode(slug: string): ResourceNode | null {
  const p = getLabPlaybook(slug);
  const tags = TAGS[`playbook:${slug}`];
  if (!p || !tags) return null;
  return {
    id: `playbook:${slug}`,
    title: p.title,
    description: p.summary,
    href: `/lab/${slug}`,
    type: tags.type,
    stage: tags.stage,
    audiences: tags.audiences,
    goals: tags.goals,
    artifacts: tags.artifacts,
    difficulty: p.difficulty,
    estimatedMinutes: p.estimatedMinutes,
    related: tags.related,
  };
}

function buildTemplateNode(slug: string): ResourceNode | null {
  const t = getLabTemplate(slug);
  const tags = TAGS[`template:${slug}`];
  if (!t || !tags) return null;
  return {
    id: `template:${slug}`,
    title: t.title,
    description: t.summary,
    href: `/lab/templates/${slug}`,
    type: tags.type,
    stage: tags.stage,
    audiences: tags.audiences,
    goals: tags.goals,
    artifacts: tags.artifacts,
    related: tags.related,
  };
}

function buildPromptSetNode(slug: string): ResourceNode | null {
  const s = getEvaluationPromptSet(slug);
  const tags = TAGS[`promptset:${slug}`];
  if (!s || !tags) return null;
  return {
    id: `promptset:${slug}`,
    title: s.title,
    description: s.summary,
    href: `/lab/prompts/${slug}`,
    type: tags.type,
    stage: tags.stage,
    audiences: tags.audiences,
    goals: tags.goals,
    artifacts: tags.artifacts,
    difficulty: s.difficulty,
    estimatedMinutes: s.estimatedMinutes,
    related: tags.related,
  };
}

function buildKitNode(slug: string): ResourceNode | null {
  const k = getWorkflowKit(slug);
  const tags = TAGS[`kit:${slug}`];
  if (!k || !tags) return null;
  return {
    id: `kit:${slug}`,
    title: k.title,
    description: k.summary,
    href: `/kits/${slug}`,
    type: tags.type,
    stage: tags.stage,
    audiences: tags.audiences,
    goals: tags.goals,
    artifacts: tags.artifacts,
    difficulty: k.difficulty,
    estimatedMinutes: k.estimatedMinutes,
    related: tags.related,
  };
}

function buildOutcomeNode(slug: string): ResourceNode | null {
  const o = getOutcomeUseCase(slug);
  const tags = TAGS[`outcome:${slug}`];
  if (!o || !tags) return null;
  return {
    id: `outcome:${slug}`,
    title: o.title,
    description: o.headline,
    href: `/use-cases/${slug}`,
    type: tags.type,
    stage: tags.stage,
    audiences: tags.audiences,
    goals: tags.goals,
    artifacts: tags.artifacts,
    related: tags.related,
  };
}

function buildAudienceNode(slug: string): ResourceNode | null {
  const a = getAudience(slug);
  const tags = TAGS[`audience:${slug}`];
  if (!a || !tags) return null;
  return {
    id: `audience:${slug}`,
    title: a.title,
    description: a.headline,
    href: `/for/${slug}`,
    type: tags.type,
    stage: tags.stage,
    audiences: tags.audiences,
    goals: tags.goals,
    artifacts: tags.artifacts,
    related: tags.related,
  };
}

function buildDemoNode(slug: string): ResourceNode | null {
  const d = getGuidedDemo(slug);
  const tags = TAGS[`demo:${slug}`];
  if (!d || !tags) return null;
  return {
    id: `demo:${slug}`,
    title: d.title,
    description: d.description,
    href: `/demos/${slug}`,
    type: tags.type,
    stage: tags.stage,
    audiences: tags.audiences,
    goals: tags.goals,
    artifacts: tags.artifacts,
    related: tags.related,
  };
}

function buildAuthoredNode(id: string): ResourceNode | null {
  const tags = TAGS[id];
  const authored = AUTHORED[id];
  if (!tags || !authored) return null;
  return {
    id,
    title: authored.title,
    description: authored.description,
    href: authored.href,
    type: tags.type,
    stage: tags.stage,
    audiences: tags.audiences,
    goals: tags.goals,
    artifacts: tags.artifacts,
    difficulty: authored.difficulty,
    estimatedMinutes: authored.estimatedMinutes,
    related: tags.related,
  };
}

function buildGraph(): ResourceNode[] {
  const nodes: ResourceNode[] = [];
  for (const l of lessons) {
    const n = buildLessonNode(l.slug);
    if (n) nodes.push(n);
  }
  for (const e of learningExercises) {
    const n = buildExerciseNode(e.slug);
    if (n) nodes.push(n);
  }
  for (const p of learningPaths) {
    const n = buildPathNode(p.slug);
    if (n) nodes.push(n);
  }
  for (const p of labPlaybooks) {
    const n = buildPlaybookNode(p.slug);
    if (n) nodes.push(n);
  }
  for (const t of labTemplates) {
    const n = buildTemplateNode(t.slug);
    if (n) nodes.push(n);
  }
  for (const s of evaluationPromptSets) {
    const n = buildPromptSetNode(s.slug);
    if (n) nodes.push(n);
  }
  for (const k of workflowKits) {
    const n = buildKitNode(k.slug);
    if (n) nodes.push(n);
  }
  for (const o of outcomeUseCases) {
    const n = buildOutcomeNode(o.slug);
    if (n) nodes.push(n);
  }
  for (const a of audiences) {
    const n = buildAudienceNode(a.slug);
    if (n) nodes.push(n);
  }
  for (const d of getGuidedDemos()) {
    const n = buildDemoNode(d.slug);
    if (n) nodes.push(n);
  }
  for (const id of Object.keys(AUTHORED)) {
    const n = buildAuthoredNode(id);
    if (n) nodes.push(n);
  }
  return nodes;
}

const GRAPH: ResourceNode[] = buildGraph();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getResourceGraph(): ResourceNode[] {
  return GRAPH;
}

export function getResourceNode(id: string): ResourceNode | undefined {
  return GRAPH.find((n) => n.id === id);
}

export function getResourcesByStage(stage: ResourceStage): ResourceNode[] {
  return GRAPH.filter((n) => n.stage === stage);
}

export function getResourcesByAudience(
  audience: ResourceAudience
): ResourceNode[] {
  return GRAPH.filter((n) => n.audiences.includes(audience));
}

export function getResourcesByGoal(goal: ResourceGoal): ResourceNode[] {
  return GRAPH.filter((n) => n.goals.includes(goal));
}

export function getResourcesByArtifact(
  artifact: ResourceArtifact
): ResourceNode[] {
  return GRAPH.filter((n) => n.artifacts.includes(artifact));
}

export function filterResources(filters: ResourceFilters): ResourceNode[] {
  return GRAPH.filter((n) => {
    if (filters.audience && !n.audiences.includes(filters.audience))
      return false;
    if (filters.goal && !n.goals.includes(filters.goal)) return false;
    if (filters.resourceType && n.type !== filters.resourceType) return false;
    if (filters.stage && n.stage !== filters.stage) return false;
    if (filters.artifact && !n.artifacts.includes(filters.artifact))
      return false;
    if (filters.difficulty && n.difficulty !== filters.difficulty)
      return false;
    return true;
  });
}

export interface ResourceFinderSummary {
  total: number;
  byStage: Record<ResourceStage, number>;
  byType: Record<ResourceType, number>;
}

export function getResourceFinderSummary(): ResourceFinderSummary {
  const byStage: Record<ResourceStage, number> = {
    learn: 0,
    apply: 0,
    verify: 0,
    test: 0,
    package: 0,
  };
  const byType: Record<ResourceType, number> = {
    lesson: 0,
    exercise: 0,
    "learning-path": 0,
    "lab-playbook": 0,
    "lab-template": 0,
    "prompt-set": 0,
    "workflow-kit": 0,
    outcome: 0,
    audience: 0,
    demo: 0,
    workflow: 0,
    evidence: 0,
    reference: 0,
  };
  for (const n of GRAPH) {
    byStage[n.stage]++;
    byType[n.type]++;
  }
  return { total: GRAPH.length, byStage, byType };
}

export interface NextStepGroup {
  title: string;
  description: string;
  href: string;
}

/**
 * Curated "I want to..." entry points for the NextStepPanel. Each
 * `href` lands the reader on a filtered /resources view that the
 * finder already supports.
 */
export function getNextStepGroups(): NextStepGroup[] {
  return [
    {
      title: "I want to learn the basics",
      description: "Plain-language concept lessons.",
      href: "/resources?goal=learn-basics",
    },
    {
      title: "I want to choose model candidates",
      description: "Build a source-backed shortlist.",
      href: "/resources?goal=choose-model-candidates",
    },
    {
      title: "I want to compare models side by side",
      description: "Render verified fields against each other.",
      href: "/resources?goal=compare-models",
    },
    {
      title: "I want to test model behaviour",
      description: "Run prompt + structured-output + regression tests.",
      href: "/resources?goal=test-model-behaviour",
    },
    {
      title: "I want to evaluate prompts",
      description: "Six generic, safe evaluation prompt sets.",
      href: "/resources?goal=evaluate-prompts",
    },
    {
      title: "I want to document evidence",
      description: "Package the decision brief or evaluation plan.",
      href: "/resources?goal=document-evidence",
    },
    {
      title: "I want to review sources",
      description: "Audit citations + freshness across the catalogue.",
      href: "/resources?goal=review-sources",
    },
    {
      title: "I want to prepare a governance review",
      description: "Source freshness + lifecycle + refusal-boundary suite.",
      href: "/resources?goal=prepare-governance-review",
    },
    {
      title: "I want to test an automation workflow",
      description: "Validate model behaviour inside an unattended loop.",
      href: "/resources?goal=test-automation-workflow",
    },
  ];
}

export const RESOURCE_AUDIENCES: ResourceAudience[] = [
  "beginners",
  "developers",
  "product-teams",
  "automation-specialists",
  "governance-teams",
];

export const RESOURCE_STAGES: ResourceStage[] = [
  "learn",
  "apply",
  "verify",
  "test",
  "package",
];

export const RESOURCE_TYPES: ResourceType[] = [
  "lesson",
  "exercise",
  "learning-path",
  "lab-playbook",
  "lab-template",
  "prompt-set",
  "workflow-kit",
  "outcome",
  "audience",
  "demo",
  "workflow",
  "evidence",
  "reference",
];

export const RESOURCE_GOALS: ResourceGoal[] = [
  "learn-basics",
  "choose-model-candidates",
  "compare-models",
  "test-model-behaviour",
  "document-evidence",
  "review-sources",
  "prepare-governance-review",
  "test-automation-workflow",
  "understand-pricing",
  "understand-hosting",
  "evaluate-prompts",
];

export const RESOURCE_ARTIFACTS: ResourceArtifact[] = [
  "shortlist-url",
  "comparison-url",
  "decision-brief",
  "model-evaluation-plan",
  "prompt-test-matrix",
  "source-freshness-checklist",
  "external-test-plan",
  "automation-risk-checklist",
  "hosted-provider-note",
  "lifecycle-review-note",
];

export const RESOURCE_DIFFICULTIES: ResourceDifficulty[] = [
  "beginner",
  "intermediate",
];

export const RESOURCE_LABELS: {
  stages: Record<ResourceStage, string>;
  types: Record<ResourceType, string>;
  goals: Record<ResourceGoal, string>;
  artifacts: Record<ResourceArtifact, string>;
  audiences: Record<ResourceAudience, string>;
} = {
  stages: {
    learn: "Learn",
    apply: "Apply",
    verify: "Verify",
    test: "Test",
    package: "Package",
  },
  types: {
    lesson: "Lesson",
    exercise: "Exercise",
    "learning-path": "Learning path",
    "lab-playbook": "Lab playbook",
    "lab-template": "Lab template",
    "prompt-set": "Evaluation prompt set",
    "workflow-kit": "Workflow kit",
    outcome: "Outcome",
    audience: "Audience",
    demo: "Guided demo",
    workflow: "Workspace",
    evidence: "Evidence example",
    reference: "Reference",
  },
  goals: {
    "learn-basics": "Learn the basics",
    "choose-model-candidates": "Choose model candidates",
    "compare-models": "Compare models",
    "test-model-behaviour": "Test model behaviour",
    "document-evidence": "Document evidence",
    "review-sources": "Review sources",
    "prepare-governance-review": "Prepare a governance review",
    "test-automation-workflow": "Test an automation workflow",
    "understand-pricing": "Understand pricing",
    "understand-hosting": "Understand hosting",
    "evaluate-prompts": "Evaluate prompts",
  },
  artifacts: {
    "shortlist-url": "Shortlist URL",
    "comparison-url": "Comparison URL",
    "decision-brief": "Decision brief",
    "model-evaluation-plan": "Model evaluation plan",
    "prompt-test-matrix": "Prompt test matrix",
    "source-freshness-checklist": "Source freshness checklist",
    "external-test-plan": "External test plan",
    "automation-risk-checklist": "Automation risk checklist",
    "hosted-provider-note": "Hosted-provider note",
    "lifecycle-review-note": "Lifecycle review note",
  },
  audiences: {
    beginners: "Beginners",
    developers: "Developers",
    "product-teams": "Product teams",
    "automation-specialists": "Automation specialists",
    "governance-teams": "Governance teams",
  },
};
