exports['e2e server sent events passes 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:        1.2.3                                                                          │
  │ Browser:        FooBrowser 88                                                                  │
  │ Node Version:   v0.0.0 (bundled with Cypress)                                                  │
  │ Specs:          1 found (server_sent_events_spec.coffee)                                       │
  │ Searched:       cypress/integration/server_sent_events_spec.coffee                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: server_sent_events_spec.coffee...                                               (1 of 1) 


  server sent events
    ✓ does not crash
    ✓ aborts proxied connections to prevent client connection buildup


  2 passing


  (Results)

  ┌──────────────────────────────────────────────┐
  │ Tests:        2                              │
  │ Passing:      2                              │
  │ Failing:      0                              │
  │ Pending:      0                              │
  │ Skipped:      0                              │
  │ Screenshots:  0                              │
  │ Video:        true                           │
  │ Duration:     X seconds                      │
  │ Spec Ran:     server_sent_events_spec.coffee │
  └──────────────────────────────────────────────┘


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔ server_sent_events_spec.coffee            XX:XX        2        2        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    All specs passed!                           XX:XX        2        2        -        -        -  


`
