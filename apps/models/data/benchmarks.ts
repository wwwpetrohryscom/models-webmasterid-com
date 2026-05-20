import type { BenchmarkEntity } from "@/lib/types";

export const benchmarks: BenchmarkEntity[] = [
  {
    id: "benchmark-mmlu-pro",
    slug: "mmlu-pro",
    name: "MMLU-Pro",
    description:
      "A harder, more reasoning-focused successor to MMLU covering broad academic and professional knowledge.",
    sourceUrl: null,
    verified: true,
    verificationStatus: "verified",
    lastCheckedAt: null,
    updatedDate: "2026-05-20",
    category: "knowledge",
  },
  {
    id: "benchmark-gpqa",
    slug: "gpqa",
    name: "GPQA Diamond",
    description:
      "Graduate-level questions across physics, chemistry, and biology designed to be 'Google-proof'.",
    sourceUrl: null,
    verified: true,
    verificationStatus: "verified",
    lastCheckedAt: null,
    updatedDate: "2026-05-20",
    category: "reasoning",
  },
  {
    id: "benchmark-swe-bench",
    slug: "swe-bench",
    name: "SWE-bench Verified",
    description:
      "Real-world software engineering tasks sourced from GitHub issues, with verified solutions.",
    sourceUrl: null,
    verified: true,
    verificationStatus: "verified",
    lastCheckedAt: null,
    updatedDate: "2026-05-20",
    category: "coding",
  },
  {
    id: "benchmark-aime",
    slug: "aime",
    name: "AIME",
    description:
      "American Invitational Mathematics Examination problems used to measure mathematical reasoning.",
    sourceUrl: null,
    verified: true,
    verificationStatus: "verified",
    lastCheckedAt: null,
    updatedDate: "2026-05-20",
    category: "math",
  },
  {
    id: "benchmark-humaneval",
    slug: "humaneval",
    name: "HumanEval",
    description:
      "Classic functional code generation benchmark covering 164 hand-written Python problems.",
    sourceUrl: null,
    verified: true,
    verificationStatus: "verified",
    lastCheckedAt: null,
    updatedDate: "2026-05-20",
    category: "coding",
  },
];

export function getBenchmarkBySlug(slug: string): BenchmarkEntity | undefined {
  return benchmarks.find((b) => b.slug === slug);
}
