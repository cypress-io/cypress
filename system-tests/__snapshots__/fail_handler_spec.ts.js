exports['e2e fail handlers / passes or fails each test according to its fail handler'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (fail_handler.cy.ts)                                                       │
  │ Searched:   cypress/e2e/fail_handler.cy.ts                                                     │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  fail_handler.cy.ts                                                              (1 of 1)


  fail handlers
    ✓ passes when a cy.on handler returns without throwing
    ✓ skips the commands after a failure a handler swallowed
    1) fails when a cy.on handler rethrows the error
    2) fails when a test with a done callback never calls it
    with a Cypress.on handler
      ✓ passes when the handler returns without throwing


  3 passing
  2 failing

  1) fail handlers
       fails when a cy.on handler rethrows the error:
     AssertionError: Timed out retrying after 100ms: Expected to find element: \`#does-not-exist\`, but never found it.
      [stack trace lines]

  2) fail handlers
       fails when a test with a done callback never calls it:
     CypressError: Timed out after \`100ms\`. The \`done()\` callback was never invoked!
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        5                                                                                │
  │ Passing:      3                                                                                │
  │ Failing:      2                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     fail_handler.cy.ts                                                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  fail_handler.cy.ts                       XX:XX        5        3        2        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        5        3        2        -        -  


`
