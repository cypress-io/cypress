exports['e2e iframes passes 1'] = `
====================================================================================================

  (Run Starting)


  iframes
    ✓ can snapshot iframes which arent loaded
    ✓ can access nested iframes over http server
    ✓ can access iframes over file server
    ✓ does not throw on cross origin iframes
    ✓ continues to inject even on 5xx responses
    ✓ injects on file server 4xx errors
    ✓ injects on http request errors
    ✓ does not inject into xhr's


  8 passing


  (Results)

  - Tests:           8
  - Passes:          8
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

