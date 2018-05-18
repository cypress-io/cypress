exports['e2e promises failing1 1'] = `
====================================================================================================

  (Run Starting)


  1) catches regular promise errors
  2) catches promise errors and calls done with err even when async

  0 passing
  2 failing

  1)  catches regular promise errors:
     Error: bar
      at stack trace line

  2)  catches promise errors and calls done with err even when async:
     Error: foo
      at stack trace line
      at stack trace line




  (Results)

  - Tests:           2
  - Passes:          0
  - Failures:        2
  - Pending:         0
  - Skipped:         0
  - Duration:        10 seconds
  - Screenshots:     2
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/catches regular promise errors.png (1280x720)
  - /foo/bar/.projects/e2e/cypress/screenshots/catches promise errors and calls done with err even when async.png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


  (All Done)

`

