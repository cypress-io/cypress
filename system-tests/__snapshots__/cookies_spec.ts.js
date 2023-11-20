exports['e2e cookies with baseurl'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (cookies_spec_baseurl.cy.js)                                               │
  │ Searched:   cypress/e2e/cookies_spec_baseurl.cy.js                                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  cookies_spec_baseurl.cy.js                                                      (1 of 1)


  cookies
    ✓ sends set cookies to path
    ✓ handles expired cookies secure
    ✓ issue: #224 sets expired cookies between redirects
    ✓ issue: #1321 failing to set or parse cookie
    ✓ issue: #2724 does not fail on invalid cookies
    ✓ can set and clear cookie
    in a cy.visit
      ✓ can successfully send cookies as a Cookie header
      ✓ ignores invalid set-cookie headers that contain control chars
      with Domain = hostname
        ✓ is set properly with no redirects
        ✓ is set properly with redirects
      with SameSite
        ✓ None is set and sent with subsequent requests
        ✓ Strict is set and sent with subsequent requests
        ✓ Lax is set and sent with subsequent requests
      when redirected to a HTTP URL
        ✓ can set cookies on lots of redirects, ending with different domain
        ✓ can set cookies on lots of redirects, ending with same domain
      when redirected to a HTTPS URL
        ✓ can set cookies on lots of redirects, ending with different domain
        ✓ can set cookies on lots of redirects, ending with same domain
    in a cy.request
      ✓ can successfully send cookies as a Cookie header
      ✓ ignores invalid set-cookie headers that contain control chars
      with Domain = hostname
        ✓ is set properly with no redirects
        ✓ is set properly with redirects
      with SameSite
        ✓ None is set and sent with subsequent requests
        ✓ Strict is set and sent with subsequent requests
        ✓ Lax is set and sent with subsequent requests
      when redirected to a HTTP URL
        ✓ can set cookies on lots of redirects, ending with different domain
        ✓ can set cookies on lots of redirects, ending with same domain
      when redirected to a HTTPS URL
        ✓ can set cookies on lots of redirects, ending with different domain
        ✓ can set cookies on lots of redirects, ending with same domain


  28 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        28                                                                               │
  │ Passing:      28                                                                               │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     cookies_spec_baseurl.cy.js                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  cookies_spec_baseurl.cy.js               XX:XX       28       28        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX       28       28        -        -        -  


`

exports['e2e cookies with no baseurl'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (cookies_spec_no_baseurl.cy.js)                                            │
  │ Searched:   cypress/e2e/cookies_spec_no_baseurl.cy.js                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  cookies_spec_no_baseurl.cy.js                                                   (1 of 1)


  cookies
    ✓ sends cookies to url
    ✓ handles expired cookies secure
    ✓ issue: #224 sets expired cookies between redirects
    ✓ issue: #1321 failing to set or parse cookie
    ✓ issue: #2724 does not fail on invalid cookies


  5 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        5                                                                                │
  │ Passing:      5                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     cookies_spec_no_baseurl.cy.js                                                    │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  cookies_spec_no_baseurl.cy.js            XX:XX        5        5        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        5        5        -        -        -  


`
