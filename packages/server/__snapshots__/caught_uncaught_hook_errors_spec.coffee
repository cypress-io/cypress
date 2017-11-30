exports['e2e caught and uncaught hooks errors failing1 1'] = `
Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)


  ✓ t1a
  s1a
    1) "before each" hook for "t2a"

  s2a
    ✓ t5a
    ✓ t6a
    ✓ t7a


  4 passing
  1 failing

  1) s1a "before each" hook for "t2a":
     CypressError: Expected to find element: '.does-not-exist', but never found it.

Because this error occurred during a 'before each' hook we are skipping the remaining tests in the current suite: 's1a'
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

  - Tests:           4
  - Passes:          4
  - Failures:        1
  - Pending:         0
  - Duration:        10 seconds
  - Screenshots:     1
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/s1a -- t2a -- before each hook.png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (0 seconds)


  (All Done)

`

exports['e2e caught and uncaught hooks errors failing2 1'] = `
Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)


  ✓ t1b
  s1b
    1) "before each" hook for "t2b"

  s2b
    ✓ t5b
    ✓ t6b
    ✓ t7b


  4 passing
  1 failing

  1) s1b "before each" hook for "t2b":
     Uncaught ReferenceError: foo is not defined

Because this error occurred during a 'before each' hook we are skipping the remaining tests in the current suite: 's1b'
      at stack trace line




  (Tests Finished)

  - Tests:           4
  - Passes:          4
  - Failures:        1
  - Pending:         0
  - Duration:        10 seconds
  - Screenshots:     1
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/s1b -- t2b -- before each hook.png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (0 seconds)


  (All Done)

`

exports['e2e caught and uncaught hooks errors failing3 1'] = `
Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)


  1) "before each" hook for "t1c"

  0 passing
  1 failing

  1)  "before each" hook for "t1c":
     Uncaught ReferenceError: foo is not defined

Because this error occurred during a 'before each' hook we are skipping all of the remaining tests.
      at stack trace line




  (Tests Finished)

  - Tests:           0
  - Passes:          0
  - Failures:        1
  - Pending:         0
  - Duration:        10 seconds
  - Screenshots:     1
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/t1c -- before each hook.png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (0 seconds)


  (All Done)

`

exports['e2e caught and uncaught hooks errors failing4 1'] = `
Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)


  uncaught hook error should continue to fire all mocha events
    s1
      1) "before each" hook for "does not run"
    s2
      ✓ does run
      ✓ also runs


  2 passing
  1 failing

  1) uncaught hook error should continue to fire all mocha events s1 "before each" hook for "does not run":
     Uncaught ReferenceError: foo is not defined

Because this error occurred during a 'before each' hook we are skipping the remaining tests in the current suite: 's1'
      at stack trace line




  (Tests Finished)

  - Tests:           2
  - Passes:          2
  - Failures:        1
  - Pending:         0
  - Duration:        10 seconds
  - Screenshots:     1
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/uncaught hook error should continue to fire all mocha events -- s1 -- does not run -- before each hook.png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (0 seconds)


  (All Done)

`
