# Continuous Integration

This guide provides an overview of the CI/CD pipelines used in the Cypress repository.

## CircleCI

CircleCI is our primary CI system, handling testing, building, and release workflows.

### Workflows

#### Pull Request Workflow

Runs on PRs targeting `develop` or `release/*` branches (excluding draft PRs).

| Stage | What It Does |
|-------|--------------|
| Build | Installs dependencies, builds packages, generates V8 snapshots |
| Lint & Type Check | ESLint, TypeScript compilation, type linting |
| Unit Tests | Runs unit tests across packages |
| Integration Tests | Driver tests (Chrome, Firefox, Electron, WebKit), server tests, component tests |
| System Tests | End-to-end system tests across browsers |
| NPM Package Tests | Validates framework integrations (React, Vue, Angular, etc.) |

**Note:** External contributor PRs require manual approval before running tests that use secrets.

**Binary jobs do not run on pull requests.** Building and verifying the Electron
binary is the most expensive part of the pipeline, so it runs post-merge on
`develop` instead. There is no opt-in and no path-based override: a PR that
changes binary or packaging code is not covered until it merges, and breakage is
caught by the develop build. See `notify-binary-failure` below.

#### Full Workflow

Runs on pushes to `develop` and `release/*` branches. Includes everything from the PR workflow plus:

| Stage | What It Does |
|-------|--------------|
| Linux x64 Build | Full build, packaging, and binary verification for Linux x64 |
| Binary Creation | Triggers the `cypress-publish-binary` pipeline to build the Linux x64 Electron binaries |
| Binary Verification | Tests the built Linux binary against kitchensink, recipes, and real-world apps |
| Binary Failure Alerts | Comments on the commit, tagging its author, when a binary job fails |
| Release Preparation | Validates release readiness, prepares npm packages |

Linux ARM64, macOS Intel, macOS Apple Silicon, and Windows do not build on every `develop` or `release/*` push — see "Multi-Platform Builds" below.

#### Multi-Platform Builds

Linux ARM64, macOS Intel, macOS Apple Silicon, and Windows build from a CircleCI Scheduled Pipeline instead of every push — one schedule for `develop`, a second retargeted at whichever `release/*` branch is currently active. See the "Scheduled platform CI" section of [`.circleci/AGENTS.md`](../.circleci/AGENTS.md) for the schedule ids and parameters. A manual Trigger Pipeline run can also produce all four on demand, for any branch, via `run-platform-workflows=true` or `force-persist-artifacts=true`.

### Triggers

| Trigger | Workflow | Notes |
|---------|----------|-------|
| PR opened/updated | Pull Request | Skipped for draft PRs |
| Push to `develop` | Full | Linux x64 test suite + binary build; other platforms run from the develop schedule |
| Push to `release/*` | Full | Same as develop; other platforms run from the release schedule |
| Manual (CircleCI UI) | Configurable | Can run full workflow, or all four scheduled platforms, on any branch |

### Key Jobs

- **`build`** - Core build job that all test jobs depend on
- **`ready-to-release`** - Gate job that ensures all tests pass before release
- **`npm-release`** - Publishes packages to npm (develop/release branches only)
- **`create-and-trigger-packaging-artifacts`** - Initiates binary build process
- **`notify-binary-failure`** - Comments on the commit when a binary job fails on
  `develop`, tagging its author. It requires every binary job at `terminal`, so it
  runs once they have all settled however they settled, then reads their real
  statuses from the CircleCI API and exits quietly unless one of them is `failed` -
  a cancelled or skipped job is not a breakage. Scope comes from the job's own
  dependency list, so adding a binary job to its `requires:` block is all that is
  needed to cover it.

  `develop` is squash-merged, so the commit author is the author of the PR that
  produced it, and the `@` tag notifies them whatever their GitHub notification
  settings are. A commit whose author GitHub cannot resolve still gets a comment,
  just without the tag.

  It needs `CIRCLE_TOKEN` (from the `publish-binary` context) and `GH_TOKEN` (from
  `test-runner:npm-release`, the same pairing `verify-release-readiness` uses).

## GitHub Actions

GitHub Actions handle automation, security scanning, and repository maintenance.

### Automation

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **Update Browser Versions** | Daily at 8am UTC | Checks for new Chrome stable/beta versions and creates PRs to update CI config |
| **Update V8 Snapshot Cache** | Daily + release branch pushes | Regenerates V8 snapshots to maintain startup performance |

### Security

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **Snyk SCA Scan** | PRs to develop/release | Scans dependencies for known vulnerabilities |
| **Snyk Static Analysis** | PRs to develop/release | Performs code security analysis |

### PR Validation

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **Semantic Pull Request** | PR opened/edited | Validates PR title follows conventional commit format and has changelog entry |

### Repository Maintenance

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **Stale Issues/PRs** | Daily at 1:30am UTC | Marks inactive issues/PRs as stale after 180 days, closes after 14 more days |
| **Triage Workflows** | Issue/PR opened | Adds external contributor items to the triage project board |

### Compliance

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **Upload Release Asset** | Release published | Generates Software Bill of Materials (SBOM) and attaches to GitHub release |

## Configuration Files

- **CircleCI**: `.circleci/config.yml` (entry point), `.circleci/src/` (source configs)
- **GitHub Actions**: `.github/workflows/`

For information about modifying the CircleCI configuration, see [`.circleci/README.md`](../.circleci/README.md).

