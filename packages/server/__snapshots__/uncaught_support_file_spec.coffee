exports['e2e uncaught support file errors failing 1'] = `
Started video recording: /foo/bar/.projects/uncaught-support-file/cypress/videos/abc123.mp4

  (Tests Starting)


  1) An uncaught error was detected outside of a test

  0 passing
  1 failing

  1)  An uncaught error was detected outside of a test:
     Uncaught Error: bar

This error originated from *your* test code, not from Cypress.

When Cypress detects uncaught errors originating from your test code it will automatically fail the current test.

Cypress could not associate this error to any specific test.

We dynamically generated a new test to display this failure.
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line




  (Tests Finished)

  - Tests:           1
  - Passes:          0
  - Failures:        1
  - Pending:         0
  - Duration:        10 seconds
  - Screenshots:     1
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Screenshots)

  - /foo/bar/.projects/uncaught-support-file/cypress/screenshots/An uncaught error was detected outside of a test.png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/uncaught-support-file/cypress/videos/abc123.mp4 (0 seconds)


  (All Done)

`
