exports['allowCypressEnv / throws an error when trying to use Cypress.env() with allowCypressEnv=false'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (allow-cypress-env.cy.ts)                                                  │
  │ Searched:   cypress/e2e/**/*.cy.{js,jsx,ts,tsx}                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  allow-cypress-env.cy.ts                                                         (1 of 1)


  allowCypressEnv
    1) invokes Cypress.env()


  0 passing
  1 failing

  1) allowCypressEnv
       invokes Cypress.env():
     CypressError: \`Cypress.env()\` does not work when \`allowCypressEnv\` is set to \`false\`. Please migrate to \`cy.env()\` or leverage other stateful methods to manage variables. The variable being accessed was: \`CY_ENV_FOO\`

https://on.cypress.io/cypress-env-migration
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     allow-cypress-env.cy.ts                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/allow-cypress-env.cy.ts/allowCypressEnv -- invo     (1280x720)
     kes Cypress.env() (failed).png                                                                 


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  allow-cypress-env.cy.ts                  XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1        -        1        -        -  


`

exports['allowCypressEnv / correctly prints a warning when trying to use Cypress.env() with allowCypressEnv=true'] = `
The use of Cypress.env() is deprecated and will be removed in a future major version of Cypress.

Cypress recommends migrating to the cy.env() command and disabling allowCypressEnv within your Cypress configuration.

The use of Cypress.env() will warn and throw an error when allowCypressEnv is explicitly set to false.

Read our Migration Guide for the allowCypressEnv configuration option, why Cypress.env() is deprecated, and how to migrate to cy.env(): https://on.cypress.io/cypress-env-migration.


====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (allow-cypress-env.cy.ts)                                                  │
  │ Searched:   cypress/e2e/**/*.cy.{js,jsx,ts,tsx}                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  allow-cypress-env.cy.ts                                                         (1 of 1)


  allowCypressEnv
    ✓ invokes Cypress.env()


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
  │ ✔  allow-cypress-env.cy.ts                  XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


`
