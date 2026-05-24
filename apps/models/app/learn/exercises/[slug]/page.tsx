import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExerciseLayout } from "@/components/learn/ExerciseLayout";
import { ExerciseStepList } from "@/components/learn/ExerciseStepList";
import { ExerciseChecklist } from "@/components/learn/ExerciseChecklist";
import { buildMetadata } from "@/lib/seo";
import {
  getLearningExercise,
  learningExercises,
} from "@/lib/learning-exercises";

interface RouteParams {
  slug: string;
}

export function generateStaticParams(): RouteParams[] {
  return learningExercises.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const exercise = getLearningExercise(slug);
  if (!exercise) {
    return buildMetadata({
      title: "Exercise",
      path: `/learn/exercises/${slug}`,
    });
  }
  return buildMetadata({
    title: `${exercise.title} — exercise`,
    description: exercise.summary,
    path: `/learn/exercises/${exercise.slug}`,
    keywords: [
      "ai model selection exercise",
      "evaluate ai models",
      ...exercise.relatedLessonSlugs,
    ],
  });
}

export default async function ExerciseDetailPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { slug } = await params;
  const exercise = getLearningExercise(slug);
  if (!exercise) notFound();

  return (
    <ExerciseLayout
      exercise={exercise}
      notForBullets={[
        "A model recommendation. The exercise routes you through evidence — you decide.",
        "A score or grade for any model. The catalogue does not score.",
        "A substitute for external prompt, latency, rate-limit, cost, or compliance tests.",
      ]}
    >
      <h2>Goal</h2>
      <p>{exercise.goal}</p>

      <h2>Prerequisites</h2>
      <ul>
        {exercise.prerequisites.map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </ul>

      <h2>Step-by-step exercise</h2>
      <ExerciseStepList steps={exercise.steps} />

      <h2>Completion checklist</h2>
      <ExerciseChecklist items={exercise.completionChecklist} />

      <h2>Evidence artifact</h2>
      <p>
        At the end of this exercise you should have:{" "}
        <strong className="text-foreground">
          {exercise.evidenceArtifact}
        </strong>
      </p>
      <p>
        Paste the artifact into your design doc, ticket, or PR
        description. The catalogue's role ends with the artifact;
        the workload-specific testing is yours.
      </p>

      <h2>Related workflow routes</h2>
      <ul>
        <li>
          <Link href="/select">/select</Link> — narrow the
          source-backed shortlist.
        </li>
        <li>
          <Link href="/compare/build">/compare/build</Link> — render
          verified fields side by side.
        </li>
        <li>
          <Link href="/briefs/build">/briefs/build</Link> — generate
          the evidence decision brief.
        </li>
        <li>
          <Link href="/sources">/sources</Link> — every primary-source
          citation, by provider.
        </li>
        <li>
          <Link href="/coverage">/coverage</Link> — per-provider
          verified-field coverage.
        </li>
        <li>
          <Link href="/reverification">/reverification</Link> —
          sources due for manual re-check.
        </li>
      </ul>

      <p className="text-xs">
        Exercise does not recommend a model — external testing still
        required.
      </p>
    </ExerciseLayout>
  );
}
