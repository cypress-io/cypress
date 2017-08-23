exports['e2e stdout displays errors from failures 1'] = `Error: connect ECONNREFUSED 127.0.0.1:1234
 > The local API server isn't running in development. This may cause problems running the GUI.

-----------------------------------------------------------------------------------
You are using an older version of the CLI tools.

Please update the CLI tools by running: npm install -g cypress-cli
-----------------------------------------------------------------------------------

Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)


  stdout_failing_spec
    ✓ passes
    1) fails
    ✓ doesnt fail
    failing hook
      2) "before each" hook for "is failing"
    passing hook
      3) is failing


  2 passing (123ms)
  3 failing

  1) stdout_failing_spec fails:
     Error: foo
      at stack trace line

  2) stdout_failing_spec failing hook "before each" hook for "is failing":
     CypressError: cy.visit() failed trying to load:

/does-not-exist.html

We failed looking for this file at stack trace line

/foo/bar/.projects/e2e/does-not-exist.html

The internal Cypress web server responded with:

  > 404: Not Found



Because this error occured during a 'before each' hook we are skipping the remaining tests in the current suite: 'failing hook'
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

  3) stdout_failing_spec passing hook is failing:
     CypressError: cy.visit() failed trying to load:

/does-not-exist.html

We failed looking for this file at stack trace line

/foo/bar/.projects/e2e/does-not-exist.html

The internal Cypress web server responded with:

  > 404: Not Found


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

  - Tests:           4
  - Passes:          2
  - Failures:        3
  - Pending:         0
  - Duration:        10 seconds
  - Screenshots:     3
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/stdout_failing_spec -- fails.png (1280x720)
  - /foo/bar/.projects/e2e/cypress/screenshots/stdout_failing_spec -- failing hook -- is failing.png (1280x720)
  - /foo/bar/.projects/e2e/cypress/screenshots/stdout_failing_spec -- passing hook -- is failing.png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (0 seconds)


  (All Done)

`

exports['e2e stdout displays errors from exiting early due to bundle errors 1'] = `Error: connect ECONNREFUSED 127.0.0.1:1234
 > The local API server isn't running in development. This may cause problems running the GUI.

-----------------------------------------------------------------------------------
You are using an older version of the CLI tools.

Please update the CLI tools by running: npm install -g cypress-cli
-----------------------------------------------------------------------------------

Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)
Oops...we found an error preparing this test file:

  /foo/bar/.projects/e2e/cypress/integration/stdout_exit_early_failing_spec.coffee

The error was:

/foo/bar/.projects/e2e/cypress/integration/stdout_exit_early_failing_spec.coffee:1
+>
 ^
ParseError: unexpected >
    (No stack trace)


This occurred while Cypress was compiling and bundling your test code. This is usually caused by:

- A missing file or dependency
- A syntax error in the file or one of its dependencies

Fix the error in your code and re-run your tests.

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
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (0 seconds)


  (All Done)

`

exports['e2e stdout does not duplicate suites or tests between visits 1'] = `Error: connect ECONNREFUSED 127.0.0.1:1234
 > The local API server isn't running in development. This may cause problems running the GUI.

-----------------------------------------------------------------------------------
You are using an older version of the CLI tools.

Please update the CLI tools by running: npm install -g cypress-cli
-----------------------------------------------------------------------------------

Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)


  stdout_passing_spec
    file
      ✓ visits file (123ms)
    google
      ✓ visits google (123ms)
      ✓ google2
    apple
      ✓ apple1
      ✓ visits apple (123ms)
    subdomains
      ✓ cypress1
      ✓ visits cypress (123ms)
      ✓ cypress3


  8 passing (123ms)


  (Tests Finished)

  - Tests:           8
  - Passes:          8
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

