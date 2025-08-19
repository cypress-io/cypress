# Cypress App CI Refactor - Implementation Issues

### Set up CircleCI Pack Environment & Basic PR Workflow
Establish CircleCI Pack development environment, create manual PR workflow trigger, and migrate project setup commands to DLC-optimized parallel execution.

**Acceptance Criteria:**
- [ ] When changes in the workflow directory are committed, they are packed into a complete CircleCI workflow YAML file
- [ ] Engineers can trigger the packed workflow manually in CircleCI
- [ ] The workflow installs dependencies and builds the project

**Scope**: CircleCI Pack configuration, workflow directory structure, DLC optimization
**Complexity**: 2

### Linting Jobs Consolidation
Consolidate linting jobs into a single comprehensive linting job. Remove redundant `check-ts` since build step already performs TypeScript type checking during compilation.

**Acceptance Criteria:**
- [ ] Two linting jobs consolidated into one job (remove `check-ts`)
- [ ] ESLint and dtslint run sequentially in the consolidated job
- [ ] No validation coverage is lost
- [ ] Move `server-unit-tests-cloud-environment` to integration test suite
- [ ] Type checking handled by build step, not separate job

**Resulting Job**: `lint-and-validate`
**Eliminated Jobs**: `lint`, `lint-types` (removed `check-ts` as redundant)

**Scope**: `lint`, `lint-types` jobs, ESLint, dtslint
**Complexity**: 2 

### Integration Tests Consolidation
Consolidate integration test jobs into a single standardized integration test job.

**Acceptance Criteria:**
- [ ] One integration test job, which requires unit tests to complete successfully, runs all integration tests.
- [ ] Tests are split across job instances for parallel execution.  
- [ ] All integration tests for the monorepo can be run with a single `ci:test:integration` command.

**Resulting Job**: `run-integration-tests`
**Eliminated Jobs**: `server-integration-tests`, `v8-integration-tests`, `server-unit-tests-cloud-environment`

**Scope**: @packages/server, @tooling/packherd, @tooling/v8-snapshot, @tooling/electron-mksnapshot
**Complexity**: 2

### Component Tests
Consolidate component tests into a single matrix job with browser variants.

**Acceptance Criteria:**
- [ ] All component tests for the monorepo can be run with a single `ci:test:component` command.
- [ ] Component tests are matrixed over the full suite of browsers
- [ ] Tests are parallelized across job instances
- [ ] Component tests run at the same time as e2e tests, performance tests, and integration tests

**Resulting Job**: `run-component-tests`
**Eliminated Jobs**: `run-app-component-tests-chrome`, `run-launchpad-component-tests-chrome`, `run-frontend-shared-component-tests-chrome`, `run-reporter-component-tests-chrome`

**Scope**: @packages/app, @packages/launchpad, @packages/frontend-shared, @packages/reporter
**Complexity**: 2

### Cross-Package Parallelization Implementation
Implement cross-package parallelization for consolidated test jobs using Nx auto-discovery to enable splitting across packages while maintaining Cypress Cloud parallelization.

**Acceptance Criteria:**
- [ ] Install and configure Nx with minimal setup (nx.json with targetDefaults)
- [ ] Implement cross-package test distribution for unit, integration, E2E, and component tests using `nx run-many`
- [ ] Maintain Cypress Cloud parallelization for internal PRs with `--record --parallel --group`
- [ ] Use CircleCI test splitting for external PRs with `--parallel --partition`
- [ ] Achieve optimal parallelism tuning (unit: 4-6, integration: 3-4, E2E: 8-10, component: 6-8)
- [ ] Support parameter passing to test scripts (e.g., `"ci:test:e2e": "cypress run --record --parallel --browser $0 --group app-$0"`)
- [ ] Auto-discover packages with test scripts (no explicit package lists needed)

**Scope**: Nx setup, test distribution logic, CircleCI integration, Cypress Cloud integration
**Complexity**: 5

### System Tests
Consolidate system tests into a single matrix job with browser and testing type varients.

**Acceptance Criteria:**
- [ ] System tests account for a single job with browser and testing-type parameters provided as a matrix.
- [ ] System tests can run in parallel to other in-depth tests.
- [ ] Binary system tests do not run in PR CI

**Resulting Job**: `run-system-tests`, accepting a `browser` matrix parameter and `testing-type` matrix parameter (`main` | `non-root` | `webpack-dev-server`) 
**Eliminated Jobs**: `system-tests-chrome`, `system-tests-electron`, `system-tests-firefox`, `system-tests-webkit`, `npm-webpack-dev-server-e2e`

**Scope**: @tooling/system-tests, @cypress/webpack-dev-server
**Complexity**: 2

### Unit Tests
Unit tests are spread across several jobs. Some unit tests are not actually unit tests.

**Acceptance Criteria:**
- [ ] All unit tests in the repo can be run via `ci:test:unit`.
- [ ] Tests that are labeled "unit" but are more integration or e2e are not run
- [ ] A single job runs all unit tests. 

