exports['e2e record passing passes 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      4 found (record_error_spec.coffee, record_fail_spec.coffee, record_pass_spec.coffe │
  │             e, record_uncaught_spec.coffee)                                                    │
  │ Searched:   cypress/integration/record*                                                        │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_error_spec.coffee                                                        (1 of 4)
  Estimated: 8 seconds

Oops...we found an error preparing this test file:

  cypress/integration/record_error_spec.coffee

The error was:

Error: Webpack Compilation Error
./cypress/integration/record_error_spec.coffee
Module not found: Error: Can't resolve '../it/does/not/exist' in '/foo/bar/.projects/e2e/cypress/integration'
Looked for and couldn't find the file at the following paths:
[/foo/bar/.projects/e2e/cypress/it/does/not/exist]
[/foo/bar/.projects/e2e/cypress/it/does/not/exist.js]
[/foo/bar/.projects/e2e/cypress/it/does/not/exist.json]
[/foo/bar/.projects/e2e/cypress/it/does/not/exist.jsx]
[/foo/bar/.projects/e2e/cypress/it/does/not/exist.mjs]
[/foo/bar/.projects/e2e/cypress/it/does/not/exist.coffee]
[/foo/bar/.projects/e2e/cypress/it/does/not/exist.ts]
[/foo/bar/.projects/e2e/cypress/it/does/not/exist.tsx]
 @ ./cypress/integration/record_error_spec.coffee 1:0-31

This occurred while Cypress was compiling and bundling your test code. This is usually caused by:

- A missing file or dependency
- A syntax error in the file or one of its dependencies

Fix the error in your code and re-run your tests.

  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        0                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Estimated:    8 seconds                                                                        │
  │ Spec Ran:     record_error_spec.coffee                                                         │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/record_error_spec.coffee.mp4        (X second)


  (Uploading Results)

  - Done Uploading (1/1) /foo/bar/.projects/e2e/cypress/videos/record_error_spec.coffee.mp4

────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_fail_spec.coffee                                                         (2 of 4)
  Estimated: 8 seconds


  record fails
    1) "before each" hook for "fails 1"


  0 passing
  1 failing

  1) record fails
       "before each" hook for "fails 1":
     Error: foo

Because this error occurred during a \`before each\` hook we are skipping the remaining tests in the current suite: \`record fails\`
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      1                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Estimated:    8 seconds                                                                        │
  │ Spec Ran:     record_fail_spec.coffee                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_fail_spec.coffee/record fails -- fails 1     (1280x720)
      -- before each hook (failed).png                                                              


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/record_fail_spec.coffee.mp4         (X second)


  (Uploading Results)

  - Done Uploading (*/2) /foo/bar/.projects/e2e/cypress/screenshots/record_fail_spec.coffee/record fails -- fails 1 -- before each hook (failed).png
  - Done Uploading (*/2) /foo/bar/.projects/e2e/cypress/videos/record_fail_spec.coffee.mp4

────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_pass_spec.coffee                                                         (3 of 4)
  Estimated: 8 seconds


  record pass
    ✓ passes
    - is pending


  1 passing
  1 pending


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      1                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Estimated:    8 seconds                                                                        │
  │ Spec Ran:     record_pass_spec.coffee                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_pass_spec.coffee/yay it passes.png           (202x1002)


  (Uploading Results)

  - Done Uploading (1/1) /foo/bar/.projects/e2e/cypress/screenshots/record_pass_spec.coffee/yay it passes.png

────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_uncaught_spec.coffee                                                     (4 of 4)
  Estimated: 8 seconds


  1) An uncaught error was detected outside of a test

  0 passing
  1 failing

  1) An uncaught error was detected outside of a test:
     Error: The following error originated from your test code, not from Cypress.

  > instantly fails

When Cypress detects uncaught errors originating from your test code it will automatically fail the current test.

Cypress could not associate this error to any specific test.

We dynamically generated a new test to display this failure.
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
  │ Estimated:    8 seconds                                                                        │
  │ Spec Ran:     record_uncaught_spec.coffee                                                      │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_uncaught_spec.coffee/An uncaught error w     (1280x720)
     as detected outside of a test (failed).png                                                     


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/record_uncaught_spec.coffee.mp4     (X second)


  (Uploading Results)

  - Done Uploading (*/2) /foo/bar/.projects/e2e/cypress/screenshots/record_uncaught_spec.coffee/An uncaught error was detected outside of a test (failed).png
  - Done Uploading (*/2) /foo/bar/.projects/e2e/cypress/videos/record_uncaught_spec.coffee.mp4

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  record_error_spec.coffee                 XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  record_fail_spec.coffee                  XX:XX        2        -        1        -        1 │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  record_pass_spec.coffee                  XX:XX        2        1        -        1        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  record_uncaught_spec.coffee              XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  3 of 4 failed (75%)                      XX:XX        5        1        3        1        1  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12                                   


`

exports['e2e record api interaction errors project 404 errors and exits 1'] = `
We could not find a project with the ID: pid123

This projectId came from your 'cypress.json' file or an environment variable.

Please log into the Dashboard and find your project.

We will list the correct projectId in the 'Settings' tab.

Alternatively, you can create a new project using the Desktop Application.

https://on.cypress.io/dashboard

`

