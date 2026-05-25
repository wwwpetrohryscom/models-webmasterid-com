import Link from "next/link";
import type { WorkflowKit } from "@/lib/workflow-kits";
import { getLesson } from "@/lib/lessons";
import { getLearningExercise } from "@/lib/learning-exercises";
import { getLabPlaybook, getLabTemplate } from "@/lib/lab-playbooks";
import { getEvaluationPromptSet } from "@/lib/evaluation-prompts";

interface ResourceLink {
  label: string;
  href: string;
  summary?: string;
}

function buildLessonLinks(slugs: string[]): ResourceLink[] {
  return slugs.map((slug) => {
    const lesson = getLesson(slug);
    return {
      label: lesson?.title ?? slug,
      href: `/learn/${slug}`,
      summary: lesson?.oneLine,
    };
  });
}

function buildExerciseLinks(slugs: string[]): ResourceLink[] {
  return slugs.map((slug) => {
    const ex = getLearningExercise(slug);
    return {
      label: ex?.title ?? slug,
      href: `/learn/exercises/${slug}`,
      summary: ex?.summary,
    };
  });
}

function buildPlaybookLinks(slugs: string[]): ResourceLink[] {
  return slugs.map((slug) => {
    const p = getLabPlaybook(slug);
    return {
      label: p?.title ?? slug,
      href: `/lab/${slug}`,
      summary: p?.summary,
    };
  });
}

function buildPromptSetLinks(slugs: string[]): ResourceLink[] {
  return slugs.map((slug) => {
    const set = getEvaluationPromptSet(slug);
    return {
      label: set?.title ?? slug,
      href: `/lab/prompts/${slug}`,
      summary: set?.summary,
    };
  });
}

function buildTemplateLinks(slugs: string[]): ResourceLink[] {
  return slugs.map((slug) => {
    const t = getLabTemplate(slug);
    return {
      label: t?.title ?? slug,
      href: `/lab/templates/${slug}`,
      summary: t?.summary,
    };
  });
}

function ResourceColumn({
  title,
  resources,
}: {
  title: string;
  resources: ResourceLink[];
}) {
  if (!resources.length) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <ul className="mt-2 space-y-2">
        {resources.map((r) => (
          <li key={r.href}>
            <Link
              href={r.href}
              className="block rounded-lg border border-border bg-card p-2.5 transition hover:border-primary/30"
            >
              <p className="text-sm font-semibold text-foreground">
                {r.label} →
              </p>
              {r.summary ? (
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {r.summary}
                </p>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * WorkflowKitResourceGrid — renders the five resource columns
 * (lessons, exercises, lab playbooks, prompt sets, templates) the
 * kit depends on. Resolves titles + summaries from each registry so
 * a rename in any registry flows through automatically.
 */
export function WorkflowKitResourceGrid({
  kit,
  title = "Required resources",
}: {
  kit: WorkflowKit;
  title?: string;
}) {
  const lessons = buildLessonLinks(kit.requiredLessons);
  const exercises = buildExerciseLinks(kit.requiredExercises);
  const playbooks = buildPlaybookLinks(kit.requiredPlaybooks);
  const promptSets = buildPromptSetLinks(kit.requiredPromptSets);
  const templates = buildTemplateLinks(kit.requiredTemplates);

  return (
    <section
      aria-label={title}
      className="card-surface space-y-4 p-5 text-sm not-prose"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        {title}
      </p>
      <p className="text-xs text-muted-foreground">
        The kit reuses existing surfaces — no parallel UI, no
        duplicated content. Open each surface in the order the
        timeline lists.
      </p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ResourceColumn title="Lessons" resources={lessons} />
        <ResourceColumn title="Exercises" resources={exercises} />
        <ResourceColumn title="Lab playbooks" resources={playbooks} />
        <ResourceColumn title="Evaluation prompt sets" resources={promptSets} />
        <ResourceColumn title="Templates" resources={templates} />
      </div>
    </section>
  );
}
