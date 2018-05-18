exports['e2e cache passes 1'] = `
====================================================================================================

  (Run Starting)


  caching
    ✓ does not cache cy.visit file server requests
    ✓ sets etags on file assets, but no cache-control
    ✓ does not cache cy.visit http server requests
    ✓ respects cache control headers from 3rd party http servers


  4 passing


  (Results)

  - Tests:           4
  - Passes:          4
  - Failures:        0
  - Pending:         0
  - Skipped:         0
  - Duration:        10 seconds
  - Screenshots:     0
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


  (Run Finished)

`

