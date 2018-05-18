exports['e2e issue 674 fails 1'] = `
Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Run Starting)


  issue 674
    1) "before each" hook for "doesn't hang when both beforeEach and afterEach fail"
    2) "after each" hook for "doesn't hang when both beforeEach and afterEach fail"


  0 passing
  2 failing

  1) issue 674 "before each" hook for "doesn't hang when both beforeEach and afterEach fail":
     Error: 

Because this error occurred during a 'before each' hook we are skipping the remaining tests in the current suite: 'issue 674'
      at stack trace line

  2) issue 674 "after each" hook for "doesn't hang when both beforeEach and afterEach fail":
     Error: 

Because this error occurred during a 'after each' hook we are skipping the remaining tests in the current suite: 'issue 674'
      at stack trace line




  (Results)

  - Tests:           1
  - Passes:          0
  - Failures:        1
  - Pending:         0
  - Skipped:         0
  - Duration:        10 seconds
  - Screenshots:     2
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/issue 674 -- doesnt hang when both beforeEach and afterEach fail -- before each hook.png (1280x720)
  - /foo/bar/.projects/e2e/cypress/screenshots/issue 674 -- doesnt hang when both beforeEach and afterEach fail -- after each hook.png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


  (All Done)

`

