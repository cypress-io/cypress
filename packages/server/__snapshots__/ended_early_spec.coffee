exports['e2e ended early failing 1'] = `Error: connect ECONNREFUSED 127.0.0.1:1234
 > The local API server isn't running in development. This may cause problems running the GUI.

-----------------------------------------------------------------------------------
You are using an older version of the CLI tools.

Please update the CLI tools by running: npm install -g cypress-cli
-----------------------------------------------------------------------------------

Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)


  ending early
    ✓ does not end early
    ✓ does end early (123ms)
    1) does end early


  2 passing (123ms)
  1 failing

  1) ending early does end early:
     CypressError: Oops, Cypress detected something wrong with your test code.

The test has finished but Cypress still has commands in its queue.
The 3 queued commands that have not yet run are:

- cy.then('...')
- cy.noop('...')
- cy.wrap('...')

In every situation we've seen, this has been caused by programmer error.
Most often this indicates a race condition due to a forgotten 'return' or from commands in a previously run test bleeding into the current test.

For a much more thorough explanation including examples please review this error here:

https://on.cypress.io/command-queue-ended-early
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

  - Tests:           3
  - Passes:          2
  - Failures:        1
  - Pending:         0
  - Duration:        10 seconds
  - Screenshots:     1
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/ending early -- does end early.png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (0 seconds)


  (All Done)

`

