exports['e2e issue 1669 passes 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (issue_1669_spec.js)                                                       │
  │ Searched:   cypress/integration/issue_1669_spec.js                                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  issue_1669_spec.js                                                              (1 of 1)


  issue-1669 undefined err.stack in beforeEach hook
    1) "before each" hook for "cy.setCookie should fail with correct error"


  0 passing
  1 failing

  1) issue-1669 undefined err.stack in beforeEach hook
       "before each" hook for "cy.setCookie should fail with correct error":
     Error: some error, without stack

Because this error occurred during a \`before each\` hook we are skipping the remaining tests in the current suite: \`issue-1669 undefined err.st...\`
  




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     issue_1669_spec.js                                                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/issue_1669_spec.js/issue-1669 undefined err.sta     (1280x720)
     ck in beforeEach hook -- cy.setCookie should fail with correct error -- before e               
     ach hook (failed).png                                                                          


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/issue_1669_spec.js.mp4              (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  issue_1669_spec.js                       XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1        -        1        -        -  


`
