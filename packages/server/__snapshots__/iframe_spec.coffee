exports['e2e iframes passes 1'] = `
====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (iframe_spec.coffee)                                                       │
  │ Searched:   cypress/integration/iframe_spec.coffee                                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: iframe_spec.coffee...                                                           (1 of 1) 


  iframes
    ✓ can snapshot iframes which arent loaded
    ✓ can access nested iframes over http server
    ✓ can access iframes over file server
    ✓ does not throw on cross origin iframes
    ✓ continues to inject even on 5xx responses
    ✓ injects on file server 4xx errors
    ✓ injects on http request errors
    ✓ does not inject into xhr's


  8 passing


  (Results)

  ┌──────────────────────────────────┐
  │ Tests:        8                  │
  │ Passing:      8                  │
  │ Failing:      0                  │
  │ Pending:      0                  │
  │ Skipped:      0                  │
  │ Screenshots:  0                  │
  │ Video:        true               │
  │ Duration:     X seconds          │
  │ Spec Ran:     iframe_spec.coffee │
  └──────────────────────────────────┘


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔ iframe_spec.coffee                        XX:XX        8        8        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    All specs passed!                           XX:XX        8        8        -        -        -  

`

