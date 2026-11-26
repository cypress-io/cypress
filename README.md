<p align="center">
  <a href="https://www.cypress.io?utm_source=github&utm_medium=readme&utm_campaign=cypress-repo&utm_content=logo">
    <picture>
      <source media="(prefers-color-scheme: dark)"  srcset="./assets/cypress-logo-dark.png">
      <source media="(prefers-color-scheme: light)" srcset="./assets/cypress-logo-light.png">
      <img alt="Cypress" src="./assets/cypress-logo-light.png">
    </picture>
  </a>
</p>

<h3 align="center">
  AI writes the code. Cypress proves it works.
</h3>

<p align="center">
  Run end-to-end and component tests in a real browser and rewind any failure.<br />
  Works wherever you do: your machine, CI, or your coding agent.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/cypress"><img src="https://img.shields.io/npm/v/cypress?style=for-the-badge&labelColor=1B1E2E&logo=npm&label=npm&color=CB3837&cacheSeconds=86400" alt="npm version"/></a>
  <a href="https://www.npmjs.com/package/cypress"><img src="https://img.shields.io/npm/dm/cypress?style=for-the-badge&labelColor=1B1E2E&logo=npm&color=CB3837&cacheSeconds=86400" alt="npm downloads"/></a>
  <a href="https://github.com/cypress-io/cypress"><img src="https://img.shields.io/github/stars/cypress-io/cypress?style=for-the-badge&labelColor=1B1E2E&logo=github&color=181717&cacheSeconds=86400" alt="GitHub stars"/></a>
  <a href="https://hub.docker.com/r/cypress/browsers"><img src="https://img.shields.io/docker/pulls/cypress/browsers?style=for-the-badge&labelColor=1B1E2E&logo=docker&logoColor=white&color=2496ED&cacheSeconds=86400" alt="Docker pulls"/></a>
</p>

<p align="center">
  <a href="https://on.cypress.io/discord"><img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fdiscord.com%2Fapi%2Fv10%2Finvites%2Fcypress%3Fwith_counts%3Dtrue&query=%24.approximate_member_count&label=Discord&suffix=%20members&color=5865F2&style=for-the-badge&labelColor=1B1E2E&logo=discord&logoColor=white&cacheSeconds=86400" alt="Discord members"/></a>
  <a href="https://skills.sh/cypress-io/ai-toolkit"><img src="https://skills.sh/b/cypress-io/ai-toolkit?style=for-the-badge" alt="skills.sh"/></a>
  <a href="https://deepwiki.com/cypress-io/cypress"><img src="https://img.shields.io/badge/Ask-DeepWiki-3B82F6?style=for-the-badge&labelColor=1B1E2E" alt="Ask DeepWiki"/></a>
</p>

<p align="center">
  <img alt="A tour of Cypress: end-to-end and component tests running in the Cypress App, rewinding a failed step with time-travel debugging, driving Cypress from the terminal with cypress tap, running tests in CI, and Cypress Cloud features" src="./assets/cypress-overview.gif" width="100%" />
</p>

## What is Cypress?

Cypress is a quality platform for teams shipping modern web applications. It tests anything that runs in a browser, on your machine and in CI.

