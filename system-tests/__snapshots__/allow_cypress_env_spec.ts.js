exports['allowCypressEnv removal / warns when allowCypressEnv is set in config'] = `
Warning: The allowCypressEnv configuration option was removed in Cypress 16.0.0.

Cypress.env() has been removed. Replace Cypress.env() calls with cy.env() (for sensitive values) or Cypress.expose() (for public configuration).

You can safely remove allowCypressEnv from your configuration.

Learn more: https://on.cypress.io/cypress-env-migration

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    X.X.X                                                                              │
  │ Browser:    Electron X                                                                         │
  │ Node Version: vX.X.X                                                                           │
  │ Specs:      1 found (allow-cypress-env.cy.ts)                                                 │
  │ Searched:   cypress/e2e/allow-cypress-env.cy.ts                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  allow-cypress-env.cy.ts                                                         (1 of 1)


  Cypress.env removal
    ✓ does not expose Cypress.env


  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     allow-cypress-env.cy.ts                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  allow-cypress-env.cy.ts                   Xms        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        Xms        1        1        -        -        -  

`

exports['allowCypressEnv removal / does not expose Cypress.env in the browser'] = `
====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    X.X.X                                                                              │
  │ Browser:    Electron X                                                                         │
  │ Node Version: vX.X.X                                                                           │
  │ Specs:      1 found (allow-cypress-env.cy.ts)                                                 │
  │ Searched:   cypress/e2e/allow-cypress-env.cy.ts                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  allow-cypress-env.cy.ts                                                         (1 of 1)


  Cypress.env removal
    ✓ does not expose Cypress.env


  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     allow-cypress-env.cy.ts                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  allow-cypress-env.cy.ts                   Xms        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        Xms        1        1        -        -        -  

`
