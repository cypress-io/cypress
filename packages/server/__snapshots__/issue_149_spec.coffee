exports['e2e issue 149 failing 1'] = `
Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)


  1) fails
  ✓ executes more commands

  1 passing
  1 failing

  1)  fails:
     Error: this should fail here
      at stack trace line




  (Tests Finished)

  - Tests:           2
  - Passes:          1
  - Failures:        1
  - Pending:         0
  - Duration:        10 seconds
  - Screenshots:     1
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/fails.png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (0 seconds)


  (All Done)

`
