exports['e2e form submissions passing 1'] = `
Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)


  form submissions
    ✓ will find 'form success' message by default (after retrying)
    ✓ needs an explicit should when an element is immediately found


  2 passing


  (Tests Finished)

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
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (0 seconds)


  (All Done)

`

exports['e2e form submissions failing 1'] = `
Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)


  form submission fails
    1) fails without an explicit wait when an element is immediately found


  0 passing
  1 failing

  1) form submission fails fails without an explicit wait when an element is immediately found:
     AssertionError: expected '<form>' to contain 'form success!'
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line




  (Tests Finished)

  - Tests:           1
  - Passes:          0
  - Failures:        1
  - Pending:         0
  - Skipped:         0
  - Duration:        10 seconds
  - Screenshots:     1
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/form submission fails -- fails without an explicit wait when an element is immediately found.png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (0 seconds)


  (All Done)

`

