exports['e2e async commands / failing'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (async_commands.cy.js)                                                     │
  │ Searched:   cypress/e2e/async_commands.cy.js                                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  async_commands.cy.js                                                            (1 of 1)


  1) fails when a command times out after await in an async test
  ✓ passes when an async test enqueues only passing commands after await

  1 passing
  1 failing

  1) fails when a command times out after await in an async test:

      Timed out retrying after 100ms
      + expected - actual

      -'foo'
      +'baz'
      
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     async_commands.cy.js                                                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /foo/bar/.projects/e2e/cypress/screenshots/async_commands.cy.js/fails when a comma     (1280x720)
     nd times out after await in an async test (failed).png                                         


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  async_commands.cy.js                     XX:XX        2        1        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        2        1        1        -        -  


`
