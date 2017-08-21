exports['e2e iframes passes 1'] = `Error: connect ECONNREFUSED 127.0.0.1:1234
 > The local API server isn't running in development. This may cause problems running the GUI.

-----------------------------------------------------------------------------------
You are using an older version of the CLI tools.

Please update the CLI tools by running: npm install -g cypress-cli
-----------------------------------------------------------------------------------

Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)


  iframes
    ✓ can snapshot iframes which arent loaded (123ms)
    ✓ can access nested iframes over http server (123ms)
    ✓ can access iframes over file server (123ms)
    ✓ does not throw on cross origin iframes (123ms)
    ✓ continues to inject even on 5xx responses (123ms)
    ✓ injects on file server 4xx errors (123ms)
    ✓ injects on http request errors (123ms)
    ✓ does not inject into xhr's (123ms)


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

