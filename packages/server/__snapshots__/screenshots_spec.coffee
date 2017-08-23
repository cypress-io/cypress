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
    before hooks
      2) "before all" hook for "empty test 1"
    each hooks
      3) "before each" hook for "empty test 2"
      4) "after each" hook for "empty test 2"


  2 passing (123ms)
  4 failing

  1) taking screenshots generates pngs on failure:
     Error: fail whale
      at stack trace line

  2) taking screenshots before hooks "before all" hook for "empty test 1":
     Error: before hook failing

Because this error occurred during a 'before all' hook we are skipping the remaining tests in the current suite: 'before hooks'
      at stack trace line

  3) taking screenshots each hooks "before each" hook for "empty test 2":
     Error: before each hook failed

Because this error occurred during a 'before each' hook we are skipping the remaining tests in the current suite: 'each hooks'
      at stack trace line

  4) taking screenshots each hooks "after each" hook for "empty test 2":
     Error: after each hook failed

Because this error occurred during a 'after each' hook we are skipping the remaining tests in the current suite: 'each hooks'
      at stack trace line




  (Tests Finished)

  - Tests:           3
  - Passes:          2
  - Failures:        4
  - Pending:         0
  - Duration:        10 seconds
  - Screenshots:     7
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Screenshots)

  - /foo/bar/.projects/any-e2e-project/cypress/screenshots/black.png (1280x720)
  - /foo/bar/.projects/any-e2e-project/cypress/screenshots/red.png (1280x720)
  - /foo/bar/.projects/any-e2e-project/cypress/screenshots/foobarbaz.png (1280x720)
  - /foo/bar/.projects/any-e2e-project/cypress/screenshots/taking screenshots -- generates pngs on failure.png (1280x720)
  - /foo/bar/.projects/any-e2e-project/cypress/screenshots/taking screenshots -- before hooks -- empty test 1 -- before all hook.png (1280x720)
  - /foo/bar/.projects/any-e2e-project/cypress/screenshots/taking screenshots -- each hooks -- empty test 2 -- before each hook.png (1280x720)
  - /foo/bar/.projects/any-e2e-project/cypress/screenshots/taking screenshots -- each hooks -- empty test 2 -- after each hook.png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (0 seconds)


  (All Done)

`

