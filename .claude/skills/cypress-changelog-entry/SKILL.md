---
name: cypress-changelog-entry
description: >-
  Decides whether a PR needs a cli/CHANGELOG.md entry based on its semantic
  title prefix, then writes the entry in the right section with the exact
  "Fixes"/"Addresses" resolve phrase and issue/PR links the validator matches,
  and verifies it with scripts/semantic-commits/validate-binary-changelog.js.
  Use when adding or reviewing a changelog entry, picking a semantic prefix,
  or resolving CI failures from verify-release-readiness such as "A changelog
  entry was not found in cli/CHANGELOG.md", "does not include the
  Breaking Changes section", or "Found the changelog entry in the wrong
  section".
---

# Writing a Cypress changelog entry

Canonical reference: [guides/writing-the-cypress-changelog.md](../../../guides/writing-the-cypress-changelog.md) (full style rules, formatting tables, release duties). Source of truth for sections and phrasing: [`scripts/semantic-commits/change-categories.js`](../../../scripts/semantic-commits/change-categories.js).

Entries live in [`cli/CHANGELOG.md`](../../../cli/CHANGELOG.md) and ship with the **binary**. `npm/*` packages are published separately by semantic-release and do not belong here.

## Agent execution

Editing the entry needs nothing but the repo. **Verifying** it (step 5) has two prerequisites — check both before reporting that validation passed or failed:

| Need | Why | Fix |
|------|-----|-----|
| Root `node_modules` | `validate-binary-changelog.js` loads `bluebird` and `@octokit/core` from the root install | `yarn` from repo root (`network`; several minutes) |
| `GH_TOKEN` + network | It queries the GitHub API for the last release and this branch's commits | Any token with public repo read; `network` permission |

Without the install it fails at `Cannot find module 'bluebird'` — that is a **missing dependency, not a changelog problem**. Do not report it as a validation failure. If neither prerequisite can be met, say the entry is unverified rather than implying the script passed.

## 1. Does this PR need an entry?

Decided by the **semantic prefix of the PR title**, not by how large the change feels.

| Prefix | Section heading (exact) | Version bump |
|--------|-------------------------|--------------|
| `breaking` | `**Breaking Changes:**` | major |
| `deprecation` | `**Deprecations:**` | minor |
| `feat` | `**Features:**` | minor |
| `perf` | `**Performance:**` | patch |
| `fix` | `**Bugfixes:**` | patch |
| `misc` | `**Misc:**` | patch |
| `dependency` | `**Dependency Updates:**` | patch |

**No entry required:** `chore`, `docs`, `refactor`, `revert`, `test`, `internal` (`internal` = available to internal Cypress users only).

Two rules that cause most of the failures:

- Choosing `fix` **asserts the change ships to users**. Do not then skip the entry because the impact looks internal — pick `chore`/`refactor` instead if it truly has no user-facing effect.
- Validation only considers files under **`cli/`** or **`packages/`** (excluding `cli/CHANGELOG.md` itself). A user-facing prefix on a PR touching only `npm/`, `system-tests/`, or `scripts/` needs no entry — and should probably carry a different prefix.

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

- **Only the seven section headings in the table above are valid.** Anything else throws, including the `**Summary:**` section the guide describes for large releases — it does not appear in the file and the tooling rejects it.
- **No duplicate section headings** in one release (`Condense change content under a single section header.`). Add to the existing section instead.
- Section order, when several are present: Breaking Changes, Deprecations, Performance, Features, Bugfixes, Misc, Dependency Updates. Order entries within a section by user impact, most impactful first.

## 3. Write the resolve phrase exactly

The validator matches on the phrase plus **every** link. The phrase depends on the category and on whether the PR closes issues.

| Category | Has linked issue(s) | PR only, no issue |
|----------|---------------------|-------------------|
| `fix`, `perf` | `Fixes [#123](…/issues/123).` | `Fixed in [#456](…/pull/456).` |
| all others | `Addresses [#123](…/issues/123).` | `Addressed in [#456](…/pull/456).` |

- Issue links use `https://github.com/cypress-io/cypress/issues/<n>`; PR links use `https://github.com/cypress-io/cypress/pull/<n>`.
- Multiple issues are sorted ascending and joined as `[#12] and [#13]` (two) or `[#12], [#13] and [#14]` (three or more).
- End with a period.

A regression entry opens with the release that introduced it: `Fixed a regression in [16.0.0](#16-0-0) where …`.

## 4. Write the description

Rules that reviewers reliably enforce (full set in the guide):

- **Describe user-visible impact, never implementation.** No internal function or file names, no "how the fix works". A reader must understand the change without opening the issue, and *never* by reading code.
- **Do not say "we".** Write from the user's side: "Cross-origin errors will no longer incorrectly throw in Chrome", not "We fixed…".
- **Link the first mention** of a command, plugin event, or config option to its docs — either `https://on.cypress.io/<slug>` or an absolute `https://docs.cypress.io/<path>`.
- **Name the run context** when behavior differs between `cypress run` and `cypress open`, or behind an experimental flag.
- **Backticks** for npm package names (`tar-fs`), semver versions (`3.1.0`), and ranges (`^3.0.0`). No backticks on a bare major version (15).
- Group related changes into one entry when that reads better for users.

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
- missing links → prints the exact expected resolve string to paste.

The validator checks placement and links only. **Wording, ordering, and whether the entry is understandable are left to reviewers** — step 4 is not optional just because the script passes.

## What to skip

- Editing older released version sections — entries are added to the pending release only.
- Adding an entry for a reverted PR; the validator excludes reverts, and the change never shipped.
- `SKIP_RELEASE_CHANGELOG_VALIDATION_FOR_BRANCHES` — a CircleCI release-engineering escape hatch, not a way to land a PR without an entry.
