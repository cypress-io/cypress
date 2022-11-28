exports['e2e js error handling / fails'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (js_error_handling_failing.cy.js)                                          │
  │ Searched:   cypress/e2e/js_error_handling_failing.cy.js                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  js_error_handling_failing.cy.js                                                 (1 of 1)


  s1
    without an afterEach hook
      1) t1
      2) t2
      ✓ t3
    with an afterEach hook
      3) t4
      4) t5
      ✓ t6
    cross origin script errors
      5) explains where script errored
    bad gzipped content
      ✓ destroys the request socket


  3 passing
  5 failing

  1) s1
       without an afterEach hook
         t1:
     ReferenceError: The following error originated from your application code, not from Cypress.

  > foo is not defined

When Cypress detects uncaught errors originating from your application it will automatically fail the current test.

This behavior is configurable, and you can choose to turn this off by listening to the \`uncaught:exception\` event.

https://on.cypress.io/uncaught-exception-from-application
      [stack trace lines]

  2) s1
       without an afterEach hook
         t2:
     ReferenceError: The following error originated from your application code, not from Cypress.

  > bar is not defined

When Cypress detects uncaught errors originating from your application it will automatically fail the current test.

This behavior is configurable, and you can choose to turn this off by listening to the \`uncaught:exception\` event.

https://on.cypress.io/uncaught-exception-from-application
      [stack trace lines]

  3) s1
       with an afterEach hook
         t4:
     ReferenceError: The following error originated from your application code, not from Cypress.

  > foo is not defined

When Cypress detects uncaught errors originating from your application it will automatically fail the current test.

This behavior is configurable, and you can choose to turn this off by listening to the \`uncaught:exception\` event.

https://on.cypress.io/uncaught-exception-from-application
      [stack trace lines]

  4) s1
       with an afterEach hook
         t5:
     Error: baz
      [stack trace lines]

  5) s1
       cross origin script errors
         explains where script errored:
     Error: The following error originated from your application code, not from Cypress.

  > Script error.

Cypress detected that an uncaught error was thrown from a cross origin script.

We cannot provide you the stack trace, line number, or file where this error occurred.

Check your Developer Tools Console for the actual error - it should be printed there.

It's possible to enable debugging these scripts by adding the \`crossorigin\` attribute and setting a CORS header.

When Cypress detects uncaught errors originating from your application it will automatically fail the current test.

This behavior is configurable, and you can choose to turn this off by listening to the \`uncaught:exception\` event.

https://on.cypress.io/uncaught-exception-from-application

https://on.cypress.io/cross-origin-script-error

  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        8                                                                                │
  │ Passing:      3                                                                                │
  │ Failing:      5                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  5                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     js_error_handling_failing.cy.js                                                  │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/js_error_handling_failing.cy.js/s1 -- without a     (1280x720)
     n afterEach hook -- t1 (failed).png                                                            
  -  /XXX/XXX/XXX/cypress/screenshots/js_error_handling_failing.cy.js/s1 -- without a     (1280x720)
     n afterEach hook -- t2 (failed).png                                                            
  -  /XXX/XXX/XXX/cypress/screenshots/js_error_handling_failing.cy.js/s1 -- with an a     (1280x720)
     fterEach hook -- t4 (failed).png                                                               
  -  /XXX/XXX/XXX/cypress/screenshots/js_error_handling_failing.cy.js/s1 -- with an a     (1280x720)
     fterEach hook -- t5 (failed).png                                                               
  -  /XXX/XXX/XXX/cypress/screenshots/js_error_handling_failing.cy.js/s1 -- cross ori     (1280x720)
     gin script errors -- explains where script errored (failed).png                                


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  js_error_handling_failing.cy.js          XX:XX        8        3        5        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        8        3        5        -        -  


`
