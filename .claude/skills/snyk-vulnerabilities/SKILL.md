---
name: snyk-vulnerabilities
description: Triage, fix, and validate high-severity Snyk package vulnerabilities in a monorepo. Use when a user asks to fix Snyk issues, or asks to remediate package vulnerabilities. Covers the full workflow including looking up fixed versions, deciding on fix strategy (relock vs resolution vs direct dep bump), applying changes across all yarn workspaces, relock, and re-running Snyk to validate.
metadata:
  version: 1.1.0
  model: claude-opus-4-6
---

# Fix Snyk Vulnerabilities

## Purpose

Triage, fix, and validate high-severity Snyk package vulnerabilities in a monorepo. Use this skill when asked to fix Snyk issues or remediate package vulnerabilities. Covers the full workflow: triage, version lookup, fix strategy selection (relock vs resolution vs direct dep bump), applying changes across yarn workspaces, relocking, and re-running Snyk to validate.

## Required Context

Before starting, ensure you have access to:

- The repo root directory with `package.json` and `yarn.lock` files
- Snyk CLI (`npx snyk`) authenticated to the `cypress-pilot` org
- Node.js for running skill scripts
- Write access to `package.json` and `yarn.lock` files in all workspaces

## Output Format

The final deliverable is:

- Updated `package.json` files with version bumps and/or resolutions
- Updated `yarn.lock` files reflecting the fixed versions
- A clean Snyk re-scan confirming zero vulnerabilities at the chosen severity threshold (or a list of remaining issues if any cannot be resolved)

---

## Path conventions

All commands below are run from the **repo root**. The skill directory lives under `.claude/`, `.codex/`, or `.cursor/` depending on the tool. Define these variables once at the start:

```bash
# Auto-detect: works under .claude/, .codex/, or .cursor/
SKILL_DIR=$(find .claude .codex .cursor -path '*/skills/snyk-vulnerabilities' -type d 2>/dev/null | head -1)
SCRIPTS=$SKILL_DIR/scripts
SKILL_TMP=$SKILL_DIR/tmp
mkdir -p $SKILL_TMP
```

## Available scripts

All scripts live in `$SCRIPTS/` and are run with `node`:

- **`vuln-actions.js`:** Parse Snyk JSON → human-readable vulnerability list (filters by vuln-actions rules)
- **`triage-vulns.js`:** Extract triage data from Snyk JSON: package names, fix versions, ranges, SNYK IDs
- **`check-npm-versions.js`:** Query npm registry for available versions (replaces ad-hoc python version lookups)
- **`parse-snyk-summary.js`:** Quick summary of Snyk results: project count, vuln count, ALL CLEAR confirmation
- **`find-lockfile-stanzas.js`:** Find all lockfile stanzas for a package across workspace lockfiles
- **`remove-lockfile-stanzas.js`:** Remove lockfile stanzas by package name + version (batch, from JSON stdin)
- **`verify-lockfile-versions.js`:** Verify packages resolve to expected versions in all lockfiles
- **`check-npm-deprecation.js`:** Check whether specific package versions are deprecated on npm

---

## Workspaces in this repo

Workspaces are the **root** (if it has `package.json`) and any **direct child directory** (max 1 level deep) that contains `package.json`. Each has its own lockfile and `resolutions` block; Snyk scans all of them.

```bash
([ -f package.json ] && echo "root"; for d in */; do [ -f "${d}package.json" ] && echo "${d%/}"; done)
```

Example output: `root`, `app`, `discovery`, `frontend`. Use this list everywhere below.

---

## Processing files: use skill temp directory only

- **Temp directory:** All Snyk and vulnerability-list outputs must be written under `$SKILL_TMP/`. Do not write `snyk.json`, `snyk_vulnerabilities.txt`, `snyk_updated.json`, or `snyk_vulnerabilities_updated.txt` at the repo root or elsewhere.
- **Fix summaries:** Do **not** write fix summaries or any subagent result JSON to disk. Subagents must return their structured summary only in their final response text.

---

