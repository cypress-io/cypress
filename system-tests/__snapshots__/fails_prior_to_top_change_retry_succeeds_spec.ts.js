exports['fails prior to top change retry succeeds / shows the correct retry number in the reporter'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (fails_prior_to_top_change_retry_succeeds.cy.ts)                           │
  │ Searched:   cypress/e2e/fails_prior_to_top_change_retry_succeeds.cy.ts                         │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  fails_prior_to_top_change_retry_succeeds.cy.ts                                  (1 of 1)


  fails prior to top change
    (Attempt 1 of 3) fails prior to top change
    (Attempt 2 of 3) fails prior to top change
    ✓ fails prior to top change


  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  2                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     fails_prior_to_top_change_retry_succeeds.cy.ts                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/fails_prior_to_top_change_retry_succeeds.cy.ts/     (1280x720)
     fails prior to top change -- fails prior to top change (failed).png                            
  -  /XXX/XXX/XXX/cypress/screenshots/fails_prior_to_top_change_retry_succeeds.cy.ts/     (1280x720)
     fails prior to top change -- fails prior to top change (failed) (attempt 2).png                


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  fails_prior_to_top_change_retry_suc      XX:XX        1        1        -        -        - │
  │    ceeds.cy.ts                                                                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


`
