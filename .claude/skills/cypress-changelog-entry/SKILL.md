---
name: cypress-changelog-entry
description: >-
  Decides whether a PR needs a cli/CHANGELOG.md entry from its changed paths
  and semantic title prefix, writes it in the correct section with the issue
  or PR links validation matches, covers dependency bumps that address a CVE
  or advisory reported in security scans, and verifies with
  scripts/semantic-commits/validate-binary-changelog.js. Also use when a
  release shipped while a PR was open and an entry is stranded under an older
  version heading, when picking a semantic prefix, or on verify-release-readiness
  failures such as "A changelog entry was not found in cli/CHANGELOG.md",
  "does not include the Breaking Changes section", or "Found the changelog entry
  in the wrong section".
---

# Writing a Cypress changelog entry

**[guides/writing-the-cypress-changelog.md](../../../guides/writing-the-cypress-changelog.md) is the source of truth** for which prefixes need an entry, section names and order, phrasing, formatting, and dependency/security wording. This skill is the procedure around it: how to decide, where to place, and how to verify. When the two disagree, the guide wins and this file is the one to fix — along with [`change-categories.js`](../../../scripts/semantic-commits/change-categories.js) (sections, version bumps, phrase convention) and [`parse-changelog.js`](../../../scripts/semantic-commits/parse-changelog.js) (structure), which the guide documents.

## Agent execution

Editing the entry needs nothing but the repo. **Verifying** it (step 5) has two prerequisites — check both before reporting that validation passed or failed:

- **Root `node_modules`** — `validate-binary-changelog.js` loads `bluebird` and `@octokit/core` from the root install. Run `yarn` from the repo root (`network`; several minutes).
- **`GH_TOKEN` + network** — it queries the GitHub API for the last release and this branch's commits. Any token with public repo read access works.

Without the install it fails at `Cannot find module 'bluebird'` — that is a **missing dependency, not a changelog problem**. Do not report it as a validation failure. If neither prerequisite can be met, say the entry is unverified rather than implying the script passed.

## 1. Stop conditions — does this PR need an entry at all?

Check scope first, prefix second. Either gate alone ends the task.

**Scope.** Entries in [`cli/CHANGELOG.md`](../../../cli/CHANGELOG.md) describe the **binary**. Validation only considers changed files under **`cli/`** or **`packages/`** (excluding `cli/CHANGELOG.md` itself). So:

- A PR touching only **`npm/`** needs **no entry**. Those packages are versioned and published independently by semantic-release, and their changes never appear here.
- A PR touching only `system-tests/`, `scripts/`, `tooling/`, `.circleci/`, or docs needs **no entry** — and should probably not carry a user-facing prefix.

**Prefix.** Otherwise the semantic prefix of the PR title decides, not how large the change feels. Each maps to one exact section heading and one version bump:

- `breaking` → `**Breaking Changes:**` — major
- `deprecation` → `**Deprecations:**` — minor
- `feat` → `**Features:**` — minor
- `perf` → `**Performance:**` — patch
- `fix` → `**Bugfixes:**` — patch
- `misc` → `**Misc:**` — patch
- `dependency` → `**Dependency Updates:**` — patch

**No entry required:** `chore`, `docs`, `refactor`, `revert`, `test`, `internal`.

- `internal` covers work that is real and may well ship publicly later, but is not reachable by users yet — typically behind a feature flag, an internal-only build, or a gated rollout. It gets its changelog entry in the release that actually exposes it, written then as `feat` or `fix`.
- Choosing `fix` **asserts the change ships to users**. Do not then skip the entry because the impact looks internal — use `chore`/`refactor` if it truly has no user-facing effect, or `internal` if it is user-facing but not yet reachable.

## 2. Place the entry

Add to the **topmost version section** — the parser stops at the second `## X.Y.Z`, so an entry filed under any older release is invisible to validation. If no pending section exists for the next release, create one.

The layout is parsed by position, not loosely. Line 1 stays the HTML comment, **line 2 must be `## X.Y.Z`**, and a blank line follows both the version heading and every section header:

```md
<!-- See ../guides/writing-the-cypress-changelog.md ... -->
## <NEXT_VERSION>

**Bugfixes:**

- <entry>
```

Get the version with **`node ./scripts/get-next-version.js`** (see [guides/next-version.md](../../../guides/next-version.md)). Root `package.json` reads `0.0.0-development` on `develop` — that is the sentinel, not a version.

Three structural rules the parser enforces as hard errors:

- **Only the seven section headings listed above are valid.** Anything else throws, including the `**Summary:**` section the guide describes for large releases — it does not appear in the file and the tooling rejects it.
- **Never repeat a section heading** in one release — always add to the existing block. Only a repeat with another section between the two throws `Duplicate section header`; a repeat immediately after the first block **silently discards every entry above it**. If an entry seems to vanish from validation, check for a second copy of its heading.
- Section order, when several are present: Breaking Changes, Deprecations, Performance, Features, Bugfixes, Misc, Dependency Updates. Order entries within a section by user impact, most impactful first.

### Reconcile against the current release section

A release often ships between the commit that added an entry and the review that merges it. **Re-check placement every time you pull `develop`, and before marking a PR ready.** If a new `## X.Y.Z` heading has appeared above your entry, your entry is now filed under a release that already shipped — move it up into the new topmost section, keeping it in the same named section there.

