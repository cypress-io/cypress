exports['e2e page_loading passes 1'] = `
Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)


  page_loading
    ✓ sets __cypress.initial, properly injects, and avoids json injection
    issue #258: opener is undefined during snapshot
      ✓ causes the xhr to be aborted while in flight


  2 passing


  (Tests Finished)

  - Tests:           2
  - Passes:          2
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

