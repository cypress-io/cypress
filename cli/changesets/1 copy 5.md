---
type: fix
---

Correctly sync `Cypress.currentRetry` with secondary origin so test retries that leverage `cy.origin()` render logs as expected.
