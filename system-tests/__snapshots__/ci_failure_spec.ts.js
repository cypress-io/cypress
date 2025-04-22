exports['CI failure fails and displays the message that points users to the cloud 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (simple_failing.cy.js)                                                     │
  │ Searched:   cypress/e2e/simple_failing.cy.js                                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  simple_failing.cy.js                                                            (1 of 1)


  simple failing spec
    1) fails1
    2) fails2


  0 passing
  2 failing

  1) simple failing spec
       fails1:
     AssertionError: Timed out retrying after 100ms: expected true to be false
      [stack trace lines]

  2) simple failing spec
       fails2:
     Error: fails2
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      2                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     simple_failing.cy.js                                                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  simple_failing.cy.js                     XX:XX        2        -        2        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        2        -        2        -        -  

----------------------------------------------------------------------------------------------------

  Debug faster with full visibility.

  Record to Cypress Cloud and get instant access to full test details and replays.
  Inspect the DOM, network events, and console logs exactly as they ran in CI.

  >> https://on.cypress.io/cloud-get-started

----------------------------------------------------------------------------------------------------

`
