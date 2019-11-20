exports['e2e cookies with baseurl'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (cookies_spec_baseurl.coffee)                                              │
  │ Searched:   cypress/integration/cookies_spec_baseurl.coffee                                    │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  cookies_spec_baseurl.coffee                                                     (1 of 1)


  cookies
    with whitelist
      ✓ can get all cookies
      ✓ resets cookies between tests correctly
      ✓ should be only two left now
      ✓ handles undefined cookies
    without whitelist
      ✓ sends set cookies to path
      ✓ handles expired cookies secure
      ✓ issue: #224 sets expired cookies between redirects
      ✓ issue: #1321 failing to set or parse cookie
      ✓ issue: #2724 does not fail on invalid cookies
      ✓ can set and clear cookie
      in a cy.visit
        ✓ can set cookies on way too many redirects with HTTP intermediary
        ✓ can set cookies on way too many redirects with HTTPS intermediary
      in a cy.request
        ✓ can set cookies on way too many redirects with HTTP intermediary
        ✓ can set cookies on way too many redirects with HTTPS intermediary


  14 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        14                                                                               │
  │ Passing:      14                                                                               │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     cookies_spec_baseurl.coffee                                                      │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/cookies_spec_baseurl.coffee.mp4     (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  cookies_spec_baseurl.coffee              XX:XX       14       14        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX       14       14        -        -        -  


`

exports['e2e cookies with no baseurl'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (cookies_spec_no_baseurl.coffee)                                           │
  │ Searched:   cypress/integration/cookies_spec_no_baseurl.coffee                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  cookies_spec_no_baseurl.coffee                                                  (1 of 1)


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

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        9                                                                                │
  │ Passing:      9                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     cookies_spec_no_baseurl.coffee                                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/cookies_spec_no_baseurl.coffee.     (X second)
                          mp4                                                                       


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  cookies_spec_no_baseurl.coffee           XX:XX        9        9        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        9        9        -        -        -  


`
