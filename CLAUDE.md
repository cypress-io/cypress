# CLAUDE.md

## Workflow Orchestration

### 1. Plan Mode Default

- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy

- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop

- After ANY correction from the user: update the closest relevant `CLAUDE.md` file
- Write rules for yourself that prevent the same mistake

### 4. Verification Before Done

- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run relevant tests only, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)

- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes - don't over-engineer
- Challenge your own work before presenting it

## Core Principles

- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.

## Working Constraints

- Worktrees must use a full `yarn` install in the worktree. Do not symlink `node_modules` or packages back to another checkout.
- Never run `git config user.name` or `git config user.email` in this repo or any of its worktrees. A linked worktree shares the main checkout's `.git/config`, so an identity set there for throwaway test commits authors every real commit too, and the CLA check rejects them. For a scratch commit, pass the identity to that one command (`git -c user.name=… -c user.email=… commit`), or set it inside a separate repo created with `git init`. Before pushing, check that `git log --format='%an <%ae>' origin/develop..HEAD` shows only the expected author.
- Packaged-binary integration tests (`system-tests/test-binary`) need Docker and a built binary, so they do not run in the sandbox. When they are needed, provide the exact commands and ask the user to run them.
- System tests under `system-tests/test` do run in cloud containers once the monorepo is built. Run them yourself rather than handing them off; see [Running system tests](./AGENTS.md#running-system-tests).
- Keep follow-up work from the same task, such as review fixes and related instruction updates, on that task's branch. Create a separate branch only when the user asks for one.
- After committing a merge of `develop`, run `git diff --name-only origin/develop` and check that every file listed is in the PR's scope. The pre-commit hook runs `eslint --fix` on every staged file, merged-in ones included, and `package-json/order-properties` reorders keys in `package.json` files that `develop` committed unsorted. Restore any such file with `git checkout origin/develop -- <file>` and commit with `--no-verify`.
- When a change could reasonably be filed as `fix` or `chore` (for example, removing data the app sends to Cypress Cloud), ask the user which prefix to use before adding a `cli/CHANGELOG.md` entry. A `chore` gets no entry.
- When an investigation runs a published Cypress release rather than this checkout, check `npm view cypress dist-tags` and install the `latest` tag or the version the user names. Don't pin a major from memory: `latest-v15` maintenance releases can be newer by date than the current major.
- Give test fixtures realistic made-up data, such as a full name, an `@example.com` email and a token-shaped value, not placeholders like `'foo'`.
- When a test feeds in output from a browser, tool or service (a stack trace, a CLI message, an API response), take its examples from real captured output, such as a fixture under `__fixtures__`, not names made up to look plausible. Keep inputs that only follow the format's rules in their own clearly labelled cases, and check that changelog examples come from the same real output.
- Keep a `cli/CHANGELOG.md` entry to the user-facing change and the link, plus one before-and-after example only when it shows something the description doesn't. Cut any sentence that restates the change in other words, including a "For example" that only applies the description to one sample path or name.
- Before committing or pushing, `yarn check-ts`, `yarn lint`, `yarn health-check` (knip), and relevant unit tests must pass locally. CI currently does not block expensive e2e jobs when these fail.
- When every changed file is Markdown (`*.md`, `*.mdx`), something under `assets/` or `guides/`, or `LICENSE`, skip the checks above and the install and build they need: none of them read those files. Run `yarn check-markdown-links` instead. It needs the root `yarn` install but no build, and it runs `markdown-link-check` over every Markdown file in the repo, failing on any link to a repo path that doesn't exist, including one the change deletes. URLs and `#` anchors aren't checked. Markdown under a `src/`, `test/`, `fixtures/` or `templates/` directory is code input, so it gets the full set. CI's `docs-only` parameter in `.circleci/scripts/generate-pipeline-parameters.sh` uses the same rule, and the two must stay in sync.

@AGENTS.md
