exports['e2e async timeouts / failing1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (async_timeouts.cy.js)                                                     │
  │ Searched:   cypress/e2e/async_timeouts.cy.js                                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  async_timeouts.cy.js                                                            (1 of 1)


  async
    1) bar fails
    2) fails async after cypress command


  0 passing
  2 failing

  1) async
       bar fails:
     CypressError: Timed out after \`100ms\`. The \`done()\` callback was never invoked!
      [stack trace lines]

  2) async
       fails async after cypress command:
     CypressError: Timed out after \`100ms\`. The \`done()\` callback was never invoked!
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
  │ Spec Ran:     async_timeouts.cy.js                                                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/async_timeouts.cy.js/async -- bar fails (failed     (1280x720)
     ).png                                                                                          
  -  /XXX/XXX/XXX/cypress/screenshots/async_timeouts.cy.js/async -- fails async after     (1280x720)
      cypress command (failed).png                                                                  


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  async_timeouts.cy.js                     XX:XX        2        -        2        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        2        -        2        -        -  


`
