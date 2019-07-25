exports['e2e iframes passes 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (iframe_spec.XX)                                                       │
  │ Searched:   cypress/integration/iframe_spec.XX                                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: iframe_spec.XX...                                                           (1 of 1) 


  iframes
    ✓ can snapshot iframes which arent loaded
    ✓ can access nested iframes over http server
    ✓ can access iframes over file server
    ✓ does not throw on cross origin iframes
    ✓ continues to inject even on 5xx responses
    ✓ injects on file server 4xx errors
    ✓ does not inject into xhr's


  7 passing


  (Results)

  ┌──────────────────────────────────┐
  │ Tests:        7                  │
  │ Passing:      7                  │
  │ Failing:      0                  │
  │ Pending:      0                  │
  │ Skipped:      0                  │
  │ Screenshots:  0                  │
  │ Video:        true               │
  │ Duration:     X seconds          │
  │ Spec Ran:     iframe_spec.XX │
  └──────────────────────────────────┘


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔ iframe_spec.XX                        XX:XX        7        7        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    All specs passed!                           XX:XX        7        7        -        -        -  


`
