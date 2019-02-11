exports['e2e reload config changes passes 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (reload_config_changes.js)                                                 │
  │ Searched:   cypress/integration/reload_config_changes.js                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: reload_config_changes.js...                                                     (1 of 1) 


  ✓ reloads when restart is clicked after config changes

  1 passing


  (Results)

  ┌────────────────────────────────────────┐
  │ Tests:        1                        │
  │ Passing:      1                        │
  │ Failing:      0                        │
  │ Pending:      0                        │
  │ Skipped:      0                        │
  │ Screenshots:  0                        │
  │ Video:        true                     │
  │ Duration:     X seconds                │
  │ Spec Ran:     reload_config_changes.js │
  └────────────────────────────────────────┘


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔ reload_config_changes.js                  XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    All specs passed!                           XX:XX        1        1        -        -        -  


`
