exports['e2e cookies passes 1'] = `
Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)


  cookies
    ✓ can get all cookies
    ✓ resets cookies between tests correctly
    ✓ should be only two left now
    ✓ sends cookies to localhost:2121
    ✓ handles expired cookies
    ✓ issue: #224 sets expired cookies between redirects


  6 passing


  (Tests Finished)

  - Tests:           6
  - Passes:          6
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
