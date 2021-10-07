exports['e2e task fails 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (task_not_registered_spec.js)                                              │
  │ Searched:   cypress/integration/task_not_registered_spec.js                                    │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  task_not_registered_spec.js                                                     (1 of 1)


  1) fails because the "task" event is not registered in plugins file

  0 passing
  1 failing

  1) fails because the "task" event is not registered in plugins file:
     CypressError: \`cy.task('some:task')\` failed with the following error:

The 'task' event has not been registered in the plugins file. You must register it before using cy.task()

Fix this in your plugins file here:
/foo/bar/.projects/task-not-registered/cypress/plugins/index.js

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
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     task_not_registered_spec.js                                                      │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/task_not_registered_spec.js/fails because the t          (YxX)
     ask event is not registered in plugins file (failed).png                                       


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/task_not_registered_spec.js.mp4     (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  task_not_registered_spec.js              XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1        -        1        -        -  


`
