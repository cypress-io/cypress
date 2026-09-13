# Cypress App - Managing the Release Changelog

Cypress prefers hand tailored release notes over auto generated release notes, primarily, user experience is highly valued at Cypress.

## When to Add an Entry

The changelog should include anything that was merged into the `develop` branch of the Cypress repo that is a user-affecting change. This includes:
- `breaking` - A breaking change that will require an MVB
- `dependency` - A change to a dependency that impacts the user
- `deprecation` - An API deprecation notice for users
- `feat` - A new feature
- `fix` - A bug fix or regression fix
- `misc` - A miscellaneous user-facing change, like a UI update which is not a fix or enhancement to how Cypress works
- `perf` - A code change that improves performance

These prefixes do **not** require an entry:
- `chore` - Changes to the build process or auxiliary tools and libraries
- `docs` - Documentation only changes
- `refactor` - A code change that neither fixes a bug nor adds a feature
- `revert` - Reverts a previous commit
- `test` - Adding missing or correcting existing tests
- `internal` - Work that is real and may well ship publicly later, but is not reachable by users yet — typically behind a feature flag, an internal-only build, or a gated rollout. Its entry is written in the release that actually exposes it, as `feat` or `fix` at that point.

Choosing `fix` asserts the change ships to users, so do not then skip the entry because the impact looks internal. Use `chore` or `refactor` if the change truly has no user-facing effect, or `internal` if it is user-facing but not yet reachable.

This changelog describes the **binary**. Validation only considers changed files under `cli/` or `packages/` (excluding `cli/CHANGELOG.md` itself), so a pull request touching only `npm/`, `system-tests/`, `scripts/`, `tooling/`, or docs needs no entry — and should probably not carry a user-facing prefix. The `npm/*` packages are versioned and published independently by semantic-release and never appear here.

## Writing Guidelines

1. The changelog is formatted like the following. If there is not a pending changelog for the next release, add these sections.

    ```md
    ## <RELEASE_VERSION>

    **<CHANGE_SECTION:**

    - <CHANGELOG_ENTRY>
    ```

    The file is parsed by position, so a few rules are enforced as hard errors by [`parse-changelog.js`](../scripts/semantic-commits/parse-changelog.js):
    - Line 1 stays the HTML comment and **line 2 must be the `## X.Y.Z` heading**, with a blank line after it and after every section header.
    - Only the change sections in the table below are valid section headers. Anything else throws, naming the offending line number.
    - Never repeat a section header within a release; always add to the existing section. A repeat with another section between the two throws `Duplicate section header`, but a repeat **immediately after** the first block silently discards every entry above it, so those entries are never validated and can ship missing.
    - Parsing stops at the next `## X.Y.Z`, so only the topmost release is validated.

