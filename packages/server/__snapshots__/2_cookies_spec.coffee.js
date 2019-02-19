exports['e2e cookies passes 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (cookies_spec.coffee)                                                      │
  │ Searched:   cypress/integration/cookies_spec.coffee                                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: cookies_spec.coffee...                                                          (1 of 1) 


  cookies
    with whitelist
      ✓ can get all cookies
      ✓ resets cookies between tests correctly
      ✓ should be only two left now
      ✓ handles undefined cookies
    without whitelist
      ✓ sends cookies to localhost:2121
      ✓ handles expired cookies secure
      ✓ issue: #224 sets expired cookies between redirects
      ✓ issue: #1321 failing to set or parse cookie
      ✓ issue: #2724 does not fail on invalid cookies


  9 passing


  (Results)

  ┌───────────────────────────────────┐
  │ Tests:        9                   │
  │ Passing:      9                   │
  │ Failing:      0                   │
  │ Pending:      0                   │
  │ Skipped:      0                   │
  │ Screenshots:  0                   │
  │ Video:        true                │
  │ Duration:     X seconds           │
  │ Spec Ran:     cookies_spec.coffee │
  └───────────────────────────────────┘


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔ cookies_spec.coffee                       XX:XX        9        9        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    All specs passed!                           XX:XX        9        9        -        -        -  


`
