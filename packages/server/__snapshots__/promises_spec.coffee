exports['e2e promises failing1 1'] = `
====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (promises_spec.coffee)                                                     │
  │ Searched:   cypress/integration/promises_spec.coffee                                           │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: promises_spec.coffee...                                                         (1 of 1) 


  1) catches regular promise errors
  2) catches promise errors and calls done with err even when async

  0 passing
  2 failing

  1)  catches regular promise errors:
     Error: bar
      at stack trace line

  2)  catches promise errors and calls done with err even when async:
     Error: foo
      at stack trace line
      at stack trace line




  (Results)

  ┌────────────────────────────────────┐
  │ Tests:        2                    │
  │ Passing:      0                    │
  │ Failing:      2                    │
  │ Pending:      0                    │
  │ Skipped:      0                    │
  │ Screenshots:  2                    │
  │ Video:        true                 │
  │ Duration:     X seconds            │
  │ Spec Ran:     promises_spec.coffee │
  └────────────────────────────────────┘


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/promises_spec.coffee/catches regular promise errors (failed).png (1280x720)
  - /foo/bar/.projects/e2e/cypress/screenshots/promises_spec.coffee/catches promise errors and calls done with err even when async (failed).png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖ promises_spec.coffee                      XX:XX        2        -        2        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    1 of 1 failed (100%)                        XX:XX        2        -        2        -        -  

`

