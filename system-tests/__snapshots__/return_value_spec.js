exports['e2e return value failing1 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (return_value.cy.js)                                                       │
  │ Searched:   cypress/e2e/return_value.cy.js                                                     │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  return_value.cy.js                                                              (1 of 1)


  1) errors when invoking commands and return a different value
  2) errors when invoking commands in custom command and returning different value
  3) errors when not invoking commands, invoking done callback, and returning a promise

  0 passing
  3 failing

  1) errors when invoking commands and return a different value:
     CypressError: Cypress detected that you invoked one or more cy commands but returned a different value.

The return value was:

> {}, 1, 2, foo, function(){}

Because cy commands are asynchronous and are queued to be run later, it doesn't make sense to return anything else.

For convenience, you can also simply omit any return value or return \`undefined\` and Cypress will not error.

In previous versions of Cypress we automatically detected this and forced the cy commands to be returned. To make things less magical and clearer, we are now throwing an error.

https://on.cypress.io/returning-value-and-commands-in-test
      [stack trace lines]

  2) errors when invoking commands in custom command and returning different value:
     CypressError: Cypress detected that you invoked one or more cy commands in a custom command but returned a different value.

The custom command was:

  > \`cy.foo()\`

The return value was:

  > bar

Because cy commands are asynchronous and are queued to be run later, it doesn't make sense to return anything else.

For convenience, you can also simply omit any return value or return \`undefined\` and Cypress will not error.

In previous versions of Cypress we automatically detected this and forced the cy commands to be returned. To make things less magical and clearer, we are now throwing an error.

https://on.cypress.io/returning-value-and-commands-in-custom-command
      [stack trace lines]

  3) errors when not invoking commands, invoking done callback, and returning a promise:
     Error: Cypress detected that you returned a promise in a test, but also invoked a done callback. Return a promise -or- invoke a done callback, not both.

Original mocha error:

Error: Resolution method is overspecified. Specify a callback *or* return a Promise; not both.
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        3                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      3                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  3                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     return_value.cy.js                                                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/return_value.cy.js/errors when invoking command     (1280x720)
     s and return a different value (failed).png                                                    
  -  /XXX/XXX/XXX/cypress/screenshots/return_value.cy.js/errors when invoking command     (1280x720)
     s in custom command and returning different value (failed).png                                 
  -  /XXX/XXX/XXX/cypress/screenshots/return_value.cy.js/errors when not invoking com     (1280x720)
     mands, invoking done callback, and returning a promise (failed).png                            


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  return_value.cy.js                       XX:XX        3        -        3        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        3        -        3        -        -  


`
