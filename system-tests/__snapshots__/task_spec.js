exports['e2e task merges task events on subsequent registrations and logs warning for conflicts 1'] = `
Warning: Multiple attempts to register the following task(s):

 - two

Only the last attempt will be registered.

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (multiple_task_registrations.cy.js)                                        │
  │ Searched:   cypress/e2e/multiple_task_registrations.cy.js                                      │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  multiple_task_registrations.cy.js                                               (1 of 1)


  ✓ merges task events

  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     multiple_task_registrations.cy.js                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  multiple_task_registrations.cy.js        XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


`

exports['e2e task handles undefined return and includes stack trace in error 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (task.cy.js)                                                               │
  │ Searched:   cypress/e2e/task.cy.js                                                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  task.cy.js                                                                      (1 of 1)


  1) throws when task returns undefined
  2) includes stack trace in error

  0 passing
  2 failing

  1) throws when task returns undefined:
     CypressError: \`cy.task('returns:undefined')\` failed with the following error:

The task 'returns:undefined' returned undefined. You must return a value, null, or a promise that resolves to a value or null to indicate that the task was handled.

The task handler was:

'returns:undefined' () {}

Fix this in your setupNodeEvents method here:
/foo/bar/.projects/e2e/cypress.config.js

https://on.cypress.io/api/task
      [stack trace lines]

  2) includes stack trace in error:
     CypressError: \`cy.task('errors')\` failed with the following error:

> Error thrown in task handler

https://on.cypress.io/api/task
      [stack trace lines]
  
  From Node.js Internals:
    Error: Error thrown in task handler
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      2                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  2                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     task.cy.js                                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/task.cy.js/throws when task returns undefined (     (1280x720)
     failed).png                                                                                    
  -  /XXX/XXX/XXX/cypress/screenshots/task.cy.js/includes stack trace in error (faile     (1280x720)
     d).png                                                                                         


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  task.cy.js                               XX:XX        2        -        2        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        2        -        2        -        -  


`
