exports['e2e browserify, babel, es2015 passes 1'] = `
Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)


  imports work
    ✓ foo coffee
    ✓ bar babel
    ✓ dom jsx


  3 passing


  (Tests Finished)

  - Tests:           3
  - Passes:          3
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

exports['e2e browserify, babel, es2015 fails 1'] = `
Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)
Oops...we found an error preparing this test file:

  /foo/bar/.projects/e2e/cypress/integration/browserify_babel_es2015_failing_spec.js

The error was:

SyntaxError: /foo/bar/.projects/e2e/lib/fail.js: Unexpected token, expected { (1:7)
> 1 | export defalt "foo"
    |        ^


This occurred while Cypress was compiling and bundling your test code. This is usually caused by:

- A missing file or dependency
- A syntax error in the file or one of its dependencies

Fix the error in your code and re-run your tests.

  (Tests Finished)

  - Tests:           0
  - Passes:          0
  - Failures:        1
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

