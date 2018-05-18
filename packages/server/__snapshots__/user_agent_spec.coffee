exports['e2e user agent passes on chrome 1'] = `Warning: Cypress can only record videos when using the built in 'electron' browser.

You have set the browser to: 'chrome'

A video will not be recorded when using this browser.
  (Run Starting)


  user agent
    ✓ is set on visits
    ✓ is set on requests


  2 passing


  (Results)

  - Tests:           2
  - Passes:          2
  - Failures:        0
  - Pending:         0
  - Skipped:         0
  - Duration:        10 seconds
  - Screenshots:     0
  - Video Recorded:  false
  - Cypress Version: 1.2.3


  (All Done)

`

exports['e2e user agent passes on electron 1'] = `
Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Run Starting)


  user agent
    ✓ is set on visits
    ✓ is set on requests


  2 passing


  (Results)

  - Tests:           2
  - Passes:          2
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


  (All Done)

`

