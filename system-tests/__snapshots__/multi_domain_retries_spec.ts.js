exports['e2e multi domain retries / Appropriately displays test retry errors without other side effects'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (multi_domain_retries_spec.ts)                                             │
  │ Searched:   cypress/integration/multi_domain_retries_spec.ts                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  multi_domain_retries_spec.ts                                                    (1 of 1)


  multi-domain test retries
    (Attempt 1 of 3) appropriately retries test within "switchToDomain" without propagating other errors errors
    (Attempt 2 of 3) appropriately retries test within "switchToDomain" without propagating other errors errors
    1) appropriately retries test within "switchToDomain" without propagating other errors errors


  0 passing
  1 failing

  1) multi-domain test retries
       appropriately retries test within "switchToDomain" without propagating other errors errors:
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
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     multi_domain_retries_spec.ts                                                     │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/multi_domain_retries_spec.ts/multi-domain test      (1280x720)
     retries -- appropriately retries test within switchToDomain without propagating                
     other errors errors (failed).png                                                               
  -  /XXX/XXX/XXX/cypress/screenshots/multi_domain_retries_spec.ts/multi-domain test      (1280x720)
     retries -- appropriately retries test within switchToDomain without propagating                
     other errors errors (failed) (attempt 2).png                                                   
  -  /XXX/XXX/XXX/cypress/screenshots/multi_domain_retries_spec.ts/multi-domain test      (1280x720)
     retries -- appropriately retries test within switchToDomain without propagating                
     other errors errors (failed) (attempt 3).png                                                   


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/multi_domain_retries_spec.ts.mp     (X second)
                          4                                                                         


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  multi_domain_retries_spec.ts             XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1        -        1        -        -  


`
