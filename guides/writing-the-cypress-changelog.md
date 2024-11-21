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

## Writing Guidelines
1. The changelog is formatted like the following. If there is not a pending changelog for the next release, add these sections.
```md
## <RELEASE_VERSION>

_Released <RELEASE_DATE> (PENDING)_

**<CHANGE_SECTION:**

- <CHANGELOG_ENTRY>
```
2. Each changelog entry is written and merged with the associated user-facing code change in [`cli/CHANGELOG.md`](../cli/CHANGELOG.md).
3. The changelog entry should be added to the associated change section. The supported change sections for the changelog (that should be listed in the order below) are:

  | change type (by order of impact) | change section | details |
  | -- | -- | --|
  | -- | Summary | A description of the overall changes. This is usually only provided for **breaking changes** or **large features**. This should be written in coordination with Cypress's marketing and match the language used around the release. It may also link to relevant blogs. [Example](https://docs.cypress.io/guides/references/changelog#7-0-0) |
  | `breaking` | Breaking Changes | Link to the Migration Guide (if any) at the beginning of this section. For each one explain the change, how it affects users, and how users can mitigate the effects of the change (unless it's covered in the Migration Guide). [Example](https://docs.cypress.io/guides/references/changelog#6-0-0) |
  | `deprecation` | Deprecations | Explain each deprecation and that it will be removed in a future release. [Example](https://docs.cypress.io/guides/references/changelog#6-0-0) |
  | `perf` | Performance | [Example](https://docs.cypress.io/guides/references/changelog#7-2-0) |
  | `feat` | Features | [Example](https://docs.cypress.io/guides/references/changelog#8-6-0) |
  | `fix` | Bugfixes | [Example](https://docs.cypress.io/guides/references/changelog#9-1-0) |
  | `misc` | Misc | We don't use this section as much as we used to, but if there is a change that is not necessarily a feature or a bugfix, it would go here. (Like the design of the browser picker changed). [Example](https://docs.cypress.io/guides/references/changelog#6-7-0) |
  | `dependency` | Dependency Updates | A list of dependencies that were updated, downgraded, or removed as well as the version it was changed from. [Example](https://docs.cypress.io/guides/references/changelog#7-2-0) |
4. You may have several changes around a feature that make sense to group. Feel free to do so to make more sense to users consuming the changelog. [Example](https://docs.cypress.io/guides/references/changelog#8-7-0)
5. Do not refer to 'we' when writing a changelog item. We want to phrase the changelog in a way that emphasizes how the user is impacted. Additionally 'we' may not have addressed the issue, an outside contributor may have.
    - _Example:_ Instead of 'We fixed a situation where a cross-origin error could incorrectly throw in Chrome' write 'Cross-origin errors will no longer incorrectly throw in Chrome in certain situations'.
6. Be as direct as possible in explaining the changes, but with enough clarity that the user understands the full impact. Users should *never* have to click on the link to the issue/PR to understand the change that happened and *absolutely never* have to look at the code to understand the change. If you cannot yourself understand the change from the Changelog entry, add more context.
7. Order the changelog items in order of impact. The most impactful features/bugfixes should be ordered first.
8. If a changelog item is a regression, the description should start with `Fixed a regression in [9.1.0](#9-1-0)` with a link to the release that introduced it.
9. For each changelog item, there should be a link to the issue(s) it addresses (or the PR that it was addressed in if there is no corresponding issue(s)). See phrasing below
    - For bugfixes: "Fixes [#12]([https://github.com/cypress-io/cypress/issues/12](https://github.com/cypress-io/cypress/issues/1234))."
    - For other issues: "Addresses [#12]([https://github.com/cypress-io/cypress/issues/12](https://github.com/cypress-io/cypress/issues/1234))."
    - When no issues, but PR: "Addressed in [#12]([https://github.com/cypress-io/cypress/issues/12](https://github.com/cypress-io/cypress/issues/1234))."
    - When multiple issues: "Fixes [#12]([https://github.com/cypress-io/cypress/issues/12](https://github.com/cypress-io/cypress/issues/1234)), [#13]([https://github.com/cypress-io/cypress/issues/13](https://github.com/cypress-io/cypress/issues/1234)) and [#14]([https://github.com/cypress-io/cypress/issues/14](https://github.com/cypress-io/cypress/issues/1234))."

## Release

At the time of the release, the releaser will:
- remove the `(PENDING)` text next to the planned release date and adjust the date if needed
- ensure the Changelog is coherent
- ensure the change sections are in the correct order
- ensure that the entries are ordered by impact

Each Cypress release results in an update to the [changelog.mdx](https://github.com/cypress-io/cypress-documentation/blob/main/docs/app/references/changelog.mdx) file in the [cypress-documentation](https://github.com/cypress-io/cypress-documentation) repository to be published on the [doc site](https://docs.cypress.io/guides/references/changelog). See [Example pull request](https://github.com/cypress-io/cypress-documentation/pull/5965) adding a new changelog section to the repository.
