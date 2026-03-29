---
name: commit-message
description: Generate a commit message for current changes
metadata:
  version: 2.0.0
---

## Purpose

Generate a commit message for the staged changes. Follow these requirements:

## Output Format

**Format:**
```
[header]
[BLANK LINE]
[body]
[BLANK LINE]
[footer]
```

**Header:** `[type]([scope]): [short summary]`

- Max 60 characters
- Summary: imperative mood, not capitalized
- Scope is optional

**Types:**

| Type         | When to use                                                       |
| ------------ | ----------------------------------------------------------------- |
| `feat`       | A new feature                                                     |
| `fix`        | A bug fix                                                         |
| `perf`       | A code change that improves performance                           |
| `refactor`   | A code change that neither fixes a bug nor adds a feature         |
| `docs`       | Documentation only changes                                        |
| `test`       | Adding missing tests or correcting existing tests                 |
| `build`      | Changes to the build system or external dependencies              |
| `ci`         | Changes to CI configuration files and scripts                     |

**Body:**

- Required for all commit types except `docs`
- Must be at least 20 characters
- Imperative, present tense: "fix" not "fixed" nor "fixes"
- Explain WHAT changed, not HOW
- Include a comparison of previous vs. new behavior where helpful

**Footer:**

Optional. Used for breaking changes, deprecations, and issue/PR references.

Breaking change:
```
BREAKING CHANGE: [brief summary]
[BLANK LINE]
[detailed description + migration instructions]
[BLANK LINE]
[BLANK LINE]
Fixes #[issue number]
```

Deprecation:
```
DEPRECATED: [what is deprecated]
[BLANK LINE]
[deprecation description + recommended update path]
[BLANK LINE]
[BLANK LINE]
Closes #[pr number]
```

- `BREAKING CHANGE:` signals a backward-incompatible API change and triggers a MAJOR version bump per semver
- `DEPRECATED:` signals functionality that will be removed in a future MAJOR release
- Issue/PR references (`Fixes #123`, `Closes #456`) go after the blank lines following the breaking change or deprecation block, or stand alone in the footer if there is no breaking change

**Revert commits:**

Begin with `revert: ` followed by the header of the reverted commit. The body must include:
- The SHA being reverted: `This reverts commit <SHA>`
- A clear reason for the revert

## Execution Steps

- If no staged changes exist, check unstaged changes
- If no changes exist at all, respond with "I see no changes"
- Respond with the commit message only, no other text
- Respond with a formatted git commit command with the commit message
- Ask for confirmation before executing the commit

## Examples

**Non-breaking:**
```
git commit -m "feat(skills): add interactive mode to skills install

- Make skill name argument optional in the skills install command. When omitted, the command lists uninstalled hub skills and prompts the user for selection by number or name.
- Support selection by number or name with validation
- Add npm run cli script for running CLI via tsx
- Improve printTable to truncate columns to terminal width"
```

**Breaking change:**
```
git commit -m "feat(api): remove /v1/users endpoint

- Removes the deprecated /v1/users REST endpoint that was marked for removal in v2.0.0. Consumers should migrate to /v2/users which returns the same payload structure.

BREAKING CHANGE: /v1/users has been removed.

Update all API calls to use /v2/users instead. The response schema
is identical; only the path has changed.

Fixes #1234"
```
