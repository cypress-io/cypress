<p align="center">
  <a href="https://www.cypress.io">
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
  <a href="https://www.npmjs.com/package/cypress"><img src="https://img.shields.io/npm/v/cypress?style=for-the-badge&labelColor=1B1E2E&logo=npm&label=npm&color=CB3837" alt="npm version"/></a>
  <a href="https://www.npmjs.com/package/cypress"><img src="https://img.shields.io/npm/dm/cypress?style=for-the-badge&labelColor=1B1E2E&logo=npm&color=CB3837" alt="npm downloads"/></a>
  <a href="https://github.com/cypress-io/cypress"><img src="https://img.shields.io/github/stars/cypress-io/cypress?style=for-the-badge&labelColor=1B1E2E&logo=github&color=181717" alt="GitHub stars"/></a>
  <br />
  <a href="https://skills.sh/cypress-io/ai-toolkit"><img src="https://skills.sh/b/cypress-io/ai-toolkit?style=for-the-badge" alt="skills.sh"/></a>
  <a href="https://deepwiki.com/cypress-io/cypress"><img src="https://img.shields.io/badge/Ask-DeepWiki-3B82F6?style=for-the-badge&labelColor=1B1E2E" alt="Ask DeepWiki"/></a>
  <br />
  <a href="https://on.cypress.io/discord"><img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fdiscord.com%2Fapi%2Fv10%2Finvites%2Fcypress%3Fwith_counts%3Dtrue&query=%24.approximate_member_count&label=Discord&suffix=%20members&color=5865F2&style=for-the-badge&labelColor=1B1E2E&logo=discord&logoColor=white" alt="Discord members"/></a>
  <a href="https://x.com/Cypress_io"><img src="https://img.shields.io/badge/X-%40Cypress__io-000000?style=for-the-badge&labelColor=1B1E2E&logo=x&logoColor=white" alt="Cypress on X"/></a>
  <a href="https://youtube.com/@cypressio"><img src="https://img.shields.io/badge/YouTube-%40cypressio-FF0000?style=for-the-badge&labelColor=1B1E2E&logo=youtube&logoColor=white" alt="Cypress on YouTube"/></a>
</p>

## What is Cypress?

Cypress is a quality platform for teams shipping modern web applications. It tests anything that runs in a browser, on your machine and in CI.

- **End-to-end and component testing** in a real browser, re-running your tests every time you save.
- **Time-travel debugging** that snapshots each step of a test, so you can go back and see exactly what happened.
- **[Test Replay](https://docs.cypress.io/cloud/features/test-replay)** in Cypress Cloud, to replay a failed CI run and inspect the DOM, network requests, and console logs as they happened.
- **[Cypress Accessibility](https://docs.cypress.io/accessibility/get-started/introduction)** and **[UI Coverage](https://docs.cypress.io/ui-coverage/get-started/introduction)**, to catch accessibility barriers and see which parts of your app your tests never reach.

<p align="center">
  <a href="https://player.vimeo.com/video/237527670">
    <img alt="Watch the “Why Cypress” video" src="https://user-images.githubusercontent.com/1271364/31739717-dbdff0ee-b41c-11e7-9b16-bfa1b6ac1814.png" width="75%" height="75%" />
  </a>
</p>

## Installing

Install Cypress for Mac, Linux, or Windows with your package manager of choice, then [get started](https://on.cypress.io/install).

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

**Coding with an AI agent?** Leave Cypress open and let the agent drive it from another terminal with [`cypress tap`](https://docs.cypress.io/app/tooling/cypress-tap). It can run a spec, check its status, and read the failing test's Command Log, error, and DOM, so it can fix its own failures as it codes.

### Add Cypress to your coding agent

Give your coding agent the [official Cypress skills](https://skills.sh/cypress-io/ai-toolkit) so it writes, runs, and debugs tests the Cypress way.

```bash
npx skills add cypress-io/ai-toolkit
```

Then connect it to Cypress Cloud with [Cloud MCP](https://docs.cypress.io/cloud/integrations/cloud-mcp), so it can check run status, find flaky tests, and pull failure details, including Test Replay links.

## Community plugins

Extend Cypress with plugins built by the community and the Cypress team, covering everything from visual testing and accessibility to authentication and reporting. Browse the full list in the [plugins directory](https://docs.cypress.io/app/plugins/plugins-list).

## Community & resources

- **[Discord](https://on.cypress.io/discord)**: chat with other Cypress users.
- **[GitHub Discussions](https://github.com/cypress-io/cypress/discussions)**: ask questions and share ideas.
- **[GitHub Issues](https://github.com/cypress-io/cypress/issues)**: report bugs and request features.
- **[Documentation](https://on.cypress.io)**: guides, API reference, and examples.
- **[Changelog](https://on.cypress.io/changelog)**: see what's new in each release.
- **[Roadmap](https://www.cypress.io/roadmap)**: see what we're working on next.

## Contributing

[![cypress](https://img.shields.io/endpoint?url=https://cloud.cypress.io/badge/simple/ypt4pf/develop&style=for-the-badge&labelColor=1B1E2E&logo=cypress)](https://cloud.cypress.io/projects/ypt4pf/runs)
[![CircleCI](https://img.shields.io/circleci/build/github/cypress-io/cypress/develop?style=for-the-badge&labelColor=1B1E2E&logo=circleci)](https://circleci.com/gh/cypress-io/cypress/tree/develop)

Please see our [Contributing Guideline](./CONTRIBUTING.md) which explains repo organization, linting, testing, and other steps.

## License

[![MIT license](https://img.shields.io/badge/license-MIT-00814D?style=for-the-badge&labelColor=1B1E2E)](./LICENSE)

This project is licensed under the terms of the [MIT license](./LICENSE).

## Badges

Configure a badge for your project's README to show your test status in the [Cypress Cloud](https://www.cypress.io/cloud).

[![cypress](https://img.shields.io/endpoint?url=https://cloud.cypress.io/badge/simple/ypt4pf/develop&style=for-the-badge&labelColor=1B1E2E&logo=cypress)](https://cloud.cypress.io/projects/ypt4pf/runs)

Or let the world know your project is using Cypress with the badge below.

[![Cypress.io](https://img.shields.io/badge/tested%20with-Cypress-00814D?style=for-the-badge&labelColor=1B1E2E&logo=cypress)](https://www.cypress.io/)

```
[![Cypress.io](https://img.shields.io/badge/tested%20with-Cypress-00814D?style=for-the-badge&labelColor=1B1E2E&logo=cypress)](https://www.cypress.io/)
```
