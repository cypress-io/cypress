exports['e2e commands outside of test passes 1'] = `Error: connect ECONNREFUSED 127.0.0.1:1234
 > The local API server isn't running in development. This may cause problems running the GUI.

-----------------------------------------------------------------------------------
You are using an older version of the CLI tools.

Please update the CLI tools by running: npm install -g cypress-cli
-----------------------------------------------------------------------------------

Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)


  1) An uncaught error was detected outside of a test
  No Running Test
    ✓ foo
    ✓ bar


  2 passing (123ms)
  1 failing

  1)  An uncaught error was detected outside of a test:
     Uncaught CypressError: Cannot call "cy.viewport()" outside a running test.

This usually happens when you accidentally write commands outside an it(...) test.

If that is the case, just move these commands inside an it(...) test.

Check your test file for errors.

https://on.cypress.io/cannot-execute-commands-outside-test

Cypress could not associate this error to any specific test.

We dynamically generated a new test to display this failure.
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line




  (Tests Finished)

  - Tests:           3
  - Passes:          2
  - Failures:        1
  - Pending:         0
  - Duration:        10 seconds
  - Screenshots:     1
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/An uncaught error was detected outside of a test.png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (0 seconds)


  (All Done)

`
