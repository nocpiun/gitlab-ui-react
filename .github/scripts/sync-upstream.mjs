#!/usr/bin/env node

/**
 * Upstream sync & track script, driven by .github/workflows/upstream-sync.yml.
 *
 * Commands:
 *   sync   Apply the manifest's "sync" mappings (mirror upstream files into
 *          this repository) and write $SYNC_DIR/sync-result.json.
 *   track  Check the manifest's "track" entries for upstream commits in the
 *          last $SINCE_HOURS hours, let DeepSeek judge whether this
 *          repository needs changes (deduplicating against open tracking
 *          issues), and write issue drafts to $SYNC_DIR/track-issues.json.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const REPO_ROOT = process.cwd();
const MANIFEST_PATH = path.join(REPO_ROOT, ".github", "upstream-sync.json");
const SYNC_DIR = process.env.SYNC_DIR || path.join(os.tmpdir(), "upstream-sync");
const ISSUES_DIR = path.join(SYNC_DIR, "issues");
const SYNC_RESULT_PATH = path.join(SYNC_DIR, "sync-result.json");
const TRACK_RESULT_PATH = path.join(SYNC_DIR, "track-result.json");
const TRACK_ISSUES_PATH = path.join(SYNC_DIR, "track-issues.json");

const GITLAB_API_BASE = "https://gitlab.com/api/v4";
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || "https://api.deepseek.com/chat/completions";
const DEEPSEEK_MODEL = "deepseek-v4-flash";

// Label attached to tracking issues; must match the workflow.
const TRACKING_LABEL = "upstream-tracking";

// Track prompt budgets (characters / entries).
const MAX_COMMITS = 20;
const MAX_CHANGED_FILES = 25;
const MAX_DIFF_CHARS = 30_000;
const MAX_FILE_CONTENT_CHARS = 20_000;
const MAX_TOTAL_CONTENT_CHARS = 60_000;
const MAX_LISTING_ENTRIES = 400;
const MAX_ISSUE_BODY_CHARS = 600;
const MAX_ISSUES_CHARS = 12_000;
const MAX_ISSUES_PER_ENTRY = 3;

/** Normalize line endings so CRLF/LF differences are not flagged as changes. */
const normalize = (text) => text.replace(/\r\n/g, "\n");

/** Canonical form for comparison: normalize plus ignore trailing blank lines at EOF. */
const canonical = (text) => normalize(text).replace(/\n+$/, "\n");

/**
 * Convert a glob pattern to a RegExp. Supported wildcards:
 * `*` matches any sequence of characters (including `/`), `?` matches one
 * character. Patterns are matched against the POSIX path relative to the
 * mapping's upstream/local directory.
 */
function globToRegExp(glob) {
  const source = glob
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".");
  return new RegExp(`^${source}$`);
}

/** Test a relative path against an array of glob patterns. */
function matchesInclude(relPath, includes) {
  return includes.some((glob) => globToRegExp(glob).test(relPath));
}

function truncate(text, max, note = "(truncated)") {
  if(text.length <= max) return text;
  return `${text.slice(0, max)}\n\n${note}\n`;
}

async function gitlabFetch(url) {
  const res = await fetch(url);
  if(!res.ok) {
    const error = new Error(
      `GitLab API request failed: ${res.status} ${res.statusText} (${url})`,
    );
    error.status = res.status;
    throw error;
  }
  return res;
}

/** Recursively list all blob paths under an upstream directory (handles pagination). */
async function listUpstreamFiles(projectId, dirPath, ref) {
  const files = [];
  let page = 1;
  for(;;) {
    const url =
      `${GITLAB_API_BASE}/projects/${projectId}/repository/tree` +
      `?path=${encodeURIComponent(dirPath)}&ref=${encodeURIComponent(ref)}` +
      `&recursive=true&per_page=100&page=${page}`;
    const res = await gitlabFetch(url);
    for(const item of await res.json()) {
      if(item.type === "blob") files.push(item.path);
    }
    const nextPage = res.headers.get("x-next-page");
    if(!nextPage) return files;
    page = Number(nextPage);
  }
}