**Resulting Job**: `run-unit-tests`

**Scope**: @packages/config, data-context, errors, extension, https-proxy, launcher, network, packherd-require, scaffold-config, socket, telemetry, ts, v8-snapshot-require, icons, electron, server, example, @tooling/electron-mksnapshot, v8-snapshot, cli, @cypress/webpack-dev-server, vite-dev-server, webpack-preprocessor, webpack-batteries-included-preprocessor, puppeteer, eslint-plugin-dev, @packages/driver
**Complexity**: 2


### Performance Tests
Consolidate performance tests (`server-performance-tests`, `driver-integration-memory-tests`) into a single performance testing job.

**Acceptance Criteria:**
- [ ] Performance tests run as a single parallelized job at the same time that integration tests run.
- [ ] All performance tests for the monorepo can be run with a single `ci:test:performance` command.

**Open Questions**
- Should performance tests halt the build, or should they be more like a warning?

**Resulting Job**: `run-performance-tests`
**Eliminated Jobs**: `server-performance-tests`, `driver-integration-memory-tests`

**Scope**: @packages/server, @packages/driver
**Complexity**: 2

### E2E Tests
Consolidate E2E tests into a single matrix job with browser variants.

**Acceptance Criteria:**
- [ ] All e2e tests run from a single matrixed job.
- [ ] e2e tests are parallelized across packages.
- [ ] All e2e tests for the monorepo can be run with a single `ci:test:e2e` command.

**Resulting Job**: `run-e2e-tests` with a `browser` matrix parameter
**Eliminated Jobs**: `run-app-integration-tests-chrome`, `run-launchpad-integration-tests-chrome`, `reporter-integration-tests`, `run-webpack-dev-server-integration-tests`, `run-vite-dev-server-integration-tests`, `system-tests-non-root`, `driver-integration-tests-chrome`, `driver-integration-tests-chrome-inject-document-domain`, `driver-integration-tests-chrome-beta`, `driver-integration-tests-chrome-beta-inject-document-domain`, `driver-integration-tests-firefox`, `driver-integration-tests-firefox-cdp`, `driver-integration-tests-electron`, `driver-integration-tests-webkit`, `cli-visual-tests`

**Scope**: @packages/app, @packages/launchpad, @packages/reporter, @cypress/webpack-dev-server, @cypress/vite-dev-server, @tooling/system-tests, @packages/driver, cli-visual-tests
**Complexity**: 3

### Enable PR Workflow with Parallel Validation
Implement path-filtering orb to automatically trigger PR workflow for app changes, running it in parallel with main workflow for validation, and ensure GitHub integration for PR pass/fail status.

**Acceptance Criteria:**
- [ ] Path-filtering orb configured to trigger PR workflow on app changes
- [ ] PR workflow runs in parallel with main workflow for validation
- [ ] GitHub receives proper pass/fail status from PR workflow
- [ ] Performance and quality gates validated before switching over

**Scope**: CircleCI path-filtering orb, GitHub integration, workflow validation
**Complexity**: 2

### Finalization Jobs Integration
Integrate finalization jobs (`percy-finalize`, `verify-accessibility-results`, `ready-to-release`) into the consolidated workflow, ensuring they run after all tests complete.

**Acceptance Criteria:**
- [ ] `percy-finalize` job integrated into consolidated workflow
- [ ] `verify-accessibility-results` job integrated into consolidated workflow
- [ ] `ready-to-release` job integrated into consolidated workflow
- [ ] All finalization jobs run after all tests complete
- [ ] Proper dependency management configured
- [ ] Percy builds properly finalized
- [ ] Accessibility scores verified
- [ ] Release readiness confirmed

**Resulting Job**: `finalize`
**Eliminated Jobs**: `percy-finalize`, `verify-accessibility-results`, `ready-to-release`

**Scope**: percy-finalize, verify-accessibility-results, ready-to-release, dependency management
**Complexity**: 2

### Switch PR Triggering and Remove from Main Workflow
Turn on automatic PR workflow triggering and remove PR trigger from main workflow.

**Acceptance Criteria:**
- [ ] Automatic PR workflow triggering enabled
- [ ] PR trigger removed from main workflow
- [ ] PRs now use fast workflow
- [ ] Main workflow becomes develop-only

**Scope**: CircleCI workflow configuration, PR trigger management
**Complexity**: 1

---

## Complexity Scale

**1 - Trivial**: Minimal thinking required (update README, add env var, fix typo)
**2 - Simple**: Straightforward, clear path forward (add unit tests, create utility function)
**3 - Moderate**: Some design decisions, well-defined scope (refactor component, add feature)
**5 - Complex**: Multiple moving parts, significant design decisions, coordination needed (rewrite component, framework migration)
**8 - Very Complex**: System-wide impact, multiple unknowns, high coordination complexity (complete rewrite, monolith to microservices)

---

*Note: These issues focus on infrastructure modernization and developer experience improvements rather than end-user features. Each issue should have clear acceptance criteria and measurable benefits for the engineering team.* 