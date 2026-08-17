exports['retries / supports retries'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (fail-twice.cy.js)                                                         │
  │ Searched:   cypress/e2e/fail-twice.cy.js                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  fail-twice.cy.js                                                                (1 of 1)


  (Attempt 1 of 3) fail twice
  (Attempt 2 of 3) fail twice
  ✓ fail twice

  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Flaky:        1                                                                                │
  │ Screenshots:  2                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     fail-twice.cy.js                                                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/fail-twice.cy.js/fail twice (failed).png            (1280x720)
  -  /XXX/XXX/XXX/cypress/screenshots/fail-twice.cy.js/fail twice (failed) (attempt 2     (1280x720)
     ).png                                                                                          


====================================================================================================

  (Run Finished)


       Spec                                       Tests  Passing  Failing  Pending  Skipped  Flaky  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  fail-twice.cy.js                  XX:XX        1        1        -        -        -      1 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                 XX:XX        1        1        -        -        -      1  


`

exports['retries / supports retries (chrome)'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (fail-twice.cy.js)                                                         │
  │ Searched:   cypress/e2e/fail-twice.cy.js                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  fail-twice.cy.js                                                                (1 of 1)


  (Attempt 1 of 3) fail twice
  (Attempt 2 of 3) fail twice
  ✓ fail twice

  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Flaky:        1                                                                                │
  │ Screenshots:  2                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     fail-twice.cy.js                                                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/fail-twice.cy.js/fail twice (failed).png            (1280x633)
  -  /XXX/XXX/XXX/cypress/screenshots/fail-twice.cy.js/fail twice (failed) (attempt 2     (1280x633)
     ).png                                                                                          


====================================================================================================

  (Run Finished)


       Spec                                       Tests  Passing  Failing  Pending  Skipped  Flaky  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  fail-twice.cy.js                  XX:XX        1        1        -        -        -      1 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                 XX:XX        1        1        -        -        -      1  


`

exports['retries / logs one attempt when both beforeEach and afterEach fail'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (fail-in-both-hooks.cy.js)                                                 │
  │ Searched:   cypress/e2e/fail-in-both-hooks.cy.js                                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  fail-in-both-hooks.cy.js                                                        (1 of 1)


  (Attempt 1 of 3) fails in both hooks
  ✓ fails in both hooks

  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Flaky:        1                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     fail-in-both-hooks.cy.js                                                         │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                       Tests  Passing  Failing  Pending  Skipped  Flaky  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  fail-in-both-hooks.cy.js          XX:XX        1        1        -        -        -      1 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                 XX:XX        1        1        -        -        -      1  


`