exports['e2e record api interaction errors create run 500 warns and does not create or update instances 1'] = `
Warning: We encountered an error talking to our servers.

This run will not be recorded.

This error will not alter the exit code.

StatusCodeError: 500 - "Internal Server Error"

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (record_pass_spec.coffee)                                                  │
  │ Searched:   cypress/integration/record_pass*                                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_pass_spec.coffee                                                         (1 of 1)


  record pass
    ✓ passes
    - is pending


  1 passing
  1 pending


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      1                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     record_pass_spec.coffee                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_pass_spec.coffee/yay it passes.png           (202x1002)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  record_pass_spec.coffee                  XX:XX        2        1        -        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        2        1        -        1        -  


`

exports['e2e record api interaction errors create instance does not update instance 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (record_pass_spec.coffee)                                                  │
  │ Searched:   cypress/integration/record_pass*                                                   │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘

Warning: We encountered an error talking to our servers.

This run will not be recorded.

This error will not alter the exit code.

StatusCodeError: 500 - "Internal Server Error"

────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_pass_spec.coffee                                                         (1 of 1)


  record pass
    ✓ passes
    - is pending


  1 passing
  1 pending


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      1                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     record_pass_spec.coffee                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_pass_spec.coffee/yay it passes.png           (202x1002)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  record_pass_spec.coffee                  XX:XX        2        1        -        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        2        1        -        1        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12                                   


`

exports['e2e record api interaction errors update instance does not update instance stdout 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (record_pass_spec.coffee)                                                  │
  │ Searched:   cypress/integration/record_pass*                                                   │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_pass_spec.coffee                                                         (1 of 1)
  Estimated: 8 seconds


  record pass
    ✓ passes
    - is pending


  1 passing
  1 pending


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      1                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Estimated:    8 seconds                                                                        │
  │ Spec Ran:     record_pass_spec.coffee                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_pass_spec.coffee/yay it passes.png           (202x1002)


  (Uploading Results)

Warning: We encountered an error talking to our servers.

This run will not be recorded.

This error will not alter the exit code.

StatusCodeError: 500 - "Internal Server Error"

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  record_pass_spec.coffee                  XX:XX        2        1        -        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        2        1        -        1        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12                                   


`

exports['e2e record api interaction errors update instance stdout warns but proceeds 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (record_pass_spec.coffee)                                                  │
  │ Searched:   cypress/integration/record_pass*                                                   │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_pass_spec.coffee                                                         (1 of 1)
  Estimated: 8 seconds


  record pass
    ✓ passes
    - is pending


  1 passing
  1 pending


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      1                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Estimated:    8 seconds                                                                        │
  │ Spec Ran:     record_pass_spec.coffee                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_pass_spec.coffee/yay it passes.png           (202x1002)


  (Uploading Results)

  - Done Uploading (1/1) /foo/bar/.projects/e2e/cypress/screenshots/record_pass_spec.coffee/yay it passes.png
Warning: We encountered an error talking to our servers.

This run will not be recorded.

This error will not alter the exit code.

StatusCodeError: 500 - "Internal Server Error"

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  record_pass_spec.coffee                  XX:XX        2        1        -        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        2        1        -        1        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12                                   


`

exports['e2e record recordKey errors and exits without recordKey 1'] = `
You passed the --record flag but did not provide us your Record Key.

You can pass us your Record Key like this:

  cypress run --record --key <record_key>

You can also set the key as an environment variable with the name CYPRESS_RECORD_KEY.

https://on.cypress.io/how-do-i-record-runs

`

exports['e2e record projectId errors and exits without projectId 1'] = `
You passed the --record flag but this project has not been setup to record.

This project is missing the 'projectId' inside of 'cypress.json'.

We cannot uniquely identify this project without this id.

You need to setup this project to record. This will generate a unique 'projectId'.

Alternatively if you omit the --record flag this project will run without recording.

https://on.cypress.io/recording-project-runs

`

exports['e2e record api interaction errors recordKey and projectId errors and exits on 401 1'] = `
Your Record Key f858a...ee7e1 is not valid with this project: pid123

It may have been recently revoked by you or another user.

Please log into the Dashboard to see the valid record keys.

https://on.cypress.io/dashboard/projects/pid123

`

exports['e2e record video recording does not upload when not enabled 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (record_pass_spec.coffee)                                                  │
  │ Searched:   cypress/integration/record_pass*                                                   │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_pass_spec.coffee                                                         (1 of 1)
  Estimated: 8 seconds


  record pass
    ✓ passes
    - is pending


  1 passing
  1 pending


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      1                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Estimated:    8 seconds                                                                        │
  │ Spec Ran:     record_pass_spec.coffee                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_pass_spec.coffee/yay it passes.png           (202x1002)


  (Uploading Results)

  - Done Uploading (1/1) /foo/bar/.projects/e2e/cypress/screenshots/record_pass_spec.coffee/yay it passes.png

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  record_pass_spec.coffee                  XX:XX        2        1        -        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        2        1        -        1        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12                                   


`

exports['e2e record api interaction errors uploading assets warns but proceeds 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (record_pass_spec.coffee)                                                  │
  │ Searched:   cypress/integration/record_pass*                                                   │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_pass_spec.coffee                                                         (1 of 1)
  Estimated: 8 seconds


  record pass
    ✓ passes
    - is pending


  1 passing
  1 pending


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      1                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Estimated:    8 seconds                                                                        │
  │ Spec Ran:     record_pass_spec.coffee                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_pass_spec.coffee/yay it passes.png           (202x1002)


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/record_pass_spec.coffee.mp4         (X second)


  (Uploading Results)

  - Failed Uploading (*/2) /foo/bar/.projects/e2e/cypress/screenshots/record_pass_spec.coffee/yay it passes.png
  - Failed Uploading (*/2) /foo/bar/.projects/e2e/cypress/videos/record_pass_spec.coffee.mp4

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  record_pass_spec.coffee                  XX:XX        2        1        -        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        2        1        -        1        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12                                   


`

exports['e2e record misconfiguration errors and exits when no browser found 1'] = `
Can't run because you've entered an invalid browser name.

Browser: 'browserDoesNotExist' was not found on your system or is not supported by Cypress.

Cypress supports the following browsers:
- chrome
- chromium
- edge
- electron
- firefox

You can also use a custom browser: https://on.cypress.io/customize-browsers

Available browsers found on your system are:
- browser1
- browser2
- browser3
`

exports['e2e record misconfiguration errors and exits when no specs found 1'] = `
Can't run because no spec files were found.

We searched for any files matching this glob pattern:

cypress/integration/notfound/**

`

exports['e2e record recordKey warns but does not exit when is forked pr 1'] = `
Warning: It looks like you are trying to record this run from a forked PR.

The 'Record Key' is missing. Your CI provider is likely not passing private environment variables to builds from forks.

These results will not be recorded.

This error will not alter the exit code.

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (record_pass_spec.coffee)                                                  │
  │ Searched:   cypress/integration/record_pass*                                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_pass_spec.coffee                                                         (1 of 1)


  record pass
    ✓ passes
    - is pending


  1 passing
  1 pending


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      1                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     record_pass_spec.coffee                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_pass_spec.coffee/yay it passes.png           (202x1002)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  record_pass_spec.coffee                  XX:XX        2        1        -        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        2        1        -        1        -  


`

exports['e2e record parallelization passes in parallel with group 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      4 found (record_error_spec.coffee, record_fail_spec.coffee, record_pass_spec.coffe │
  │             e, record_uncaught_spec.coffee)                                                    │
  │ Searched:   cypress/integration/record*                                                        │
  │ Params:     Tag: nightly, Group: prod-e2e, Parallel: true                                      │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_pass_spec.coffee                                                         (1 of 4)
  Estimated: 1 second


  record pass
    ✓ passes
    - is pending


  1 passing
  1 pending


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      1                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Estimated:    1 second                                                                         │
  │ Spec Ran:     record_pass_spec.coffee                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_pass_spec.coffee/yay it passes.png           (202x1002)


  (Uploading Results)

  - Done Uploading (1/1) /foo/bar/.projects/e2e/cypress/screenshots/record_pass_spec.coffee/yay it passes.png

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  record_pass_spec.coffee                  XX:XX        2        1        -        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        2        1        -        1        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12                                   


`

exports['e2e record parallelization passes in parallel with group 2'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      4 found (record_error_spec.coffee, record_fail_spec.coffee, record_pass_spec.coffe │
  │             e, record_uncaught_spec.coffee)                                                    │
  │ Searched:   cypress/integration/record*                                                        │
  │ Params:     Tag: nightly, Group: prod-e2e, Parallel: true                                      │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_error_spec.coffee                                                        (2 of 4)
  Estimated: 1 second

Oops...we found an error preparing this test file:

  cypress/integration/record_error_spec.coffee

The error was:

Error: Webpack Compilation Error
./cypress/integration/record_error_spec.coffee
Module not found: Error: Can't resolve '../it/does/not/exist' in '/foo/bar/.projects/e2e/cypress/integration'
Looked for and couldn't find the file at the following paths:
[/foo/bar/.projects/e2e/cypress/it/does/not/exist]
[/foo/bar/.projects/e2e/cypress/it/does/not/exist.js]
[/foo/bar/.projects/e2e/cypress/it/does/not/exist.json]
[/foo/bar/.projects/e2e/cypress/it/does/not/exist.jsx]
[/foo/bar/.projects/e2e/cypress/it/does/not/exist.mjs]
[/foo/bar/.projects/e2e/cypress/it/does/not/exist.coffee]
[/foo/bar/.projects/e2e/cypress/it/does/not/exist.ts]
[/foo/bar/.projects/e2e/cypress/it/does/not/exist.tsx]
 @ ./cypress/integration/record_error_spec.coffee 1:0-31

This occurred while Cypress was compiling and bundling your test code. This is usually caused by:

- A missing file or dependency
- A syntax error in the file or one of its dependencies

Fix the error in your code and re-run your tests.

  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        0                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Estimated:    1 second                                                                         │
  │ Spec Ran:     record_error_spec.coffee                                                         │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/record_error_spec.coffee.mp4        (X second)


  (Uploading Results)

  - Done Uploading (1/1) /foo/bar/.projects/e2e/cypress/videos/record_error_spec.coffee.mp4

────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_fail_spec.coffee                                                         (3 of 4)
  Estimated: 2 seconds


  record fails
    1) "before each" hook for "fails 1"


  0 passing
  1 failing

  1) record fails
       "before each" hook for "fails 1":
     Error: foo

Because this error occurred during a \`before each\` hook we are skipping the remaining tests in the current suite: \`record fails\`
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      1                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Estimated:    2 seconds                                                                        │
  │ Spec Ran:     record_fail_spec.coffee                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_fail_spec.coffee/record fails -- fails 1     (1280x720)
      -- before each hook (failed).png                                                              


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/record_fail_spec.coffee.mp4         (X second)


  (Uploading Results)

  - Done Uploading (*/2) /foo/bar/.projects/e2e/cypress/screenshots/record_fail_spec.coffee/record fails -- fails 1 -- before each hook (failed).png
  - Done Uploading (*/2) /foo/bar/.projects/e2e/cypress/videos/record_fail_spec.coffee.mp4

────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_uncaught_spec.coffee                                                     (4 of 4)
  Estimated: 3 seconds


  1) An uncaught error was detected outside of a test

  0 passing
  1 failing

  1) An uncaught error was detected outside of a test:
     Error: The following error originated from your test code, not from Cypress.

  > instantly fails