/** Fetch an upstream file, normalized to LF. Returns null when it does not exist (404). */
async function fetchUpstreamFile(projectId, filePath, ref) {
  const url =
    `${GITLAB_API_BASE}/projects/${projectId}` +
    `/repository/files/${encodeURIComponent(filePath)}/raw` +
    `?ref=${encodeURIComponent(ref)}`;
  try {
    const res = await gitlabFetch(url);
    return normalize(await res.text());
  } catch (error) {
    if(error.status === 404) return null;
    throw error;
  }
}

/** Whether a file exists upstream (metadata only, no content download). */
async function upstreamFileExists(projectId, filePath, ref) {
  const url =
    `${GITLAB_API_BASE}/projects/${projectId}` +
    `/repository/files/${encodeURIComponent(filePath)}` +
    `?ref=${encodeURIComponent(ref)}`;
  try {
    await gitlabFetch(url);
    return true;
  } catch (error) {
    if(error.status === 404) return false;
    throw error;
  }
}

/** Recent commits touching an upstream path, newest first. */
async function listPathCommits(projectId, filePath, ref, sinceIso, perPage = MAX_COMMITS) {
  const url =
    `${GITLAB_API_BASE}/projects/${projectId}/repository/commits` +
    `?path=${encodeURIComponent(filePath)}&ref_name=${encodeURIComponent(ref)}` +
    `&since=${encodeURIComponent(sinceIso)}&per_page=${perPage}`;
  return (await gitlabFetch(url)).json();
}

/** File diffs of one upstream commit. */
async function fetchCommitDiff(projectId, sha) {
  const url =
    `${GITLAB_API_BASE}/projects/${projectId}` +
    `/repository/commits/${encodeURIComponent(sha)}/diff?per_page=100`;
  return (await gitlabFetch(url)).json();
}

/** Recursively list local files as POSIX-style relative paths (optionally filtered). */
function listLocalFiles(localDir, includes = null) {
  const out = [];
  if(!fs.existsSync(localDir)) return out;
  const walk = (dir) => {
    for(const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if(entry.isDirectory()) {
        walk(full);
      } else {
        const rel = path.relative(localDir, full).split(path.sep).join("/");
        if(!includes || matchesInclude(rel, includes)) out.push(rel);
      }
    }
  };
  walk(localDir);
  return out;
}

function readLocalFile(localPath) {
  if(!fs.existsSync(localPath)) return null;
  return normalize(fs.readFileSync(localPath, "utf8"));
}

function setOutput(name, value) {
  if(process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
  }
  console.log(`[output] ${name}=${value}`);
}

function readManifest() {
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
}

// ---------------------------------------------------------------------------
// MARK: sync
// ---------------------------------------------------------------------------

/** Apply one detected change to the working tree. */
function applySyncChange({ result, localPath, localRelPath, status, upstreamContent }) {
  if(status === "deleted") {
    fs.rmSync(localPath);
  } else {
    fs.mkdirSync(path.dirname(localPath), { recursive: true });
    fs.writeFileSync(localPath, upstreamContent);
  }
  result.files.push({ path: localRelPath, status });
}

/** Sync mapping: mirror upstream files matching `include` into the local directory. */
async function syncMapping(mapping, projectId, branch, result) {
  if(!Array.isArray(mapping.include) || mapping.include.length === 0) {
    throw new Error(
      `Sync mapping ${mapping.upstream} -> ${mapping.local}: "include" must be a non-empty string array.`,
    );
  }
  const localDir = path.join(REPO_ROOT, mapping.local);
  // Match glob patterns against the path relative to the mapping directory,
  // so patterns can select both individual files and whole subtrees.
  const upstreamByRel = new Map(
    (await listUpstreamFiles(projectId, mapping.upstream, branch))
      .map((p) => [path.posix.relative(mapping.upstream, p), p])
      .filter(([rel]) => matchesInclude(rel, mapping.include)),
  );

  // Additions and modifications
  for(const [rel, upstreamPath] of upstreamByRel) {
    const localPath = path.join(localDir, rel);
    const upstreamContent = await fetchUpstreamFile(projectId, upstreamPath, branch);
    // Vanished between listing and fetching; treat as unchanged this run.
    if(upstreamContent === null) continue;
    const localContent = readLocalFile(localPath);
    if(localContent !== null && canonical(localContent) === canonical(upstreamContent)) continue;
    applySyncChange({
      result,
      localPath,
      localRelPath: `${mapping.local}/${rel}`,
      status: localContent === null ? "added" : "changed",
      upstreamContent,
    });
  }

  // Deletions: present locally but gone upstream
  for(const rel of listLocalFiles(localDir, mapping.include)) {
    if(upstreamByRel.has(rel)) continue;
    applySyncChange({
      result,
      localPath: path.join(localDir, rel),
      localRelPath: `${mapping.local}/${rel}`,
      status: "deleted",
      upstreamContent: null,
    });
  }
}