This is silent both ways: the entry reads fine in the diff, and validation parses only the topmost release, so an entry stranded under an older heading is simply not seen. Check any time the PR sits through a release, on rebase or merge conflicts in `cli/CHANGELOG.md`, and whenever `node ./scripts/get-next-version.js` prints a version that no longer matches the heading your entry is under.

## 3. Cite the issue or PR

An entry is matched by the **links it cites**, so every issue (or the PR, when there is no issue) must appear in it:

- With linked issues, cite the **issues**: `https://github.com/cypress-io/cypress/issues/<n>`.
- With no linked issue, cite the **PR**: `https://github.com/cypress-io/cypress/pull/<n>`.
- Multiple issues are sorted ascending and joined as `[#12] and [#13]` (two) or `[#12], [#13] and [#14]` (three or more).
- End with a period.

The lead-in phrase is style rather than a matched rule, so follow what the surrounding entries do. The convention the validator's own example prints:

- `fix` and `perf` — `Fixes [#123](…/issues/123).` with issues, `Fixed in [#456](…/pull/456).` without.
- every other category — `Addresses [#123](…/issues/123).` with issues, `Addressed in [#456](…/pull/456).` without.

A regression entry opens with the release that introduced it: `Fixed a regression in [16.0.0](#16-0-0) where …`.

## 4. Write the description

Rules that reviewers reliably enforce (full set in the guide):

- **Describe user-visible impact, never implementation.** No internal function or file names, no "how the fix works". A reader must understand the change without opening the issue, and *never* by reading code.
- **Do not say "we".** Write from the user's side: "Cross-origin errors will no longer incorrectly throw in Chrome", not "We fixed…".
- **Link the first mention** of a command, plugin event, or config option to its docs — either `https://on.cypress.io/<slug>` or an absolute `https://docs.cypress.io/<path>`.
- **Name the run context** when behavior differs between `cypress run` and `cypress open`, or behind an experimental flag.
- **Backticks** for npm package names (`tar-fs`), semver versions (`3.1.0`), and ranges (`^3.0.0`). No backticks on a bare major version (15).
- Group related changes into one entry when that reads better for users.

### Dependency bumps that resolve a reported vulnerability

These are near-templated in `**Dependency Updates:**`, and matching the existing shape matters — users and their own security teams scan this section for a specific advisory ID. The form is: **upgraded what, from/to which versions, to address which advisory, as reported in security scans.**

```md
- Upgraded `undici` from `6.26.0` to `6.27.0` to address a [CRLF Injection](https://security.snyk.io/vuln/SNYK-JS-UNDICI-17372658) vulnerability reported in security scans. Addressed in [#34121](https://github.com/cypress-io/cypress/pull/34121).
```

- Open with **`Upgraded`** and the backticked package name, then `from \`X\` to \`Y\`` — or just `to \`Y\`` when the old version was a range.
- Always link the advisory. Use whichever source reported it: `https://www.cve.org/CVERecord?id=CVE-…`, `https://github.com/advisories/GHSA-…`, `https://security.snyk.io/vuln/SNYK-JS-…`, or `https://nvd.nist.gov/vuln/detail/CVE-…`.
- **Link text is the vulnerability class** when the advisory names one — *Denial of Service*, *Remote Code Execution*, *Prototype Pollution*, *CRLF Injection*, *ReDoS*. Fall back to the bare ID when it has no descriptive name. A Snyk link may carry the CVE after it in parentheses.
- Close the clause with **"reported in security scans"** — the phrase is near-universal here and is what makes these entries greppable. Pluralize to `vulnerabilities` when listing more than one advisory.
- **Say where the vulnerability actually lived** when it is not the package itself — a bundled binary, or a transitive copy. Name any sibling dependencies bumped to keep versions aligned, and why.
- Do **not** claim Cypress was exploitable. These entries say the advisory no longer appears in scans; they do not assess whether the vulnerable path was reachable.

## 5. Verify

```bash
GH_TOKEN=<token> node ./scripts/semantic-commits/validate-binary-changelog.js
```

This is the same check CI runs in the **`verify-release-readiness`** job. It throws `The GH_TOKEN env is not set.` without a token; `gh auth token` supplies one where the `gh` CLI is installed.

Run it **locally on your feature branch**: the branch gate that limits full-changelog validation to `develop` / `release/X.Y.Z` applies only under `CIRCLECI`, so a local run validates the whole changelog regardless of branch.

It reports which of these went wrong:

- missing entry → `A changelog entry was not found in cli/CHANGELOG.md.`
- missing section → `The changelog does not include the **<Section>:** section.`
- wrong section → `Found the changelog entry in the wrong section.`
- missing links → prints the exact expected string to paste.
- a malformed release block throws out of the parser instead, naming the offending line number — an unknown or duplicate section heading, or a missing blank line.

The validator checks placement and links only. **Wording, ordering, and whether the entry is understandable are left to reviewers** — steps 3 and 4 are not optional just because the script passes.

## What to skip

- Editing older released version sections — entries belong to the pending release only. The one exception is moving your own stranded entry up, per *Reconcile against the current release section*.
- Adding an entry for a reverted PR; the validator excludes reverts, and the change never shipped.
- `SKIP_RELEASE_CHANGELOG_VALIDATION_FOR_BRANCHES` — a CircleCI release-engineering escape hatch, not a way to land a PR without an entry.
