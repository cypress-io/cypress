exports['e2e cy.origin retries / Appropriately displays test retry errors without other side effects'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (cy_origin_retries.cy.ts)                                                  │
  │ Searched:   cypress/e2e/cy_origin_retries.cy.ts                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  cy_origin_retries.cy.ts                                                         (1 of 1)


  cy.origin test retries
    (Attempt 1 of 3) appropriately retries test within "cy.origin" without propagating other errors
    (Attempt 2 of 3) appropriately retries test within "cy.origin" without propagating other errors
    1) appropriately retries test within "cy.origin" without propagating other errors


  0 passing
  1 failing

  1) cy.origin test retries
       appropriately retries test within "cy.origin" without propagating other errors:
     AssertionError: expected true to be false
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  3                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     cy_origin_retries.cy.ts                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/cy_origin_retries.cy.ts/cy.origin test retries      (1280x720)
     -- appropriately retries test within cy.origin without propagating other errors                
     (failed).png                                                                                   
  -  /XXX/XXX/XXX/cypress/screenshots/cy_origin_retries.cy.ts/cy.origin test retries      (1280x720)
     -- appropriately retries test within cy.origin without propagating other errors                
     (failed) (attempt 2).png                                                                       
  -  /XXX/XXX/XXX/cypress/screenshots/cy_origin_retries.cy.ts/cy.origin test retries      (1280x720)
     -- appropriately retries test within cy.origin without propagating other errors                
     (failed) (attempt 3).png                                                                       


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  cy_origin_retries.cy.ts                  XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1        -        1        -        -  


`