When Cypress detects uncaught errors originating from your test code it will automatically fail the current test.

Cypress could not associate this error to any specific test.

We dynamically generated a new test to display this failure.
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
  │ Estimated:    3 seconds                                                                        │
  │ Spec Ran:     record_uncaught_spec.coffee                                                      │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_uncaught_spec.coffee/An uncaught error w     (1280x720)
     as detected outside of a test (failed).png                                                     


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/record_uncaught_spec.coffee.mp4     (X second)


  (Uploading Results)

  - Done Uploading (*/2) /foo/bar/.projects/e2e/cypress/screenshots/record_uncaught_spec.coffee/An uncaught error was detected outside of a test (failed).png
  - Done Uploading (*/2) /foo/bar/.projects/e2e/cypress/videos/record_uncaught_spec.coffee.mp4

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  record_error_spec.coffee                 XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  record_fail_spec.coffee                  XX:XX        2        -        1        -        1 │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  record_uncaught_spec.coffee              XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  3 of 3 failed (100%)                     XX:XX        3        -        3        -        1  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12                                   


`

exports['e2e record api interaction errors create run 422 errors and exits when group name is in use 1'] = `
You passed the --group flag, but this group name has already been used for this run.

The existing run is: https://dashboard.cypress.io/runs/12345

The --group flag you passed was: e2e-tests

