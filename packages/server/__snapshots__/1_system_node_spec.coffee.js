exports['e2e system node uses system node when launching plugins file 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:        1.2.3                                                                          │
  │ Browser:        FooBrowser 88                                                                  │
  │ Node Version:   v0.0.0 (/foo/bar/node)                                                         │
  │ Specs:          1 found (spec.js)                                                              │
  │ Searched:       cypress/integration/spec.js                                                    │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: spec.js...                                                                      (1 of 1) 


  ✓ 

  1 passing


  (Results)

  ┌─────────────────────────┐
  │ Tests:        1         │
  │ Passing:      1         │
  │ Failing:      0         │
  │ Pending:      0         │
  │ Skipped:      0         │
  │ Screenshots:  0         │
  │ Video:        true      │
  │ Duration:     X seconds │
  │ Spec Ran:     spec.js   │
  └─────────────────────────┘


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/system-node/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔ spec.js                                   XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    All specs passed!                           XX:XX        1        1        -        -        -  


`
