exports['e2e specs failing when no specs found and default specPattern 1'] = `
Can't run because no spec files were found.

We searched for specs matching this glob pattern:

  > /foo/bar/.projects/no-specs/cypress/e2e/**/*.cy.{js,jsx,ts,tsx}

`

exports['e2e specs failing when no specs found and custom specPattern 1'] = `
Can't run because no spec files were found.

We searched for specs matching this glob pattern:

  > /foo/bar/.projects/no-specs-custom-pattern/src/**/*.{cy,spec}.{js,jsx}

`

exports['e2e specs failing when no specs found and spec pattern provided from CLI 1'] = `
Can't run because no spec files were found.

We searched for specs matching this glob pattern:

  > /foo/bar/.projects/no-specs/cypress/e2e/does/not/exist/**notfound**

`

exports['e2e specs failing when no specs found with custom spec pattern and spec pattern provided from CLI 1'] = `
Can't run because no spec files were found.

We searched for specs matching this glob pattern:

  > /foo/bar/.projects/no-specs-custom-pattern/cypress/e2e/does/not/exist/**notfound**

`

exports['e2e specs handles glob characters in the working directory and spec pattern provided from CLI 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (app.cy.js)                                                                │
  │ Searched:   cypress/e2e/**/*.cy.js                                                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  app.cy.js                                                                       (1 of 1)


  ✓ is true

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
  │ Spec Ran:     app.cy.js                                                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  app.cy.js                                XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


`