If you are trying to parallelize this run, then also pass the --parallel flag, else pass a different group name.

https://on.cypress.io/run-group-name-not-unique

`

exports['e2e record api interaction errors create run unknown 422 errors and exits when there is an unknown 422 response 1'] = `
We encountered an unexpected error talking to our servers.

There is likely something wrong with the request.

The --tag flag you passed was: nightly
The --group flag you passed was: e2e-tests
The --parallel flag you passed was: true
The --ciBuildId flag you passed was: ciBuildId123

The server's response was:

StatusCodeError: 422

{
  "code": "SOMETHING_UNKNOWN",
  "message": "An unknown message here from the server."
}

`

exports['e2e record api interaction errors create run 500 warns but proceeds when grouping without parallelization 1'] = `
Warning: We encountered an error talking to our servers.

This run will not be recorded.

This error will not alter the exit code.

StatusCodeError: 500 - "Internal Server Error"

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (record_pass_spec.coffee)                                                  │
  │ Searched:   cypress/integration/record_pass*                                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_pass_spec.coffee                                                         (1 of 1)


  record pass
    ✓ passes
    - is pending


  1 passing
  1 pending


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      1                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     record_pass_spec.coffee                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_pass_spec.coffee/yay it passes.png           (202x1002)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  record_pass_spec.coffee                  XX:XX        2        1        -        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        2        1        -        1        -  


`

exports['e2e record api interaction errors create run 500 does not proceed and exits with error when parallelizing 1'] = `
We encountered an unexpected error talking to our servers.

Because you passed the --parallel flag, this run cannot proceed because it requires a valid response from our servers.

The --group flag you passed was: foo
The --ciBuildId flag you passed was: ciBuildId123

The server's response was:

StatusCodeError: 500 - "Internal Server Error"

`

exports['e2e record api interaction errors create instance 500 does not proceed and exits with error when parallelizing and creating instance 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (record_pass_spec.coffee)                                                  │
  │ Searched:   cypress/integration/record_pass*                                                   │
  │ Params:     Tag: nightly, Group: foo, Parallel: true                                           │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘

We encountered an unexpected error talking to our servers.

Because you passed the --parallel flag, this run cannot proceed because it requires a valid response from our servers.

The --group flag you passed was: foo
The --ciBuildId flag you passed was: ciBuildId123

The server's response was:

StatusCodeError: 500 - "Internal Server Error"

`