async function sync() {
  const manifest = readManifest();
  const { projectId, branch } = manifest.upstream;
  const result = { changed: false, files: [] };

  for(const mapping of manifest.sync ?? []) {
    await syncMapping(mapping, projectId, branch, result);
  }

  result.changed = result.files.length > 0;
  fs.mkdirSync(SYNC_DIR, { recursive: true });
  fs.writeFileSync(SYNC_RESULT_PATH, JSON.stringify(result, null, 2));

  console.log(`Sync finished: ${result.files.length} change(s) applied.`);
  setOutput("changed", String(result.changed));
}

// ---------------------------------------------------------------------------
// MARK: track
// ---------------------------------------------------------------------------

/** Open tracking issues, used by the model for deduplication. Requires gh + GH_TOKEN. */
function fetchOpenIssues() {
  let out;
  try {
    out = execFileSync(
      "gh",
      [
        "issue", "list",
        "--label", TRACKING_LABEL,
        "--state", "open",
        "--limit", "200",
        "--json", "number,title,body",
      ],
      { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
    );
  } catch (error) {
    throw new Error(
      "The track command requires the gh CLI authenticated via GH_TOKEN to " +
        `list open tracking issues: ${error.stderr || error.message}`,
    );
  }
  return JSON.parse(out);
}

/** "file" or "dir", or null when the path exists upstream as neither. */
async function resolveEntryKind(projectId, upstreamPath, ref) {
  if(await upstreamFileExists(projectId, upstreamPath, ref)) return "file";
  const files = await listUpstreamFiles(projectId, upstreamPath, ref);
  return files.length > 0 ? "dir" : null;
}

/**
 * Collect the files changed under an upstream directory by the given commits
 * (newest first, deduplicated), plus the combined diff text.
 */
async function collectDirChanges(projectId, upstreamDir, commits) {
  const prefix = `${upstreamDir}/`;
  const changed = new Map(); // path -> diff text (first/newest occurrence wins)
  for(const commit of commits) {
    for(const d of await fetchCommitDiff(projectId, commit.id)) {
      const p = d.new_path ?? d.old_path;
      if(!p.startsWith(prefix) || changed.has(p)) continue;
      changed.set(p, `file: ${p}\n${d.diff ?? "(diff omitted by GitLab)"}`);
      if(changed.size >= MAX_CHANGED_FILES) break;
    }
    if(changed.size >= MAX_CHANGED_FILES) break;
  }
  return changed;
}

function formatCommits(commits) {
  return commits
    .map((c) => `- ${c.short_id} ${c.title} (${c.committed_date}) ${c.web_url}`)
    .join("\n");
}

function formatOpenIssues(openIssues) {
  let budget = MAX_ISSUES_CHARS;
  const parts = [];
  for(const issue of openIssues) {
    const part =
      `- #${issue.number} ${issue.title}\n` +
      `  ${truncate(issue.body.replace(/\s+/g, " "), MAX_ISSUE_BODY_CHARS)}\n`;
    if(budget - part.length < 0) {
      parts.push("(more open issues omitted)");
      break;
    }
    budget -= part.length;
    parts.push(part);
  }
  return parts.length > 0 ? parts.join("\n") : "(no open tracking issues)";
}

const TRACK_SYSTEM_PROMPT = `You are a maintenance assistant for the gitlab-ui-react repository, which ports GitLab's Pajamas Design System (upstream: gitlab-org/gitlab-services/design.gitlab.com, Vue) to React.

You are given one tracked upstream entry (a file or a directory, and its local counterpart), the upstream commits touching it recently, diffs and file contents from both sides, and the list of currently open tracking issues in this repository.

Decide whether these upstream changes require changes in THIS repository, and whether any open issue already covers them.

Respond with a JSON object only (no markdown fences, no commentary):
{"issues": [{"title": "...", "body": "..."}]}

Rules:
- Return an empty "issues" array when no action is needed, e.g. the change is Vue-specific with no impact on the React port, only affects docs/tests, or is already covered by an open issue.
- Never create an issue whose topic is already covered by one of the listed open issues.
- Create at most ${MAX_ISSUES_PER_ENTRY} issues, each focused on one actionable topic.
- Issue bodies must be English Markdown with the sections: Summary of changes, Impact analysis, Suggested actions, Risks.
- Base your judgment strictly on the provided material; when the material is insufficient, say so in the issue body instead of speculating.`;

async function callDeepSeekTrack(userPrompt) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if(!apiKey) {
    throw new Error(
      "Upstream commits need analysis, but DEEPSEEK_API_KEY is not configured.",
    );
  }
  const res = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        { role: "system", content: TRACK_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      stream: false,
      response_format: { type: "json_object" },
    }),
  });
  if(!res.ok) {
    throw new Error(
      `DeepSeek API request failed: ${res.status} ${res.statusText} (${await res.text()})`,
    );
  }
  const data = await res.json();
  const raw = data.choices[0].message.content.trim().replace(/^```(?:json)?|```$/g, "").trim();
  const parsed = JSON.parse(raw);
  if(!Array.isArray(parsed.issues)) {
    throw new Error(`Unexpected model response shape: ${raw.slice(0, 200)}`);
  }
  return parsed.issues
    .filter((i) => typeof i?.title === "string" && typeof i?.body === "string")
    .slice(0, MAX_ISSUES_PER_ENTRY);
}

