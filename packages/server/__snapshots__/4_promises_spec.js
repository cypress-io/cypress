exports['e2e promises / failing1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (promises_spec.coffee)                                                     │
  │ Searched:   cypress/integration/promises_spec.coffee                                           │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  promises_spec.coffee                                                            (1 of 1)


  1) catches regular promise errors
  2) catches promise errors and calls done with err even when async

  0 passing
  2 failing

  1) catches regular promise errors:
     Error: bar
      [stack trace lines]

  2) catches promise errors and calls done with err even when async:
     Error: foo
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      2                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  2                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     promises_spec.coffee                                                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/promises_spec.coffee/catches regular promise er     (1280x720)
     rors (failed).png                                                                              
  -  /XXX/XXX/XXX/cypress/screenshots/promises_spec.coffee/catches promise errors and     (1280x720)
      calls done with err even when async (failed).png                                              


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/promises_spec.coffee.mp4            (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  promises_spec.coffee                     XX:XX        2        -        2        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        2        -        2        -        -  


`
