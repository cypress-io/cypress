exports['e2e blacklist passes 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (blacklist_hosts_spec.XX)                                              │
  │ Searched:   cypress/integration/blacklist_hosts_spec.XX                                    │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: blacklist_hosts_spec.XX...                                                  (1 of 1) 


  blacklist
    ✓ forces blacklisted hosts to return 503


  1 passing


  (Results)

  ┌───────────────────────────────────────────┐
  │ Tests:        1                           │
  │ Passing:      1                           │
  │ Failing:      0                           │
  │ Pending:      0                           │
  │ Skipped:      0                           │
  │ Screenshots:  0                           │
  │ Video:        true                        │
  │ Duration:     X seconds                   │
  │ Spec Ran:     blacklist_hosts_spec.XX │
  └───────────────────────────────────────────┘


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔ blacklist_hosts_spec.XX               XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    All specs passed!                           XX:XX        1        1        -        -        -  


`
