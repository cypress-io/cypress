exports['e2e cy.origin errors / captures the stack trace correctly for errors in cross origins to point users to their "cy.origin" callback'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:      1.2.3                                                                            │
  │ Browser:      FooBrowser 88                                                                    │
  │ Specs:        1 found (cy_origin_error.cy.ts)                                                  │
  │ Searched:     cypress/e2e/cy_origin_error.cy.ts                                                │
  │ Experiments:  experimentalSessionAndOrigin=true                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  cy_origin_error.cy.ts                                                           (1 of 1)


  cy.origin
    1) tries to find an element that doesn't exist and fails


  0 passing
  1 failing

  1) cy.origin
       tries to find an element that doesn't exist and fails:
     AssertionError: Timed out retrying after 1000ms: Expected to find element: \`#doesnotexist\`, but never found it.
      [stack trace lines]




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
  │ Spec Ran:     cy_origin_error.cy.ts                                                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/cy_origin_error.cy.ts/cy.origin -- tries to fin     (1280x720)
     d an element that doesn't exist and fails (failed).png                                         


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/cy_origin_error.cy.ts.mp4           (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  cy_origin_error.cy.ts                    XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1        -        1        -        -  


`
