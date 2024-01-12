# Cypress App - Managing the Release Changelog

Cypress prefers hand tailored release notes over auto generated release notes, primarily, user experience is highly valued at Cypress. While Cypress is a dependency installed via a package manager, the changelog should be more akin to other desktop products like [VS Code](https://code.visualstudio.com/updates/v1_62) or [Notion](https://www.notion.so/What-s-New-157765353f2c4705bd45474e5ba8b46c).

## When to Add an Entry

The changelog should include anything that was merged into the develop branch of the cypress repo that are user affecting changes. These include:
- `breaking` - A breaking change that will require a MVB
- `dependency` - A change to a dependency that impact the user
- `deprecation` - A API deprecation notice for users
- `feat` - A new feature
- `fix` - A bug fix or regression fix.
- `misc` - a misc user-facing change, like a UI update which is not a fix or enhancement to how Cypress works
- `perf` - A code change that improves performance

When a change should be included in the Changelog, write and merged the entry with the associated user-facing code change. This entry is added to [`cli/changeset/](../cli/changesets) as a uniquely named file.

## Creating a Changeset File

When a change should be included in the Changelog upon release, add a unique changeset by running:

```bash
yarn add-change
```

You will be prompted for the change type and message.

Or shortcut with `-t` and `-m`

```bash
yarn add-change -t fix -me 'Fixed an issue...'
```

Be sure to follow the guidelines below when adding the change message.

The filename is a uniquely generated ID to ensure merge-conflicts do not arise in this format:
```
---
type: <change_type>

changelog entry
---
```

### Writing Guidelines
1. Do not refer to 'we' when writing a changelog item. We want to phrase the changelog in a way that emphasizes how the user is impacted. Additionally 'we' may not have addressed the issue, an outside contributor may have.
  - _Example:_ Instead of 'We fixed a situation where a cross-origin errors could incorrectly throw in Chrome' write 'Cross-origin errors will no longer incorrectly throw in Chrome in certain situations'.
2. Be as direct as possible in explaining the changes, but with enough clarity that the user understands the full impact. Users should *never* have to click on the link to the issue/PR to understand the change that happened and *absolutely never* have to look at the code to understand the change. If you cannot yourself understand the change from the Changelog entry, add more context.
3. If a changelog item is a regression, the description should start with `Fixed a regression in [9.1.0](#9-1-0)` with a link to the release that introduced it.

## Release 

At the time of the release, the releaser will run `yarn create-changelog` to create the changelog. Then they will:
- ensure the Changelog is coherent
- ensure the change sections are in the correct order
- ensure that the entries are ordered by impact. The most impactful features/bugfixes should be ordered first.
- there may have several changes around a feature that make sense to group. Feel free to do so to make more sense to users consuming the changelog. [Example](https://docs.cypress.io/guides/references/changelog#8-7-0)

Each Cypress release results in a new changelog file being added to the [`cypress-documentation`](https://github.com/cypress-io/cypress-documentation) repository to be published on the doc site. [Example pull request](https://github.com/cypress-io/cypress-documentation/pull/4141) adding changelog to the repository.

### Changelog Section Order

This is handled by the `yarn create-changelog` script, but the changelog section order is as follows:

| change type (by order of impact) | change section | details |
| -- | -- | --|
| -- | Summary | A description of the overall changes. This is usually only provided for **breaking changes** or **large features**. This should be written in coordination with Cypress's marketing and match the language used around the release. It may also link to relevant blogs. [Example](https://docs.cypress.io/guides/references/changelog#7-0-0) |
| `breaking` | Breaking Changes | Link to the Migration Guide (if any) at the beginning of this section. For each one explain the change, how it affects them, and how the can mitigate the effects of the change (unless it's covered in the Migration Guide). [Example](https://docs.cypress.io/guides/references/changelog#6-0-0) |
| `deprecation` | Deprecations | Explain each deprecation and that it will be removed in a future release. [Example](https://docs.cypress.io/guides/references/changelog#6-0-0) |
| `perf` | Performance | [Example](https://docs.cypress.io/guides/references/changelog#7-2-0) |
| `feat` | Features | [Example](https://docs.cypress.io/guides/references/changelog#8-6-0) |
| `fix` | Bugfixes | [Example](https://docs.cypress.io/guides/references/changelog#9-1-0) |
| `misc` | Misc | We don't use this section as much as we used to, but perhaps there was a change that is not necessarily a feature or a bugfix, it would go here. (Like the design of the browser picker changed). [Example](https://docs.cypress.io/guides/references/changelog#6-7-0) |
| `dependency` | Dependency Updates | A list of dependencies that were updated, downgraded, or removed as well as the version it was changed from. [Example](https://docs.cypress.io/guides/references/changelog#7-2-0) |

### Linking Resolved Issues

This is handled by the `yarn create-changelog` script, but each changelog item, there will have be a link to the issue(s) it addresses (or the PR that it was addressed in if there is no corresponding issue(s)).

The following rules are used:
- Has associated issue(s):
  - For bugfixes:
    > Fixes [#12]([https://github.com/cypress-io/cypress/issues/12](https://github.com/cypress-io/cypress/issues/1234))
  - For other issues: 
     >"Addresses [#12]([https://github.com/cypress-io/cypress/issues/12](https://github.com/cypress-io/cypress/issues/1234))"
  - When multiple issues:
    > "Fixes [#12]([https://github.com/cypress-io/cypress/issues/12](https://github.com/cypress-io/cypress/issues/1234)), [#13]([https://github.com/cypress-io/cypress/issues/13](https://github.com/cypress-io/cypress/issues/1234)) and [#14]([https://github.com/cypress-io/cypress/issues/14](https://github.com/cypress-io/cypress/issues/1234))."
- When no issues, the PR is used
  > "Addressed in [#12]([https://github.com/cypress-io/cypress/issues/12](https://github.com/cypress-io/cypress/issues/1234))"
