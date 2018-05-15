exports['e2e task fails 1'] = `
Started video recording: /foo/bar/.projects/task-not-registered/cypress/videos/abc123.mp4

  (Tests Starting)


  1) fails because the 'task' event is not registered in plugins file

  0 passing
  1 failing

  1)  fails because the 'task' event is not registered in plugins file:
     CypressError: cy.task('some:task') failed with the following error:

The 'task' event has not been registered in the plugins file. You must register it before using cy.task()

Fix this in your plugins file here:
/foo/bar/.projects/task-not-registered/cypress/plugins/index.js

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




  (Tests Finished)

  - Tests:           1
  - Passes:          0
  - Failures:        1
  - Pending:         0
  - Skipped:         0
  - Duration:        10 seconds
  - Screenshots:     1
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Screenshots)

  - /foo/bar/.projects/task-not-registered/cypress/screenshots/fails because the task event is not registered in plugins file.png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/task-not-registered/cypress/videos/abc123.mp4 (0 seconds)


  (All Done)

`

