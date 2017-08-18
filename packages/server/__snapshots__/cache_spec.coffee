exports['e2e cache passes 1'] = `Error: connect ECONNREFUSED 127.0.0.1:1234
 > The local API server isn't running in development. This may cause problems running the GUI.

-----------------------------------------------------------------------------------
You are using an older version of the CLI tools.

Please update the CLI tools by running: npm install -g cypress-cli
-----------------------------------------------------------------------------------

Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)


  caching
    ✓ does not cache cy.visit file server requests (123ms)
    ✓ sets etags on file assets, but no cache-control (123ms)
    ✓ does not cache cy.visit http server requests (123ms)
    ✓ respects cache control headers from 3rd party http servers (123ms)


  4 passing (123ms)


  (Tests Finished)

  - Tests:           4
  - Passes:          4
  - Failures:        0
  - Pending:         0
  - Duration:        10 seconds
  - Screenshots:     0
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (0 seconds)


  (All Done)

`

