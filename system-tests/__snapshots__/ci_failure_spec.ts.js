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
  │ Screenshots:  2                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     simple_failing.cy.js                                                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/simple_failing.cy.js/simple failing spec -- fai   (1280x720)
     ls1 (failed).png                                                                               
  -  /XXX/XXX/XXX/cypress/screenshots/simple_failing.cy.js/simple failing spec -- fai   (1280x720)
     ls2 (failed).png                                                                               


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  simple_failing.cy.js                     XX:XX        2        -        2        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        2        -        2        -        -  

----------------------------------------------------------------------------------------------------

  Having trouble debugging your CI failures?

  Record your runs to Cypress Cloud to watch video recordings for each test,
  debug failing and flaky tests, and integrate with your favorite tools.

  >> https://on.cypress.io/cloud-get-started

----------------------------------------------------------------------------------------------------

`
