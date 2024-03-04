exports['e2e issue 5016 - screenshot times out after clicking target _blank / fails but does not timeout taking screenshot'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (issue-5016.cy.js)                                                         │
  │ Searched:   cypress/e2e/**/*.cy.{js,jsx,ts,tsx}                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  issue-5016.cy.js                                                                (1 of 1)


  issue 5016
    ✓ should take a normal screenshot
    1) should fail but not timeout while taking the screenshot
    ✓ should not timeout taking screenshot when not failing


  2 passing
  1 failing

  1) issue 5016
       should fail but not timeout while taking the screenshot:
     AssertionError: Timed out retrying after 4050ms: expected '<a>' to have attribute 'foo'
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        3                                                                                │
  │ Passing:      2                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  3                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     issue-5016.cy.js                                                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/issue-5016.cy.js/issue 5016 -- should take a no          (YxX)
     rmal screenshot.png                                                                            
  -  /XXX/XXX/XXX/cypress/screenshots/issue-5016.cy.js/issue 5016 -- should fail but           (YxX)
     not timeout while taking the screenshot (failed).png                                           
  -  /XXX/XXX/XXX/cypress/screenshots/issue-5016.cy.js/issue 5016 -- should not timeo          (YxX)
     ut taking screenshot when not failing.png                                                      


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  issue-5016.cy.js                         XX:XX        3        2        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        3        2        1        -        -  


`