2. Each changelog entry is written and merged with the associated user-facing code change in [`cli/CHANGELOG.md`](../cli/CHANGELOG.md).
3. The changelog entry should be added to the associated change section. The supported change sections for the changelog (that should be listed in the order below) are:

    | change type (by order of impact) | change section | details |
    | -- | -- | --|
    | -- | Summary | A description of the overall changes, usually only provided for **breaking changes** or **large features**, written in coordination with Cypress's marketing to match the language used around the release. It may also link to relevant blogs. [Example](https://docs.cypress.io/app/references/changelog#7-0-0) — **note:** `**Summary:**` is not a valid section header in [`cli/CHANGELOG.md`](../cli/CHANGELOG.md) and will fail validation. Add the summary when the release notes are published to `docs.cypress.io` (see step 11 of the [Release Process](./release-process.md)), not to this file. |
    | `breaking` | Breaking Changes | Link to the Migration Guide (if any) at the beginning of this section. For each one explain the change, how it affects users, and how users can mitigate the effects of the change (unless it's covered in the Migration Guide). [Example](https://docs.cypress.io/app/references/changelog#6-0-0) |
    | `deprecation` | Deprecations | Explain each deprecation and that it will be removed in a future release. [Example](https://docs.cypress.io/app/references/changelog#6-0-0) |
    | `perf` | Performance | [Example](https://docs.cypress.io/app/references/changelog#7-2-0) |
    | `feat` | Features | [Example](https://docs.cypress.io/app/references/changelog#8-6-0) |
    | `fix` | Bugfixes | [Example](https://docs.cypress.io/app/references/changelog#9-1-0) |
    | `misc` | Misc | We don't use this section as much as we used to, but if there is a change that is not necessarily a feature or a bugfix, it would go here. (Like the design of the browser picker changed). [Example](https://docs.cypress.io/app/references/changelog#6-7-0) |
    | `dependency` | Dependency Updates | A list of dependencies that were updated, downgraded, or removed as well as the version it was changed from. [Example](https://docs.cypress.io/app/references/changelog#7-2-0) |
4. You may have several changes around a feature that make sense to group. Feel free to do so to make more sense to users consuming the changelog. [Example](https://docs.cypress.io/app/references/changelog#8-7-0)
5. Do not refer to 'we' when writing a changelog item. We want to phrase the changelog in a way that emphasizes how the user is impacted. Additionally 'we' may not have addressed the issue, an outside contributor may have.
    - _Example:_ Instead of 'We fixed a situation where a cross-origin error could incorrectly throw in Chrome' write 'Cross-origin errors will no longer incorrectly throw in Chrome in certain situations'.
6. Be as direct as possible in explaining the changes, but with enough clarity that the user understands the full impact. Users should *never* have to click on the link to the issue/PR to understand the change that happened and *absolutely never* have to look at the code to understand the change. If you cannot yourself understand the change from the Changelog entry, add more context.
    - Do not include implementation details (e.g. internal function/file names, refactors, the specific code path that changed, or how the fix works under the hood). Describe only the user-facing impact — what behavior the user will now observe. If a change has no user-facing impact, it does not belong in the changelog.
7. Order the changelog items in order of impact. The most impactful features/bugfixes should be ordered first.
8. If a changelog item is a regression, the description should start with `Fixed a regression in [9.1.0](#9-1-0)` with a link to the release that introduced it.
9. For each changelog item, there should be a link to the issue(s) it addresses, or to the PR it was addressed in when there is no corresponding issue. Validation matches an entry by these links, so every issue (or the PR) must appear in it. Link issues as `https://github.com/cypress-io/cypress/issues/<n>` and pull requests as `https://github.com/cypress-io/cypress/pull/<n>`. The lead-in phrase depends on the change type, per [`change-categories.js`](../scripts/semantic-commits/change-categories.js):
    - `fix` and `perf`, with issues: ``Fixes [#1234](https://github.com/cypress-io/cypress/issues/1234).``
    - `fix` and `perf`, no issue: ``Fixed in [#1234](https://github.com/cypress-io/cypress/pull/1234).``
    - All other change types, with issues: ``Addresses [#1234](https://github.com/cypress-io/cypress/issues/1234).``
    - All other change types, no issue: ``Addressed in [#1234](https://github.com/cypress-io/cypress/pull/1234).``
    - Multiple issues are sorted ascending and joined with a comma and `and`: ``Fixes [#12](https://github.com/cypress-io/cypress/issues/12), [#13](https://github.com/cypress-io/cypress/issues/13) and [#14](https://github.com/cypress-io/cypress/issues/14).``
10. When a changelog item references a Cypress command, plugin event, or configuration option, link the first mention to its documentation for consistency with existing entries. Either link form is acceptable: the `https://on.cypress.io/<slug>` short link or an absolute `https://docs.cypress.io/<path>` URL.
    - _Example (`on.cypress.io`):_ `` [`cy.visit()`](https://on.cypress.io/visit) ``, `` [`before:spec`](https://on.cypress.io/before-spec-api) ``.
    - _Example (`docs.cypress.io`):_ `` [`before:spec`](https://docs.cypress.io/api/plugins/before-spec-api) ``, `` [`numTestsKeptInMemory`](https://docs.cypress.io/app/references/configuration#Global) ``.
11. If a change is only observable under a specific run context (e.g. `cypress run` vs. `cypress open`, or behind an experimental flag), state which context is affected so users can tell whether the change applies to them.
12. A release often ships between the commit that adds an entry and the review that merges it. Re-check placement every time you pull `develop`, and again before marking a pull request ready: if a new `## X.Y.Z` heading has appeared above your entry, move the entry up into the new topmost release, keeping it under the same named section there. This is silent in both directions — the entry still reads correctly in the diff, and validation parses only the topmost release, so an entry stranded under an already-shipped version is simply never seen.

## Dependency Updates and Security Advisories

Most `dependency` entries exist because a security scan reported an advisory, and users (and their own security teams) scan this section for a specific advisory ID. Follow the established shape: **upgraded what, from and to which versions, to address which advisory, as reported in security scans.**

```md
- Upgraded `undici` from `6.26.0` to `6.27.0` to address a [CRLF Injection](https://security.snyk.io/vuln/SNYK-JS-UNDICI-17372658) vulnerability reported in security scans. Addressed in [#34121](https://github.com/cypress-io/cypress/pull/34121).
```

- Open with `Upgraded` and the package name in backticks, then ``from `X` to `Y` `` — or just ``to `Y` `` when the previous version was a range.
- Always link the advisory, using whichever source reported it: `https://www.cve.org/CVERecord?id=CVE-…`, `https://github.com/advisories/GHSA-…`, `https://security.snyk.io/vuln/SNYK-JS-…`, or `https://nvd.nist.gov/vuln/detail/CVE-…`.
- Use the vulnerability class as the link text when the advisory names one — *Denial of Service*, *Remote Code Execution*, *Prototype Pollution*, *CRLF Injection*, *ReDoS*. Fall back to the bare advisory ID when it has no descriptive name. A Snyk link may carry the CVE after it in parentheses.
- Close the clause with "reported in security scans", which is what makes these entries greppable. Use `vulnerabilities` when listing more than one advisory.
- Say where the vulnerability actually lived when it is not the package itself — a bundled binary, or a transitive copy — and name any sibling dependencies bumped to keep versions aligned, and why.
- Do not claim Cypress was exploitable. These entries state that the advisory no longer appears in scans; they do not assess whether the vulnerable code path was reachable.

## Formatting

### Package Names and Versions

Enclose the following in backticks (\`):

| Item                                                                                                     | Pattern                                  | Example                      |
| -------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ---------------------------- |
| [npm package name](https://docs.npmjs.com/creating-a-package-json-file#required-name-and-version-fields) | lower case, hyphen / underscore optional | `tar-fs`                     |
| [semver version](https://semver.org/)                                                                    | `X.Y.Z` (no `v`)                         | `3.1.0`                      |
| [npm semver ranges](https://github.com/npm/node-semver/blob/main/README.md#ranges)                       | caret `^`, tilde `~`, comparator         | `^3.0.0` `~0.6.1` `>=15.0.4` |

No backticks for:

| Item                      | Pattern | Example |
| ------------------------- | ------- | ------- |
| npm package major version | `X`     | 15      |

## Release

At the time of the release, the releaser will:
- ensure the Changelog is coherent
- ensure the change sections are in the correct order
- ensure that the entries are ordered by impact

Each Cypress release results in an update to the [changelog.mdx](https://github.com/cypress-io/cypress-documentation/blob/main/docs/app/references/changelog.mdx) file in the [cypress-documentation](https://github.com/cypress-io/cypress-documentation) repository to be published on the [doc site](https://docs.cypress.io/app/references/changelog). See [Example pull request](https://github.com/cypress-io/cypress-documentation/pull/5965) adding a new changelog section to the repository.
