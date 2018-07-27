exports['e2e task fails 1'] = `
====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (task_spec.coffee)                                                         │
  │ Searched:   cypress/integration/task_spec.coffee                                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: task_spec.coffee...                                                             (1 of 1) 


  1) throws when task returns undefined
  2) includes stack trace in error

  0 passing
  2 failing

  1)  throws when task returns undefined:
     CypressError: cy.task('returns:undefined') failed with the following error:

The task 'returns:undefined' returned undefined. You must return a promise, a value, or null to indicate that the task was handled.

The task handler was:

returns:undefined() {}

Fix this in your plugins file here:
/foo/bar/.projects/e2e/cypress/plugins/index.js

https://on.cypress.io/api/task
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

  2)  includes stack trace in error:
     CypressError: cy.task('errors') failed with the following error:

> Error: Error thrown in task handler
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
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line




  (Results)

  ┌────────────────────────────────┐
  │ Tests:        2                │
  │ Passing:      0                │
  │ Failing:      2                │
  │ Pending:      0                │
  │ Skipped:      0                │
  │ Screenshots:  2                │
  │ Video:        true             │
  │ Duration:     X seconds        │
  │ Spec Ran:     task_spec.coffee │
  └────────────────────────────────┘


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/task_spec.coffee/throws when task returns undefined (failed).png (1280x720)
  - /foo/bar/.projects/e2e/cypress/screenshots/task_spec.coffee/includes stack trace in error (failed).png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖ task_spec.coffee                          XX:XX        2        -        2        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    1 of 1 failed (100%)                        XX:XX        2        -        2        -        -  

`

