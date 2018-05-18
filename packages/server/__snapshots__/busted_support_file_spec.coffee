exports['e2e busted support file passes 1'] = `
Started video recording: /foo/bar/.projects/busted-support-file/cypress/videos/abc123.mp4

  (Run Starting)
Oops...we found an error preparing this test file:

  /foo/bar/.projects/busted-support-file/cypress/support/index.js

The error was:

Error: Cannot find module './does/not/exist' from '/foo/bar/.projects/busted-support-file/cypress/support'


This occurred while Cypress was compiling and bundling your test code. This is usually caused by:

- A missing file or dependency
- A syntax error in the file or one of its dependencies

Fix the error in your code and re-run your tests.

  (Results)

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
  - Finished processing:  /foo/bar/.projects/busted-support-file/cypress/videos/abc123.mp4 (0 seconds)


  (Run Finished)

`

