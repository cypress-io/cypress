exports['e2e only spec failing 1'] = `
====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (only_spec.coffee)                                                         │
  │ Searched:   cypress/integration/only_spec.coffee                                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: only_spec.coffee...                                                             (1 of 1) 


  s1
    ✓ t3


  1 passing


  (Results)

  ┌────────────────────────────────┐
  │ Tests:        1                │
  │ Passing:      1                │
  │ Failing:      0                │
  │ Pending:      0                │
  │ Skipped:      0                │
  │ Screenshots:  0                │
  │ Video:        true             │
  │ Duration:     X seconds        │
  │ Spec Ran:     only_spec.coffee │
  └────────────────────────────────┘


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔ only_spec.coffee                          XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    All specs passed!                           XX:XX        1        1        -        -        -  

`

