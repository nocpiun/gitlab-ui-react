/**
 * Shared package-manager metadata for the interactive tabs (components/package-manager-tabs.tsx)
 * and LLM-friendly Markdown renderer (llm.ts), keeping their displayed commands in sync.
 */
export const packageManagers = [
  { command: "pnpm add", title: "pnpm" },
  { command: "npm install", title: "npm" },
  { command: "yarn add", title: "yarn" },
] as const;

export type PackageManager = (typeof packageManagers)[number]["title"];
