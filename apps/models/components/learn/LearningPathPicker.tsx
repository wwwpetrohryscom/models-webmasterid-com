import { getLearningPaths } from "@/lib/learning-paths";
import { LearningPathCard } from "./LearningPathCard";

/**
 * LearningPathPicker — renders all four role-based path cards in a
 * grid. Used on the /learn hub, the /learn/paths index, and anywhere
 * else a four-up role picker is appropriate. Server component.
 */
export function LearningPathPicker() {
  const paths = getLearningPaths();
  return (
    <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {paths.map((p) => (
        <li key={p.slug}>
          <LearningPathCard path={p} />
        </li>
      ))}
    </ul>
  );
}
