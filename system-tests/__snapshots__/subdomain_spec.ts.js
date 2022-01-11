exports['e2e subdomain / passes'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (subdomain.cy.js)                                                          │
  │ Searched:   cypress/e2e/subdomain.cy.js                                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  subdomain.cy.js                                                                 (1 of 1)


  subdomains
    ✓ can swap to help.foobar.com:2292
    ✓ can directly visit a subdomain in another test
    ✓ issue: #207: does not duplicate or hostOnly cookies as a domain cookie
    ✓ correctly sets domain based cookies
    - issue #362: do not set domain based (non hostOnly) cookies by default
    - sets a hostOnly cookie by default
    ✓ issue #361: incorrect cookie synchronization between cy.request redirects
    ✓ issue #362: incorrect cookie synchronization between cy.visit redirects
    ✓ issue #600 can visit between nested subdomains


  7 passing
  2 pending


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        9                                                                                │
  │ Passing:      7                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      2                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     subdomain.cy.js                                                                  │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/subdomain.cy.js.mp4                 (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  subdomain.cy.js                          XX:XX        9        7        -        2        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        9        7        -        2        -  


`
