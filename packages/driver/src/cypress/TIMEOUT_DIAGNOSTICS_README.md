<!-- NOTE: This file documents a work-in-progress experimental feature. It is NOT integrated into the main Cypress error pipeline yet. -->
# Timeout Diagnostics — Smart Timeout Error Messages (WIP)

Status: Work‑in‑progress (not yet integrated into Cypress). This document describes an experimental timeout diagnostics system that analyzes command context (selectors, network, animations, DOM mutations) and produces contextual recommendations to help users address flaky or timing-related failures.

## Objective

Improve the developer experience for timeout errors by producing actionable, context-aware suggestions when a command times out. Instead of a generic message like `cy.get() timed out waiting 4000ms`, diagnostics should indicate likely causes (dynamic content, pending network requests, animations, etc.) and suggest concrete fixes.

## Motivation

Timeout errors are a frequent source of confusion in end-to-end tests. The goal of this feature is to reduce debugging time and teach best practices inline by providing targeted suggestions and examples.

## Example Enhanced Output

```
cy.get('.user-list') timed out waiting 4000ms

Diagnostic suggestions:

1) Selector likely targets dynamic content
   • Wait for the loading state: cy.get('.loading-spinner').should('not.exist')
   • Prefer stable data attributes: e.g. [data-cy="user-list"]
   • Consider intercepting the API call that populates this content

2) Network requests pending (8)
   • Use cy.intercept('GET', '/api/users').as('getUsers') and cy.wait('@getUsers')
   • If requests are expected to be slow, either wait for the specific request or increase the timeout

Learn more: https://on.cypress.io/intercept
```

## Features

- Problematic selector detection (loading spinners, skeletons, dynamic IDs)
- Network analysis (pending requests, slow/long-running requests)
- Animation detection and guidance to reduce timing flakiness
- Detection of excessive DOM mutations and recommendations to wait for stability
- Command-specific suggestions (get, click, type, etc.) and doc links

## Project Structure (Implementation Sketch)

```
packages/driver/src/cypress/
  timeout_diagnostics.ts        — core analysis + formatting (WIP)

packages/driver/test/unit/cypress/
  timeout_diagnostics.spec.ts   — unit tests
```

## API Sketch

```ts
// analyze context and produce suggestions
const suggestions = TimeoutDiagnostics.analyze({
  command: 'get',
  selector: '.loading-spinner',
  timeout: 4000,
  networkRequests: 5,
  animationsRunning: true,
})

const formatted = TimeoutDiagnostics.formatSuggestions(suggestions)

// enhance base timeout message with suggestions
const enhanced = TimeoutDiagnostics.enhanceTimeoutError('cy.get() timed out', context)
```

## Integration Notes

To integrate this into Cypress's existing error pipeline we would:

1. Extend `error_utils` (or the error creation path) to provide additional context (selector, pending network count, DOM mutation rate, animation state) when creating a timeout error.
2. Call `TimeoutDiagnostics.analyze(context)` and append the returned suggestions to the error message (optionally behind a feature flag).
3. Add a configuration option to opt in/out of diagnostics in CI or local environments.

Integration example (pseudo):
```ts
import TimeoutDiagnostics from './timeout_diagnostics'

function createTimeoutError(cmd, ms) {
  const context = {
    command: cmd.get('name'),
    selector: cmd.get('selector'),
    timeout: ms,
    networkRequests: getNetworkMonitor().pendingCount(),
    animationsRunning: hasRunningAnimations(),
    domMutations: getDOMMutationCount(),
  }

  const baseMessage = `cy.${cmd.get('name')}() timed out waiting ${ms}ms`
  return TimeoutDiagnostics.enhanceTimeoutError(baseMessage, context)
}
```

## Tests

Run unit tests for the diagnostics module:

```powershell
cd packages/driver
yarn test timeout_diagnostics.spec.ts
```

## Notes & Next Steps

- This README documents the experimental design and examples. The feature is intentionally left out of the main error flow until heuristics and runtime metric collection are reviewed.
- Next: finalize analysis heuristics, expand unit tests, and implement an opt-in integration path in `error_utils`.

## License

MIT — consistent with the Cypress project
