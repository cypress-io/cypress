exports['before all and after all throw / events still fire after before all and after all throw'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (test.cy.js)                                                               │
  │ Searched:   cypress/e2e/test.cy.js                                                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  test.cy.js                                                                      (1 of 1)


  before all and after all throw
    1) "before all" hook for "test 1"
    2) "after all" hook for "test 1"


  0 passing
  2 failing

  1) before all and after all throw
       "before all" hook for "test 1":
     Error: before all

Because this error occurred during a \`before all\` hook we are skipping the remaining tests in the current suite: \`before all and after all throw\`
      [stack trace lines]

  2) before all and after all throw
       "after all" hook for "test 1":
     Error: after all

Because this error occurred during a \`after all\` hook we are skipping the remaining tests in the current suite: \`before all and after all throw\`
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      1                                                                                │
  │ Screenshots:  2                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     test.cy.js                                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/test.cy.js/before all and after all throw -- te     (1280x720)
     st 1 -- before all hook (failed).png                                                           
  -  /XXX/XXX/XXX/cypress/screenshots/test.cy.js/before all and after all throw -- te     (1280x720)
     st 1 -- after all hook (failed).png                                                            


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  test.cy.js                               XX:XX        2        -        1        -        1 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        2        -        1        -        1  


`
