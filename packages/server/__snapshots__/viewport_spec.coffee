exports['e2e viewport passes 1'] = `
====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (viewport_spec.coffee)                                                     │
  │ Searched:   cypress/integration/viewport_spec.coffee                                           │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: viewport_spec.coffee...                                                         (1 of 1) 


  viewport
    ✓ changes viewport to iphone-6
    ✓ does not use viewport
    ✓ ensures viewport in logs


  3 passing


  (Results)

  ┌────────────────────────────────────┐
  │ Tests:        3                    │
  │ Passing:      3                    │
  │ Failing:      0                    │
  │ Pending:      0                    │
  │ Skipped:      0                    │
  │ Screenshots:  0                    │
  │ Video:        true                 │
  │ Duration:     X seconds            │
  │ Spec Ran:     viewport_spec.coffee │
  └────────────────────────────────────┘


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔ viewport_spec.coffee                      XX:XX        3        3        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    All specs passed!                           XX:XX        3        3        -        -        -  

`

