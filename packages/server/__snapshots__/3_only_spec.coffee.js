exports['e2e only spec failing 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (only_spec.XX)                                                         │
  │ Searched:   cypress/integration/only_spec.XX                                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: only_spec.XX...                                                             (1 of 1) 


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
  │ Spec Ran:     only_spec.XX │
  └────────────────────────────────┘


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔ only_spec.XX                          XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    All specs passed!                           XX:XX        1        1        -        -        -  


`
