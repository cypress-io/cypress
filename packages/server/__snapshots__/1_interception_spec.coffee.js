exports['e2e interception spec character encodings does not mangle iso-8859-1 text 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (iso-8859-1_spec.js)                                                       │
  │ Searched:   cypress/integration/iso-8859-1_spec.js                                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: iso-8859-1_spec.js...                                                           (1 of 1) 


  Characters ISO-8859-1 tests
    without gzip
      ✓ Validation 1
      ✓ Validation 2
      ✓ Validation 3
      ✓ Validation 4
      ✓ Validation 4
      ✓ Validation 5
      ✓ Validation 6
    with gzip
      ✓ Validation 1
      ✓ Validation 2
      ✓ Validation 3
      ✓ Validation 4
      ✓ Validation 4
      ✓ Validation 5
      ✓ Validation 6
    without gzip (no content-type charset)
      ✓ Validation 1
      ✓ Validation 2
      ✓ Validation 3
      ✓ Validation 4
      ✓ Validation 4
      ✓ Validation 5
      ✓ Validation 6
    with gzip (no content-type charset)
      ✓ Validation 1
      ✓ Validation 2
      ✓ Validation 3
      ✓ Validation 4
      ✓ Validation 4
      ✓ Validation 5
      ✓ Validation 6


  28 passing


  (Results)

  ┌──────────────────────────────────┐
  │ Tests:        28                 │
  │ Passing:      28                 │
  │ Failing:      0                  │
  │ Pending:      0                  │
  │ Skipped:      0                  │
  │ Screenshots:  0                  │
  │ Video:        true               │
  │ Duration:     X seconds          │
  │ Spec Ran:     iso-8859-1_spec.js │
  └──────────────────────────────────┘


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔ iso-8859-1_spec.js                        XX:XX       28       28        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    All specs passed!                           XX:XX       28       28        -        -        -  


`
