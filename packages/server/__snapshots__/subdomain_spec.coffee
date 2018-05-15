exports['e2e subdomain passes 1'] = `
Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)


  subdomains
    ✓ can swap to help.foobar.com:2292
    ✓ can directly visit a subdomain in another test
    ✓ issue: #207: does not duplicate or hostOnly cookies as a domain cookie
    ✓ corrects sets domain based cookies
    - issue #362: do not set domain based (non hostOnly) cookies by default
    - sets a hostOnly cookie by default
    ✓ issue #361: incorrect cookie synchronization between cy.request redirects
    ✓ issue #362: incorrect cookie synchronization between cy.visit redirects
    ✓ issue #600 can visit between nested subdomains


  7 passing
  2 pending


  (Tests Finished)

  - Tests:           9
  - Passes:          7
  - Failures:        0
  - Pending:         2
  - Skipped:         0
  - Duration:        10 seconds
  - Screenshots:     0
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (0 seconds)


  (All Done)

`