## Scope: only what Snyk reports; prefer repinning over resolutions

- **Only fix packages expressly listed in the vulnerability report** (the Snyk-derived list in the skill temp dir). Do not add resolutions or other changes for packages not in that report. Resolutions are for forcing a fixed version when a declared range would otherwise resolve to a vulnerable one — add them only when the report names that package.
- **Snyk does not include vulnerabilities that exist only in devDependency trees.** We ignore those for the time being; do not add resolutions or changes for packages that are not in the report.
- **Prefer repinning over resolutions when the vuln is only from dev deps.** If the vulnerable package appears in the Snyk report but is only pulled in as a transitive of a **devDependency**, try to fix by bumping/repinning that devDependency so it resolves to the fixed version. Add a resolution only when the vuln comes from a production dependency or when repinning the dev dep is not sufficient (e.g. the dev dep's range excludes the fix version and cannot be updated).

---

## Pre-flight: Verify model

This skill orchestrates parallel subagents, reasons over complex dependency graphs, and makes judgment calls about fix strategies. It requires a high-capability model.

**Check which model you are running as.** If you are not on `claude-opus-4-6` (or an equivalent high-capability model), stop and tell the user:

> This skill works best on Claude Opus. You are currently on [model name]. Switch with `/model claude-opus-4-6` and re-run, or confirm you'd like to continue on the current model.

Do not proceed until the user either switches models or explicitly confirms they want to continue.

---

## Step 0: Generate the vulnerability report

**STOP and ask the user** which severity threshold to use: **critical**, **high** (default), or **medium**. **Do not run the Snyk scan until the user responds.** Use `high` only if they explicitly say to use the default or tell you to pick.

```bash
SEVERITY=high  # or critical, medium — as specified by the user

npx snyk test \
  --yarn-workspaces \
  --strict-out-of-sync=false \
  --detection-depth=6 \
  --exclude=docker,Dockerfile,local-data \
  --severity-threshold=$SEVERITY \
  --org=cypress-pilot \
  --json 2>/dev/null > $SKILL_TMP/snyk.json

# Human-readable vulnerability list (filters by vuln-actions rules)
node $SCRIPTS/vuln-actions.js -f $SKILL_TMP/snyk.json > $SKILL_TMP/snyk_vulnerabilities.txt
```

**Important:** Use `2>/dev/null` to prevent npm warnings from polluting the JSON output.

Review the vulnerability list before proceeding. Only entries in that file should be triaged and fixed.

---

## Step 1: Triage — extract fix info

Run the triage script to automatically extract package names, fix versions, vulnerability ranges, and SNYK IDs from the Snyk JSON:

```bash
node $SCRIPTS/triage-vulns.js $SKILL_TMP/snyk.json
```

This outputs a de-duplicated table grouped by package name with the highest fix version for each. For JSON output (useful for programmatic processing): add `--json`.

**If any packages show "UNKNOWN" fix version** (Snyk's `fixedIn` field was empty), look up available versions manually:

```bash
# Example: find recent versions of tar in the 7.x line
node $SCRIPTS/check-npm-versions.js tar --major 7

# Example: find versions >= a specific version
node $SCRIPTS/check-npm-versions.js qs --gte 6.14.0 --last 5
```

After triage, you will have a complete list:

```
{ packageName: "qs", fixVersion: "6.14.2", vulnerableRanges: [">=6.7.0 <6.14.2"], snykIds: ["SNYK-JS-QS-..."] }
```

---

## Step 2: Launch one subagent per dependency (parallel)

After triage is complete, **launch one subagent per unique vulnerable package**. Use whatever tool is available for spawning subagents (Claude Code: `Agent` tool; Cursor: `Task` tool with `subagent_type: "general-purpose"`). Fire them all in a single message so they run in parallel.

Each subagent is responsible for **classifying the fix, applying `package.json` changes, and identifying the lockfile stanzas to remove** for exactly one package.

**Subagents must not edit any `yarn.lock` file directly.** They return stanza keys to remove; the orchestrator applies all lockfile deletions sequentially after collecting all results. Do not run `yarn install` inside subagents either.

### What to include in each subagent prompt

```
You are fixing a Snyk vulnerability for the package "[PACKAGE_NAME]" in a TypeScript monorepo.

Fix info:
- Package: [PACKAGE_NAME]
- Fix version: [FIX_VERSION]  (all versions below this are vulnerable)
- Vulnerable range: [VULN_RANGE]
- Snyk ID(s): [SNYK_IDS]

Workspace layout: use the workspace list from the discovery command. For each workspace name W: root → `package.json` / `yarn.lock`; others → `W/package.json` / `W/yarn.lock`. Each has its own lockfile and resolutions.

Your task:
1. Classify the fix strategy (see below).
2. Apply package.json changes only (bumps, resolutions, stale resolution removals).
3. DO NOT edit any yarn.lock file — instead, use the find-lockfile-stanzas script to identify stanzas.
4. DO NOT run yarn install.
5. Return a structured summary (see below).

--- CLASSIFY THE FIX STRATEGY ---

A. Search all package.json files (one per discovered workspace) for "[PACKAGE_NAME]" as a direct dependency (dependencies or devDependencies) or in the resolutions block. Determine whether the vulnerable version is only pulled in via devDependency trees in each workspace.

B. Apply the correct strategy (only for packages that appear in the Snyk report — do not add resolutions for other packages):

  RELOCK ONLY — use when the fix version is within all declared/transitive ranges:
  - No package.json changes needed.
  - Return the stanza keys to remove from each affected yarn.lock.

  DIRECT DEP BUMP (including devDependencies) — prefer this when the vuln is only from a devDependency:
  - If the vulnerable package is only transitive from a devDependency, first try bumping that devDependency so its range resolves to the fix version (e.g. update "pkg": "^old" → "pkg": "^[FIX_VERSION]" in devDependencies).
  - Also use when a workspace declares [PACKAGE_NAME] directly (dependencies or devDependencies) but the declared range excludes the fix version.
  - Return the stanza keys to remove from each affected yarn.lock.

  RESOLUTION + DIRECT DEP BUMP — use only when necessary: the vuln is from a production dependency, or repinning the dev dep is not possible (e.g. range excludes fix version and we cannot bump the direct dev dep).
  - Add/update "**/[PACKAGE_NAME]": "[FIX_VERSION]" in the resolutions block only of workspaces whose lockfile resolves the vulnerable version and where a direct-dep repin (including dev) is not sufficient.
  - Also bump direct dep declarations where present (dependencies and devDependencies).
  - Do not add a resolution if the package is only in devDependency trees and you can repin the actual devDependency to the fix version.
  - Return the stanza keys to remove from each affected yarn.lock.

  REMOVING STALE RESOLUTIONS — if a resolutions entry was previously pinning a now-fixed version, remove it so yarn can freely resolve via relocking.

--- IDENTIFYING LOCKFILE STANZAS TO REMOVE ---

Use the find-lockfile-stanzas script to locate stanzas:

  node [SCRIPTS_DIR]/find-lockfile-stanzas.js --package [PACKAGE_NAME] --version [VULNERABLE_VERSION]

This will search all workspace lockfiles and output each matching stanza with its key line, resolved version, and lockfile path.

Do NOT edit lockfiles — just record the stanza information from the script output.

--- PATCHED PACKAGES ---

Patches in this repo are rarely fixing a bug; they usually subtly change behavior in a way that a new upstream version is not likely to fix. **Always assume we want to carry the patch forward** to the newly installed (fixed) version — do not drop the patch when upgrading.

Before editing, check for patch files in each discovered workspace: for root run `ls patches/ | grep [PACKAGE_NAME]`; for each other workspace W run `ls W/patches/ | grep [PACKAGE_NAME]`.

If a patch exists for the version being replaced:
1. Keep the resolution pointing to the fixed version.
2. DO NOT delete the old patch file — leave it in place. The orchestrator will spawn a dedicated patch subagent after relocking to re-apply the patch to the new version.
3. In your summary, report: the old patch file path, the old version, the new version, and the workspace where the patch lives (patch re-application is always needed when a patch exists).

--- RETURN in your final response ---

Return a structured summary in your response text only. Do NOT write the summary to a file (no JSON or other files in the repo or skill directory).
Summary to return:
- Package name and fix version applied
- Fix strategy used
- package.json files changed (list each)
- Lockfile stanzas to remove — for each affected lockfile:
    { lockfile: "<path, e.g. app/yarn.lock>", package: "[PACKAGE_NAME]", version: "[VULNERABLE_VERSION]" }
- Yarn workspaces affected (subset of the discovered workspaces)
- Patch re-application needed? If yes:
  - Workspace (one of the discovered workspace names)
  - Old patch file path (e.g., patches/packagename+1.2.3.patch)
  - Old version (e.g., 1.2.3)
  - New version (e.g., 1.4.0)
- Any issues or anomalies encountered
```

**Important:** In the subagent prompt, replace `[SCRIPTS_DIR]` with the actual `$SCRIPTS` path resolved in the Path conventions step above.

### What to do while subagents run

- Prepare the list of workspaces that will need `yarn install` (based on triage)
- Do nothing else that touches `package.json` or `yarn.lock` files

---

## Step 3: Collect subagent results, apply lockfile deletions, then run yarn install

Wait for **all subagents to finish** before proceeding.

From each subagent's summary, collect:

- All lockfile stanza removal entries (package + version per lockfile)
- The set of affected yarn workspaces (for the install step)
- Any patch re-application entries (for Step 3c)

### Step 3a: Apply lockfile stanza removals with script

Collect all removal entries from all subagents and pipe them to the removal script as JSON. Example:

```bash
echo '[
  {"lockfile":"yarn.lock","package":"qs","version":"6.13.0"},
  {"lockfile":"app/yarn.lock","package":"qs","version":"6.13.0"},
  {"lockfile":"yarn.lock","package":"tar","version":"6.2.1"}
]' | node $SCRIPTS/remove-lockfile-stanzas.js
```

The script:

- Groups removals by lockfile and processes each one
- Removes the entire stanza (key line through trailing blank line) for each matching package@version
- Reports what was removed from each lockfile

**Do not manually edit yarn.lock files.** Always use this script for stanza removal.

### Step 3b: Run yarn install

Once all lockfile edits are applied, run `yarn install` **only in the affected workspaces**, in this order:

```bash
# Run only for workspaces reported as affected by at least one subagent, in discovery order:
# - If root is affected: from repo root run yarn install --ignore-scripts
# - For each other discovered workspace W: cd W && yarn install --ignore-scripts
```

`--ignore-scripts` avoids native build failures during the relock step.

### Step 3b-post: Verify resolved versions and check for deprecations

After yarn install completes, verify that all packages now resolve to their expected fix versions:

```bash
node $SCRIPTS/verify-lockfile-versions.js tar@7.5.11 qs@6.14.2 multer@2.1.1
```

The script checks all workspace lockfiles and reports pass/fail for each package. If any fail, investigate before proceeding to validation.

Next, check that none of the installed fix versions are deprecated on npm:

```bash
node $SCRIPTS/check-npm-deprecation.js tar@7.5.11 qs@6.14.2 multer@2.1.1
```

**If any package is reported as deprecated (exit code 1), stop immediately.** Do not proceed to Snyk validation. Return to Step 1 and select a newer, non-deprecated version. Snyk's suggested fix version can lag behind npm deprecations, so this check is essential.

**If the script reports registry lookup failures (exit code 2), do not proceed either.** This means npm couldn't reach the registry or errored out for one or more packages. Retry after resolving network/npm issues — never treat a lookup failure as "not deprecated."

### Step 3c: Patch re-application subagents (if needed)

We always carry patches forward when upgrading a patched package: patches here typically change behavior in a way upstream is unlikely to fix, so re-apply them to the new version rather than dropping them.

If any fix subagents reported patch re-application needed, **group the entries by package name** — a single package may have patches in multiple workspaces, but it's the same version bump and the same logical change. Launch **one patch subagent per unique package** (not per workspace), passing all affected workspaces to that subagent. Fire them all in a single message — do not wait for user input.

Each patch subagent prompt should include:

```
You are re-applying patch-package patches in a TypeScript monorepo after a dependency was upgraded.
We always carry patches forward: they usually encode behavioral changes we want to keep, not one-off bugfixes that upstream will fix.

Context:
- Package: [PACKAGE_NAME]
- Old version: [OLD_VERSION]  (the version the patches were written against)
- New version: [NEW_VERSION]  (now installed in all workspaces)
- Affected workspaces and their patch files:
    [WORKSPACE_DIR_1]: [OLD_PATCH_PATH_1]  (e.g., "."  → patches/packagename+1.2.3.patch)
    [WORKSPACE_DIR_2]: [OLD_PATCH_PATH_2]  (e.g., "app" → app/patches/packagename+1.2.3.patch)
    (add more rows as needed)

The same logical patch needs to be applied in each workspace listed above.
Process each workspace in sequence.

Do NOT manually create or edit patch files. Always edit the installed package in node_modules and run yarn patch-package so the generated patch has correct line references and checksums.

Your task for EACH workspace:
1. Read the old patch file to understand the intent of each hunk (not just the literal diff).
2. Inspect the newly installed package at [WORKSPACE_DIR]/node_modules/[PACKAGE_NAME].
3. Apply the equivalent changes directly to the installed source files in node_modules.
   - Shifted line numbers, minor refactors, renamed variables: resolve automatically.
   - The goal is the same behavioral change, not a byte-for-byte match.
4. From [WORKSPACE_DIR], run:
     yarn patch-package [PACKAGE_NAME]
   This generates patches/[PACKAGE_NAME]+[NEW_VERSION].patch from the modified node_modules, ensuring accurate line references and SHAs. Do not write the patch file by hand.
5. Delete the old patch file for this workspace: [OLD_PATCH_PATH].

IMPORTANT — only escalate to the user if the patch cannot be reasonably reapplied:
- Escalate if: the patched code was entirely removed or replaced with a fundamentally different
  implementation in the new version, such that you cannot determine the equivalent change to make.
- Do NOT escalate for: shifted line numbers, minor refactors, renamed variables, reordered imports,
  or any case where the intent of the patch is still clearly achievable in the new code.
- If one workspace must be escalated but others succeed, complete the successful ones and only
  escalate for the specific workspace(s) that cannot be resolved.

When escalating for a workspace, provide:
- The old patch file contents
- The relevant section of the new installed source
- A clear explanation of why the patch cannot be automatically reapplied
- Your best guess at what the equivalent change should be (even if uncertain)

--- RETURN in your final response ---

For each workspace processed:
- Workspace directory
- Whether the patch was reapplied successfully or escalated
- New patch file path (e.g., patches/packagename+[NEW_VERSION].patch)
- Old patch file deleted? (yes/no)
- If escalated: full context as described above
```

After all patch subagents finish, collect any escalations and present them to the user with the full context provided. For successful re-applications, proceed directly to validation.

---

## Step 4: Validate with Snyk

```bash
npx snyk test \
  --yarn-workspaces \
  --strict-out-of-sync=false \
  --detection-depth=6 \
  --exclude=docker,Dockerfile,local-data \
  --severity-threshold=$SEVERITY \
  --org=cypress-pilot \
  --json 2>/dev/null > $SKILL_TMP/snyk_updated.json

# Quick summary — confirms zero vulns or shows remaining issues
node $SCRIPTS/parse-snyk-summary.js $SKILL_TMP/snyk_updated.json

# Detailed vulnerability list (if any remain)
node $SCRIPTS/vuln-actions.js -f $SKILL_TMP/snyk_updated.json > $SKILL_TMP/snyk_vulnerabilities_updated.txt
```

If the summary shows "ALL CLEAR", done. Otherwise review the detailed list and repeat from Step 1 for remaining issues.

---

## Decision flowchart (for reference / subagent context)

Only consider packages that appear in the Snyk report. Do not add resolutions for other packages.

```
For each vulnerable package (from Snyk output only):
│
├─ Is fix version within ALL transitive declared ranges?
│   ├─ YES → Delete lock stanza(s), reinstall → done
│   └─ NO  →
│       ├─ Vuln only from devDependency tree?
│       │   ├─ YES → Can we bump/repin that devDep to fix version?
│       │   │   ├─ YES → Bump devDep, delete lock stanza(s), reinstall (no resolution)
│       │   │   └─ NO  → Add/update resolution, delete lock stanza(s), reinstall
│       │   └─ NO (production tree) →
│       │       ├─ Package declared as direct dep (or devDep)?
│       │       │   ├─ YES → Bump declared range, then delete lock stanza(s), reinstall
│       │       │   └─ NO  → Add/update resolution, delete lock stanza(s), reinstall
│       └─ Also: remove any resolution that was pinning the old version
```

---

## Common pitfalls

- **Processing files / fix summaries**: See the "Processing files" section — temp dir for Snyk outputs only; no fix summaries or subagent JSON written to disk.
- **Snyk stderr pollution**: Always use `2>/dev/null` when redirecting Snyk JSON output to a file. npm warnings on stderr will corrupt the JSON and cause parse failures.
- **Resolutions only for reported packages**: Add resolutions only for packages in the vulnerability report. Do not add preemptively; ignore vulns that exist only in devDependency trees (they are not in the report).
- **Prefer dev dep repin over resolution**: When the vulnerable package is only pulled in via a devDependency, bump/repin that devDependency to the fix version instead of adding a resolution when possible.
- **Multiple lockfiles**: A package can appear in any of the discovered workspaces' lockfiles. Remove the stanza from every one that has it. The `find-lockfile-stanzas.js` and `remove-lockfile-stanzas.js` scripts handle this automatically.
- **Consolidated lock stanza keys**: Yarn 1 merges ranges: `qs@6.13.0, qs@6.14.1, qs@^6.14.1, ...` all resolve to one entry. The lockfile scripts handle this correctly.
- **Residual resolutions pinning old versions**: If a root/workspace `package.json` has a resolution like `"**/pkg": "oldVulnVersion"`, update or remove it or the relock will keep the old version.
- **Per-workspace resolutions**: Check each non-root workspace's `package.json` for its own `resolutions` block — they may pin transitive deps (e.g. qs, minimatch) independently.
- **@bull-board/express pins express@4.21.x**: Packages like `@bull-board/express` may carry their own pinned `express` with an older `qs`. If `qs@6.13.0` persists, a targeted `"**/qs": "6.14.2"` resolution is required.
- **Subagent lockfile conflicts**: Subagents never edit `yarn.lock` files. They use `find-lockfile-stanzas.js` to identify stanza keys and return that information to the orchestrator, which applies all deletions using `remove-lockfile-stanzas.js`.
- **Patched packages: always carry forward**: When a package has a patch and we upgrade it (e.g. for a vuln fix), we always re-apply the patch to the new version. Patches here rarely fix a bug; they usually change behavior in a way the new version won't fix.
- **Old patch files**: Fix subagents leave old patch files in place. Patch subagents are responsible for deleting them after generating the new patch. Never delete a patch file without first successfully generating its replacement.
- **Patch subagent escalation threshold**: Only escalate to the user if the patched code is entirely gone or replaced with a fundamentally different implementation. Shifted lines, minor refactors, and renamed variables are all auto-resolvable — do not escalate for those.
- **Snyk fix versions can be deprecated**: Snyk's suggested fix version may itself be deprecated on npm. Always run `check-npm-deprecation.js` after relocking (Step 3b-post) before proceeding to Snyk validation. If a fix version is deprecated (exit 1), do not release — find a newer non-deprecated version. If the script reports registry lookup failures (exit 2), do not proceed — resolve the issue and retry.
