exports['e2e plugins fails 1'] = `
Started video recording: /foo/bar/.projects/plugins-async-error/cypress/videos/abc123.mp4

  (Tests Starting)

Error: The following error was thrown by a plugin. We've stopped running your tests because this likely interrupts behavior critical to them.

Error: Async error from plugins file
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

  - Tests:           0
  - Passes:          0
  - Failures:        1
  - Pending:         0
  - Duration:        10 seconds
  - Screenshots:     0
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/plugins-async-error/cypress/videos/abc123.mp4 (0 seconds)


  (All Done)

`

exports['e2e plugins passes 1'] = `
Started video recording: /foo/bar/.projects/working-preprocessor/cypress/videos/abc123.mp4

  (Tests Starting)


  ✓ is another spec

  1 passing


  (Tests Finished)

  - Tests:           1
  - Passes:          1
  - Failures:        0
  - Pending:         0
  - Duration:        10 seconds
  - Screenshots:     0
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/working-preprocessor/cypress/videos/abc123.mp4 (0 seconds)


  (All Done)

`
