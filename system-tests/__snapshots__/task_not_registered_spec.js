exports['e2e task fails 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (task_not_registered.cy.js)                                                │
  │ Searched:   cypress/e2e/task_not_registered.cy.js                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  task_not_registered.cy.js                                                       (1 of 1)


  1) fails because the "task" event is not registered in setupNodeEvents method

  0 passing
  1 failing

  1) fails because the "task" event is not registered in setupNodeEvents method:
     CypressError: \`cy.task('some:task')\` failed with the following error:

The 'task' event has not been registered in the setupNodeEvents method. You must register it before using cy.task()

Fix this in your setupNodeEvents method here:
/foo/bar/.projects/task-not-registered/cypress.config.js

https://on.cypress.io/api/task
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     task_not_registered.cy.js                                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/task_not_registered.cy.js/fails because the tas          (YxX)
     k event is not registered in setupNodeEvents method (failed).png                               


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  task_not_registered.cy.js                XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1        -        1        -        -  


`
