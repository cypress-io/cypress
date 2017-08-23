exports['e2e js error handling fails 1'] = `Error: connect ECONNREFUSED 127.0.0.1:1234
 > The local API server isn't running in development. This may cause problems running the GUI.

-----------------------------------------------------------------------------------
You are using an older version of the CLI tools.

Please update the CLI tools by running: npm install -g cypress-cli
-----------------------------------------------------------------------------------

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


  2 passing (123ms)
  5 failing

  1) s1 without an afterEach hook t1:
     Uncaught ReferenceError: foo is not defined
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
      at stack trace line
      at stack trace line
      at stack trace line

  4) s1 with an afterEach hook t5:
     Error: baz
      at stack trace line

  5) s1 cross origin script errors explains where script errored:
     Uncaught Error: Script error.

Cypress detected that an uncaught error was thrown from a cross origin script.

We cannot provide you the stack trace, line number, or file where this error occured.

Check your Developer Tools Console for the actual error - it should be printed there.

It's possible to enable debugging these scripts by adding the 'crossorigin' attribute and setting a CORS header.

https://on.cypress.io/cross-origin-script-error
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

  - /foo/bar/.projects/any-e2e-project/cypress/screenshots/s1 -- without an afterEach hook -- t1.png (1280x720)
  - /foo/bar/.projects/any-e2e-project/cypress/screenshots/s1 -- without an afterEach hook -- t2.png (1280x720)
  - /foo/bar/.projects/any-e2e-project/cypress/screenshots/s1 -- with an afterEach hook -- t4.png (1280x720)
  - /foo/bar/.projects/any-e2e-project/cypress/screenshots/s1 -- with an afterEach hook -- t5.png (1280x720)
  - /foo/bar/.projects/any-e2e-project/cypress/screenshots/s1 -- cross origin script errors -- explains where script errored.png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (0 seconds)


  (All Done)

`