exports['e2e record api interaction errors update instance 500 does not proceed and exits with error when parallelizing and updating instance 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (record_pass_spec.coffee)                                                  │
  │ Searched:   cypress/integration/record_pass*                                                   │
  │ Params:     Tag: nightly, Group: foo, Parallel: true                                           │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_pass_spec.coffee                                                         (1 of 1)
  Estimated: 5 seconds


  record pass
    ✓ passes
    - is pending


  1 passing
  1 pending


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      1                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Estimated:    5 seconds                                                                        │
  │ Spec Ran:     record_pass_spec.coffee                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_pass_spec.coffee/yay it passes.png           (202x1002)


  (Uploading Results)

We encountered an unexpected error talking to our servers.

Because you passed the --parallel flag, this run cannot proceed because it requires a valid response from our servers.

The --group flag you passed was: foo
The --ciBuildId flag you passed was: ciBuildId123

The server's response was:

StatusCodeError: 500 - "Internal Server Error"

`

exports['e2e record api interaction errors api retries on error warns and does not create or update instances 1'] = `
We encountered an unexpected error talking to our servers.

We will retry 3 more times in 1 second...

The server's response was:

StatusCodeError: 500 - "Internal Server Error"
We encountered an unexpected error talking to our servers.

We will retry 2 more times in 2 seconds...

The server's response was:

StatusCodeError: 500 - "Internal Server Error"
We encountered an unexpected error talking to our servers.

We will retry 1 more time in 3 seconds...

The server's response was:

StatusCodeError: 500 - "Internal Server Error"

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (record_pass_spec.coffee)                                                  │
  │ Searched:   cypress/integration/record_pass*                                                   │
  │ Params:     Tag: nightly, Group: foo, Parallel: true                                           │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘

We encountered an unexpected error talking to our servers.

We will retry 3 more times in 1 second...

The server's response was:

StatusCodeError: 500 - "Internal Server Error"

────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_pass_spec.coffee                                                         (1 of 1)
  Estimated: 5 seconds


  record pass
    ✓ passes
    - is pending


  1 passing
  1 pending


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      1                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Estimated:    5 seconds                                                                        │
  │ Spec Ran:     record_pass_spec.coffee                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_pass_spec.coffee/yay it passes.png           (202x1002)


  (Uploading Results)

  - Done Uploading (1/1) /foo/bar/.projects/e2e/cypress/screenshots/record_pass_spec.coffee/yay it passes.png

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  record_pass_spec.coffee                  XX:XX        2        1        -        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        2        1        -        1        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12                                   


`

exports['e2e record recordKey warns but does not exit when is forked pr and parallel 1'] = `
Warning: It looks like you are trying to record this run from a forked PR.

The 'Record Key' is missing. Your CI provider is likely not passing private environment variables to builds from forks.

These results will not be recorded.

This error will not alter the exit code.

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (record_pass_spec.coffee)                                                  │
  │ Searched:   cypress/integration/record_pass*                                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_pass_spec.coffee                                                         (1 of 1)


  record pass
    ✓ passes
    - is pending


  1 passing
  1 pending


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      1                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     record_pass_spec.coffee                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_pass_spec.coffee/yay it passes.png           (202x1002)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  record_pass_spec.coffee                  XX:XX        2        1        -        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        2        1        -        1        -  


`

exports['e2e record api interaction errors create run 402 - free plan exceeds monthly private tests errors and exits when on free plan and over recorded runs limit 1'] = `
You've exceeded the limit of private test recordings under your free plan this month. The limit is 500 private test recordings.

To continue recording tests this month you must upgrade your account. Please visit your billing to upgrade to another billing plan.

https://on.cypress.io/dashboard/organizations/org-id-1234/billing

`

exports['e2e record api interaction errors create run 402 - parallel feature not available in plan errors and exits when attempting parallel run when not available in plan 1'] = `
Parallelization is not included under your current billing plan.

To run your tests in parallel, please visit your billing and upgrade to another plan with parallelization.

https://on.cypress.io/dashboard/organizations/org-id-1234/billing

`

exports['e2e record api interaction errors create run 402 - unknown error errors and exits when there\'s an unknown 402 error 1'] = `
We encountered an unexpected error talking to our servers.

There is likely something wrong with the request.

The --tag flag you passed was: 

The server's response was:

StatusCodeError: 402

{
  "error": "Something went wrong"
}

`

exports['e2e record api interaction errors create run 402 - free plan exceeds monthly tests errors and exits when on free plan and over recorded tests limit 1'] = `
You've exceeded the limit of test recordings under your free plan this month. The limit is 500 test recordings.

To continue recording tests this month you must upgrade your account. Please visit your billing to upgrade to another billing plan.

https://on.cypress.io/dashboard/organizations/org-id-1234/billing

`

exports['e2e record api interaction errors create run 402 - grouping feature not available in plan errors and exits when attempting parallel run when not available in plan 1'] = `
Grouping is not included under your current billing plan.

To run your tests with groups, please visit your billing and upgrade to another plan with grouping.

https://on.cypress.io/dashboard/organizations/org-id-1234/billing

`

exports['e2e record api interaction warnings create run warnings grace period - grouping feature warns when using parallel feature 1'] = `
Grouping is not included under your free plan.

Your plan is now in a grace period, which means your tests will still run with groups until 2999-12-31. Please upgrade your plan to continue running your tests with groups in the future.

https://on.cypress.io/dashboard/organizations/org-id-1234/billing

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (record_pass_spec.coffee)                                                  │
  │ Searched:   cypress/integration/record_pass*                                                   │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_pass_spec.coffee                                                         (1 of 1)
  Estimated: 8 seconds


  record pass
    ✓ passes
    - is pending


  1 passing
  1 pending


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      1                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Estimated:    8 seconds                                                                        │
  │ Spec Ran:     record_pass_spec.coffee                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_pass_spec.coffee/yay it passes.png           (202x1002)


  (Uploading Results)

  - Done Uploading (1/1) /foo/bar/.projects/e2e/cypress/screenshots/record_pass_spec.coffee/yay it passes.png

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  record_pass_spec.coffee                  XX:XX        2        1        -        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        2        1        -        1        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12                                   


`

exports['e2e record api interaction warnings create run warnings grace period - over private tests limit warns when over private test recordings 1'] = `
You've exceeded the limit of private test recordings under your free plan this month. The limit is 500 private test recordings.

Your plan is now in a grace period, which means your tests will still be recorded until 2999-12-31. Please upgrade your plan to continue recording tests on the Cypress Dashboard in the future.

https://on.cypress.io/dashboard/organizations/org-id-1234/billing

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (record_pass_spec.coffee)                                                  │
  │ Searched:   cypress/integration/record_pass*                                                   │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_pass_spec.coffee                                                         (1 of 1)
  Estimated: 8 seconds


  record pass
    ✓ passes
    - is pending


  1 passing
  1 pending


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      1                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Estimated:    8 seconds                                                                        │
  │ Spec Ran:     record_pass_spec.coffee                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_pass_spec.coffee/yay it passes.png           (202x1002)


  (Uploading Results)

  - Done Uploading (1/1) /foo/bar/.projects/e2e/cypress/screenshots/record_pass_spec.coffee/yay it passes.png

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  record_pass_spec.coffee                  XX:XX        2        1        -        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        2        1        -        1        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12                                   


`

exports['e2e record api interaction warnings create run warnings grace period - over tests limit warns when over test recordings 1'] = `
You've exceeded the limit of test recordings under your free plan this month. The limit is 500 test recordings.

Your plan is now in a grace period, which means you will have the full benefits of your current plan until 2999-12-31.

Please visit your billing to upgrade your plan.

https://on.cypress.io/dashboard/organizations/org-id-1234/billing

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (record_pass_spec.coffee)                                                  │
  │ Searched:   cypress/integration/record_pass*                                                   │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_pass_spec.coffee                                                         (1 of 1)
  Estimated: 8 seconds


  record pass
    ✓ passes
    - is pending


  1 passing
  1 pending


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      1                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Estimated:    8 seconds                                                                        │
  │ Spec Ran:     record_pass_spec.coffee                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_pass_spec.coffee/yay it passes.png           (202x1002)


  (Uploading Results)

  - Done Uploading (1/1) /foo/bar/.projects/e2e/cypress/screenshots/record_pass_spec.coffee/yay it passes.png

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  record_pass_spec.coffee                  XX:XX        2        1        -        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        2        1        -        1        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12                                   


`

exports['e2e record api interaction warnings create run warnings grace period - parallel feature warns when using parallel feature 1'] = `
Parallelization is not included under your free plan.

Your plan is now in a grace period, which means your tests will still run in parallel until 2999-12-31. Please upgrade your plan to continue running your tests in parallel in the future.

https://on.cypress.io/dashboard/organizations/org-id-1234/billing

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (record_pass_spec.coffee)                                                  │
  │ Searched:   cypress/integration/record_pass*                                                   │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_pass_spec.coffee                                                         (1 of 1)
  Estimated: 8 seconds


  record pass
    ✓ passes
    - is pending


  1 passing
  1 pending


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      1                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Estimated:    8 seconds                                                                        │
  │ Spec Ran:     record_pass_spec.coffee                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_pass_spec.coffee/yay it passes.png           (202x1002)


  (Uploading Results)

  - Done Uploading (1/1) /foo/bar/.projects/e2e/cypress/screenshots/record_pass_spec.coffee/yay it passes.png

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  record_pass_spec.coffee                  XX:XX        2        1        -        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        2        1        -        1        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12                                   


`

exports['e2e record api interaction warnings create run warnings paid plan - over private tests limit warns when over private test recordings 1'] = `
You've exceeded the limit of test recordings under your current billing plan this month. The limit is 500 private test recordings.

To continue getting the full benefits of your current plan, please visit your billing to upgrade.

https://on.cypress.io/dashboard/organizations/org-id-1234/billing

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (record_pass_spec.coffee)                                                  │
  │ Searched:   cypress/integration/record_pass*                                                   │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_pass_spec.coffee                                                         (1 of 1)
  Estimated: 8 seconds


  record pass
    ✓ passes
    - is pending


  1 passing
  1 pending


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      1                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Estimated:    8 seconds                                                                        │
  │ Spec Ran:     record_pass_spec.coffee                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_pass_spec.coffee/yay it passes.png           (202x1002)


  (Uploading Results)

  - Done Uploading (1/1) /foo/bar/.projects/e2e/cypress/screenshots/record_pass_spec.coffee/yay it passes.png

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  record_pass_spec.coffee                  XX:XX        2        1        -        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        2        1        -        1        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12                                   


`

exports['e2e record api interaction warnings create run warnings paid plan - over tests limit warns when over test recordings 1'] = `
You've exceeded the limit of test recordings under your current billing plan this month. The limit is 500 test recordings.

To continue getting the full benefits of your current plan, please visit your billing to upgrade.

https://on.cypress.io/dashboard/organizations/org-id-1234/billing

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (record_pass_spec.coffee)                                                  │
  │ Searched:   cypress/integration/record_pass*                                                   │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_pass_spec.coffee                                                         (1 of 1)
  Estimated: 8 seconds


  record pass
    ✓ passes
    - is pending


  1 passing
  1 pending


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      1                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Estimated:    8 seconds                                                                        │
  │ Spec Ran:     record_pass_spec.coffee                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_pass_spec.coffee/yay it passes.png           (202x1002)


  (Uploading Results)

  - Done Uploading (1/1) /foo/bar/.projects/e2e/cypress/screenshots/record_pass_spec.coffee/yay it passes.png

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  record_pass_spec.coffee                  XX:XX        2        1        -        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        2        1        -        1        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12                                   


`

exports['e2e record api interaction warnings create run warnings unknown warning warns with unknown warning code 1'] = `
Warning from Cypress Dashboard: You are almost out of time

Details:
{
  "code": "OUT_OF_TIME",
  "name": "OutOfTime",
  "hadTime": 1000,
  "spentTime": 999
}

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (record_pass_spec.coffee)                                                  │
  │ Searched:   cypress/integration/record_pass*                                                   │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_pass_spec.coffee                                                         (1 of 1)
  Estimated: 8 seconds


  record pass
    ✓ passes
    - is pending


  1 passing
  1 pending


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      1                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Estimated:    8 seconds                                                                        │
  │ Spec Ran:     record_pass_spec.coffee                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_pass_spec.coffee/yay it passes.png           (202x1002)


  (Uploading Results)

  - Done Uploading (1/1) /foo/bar/.projects/e2e/cypress/screenshots/record_pass_spec.coffee/yay it passes.png

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  record_pass_spec.coffee                  XX:XX        2        1        -        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        2        1        -        1        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12                                   


`

exports['e2e record passing passes 2'] = [
  {
    "stats": {
      "suites": 1,
      "tests": 2,
      "passes": 0,
      "pending": 0,
      "skipped": 1,
      "failures": 1,
      "wallClockStartedAt": "2018-02-01T20:14:19.323Z",
      "wallClockEndedAt": "2018-02-01T20:14:19.323Z",
      "wallClockDuration": 1234
    },
    "tests": [
      {
        "testId": "r3",
        "title": [
          "record fails",
          "fails 1"
        ],
        "state": "failed",
        "body": "function() {}",
        "displayError": "Error: foo\n\nBecause this error occurred during a `before each` hook we are skipping the remaining tests in the current suite: `record fails`\n      [stack trace lines]",
        "attempts": [
          {
            "state": "failed",
            "error": {
              "name": "Error",
              "message": "foo\n\nBecause this error occurred during a `before each` hook we are skipping the remaining tests in the current suite: `record fails`",
              "stack": "[stack trace lines]",
              "codeFrame": {
                "line": 3,
                "column": 11,
                "originalFile": "cypress/integration/record_fail_spec.coffee",
                "relativeFile": "cypress/integration/record_fail_spec.coffee",
                "absoluteFile": "/foo/bar/.projects/e2e/cypress/integration/record_fail_spec.coffee",
                "frame": "  1 | describe \"record fails\", ->\n  2 |   beforeEach ->\n> 3 |     throw new Error(\"foo\")\n    |           ^\n  4 | \n  5 |   it \"fails 1\", ->\n  6 | ",
                "language": "coffee"
              }
            },
            "timings": {
              "lifecycle": 100,
              "before each": [
                {
                  "hookId": "h1",
                  "fnDuration": 400,
                  "afterFnDuration": 200
                }
              ]
            },
            "failedFromHookId": "h1",
            "wallClockStartedAt": "2018-02-01T20:14:19.323Z",
            "wallClockDuration": 1234,
            "videoTimestamp": 9999
          }
        ]
      },
      {
        "testId": "r4",
        "title": [
          "record fails",
          "is skipped"
        ],
        "state": "skipped",
        "body": "function() {}",
        "displayError": null,
        "attempts": [
          {
            "state": "skipped",
            "error": null,
            "timings": null,
            "failedFromHookId": null,
            "wallClockStartedAt": null,
            "wallClockDuration": null,
            "videoTimestamp": null
          }
        ]
      }
    ],
    "error": null,
    "video": true,
    "hooks": [
      {
        "hookId": "h1",
        "hookName": "before each",
        "title": [
          "\"before each\" hook"
        ],
        "body": "function() {\n    throw new Error(\"foo\");\n  }"
      }
    ],
    "screenshots": [
      {
        "screenshotId": "some-random-id",
        "name": null,
        "testId": "r3",
        "testAttemptIndex": 0,
        "takenAt": "2018-02-01T20:14:19.323Z",
        "height": 720,
        "width": 1280
      }
    ],
    "cypressConfig": {},
    "reporterStats": {
      "suites": 1,
      "tests": 1,
      "passes": 0,
      "pending": 0,
      "failures": 1,
      "start": "2018-02-01T20:14:19.323Z",
      "end": "2018-02-01T20:14:19.323Z",
      "duration": 1234
    }
  },
  {
    "stats": {
      "suites": 1,
      "tests": 2,
      "passes": 1,
      "pending": 1,
      "skipped": 0,
      "failures": 0,
      "wallClockStartedAt": "2018-02-01T20:14:19.323Z",
      "wallClockEndedAt": "2018-02-01T20:14:19.323Z",
      "wallClockDuration": 1234
    },
    "tests": [
      {
        "testId": "r3",
        "title": [
          "record pass",
          "passes"
        ],
        "state": "passed",
        "body": "function() {\n    cy.visit(\"/scrollable.html\");\n    return cy.viewport(400, 400).get(\"#box\").screenshot('yay it passes');\n  }",
        "displayError": null,
        "attempts": [
          {
            "state": "passed",
            "error": null,
            "timings": {
              "lifecycle": 100,
              "test": {
                "fnDuration": 400,
                "afterFnDuration": 200
              }
            },
            "failedFromHookId": null,
            "wallClockStartedAt": "2018-02-01T20:14:19.323Z",
            "wallClockDuration": 1234,
            "videoTimestamp": 9999
          }
        ]
      },
      {
        "testId": "r4",
        "title": [
          "record pass",
          "is pending"
        ],
        "state": "pending",
        "body": "",
        "displayError": null,
        "attempts": [
          {
            "state": "pending",
            "error": null,
            "timings": null,
            "failedFromHookId": null,
            "wallClockStartedAt": null,
            "wallClockDuration": null,
            "videoTimestamp": null
          }
        ]
      }
    ],
    "error": null,
    "video": true,
    "hooks": [],
    "screenshots": [
      {
        "screenshotId": "some-random-id",
        "name": "yay it passes",
        "testId": "r3",
        "testAttemptIndex": 0,
        "takenAt": "2018-02-01T20:14:19.323Z",
        "height": 1002,
        "width": 202
      }
    ],
    "cypressConfig": {},
    "reporterStats": {
      "suites": 1,
      "tests": 2,
      "passes": 1,
      "pending": 1,
      "failures": 0,
      "start": "2018-02-01T20:14:19.323Z",
      "end": "2018-02-01T20:14:19.323Z",
      "duration": 1234
    }
  },
  {
    "stats": {
      "suites": 0,
      "tests": 1,
      "passes": 0,
      "pending": 0,
      "skipped": 0,
      "failures": 1,
      "wallClockStartedAt": "2018-02-01T20:14:19.323Z",
      "wallClockEndedAt": "2018-02-01T20:14:19.323Z",
      "wallClockDuration": 1234
    },
    "tests": [
      {
        "testId": "r2",
        "title": [
          "An uncaught error was detected outside of a test"
        ],
        "state": "failed",
        "body": "() => {\n      throw err;\n    }",
        "displayError": "Error: The following error originated from your test code, not from Cypress.\n\n  > instantly fails\n\nWhen Cypress detects uncaught errors originating from your test code it will automatically fail the current test.\n\nCypress could not associate this error to any specific test.\n\nWe dynamically generated a new test to display this failure.\n      [stack trace lines]",
        "attempts": [
          {
            "state": "failed",
            "error": {
              "name": "Error",
              "message": "The following error originated from your test code, not from Cypress.\n\n  > instantly fails\n\nWhen Cypress detects uncaught errors originating from your test code it will automatically fail the current test.\n\nCypress could not associate this error to any specific test.\n\nWe dynamically generated a new test to display this failure.",
              "stack": "[stack trace lines]",
              "codeFrame": {
                "line": 1,
                "column": 7,
                "originalFile": "cypress/integration/record_uncaught_spec.coffee",
                "relativeFile": "cypress/integration/record_uncaught_spec.coffee",
                "absoluteFile": "/foo/bar/.projects/e2e/cypress/integration/record_uncaught_spec.coffee",
                "frame": "> 1 | throw new Error('instantly fails')\n    |       ^\n  2 | ",
                "language": "coffee"
              }
            },
            "timings": {
              "lifecycle": 100,
              "test": {
                "fnDuration": 400,
                "afterFnDuration": 200
              }
            },
            "failedFromHookId": null,
            "wallClockStartedAt": "2018-02-01T20:14:19.323Z",
            "wallClockDuration": 1234,
            "videoTimestamp": 9999
          }
        ]
      }
    ],
    "error": null,
    "video": true,
    "hooks": [],
    "screenshots": [
      {
        "screenshotId": "some-random-id",
        "name": null,
        "testId": "r2",
        "testAttemptIndex": 0,
        "takenAt": "2018-02-01T20:14:19.323Z",
        "height": 720,
        "width": 1280
      }
    ],
    "cypressConfig": {},
    "reporterStats": {
      "suites": 0,
      "tests": 1,
      "passes": 0,
      "pending": 0,
      "failures": 1,
      "start": "2018-02-01T20:14:19.323Z",
      "end": "2018-02-01T20:14:19.323Z",
      "duration": 1234
    }
  }
]

exports['e2e record api interaction warnings create run warnings free plan - over tests limit v2 warns when over test recordings 1'] = `
You've exceeded the limit of test recordings under your free billing plan this month. The limit is 500 test recordings.

To continue getting the full benefits of your current plan, please visit your billing to upgrade.

https://on.cypress.io/dashboard/organizations/org-id-1234/billing

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (record_pass_spec.coffee)                                                  │
  │ Searched:   cypress/integration/record_pass*                                                   │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_pass_spec.coffee                                                         (1 of 1)
  Estimated: 8 seconds


  record pass
    ✓ passes
    - is pending


  1 passing
  1 pending


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      1                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Estimated:    8 seconds                                                                        │
  │ Spec Ran:     record_pass_spec.coffee                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_pass_spec.coffee/yay it passes.png           (202x1002)


  (Uploading Results)

  - Done Uploading (1/1) /foo/bar/.projects/e2e/cypress/screenshots/record_pass_spec.coffee/yay it passes.png

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  record_pass_spec.coffee                  XX:XX        2        1        -        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        2        1        -        1        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12                                   


`