/** Build the user prompt for one track entry. */
async function buildTrackPrompt({ projectId, branch, entry, kind, commits, openIssues, sinceHours }) {
  const sections = [
    `Tracked upstream entry: ${entry.upstream} (${kind})`,
    `Local counterpart: ${entry.local}`,
    `Upstream commits touching this entry in the last ${sinceHours} hours:\n${formatCommits(commits)}`,
  ];
  let contentBudget = MAX_TOTAL_CONTENT_CHARS;

  const addContent = (title, text) => {
    const part = `${title}:\n${text}`;
    if(contentBudget - part.length < 0) {
      sections.push("(further file contents omitted to bound the prompt size)");
      contentBudget = -1;
      return;
    }
    if(contentBudget >= 0) {
      contentBudget -= part.length;
      sections.push(part);
    }
  };

  if(kind === "file") {
    const diffs = [];
    for(const commit of commits) {
      for(const d of await fetchCommitDiff(projectId, commit.id)) {
        if(d.new_path === entry.upstream || d.old_path === entry.upstream) {
          diffs.push(`commit ${commit.short_id}:\n${d.diff ?? "(diff omitted by GitLab)"}`);
        }
      }
    }
    sections.push(`Upstream diff:\n${truncate(diffs.join("\n") || "(no diff available)", MAX_DIFF_CHARS)}`);

    const upstreamContent = await fetchUpstreamFile(projectId, entry.upstream, branch);
    addContent(
      "Current upstream file content",
      upstreamContent === null
        ? "(the file no longer exists upstream)"
        : truncate(upstreamContent, MAX_FILE_CONTENT_CHARS),
    );
    const localContent = readLocalFile(path.join(REPO_ROOT, entry.local));
    addContent(
      "Current local file content",
      localContent === null
        ? "(no local file at this path)"
        : truncate(localContent, MAX_FILE_CONTENT_CHARS),
    );
  } else {
    const changed = await collectDirChanges(projectId, entry.upstream, commits);
    sections.push(
      "Upstream diff (files changed under this directory):\n" +
        truncate([...changed.values()].join("\n") || "(no diff available)", MAX_DIFF_CHARS),
    );

    // Contents of changed upstream files and their local counterparts.
    for(const upstreamPath of changed.keys()) {
      const rel = path.posix.relative(entry.upstream, upstreamPath);
      const upstreamContent = await fetchUpstreamFile(projectId, upstreamPath, branch);
      if(contentBudget < 0) break;
      addContent(
        `Upstream file ${upstreamPath}`,
        upstreamContent === null
          ? "(deleted upstream)"
          : truncate(upstreamContent, MAX_FILE_CONTENT_CHARS),
      );
      if(contentBudget < 0) break;
      const localContent = readLocalFile(path.join(REPO_ROOT, entry.local, rel));
      addContent(
        `Local counterpart ${entry.local}/${rel}`,
        localContent === null
          ? "(no local file at this path)"
          : truncate(localContent, MAX_FILE_CONTENT_CHARS),
      );
    }

    const upstreamListing = (await listUpstreamFiles(projectId, entry.upstream, branch))
      .map((p) => path.posix.relative(entry.upstream, p));
    const localListing = listLocalFiles(path.join(REPO_ROOT, entry.local));
    sections.push(
      `Upstream directory listing (${upstreamListing.length} files):\n` +
        upstreamListing.slice(0, MAX_LISTING_ENTRIES).join("\n") +
        (upstreamListing.length > MAX_LISTING_ENTRIES ? "\n(listing truncated)" : ""),
      `Local directory listing (${localListing.length} files):\n` +
        localListing.slice(0, MAX_LISTING_ENTRIES).join("\n") +
        (localListing.length > MAX_LISTING_ENTRIES ? "\n(listing truncated)" : ""),
    );
  }

  sections.push(`Currently open tracking issues:\n${formatOpenIssues(openIssues)}`);
  return sections.join("\n\n---\n\n");
}

