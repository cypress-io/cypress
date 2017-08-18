exports['e2e screenshots passes 1'] = `Error: connect ECONNREFUSED 127.0.0.1:1234
 > The local API server isn't running in development. This may cause problems running the GUI.

-----------------------------------------------------------------------------------
You are using an older version of the CLI tools.

Please update the CLI tools by running: npm install -g cypress-cli
-----------------------------------------------------------------------------------

Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)


  taking screenshots
    ✓ manually generates pngs (123ms)
    ✓ can nest screenshots in folders (123ms)
    1) generates pngs on failure


  2 passing (123ms)
  1 failing

  1) taking screenshots generates pngs on failure:
     Error: fail whale
      at stack trace line




  (Tests Finished)

  - Tests:           3
  - Passes:          2
  - Failures:        1
  - Pending:         0
  - Duration:        10 seconds
  - Screenshots:     4
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/black.png (1280x720)
  - /foo/bar/.projects/e2e/cypress/screenshots/red.png (1280x720)
  - /foo/bar/.projects/e2e/cypress/screenshots/foobarbaz.png (1280x720)
  - /foo/bar/.projects/e2e/cypress/screenshots/taking screenshots -- generates pngs on failure.png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (0 seconds)


  (All Done)

`

