exports['e2e return value failing1 1'] = `
Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Run Starting)


  1) errors when invoking commands and return a different value
  2) errors when invoking commands in custom command and returning differnet value

  0 passing
  2 failing

  1)  errors when invoking commands and return a different value:
     CypressError: Cypress detected that you invoked one or more cy commands but returned a different value.

The return value was:

  > {}, 1, 2, foo, function(){}

Because cy commands are asynchronous and are queued to be run later, it doesn't make sense to return anything else.

For convenience, you can also simply omit any return value or return 'undefined' and Cypress will not error.

In previous versions of Cypress we automatically detected this and forced the cy commands to be returned. To make things less magical and clearer, we are now throwing an error.

https://on.cypress.io/returning-value-and-commands-in-test
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line

  2)  errors when invoking commands in custom command and returning differnet value:
     CypressError: Cypress detected that you invoked one or more cy commands in a custom command but returned a different value.

The custom command was:

  > cy.foo()

The return value was:

  > bar

Because cy commands are asynchronous and are queued to be run later, it doesn't make sense to return anything else.

For convenience, you can also simply omit any return value or return 'undefined' and Cypress will not error.

In previous versions of Cypress we automatically detected this and forced the cy commands to be returned. To make things less magical and clearer, we are now throwing an error.

https://on.cypress.io/returning-value-and-commands-in-custom-command
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
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

  - /foo/bar/.projects/e2e/cypress/screenshots/errors when invoking commands and return a different value.png (1280x720)
  - /foo/bar/.projects/e2e/cypress/screenshots/errors when invoking commands in custom command and returning differnet value.png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


  (All Done)

`