- **End-to-end and component testing** in a real browser, re-running your tests every time you save.
- **Time-travel debugging** that snapshots each step of a test, so you can go back and see exactly what happened.
- **[`cypress tap`](https://docs.cypress.io/app/tooling/cypress-tap?utm_source=github&utm_medium=readme&utm_campaign=cypress-repo&utm_content=feature-cypress-tap)** to drive Cypress with an AI agent from your terminal, so it can run specs, read failures, and fix them as it codes.
- **[Continuous runs in CI](https://docs.cypress.io/app/continuous-integration/overview?utm_source=github&utm_medium=readme&utm_campaign=cypress-repo&utm_content=feature-ci)** with GitHub Actions, GitLab, CircleCI, Jenkins, and other CI providers.
- **[Cypress Cloud](https://www.cypress.io/cloud?utm_source=github&utm_medium=readme&utm_campaign=cypress-repo&utm_content=feature-cypress-cloud)** to replay failed CI runs with Test Replay, catch accessibility barriers, and see what your tests never reach with UI Coverage. Connect it to your agent and tools with Cloud MCP, the Cloud CLI, and webhooks.

## Installing

Install Cypress for Mac, Linux, or Windows with your package manager of choice, then [get started](https://on.cypress.io/install?utm_source=github&utm_medium=readme&utm_campaign=cypress-repo&utm_content=install-get-started).

```bash
npm install cypress --save-dev   # npm
yarn add cypress --dev           # Yarn
pnpm add cypress --save-dev      # pnpm
bun add cypress --dev            # Bun
```

### Quick start

Open Cypress from your project root:

```bash
npx cypress open
```

**Coding with an AI agent?** Leave Cypress open and let the agent drive it from another terminal with [`cypress tap`](https://docs.cypress.io/app/tooling/cypress-tap?utm_source=github&utm_medium=readme&utm_campaign=cypress-repo&utm_content=quick-start-cypress-tap). It can run a spec, check its status, and read the failing test's Command Log, error, and DOM, so it can fix its own failures as it codes.

### Add Cypress to your coding agent

Give your coding agent the [official Cypress skills](https://skills.sh/cypress-io/ai-toolkit) so it writes, runs, and debugs tests the Cypress way.

```bash
npx skills add cypress-io/ai-toolkit
```

Then connect it to Cypress Cloud with [Cloud MCP](https://docs.cypress.io/cloud/integrations/cloud-mcp?utm_source=github&utm_medium=readme&utm_campaign=cypress-repo&utm_content=agent-cloud-mcp), so it can check run status, find flaky tests, and pull failure details, including Test Replay links.

## Community plugins

Extend Cypress with plugins built by the community and the Cypress team, covering everything from visual testing and accessibility to authentication and reporting. Browse the full list in the [plugins directory](https://docs.cypress.io/app/plugins/plugins-list?utm_source=github&utm_medium=readme&utm_campaign=cypress-repo&utm_content=plugins-directory).

## Community & resources

- **[Discord](https://on.cypress.io/discord)**: join thousands of developers and testers in the Cypress community.
- **[GitHub Issues](https://github.com/cypress-io/cypress/issues)**: report bugs and request features.
- **[Documentation](https://docs.cypress.io/?utm_source=github&utm_medium=readme&utm_campaign=cypress-repo&utm_content=resources-docs)**: guides, API reference, and examples.
- **[Changelog](https://on.cypress.io/changelog?utm_source=github&utm_medium=readme&utm_campaign=cypress-repo&utm_content=resources-changelog)**: see what's new in each release.
- **[Roadmap](https://www.cypress.io/roadmap?utm_source=github&utm_medium=readme&utm_campaign=cypress-repo&utm_content=resources-roadmap)**: see what we're working on next.
- **[Newsletter](https://www.cypress.io/subscribe?utm_source=github&utm_medium=readme&utm_campaign=cypress-repo&utm_content=resources-newsletter)**: get product releases, news, and articles in a monthly email.

## Contributing

[![cypress](https://img.shields.io/endpoint?url=https://cloud.cypress.io/badge/simple/ypt4pf/develop&style=for-the-badge&labelColor=1B1E2E&logo=cypress&cacheSeconds=3600)](https://cloud.cypress.io/projects/ypt4pf/runs?utm_source=github&utm_medium=readme&utm_campaign=cypress-repo&utm_content=contributing-tests-badge)
[![CircleCI](https://img.shields.io/circleci/build/github/cypress-io/cypress/develop?style=for-the-badge&labelColor=1B1E2E&logo=circleci&cacheSeconds=3600)](https://circleci.com/gh/cypress-io/cypress/tree/develop)

Please see our [Contributing Guideline](./CONTRIBUTING.md) which explains repo organization, linting, testing, and other steps.

## License

[![MIT license](https://img.shields.io/badge/license-MIT-00814D?style=for-the-badge&labelColor=1B1E2E)](./LICENSE)

This project is licensed under the terms of the [MIT license](./LICENSE).

## Badges

Configure a badge for your project's README to show your test status in the [Cypress Cloud](https://www.cypress.io/cloud?utm_source=github&utm_medium=readme&utm_campaign=cypress-repo&utm_content=badges-cypress-cloud).

[![cypress](https://img.shields.io/endpoint?url=https://cloud.cypress.io/badge/simple/ypt4pf/develop&style=for-the-badge&labelColor=1B1E2E&logo=cypress)](https://cloud.cypress.io/projects/ypt4pf/runs?utm_source=github&utm_medium=readme&utm_campaign=cypress-repo&utm_content=badges-tests-badge-example)

Or let the world know your project is using Cypress with the badge below.

[![Cypress.io](https://img.shields.io/badge/tested%20with-Cypress-00814D?style=for-the-badge&labelColor=1B1E2E&logo=cypress)](https://www.cypress.io/?utm_source=github&utm_medium=badge&utm_campaign=tested-with-cypress&utm_content=tested-with-badge)

```
[![Cypress.io](https://img.shields.io/badge/tested%20with-Cypress-00814D?style=for-the-badge&labelColor=1B1E2E&logo=cypress)](https://www.cypress.io/?utm_source=github&utm_medium=badge&utm_campaign=tested-with-cypress&utm_content=tested-with-badge)
```
