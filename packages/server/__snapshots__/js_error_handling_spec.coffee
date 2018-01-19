exports['e2e js error handling fails 1'] = `
Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)


  s1
    without an afterEach hook
      1) t1
      2) t2
      ✓ t3
    with an afterEach hook
      3) t4
      4) t5
      ✓ t6
    cross origin script errors
      5) explains where script errored


  2 passing
  5 failing

  1) s1 without an afterEach hook t1:
     Uncaught ReferenceError: foo is not defined

This error originated from your application code, not from Cypress.

When Cypress detects uncaught errors originating from your application it will automatically fail the current test.

This behavior is configurable, and you can choose to turn this off by listening to the 'uncaught:exception' event.

https://on.cypress.io/uncaught-exception-from-application
      at stack trace line
      at stack trace line
      at stack trace line

  2) s1 without an afterEach hook t2:
     ReferenceError: bar is not defined
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line

  3) s1 with an afterEach hook t4:
     Uncaught ReferenceError: foo is not defined

This error originated from your application code, not from Cypress.

When Cypress detects uncaught errors originating from your application it will automatically fail the current test.

This behavior is configurable, and you can choose to turn this off by listening to the 'uncaught:exception' event.

https://on.cypress.io/uncaught-exception-from-application
      at stack trace line
      at stack trace line
      at stack trace line

  4) s1 with an afterEach hook t5:
     Error: baz
      at stack trace line

  5) s1 cross origin script errors explains where script errored:
     Uncaught Error: Script error.

Cypress detected that an uncaught error was thrown from a cross origin script.

We cannot provide you the stack trace, line number, or file where this error occurred.

Check your Developer Tools Console for the actual error - it should be printed there.

It's possible to enable debugging these scripts by adding the 'crossorigin' attribute and setting a CORS header.

https://on.cypress.io/cross-origin-script-error

This error originated from your application code, not from Cypress.

When Cypress detects uncaught errors originating from your application it will automatically fail the current test.

This behavior is configurable, and you can choose to turn this off by listening to the 'uncaught:exception' event.

https://on.cypress.io/uncaught-exception-from-application
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line




  (Tests Finished)

  - Tests:           7
  - Passes:          2
  - Failures:        5
  - Pending:         0
  - Duration:        10 seconds
  - Screenshots:     5
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/s1 -- without an afterEach hook -- t1.png (1280x720)
  - /foo/bar/.projects/e2e/cypress/screenshots/s1 -- without an afterEach hook -- t2.png (1280x720)
  - /foo/bar/.projects/e2e/cypress/screenshots/s1 -- with an afterEach hook -- t4.png (1280x720)
  - /foo/bar/.projects/e2e/cypress/screenshots/s1 -- with an afterEach hook -- t5.png (1280x720)
  - /foo/bar/.projects/e2e/cypress/screenshots/s1 -- cross origin script errors -- explains where script errored.png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (0 seconds)


  (All Done)

`
