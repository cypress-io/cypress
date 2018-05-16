exports['e2e task fails 1'] = `
Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)


  1) throws when task returns undefined
  2) includes stack trace in error

  0 passing
  2 failing

  1)  throws when task returns undefined:
     CypressError: cy.task('returns:undefined') failed with the following error:

The task 'returns:undefined' returned undefined. You must return a promise, a value, or null to indicate that the task was handled.

The task handler was:

returns:undefined() {}

Fix this in your plugins file here:
/foo/bar/.projects/e2e/cypress/plugins/index.js

https://on.cypress.io/api/task
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

  2)  includes stack trace in error:
     CypressError: cy.task('errors') failed with the following error:

> Error: Error thrown in task handler
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

  - Tests:           2
  - Passes:          0
  - Failures:        2
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