function writeIssueDraft(entry, issue, commits) {
  const body =
    `${issue.body}\n\n---\n` +
    `Tracked entry: \`${entry.upstream}\` ↔ \`${entry.local}\`\n` +
    `Recent upstream commits:\n${formatCommits(commits)}\n\n` +
    "Created automatically by the upstream-sync workflow.";
  const slug = entry.local.replace(/[^a-zA-Z0-9]+/g, "-");
  fs.mkdirSync(ISSUES_DIR, { recursive: true });
  const bodyFile = path.join(ISSUES_DIR, `${slug}-${Date.now()}.md`);
  fs.writeFileSync(bodyFile, body);
  return bodyFile;
}

async function track() {
  const manifest = readManifest();
  const { projectId, branch } = manifest.upstream;
  const sinceHours = Number(process.env.SINCE_HOURS || "24");
  if(!Number.isFinite(sinceHours) || sinceHours <= 0) {
    throw new Error(`Invalid SINCE_HOURS: ${process.env.SINCE_HOURS}`);
  }
  const sinceIso = new Date(Date.now() - sinceHours * 3_600_000).toISOString();
  const openIssues = fetchOpenIssues();

  const drafts = [];
  const report = [];
  const errors = [];

  for(const entry of manifest.track ?? []) {
    try {
      const commits = await listPathCommits(projectId, entry.upstream, branch, sinceIso);
      if(commits.length === 0) {
        report.push({ entry: entry.upstream, commits: 0, issues: 0 });
        continue;
      }
      console.log(`[track] ${entry.upstream}: ${commits.length} commit(s) in the window`);
      const kind = await resolveEntryKind(projectId, entry.upstream, branch);
      if(!kind) {
        console.warn(`Warning: ${entry.upstream} exists upstream as neither file nor directory; skipping.`);
        continue;
      }
      const prompt = await buildTrackPrompt({
        projectId, branch, entry, kind, commits, openIssues, sinceHours,
      });
      const issues = await callDeepSeekTrack(prompt);
      for(const issue of issues) {
        drafts.push({
          entry: entry.upstream,
          title: issue.title,
          bodyFile: writeIssueDraft(entry, issue, commits),
        });
      }
      report.push({ entry: entry.upstream, commits: commits.length, issues: issues.length });
    } catch (error) {
      console.error(`::error::track failed for ${entry.upstream}: ${error.message}`);
      errors.push({ entry: entry.upstream, error: error.message });
    }
  }

  fs.mkdirSync(SYNC_DIR, { recursive: true });
  fs.writeFileSync(TRACK_ISSUES_PATH, JSON.stringify(drafts, null, 2));
  fs.writeFileSync(TRACK_RESULT_PATH, JSON.stringify({ report, errors }, null, 2));
  console.log(
    `Track finished: ${report.reduce((n, r) => n + r.issues, 0)} issue draft(s), ` +
      `${errors.length} entrie(s) failed.`,
  );
  setOutput("issue_count", String(drafts.length));
  if(errors.length > 0) process.exitCode = 1;
}

const command = process.argv[2];
if(command === "sync") {
  await sync();
} else if(command === "track") {
  await track();
} else {
  console.error("Usage: node sync-upstream.mjs <sync|track>");
  process.exit(1);
}
