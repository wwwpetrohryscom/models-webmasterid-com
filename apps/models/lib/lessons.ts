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
