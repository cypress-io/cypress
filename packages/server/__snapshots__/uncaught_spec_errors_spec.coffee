exports['e2e uncaught errors failing1 1'] = `
Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)


  1) An uncaught error was detected outside of a test

  0 passing
  1 failing

  1)  An uncaught error was detected outside of a test:
     Uncaught ReferenceError: foo is not defined

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

  - /foo/bar/.projects/e2e/cypress/screenshots/An uncaught error was detected outside of a test.png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (0 seconds)


  (All Done)

`

exports['e2e uncaught errors failing2 1'] = `
Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)


  1) An uncaught error was detected outside of a test

  0 passing
  1 failing

  1)  An uncaught error was detected outside of a test:
     Uncaught ReferenceError: foo is not defined

This error originated from *your* test code, not from Cypress.

When Cypress detects uncaught errors originating from your test code it will automatically fail the current test.

Cypress could not associate this error to any specific test.

We dynamically generated a new test to display this failure.
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
  - Duration:        10 seconds
  - Screenshots:     1
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/An uncaught error was detected outside of a test.png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (0 seconds)


  (All Done)

`

exports['e2e uncaught errors failing3 1'] = `
Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)


  foo
    1) bar


  0 passing
  1 failing

  1) foo bar:
     Uncaught ReferenceError: foo is not defined

This error originated from *your* test code, not from Cypress.

When Cypress detects uncaught errors originating from your test code it will automatically fail the current test.
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

  - /foo/bar/.projects/e2e/cypress/screenshots/foo -- bar.png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (0 seconds)


  (All Done)

`

exports['e2e uncaught errors failing4 1'] = `
Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)


  foo
    1) "before all" hook for "does not run"

  bar
    ✓ runs


  1 passing
  1 failing

  1) foo "before all" hook for "does not run":
     Uncaught ReferenceError: foo is not defined

This error originated from *your* test code, not from Cypress.

When Cypress detects uncaught errors originating from your test code it will automatically fail the current test.

Because this error occurred during a 'before all' hook we are skipping the remaining tests in the current suite: 'foo'
      at stack trace line




  (Tests Finished)

  - Tests:           1
  - Passes:          1
  - Failures:        1
  - Pending:         0
  - Duration:        10 seconds
  - Screenshots:     1
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/foo -- does not run -- before all hook.png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (0 seconds)


  (All Done)

`

exports['e2e uncaught errors failing5 1'] = `
Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)


  foo
    1) baz fails
    2) bar fails
    3) quux fails
    4) quux2 fails
    ✓ quux3 passes
    ✓ quux4 passes
    ✓ quux5 passes
    ✓ quux6 passes


  4 passing
  4 failing

  1) foo baz fails:
     ReferenceError: foo is not defined
      at stack trace line

  2) foo bar fails:
     ReferenceError: foo is not defined
      at stack trace line

  3) foo quux fails:
     ReferenceError: foo is not defined
      at stack trace line

  4) foo quux2 fails:
     ReferenceError: foo is not defined
      at stack trace line




  (Tests Finished)

  - Tests:           8
  - Passes:          4
  - Failures:        4
  - Pending:         0
  - Duration:        10 seconds
  - Screenshots:     4
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/foo -- baz fails.png (1280x720)
  - /foo/bar/.projects/e2e/cypress/screenshots/foo -- bar fails.png (1280x720)
  - /foo/bar/.projects/e2e/cypress/screenshots/foo -- quux fails.png (1280x720)
  - /foo/bar/.projects/e2e/cypress/screenshots/foo -- quux2 fails.png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (0 seconds)


  (All Done)

`
