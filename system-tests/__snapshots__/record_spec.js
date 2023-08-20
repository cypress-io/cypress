exports['e2e record passing passes 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      4 found (record_error.cy.js, record_fail.cy.js, record_pass.cy.js, record_uncaught │
  │             .cy.js)                                                                            │
  │ Searched:   cypress/e2e/record*                                                                │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_error.cy.js                                                              (1 of 4)
  Estimated: X second(s)

Oops...we found an error preparing this test file:

  > cypress/e2e/record_error.cy.js

The error was:

Error: Webpack Compilation Error
Module not found: Error: Can't resolve '../it/does/not/exist' in '/foo/bar/.projects/e2e/cypress/e2e'
      [stack trace lines]

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
  │ Estimated:    X second(s)                                                                      │
  │ Spec Ran:     record_error.cy.js                                                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started compressing: Compressing to 32 CRF                                                     
  -  Finished compressing: X second(s)                                               

  -  Video output: /XXX/XXX/XXX/cypress/videos/record_error.cy.js.mp4


  (Uploading Screenshots & Videos)

  - Done Uploading (1/1) /foo/bar/.projects/e2e/cypress/videos/record_error.cy.js.mp4

────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_fail.cy.js                                                               (2 of 4)
  Estimated: X second(s)


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
  │ Estimated:    X second(s)                                                                      │
  │ Spec Ran:     record_fail.cy.js                                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_fail.cy.js/record fails -- fails 1 -- be     (1280x720)
     fore each hook (failed).png                                                                    


  (Video)

  -  Started compressing: Compressing to 32 CRF                                                     
  -  Finished compressing: X second(s)                                               

  -  Video output: /XXX/XXX/XXX/cypress/videos/record_fail.cy.js.mp4


  (Uploading Screenshots & Videos)

  - Done Uploading (*/2) /foo/bar/.projects/e2e/cypress/screenshots/record_fail.cy.js/record fails -- fails 1 -- before each hook (failed).png
  - Done Uploading (*/2) /foo/bar/.projects/e2e/cypress/videos/record_fail.cy.js.mp4

────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_pass.cy.js                                                               (3 of 4)
  Estimated: X second(s)


  record pass
plugin stdout
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
  │ Estimated:    X second(s)                                                                      │
  │ Spec Ran:     record_pass.cy.js                                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_pass.cy.js/yay it passes.png                 (400x1022)


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/record_pass.cy.js.mp4


  (Uploading Screenshots & Videos)

  - Done Uploading (1/1) /foo/bar/.projects/e2e/cypress/screenshots/record_pass.cy.js/yay it passes.png

────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_uncaught.cy.js                                                           (4 of 4)
  Estimated: X second(s)


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
  │ Estimated:    X second(s)                                                                      │
  │ Spec Ran:     record_uncaught.cy.js                                                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_uncaught.cy.js/An uncaught error was det     (1280x720)
     ected outside of a test (failed).png                                                           


  (Video)

  -  Started compressing: Compressing to 32 CRF                                                     
  -  Finished compressing: X second(s)                                               

  -  Video output: /XXX/XXX/XXX/cypress/videos/record_uncaught.cy.js.mp4


  (Uploading Screenshots & Videos)

  - Done Uploading (*/2) /foo/bar/.projects/e2e/cypress/screenshots/record_uncaught.cy.js/An uncaught error was detected outside of a test (failed).png
  - Done Uploading (*/2) /foo/bar/.projects/e2e/cypress/videos/record_uncaught.cy.js.mp4

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  record_error.cy.js                       XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  record_fail.cy.js                        XX:XX        2        -        1        -        1 │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  record_pass.cy.js                        XX:XX        2        1        -        1        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  record_uncaught.cy.js                    XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  3 of 4 failed (75%)                      XX:XX        5        1        3        1        1  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12


`

exports['e2e record api interaction errors project 404 errors and exits 1'] = `
We could not find a Cypress Cloud project with the projectId: pid123

This projectId came from your cypress-with-project-id.config.js file or an environment variable.

Please log into Cypress Cloud and find your project.

We will list the correct projectId in the 'Settings' tab.

Alternatively, you can create a new project directly from within the Cypress app.

https://on.cypress.io/cloud

`

exports['e2e record api interaction errors update instance stdout warns but proceeds 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (record_pass.cy.js)                                                        │
  │ Searched:   cypress/e2e/record_pass*                                                           │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_pass.cy.js                                                               (1 of 1)
  Estimated: X second(s)


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
  │ Estimated:    X second(s)                                                                      │
  │ Spec Ran:     record_pass.cy.js                                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_pass.cy.js/yay it passes.png                 (400x1022)


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/record_pass.cy.js.mp4


  (Uploading Screenshots & Videos)

  - Done Uploading (1/1) /foo/bar/.projects/e2e/cypress/screenshots/record_pass.cy.js/yay it passes.png
Warning: We encountered an error communicating with our servers.

This run will proceed, but will not be recorded.

This error will not affect or change the exit code.

StatusCodeError: 500 - "Internal Server Error"

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  record_pass.cy.js                        XX:XX        2        1        -        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        2        1        -        1        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12


`

exports['e2e record recordKey errors and exits without recordKey 1'] = `
You passed the --record flag but did not provide us your Record Key.

You can pass us your Record Key like this:

  $ cypress run --record --key <record_key>

You can also set the key as an environment variable with the name: CYPRESS_RECORD_KEY

https://on.cypress.io/how-do-i-record-runs

`

exports['e2e record projectId errors and exits without projectId 1'] = `
You passed the --record flag but this project has not been setup to record.

This project is missing the projectId inside of: cypress.config.js

We cannot uniquely identify this project without this id.

You need to setup this project to record. This will generate a unique projectId.

Alternatively if you omit the --record flag this project will run without recording.

https://on.cypress.io/recording-project-runs

`

exports['e2e record api interaction errors recordKey and projectId errors and exits on 401 1'] = `
Your Record Key f858a...ee7e1 is not valid with this projectId: pid123

It may have been recently revoked by you or another user.

Please log into Cypress Cloud to see the valid Record Keys.

https://on.cypress.io/dashboard/projects/pid123

`

exports['e2e record api interaction errors uploading assets warns but proceeds 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (record_pass.cy.js)                                                        │
  │ Searched:   cypress/e2e/record_pass*                                                           │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_pass.cy.js                                                               (1 of 1)
  Estimated: X second(s)


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
  │ Estimated:    X second(s)                                                                      │
  │ Spec Ran:     record_pass.cy.js                                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_pass.cy.js/yay it passes.png                 (400x1022)


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/record_pass.cy.js.mp4


  (Uploading Screenshots & Videos)

  - Failed Uploading (*/2) /foo/bar/.projects/e2e/cypress/screenshots/record_pass.cy.js/yay it passes.png
  - Failed Uploading (*/2) /foo/bar/.projects/e2e/cypress/videos/record_pass.cy.js.mp4

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  record_pass.cy.js                        XX:XX        2        1        -        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        2        1        -        1        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12


`

exports['e2e record misconfiguration errors and exits when no specs found 1'] = `
Can't run because no spec files were found.

We searched for specs matching this glob pattern:

  > /foo/bar/.projects/e2e/cypress/e2e/notfound/**

`

exports['e2e record recordKey warns but does not exit when is forked pr 1'] = `
Warning: It looks like you are trying to record this run from a forked PR.

The Record Key is missing. Your CI provider is likely not passing private environment variables to builds from forks.

These results will not be recorded.

This error will not affect or change the exit code.

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (record_pass.cy.js)                                                        │
  │ Searched:   cypress/e2e/record_pass*                                                           │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_pass.cy.js                                                               (1 of 1)


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
  │ Spec Ran:     record_pass.cy.js                                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_pass.cy.js/yay it passes.png                 (400x1022)


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/record_pass.cy.js.mp4


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  record_pass.cy.js                        XX:XX        2        1        -        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        2        1        -        1        -  


`

exports['e2e record api interaction errors create run 422 errors and exits when group name is in use 1'] = `
You passed the --group flag, but this group name has already been used for this run.

The existing run is: https://cloud.cypress.io/runs/12345

The --group flag you passed was: e2e-tests

If you are trying to parallelize this run, then also pass the --parallel flag, else pass a different group name.

https://on.cypress.io/run-group-name-not-unique

`

exports['e2e record api interaction errors create run unknown 422 errors and exits when there is an unknown 422 response 1'] = `
We encountered an unexpected error communicating with our servers.

StatusCodeError: 422

{
  "code": "SOMETHING_UNKNOWN",
  "message": "An unknown message here from the server."
}

There is likely something wrong with the request.

The --tag flag you passed was: nightly
The --group flag you passed was: e2e-tests
The --parallel flag you passed was: true
The --ciBuildId flag you passed was: ciBuildId123

`

exports['e2e record api interaction errors create run 500 does not proceed and exits with error when parallelizing 1'] = `
We encountered an unexpected error communicating with our servers.

StatusCodeError: 500 - "Internal Server Error"

Because you passed the --parallel flag, this run cannot proceed because it requires a valid response from our servers.

The --group flag you passed was: foo
The --ciBuildId flag you passed was: ciBuildId123

`

exports['e2e record api interaction errors create instance 500 does not proceed and exits with error when parallelizing and creating instance 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (record_pass.cy.js)                                                        │
  │ Searched:   cypress/e2e/record_pass*                                                           │
  │ Params:     Tag: nightly, Group: foo, Parallel: true                                           │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘

We encountered an unexpected error communicating with our servers.

StatusCodeError: 500 - "Internal Server Error"

Because you passed the --parallel flag, this run cannot proceed because it requires a valid response from our servers.

The --group flag you passed was: foo
The --ciBuildId flag you passed was: ciBuildId123

`

exports['e2e record api interaction errors update instance 500 does not proceed and exits with error when parallelizing and updating instance 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (record_pass.cy.js)                                                        │
  │ Searched:   cypress/e2e/record_pass*                                                           │
  │ Params:     Tag: nightly, Group: foo, Parallel: true                                           │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_pass.cy.js                                                               (1 of 1)
  Estimated: X second(s)


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
  │ Estimated:    X second(s)                                                                      │
  │ Spec Ran:     record_pass.cy.js                                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_pass.cy.js/yay it passes.png                 (400x1022)


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/record_pass.cy.js.mp4


  (Uploading Screenshots & Videos)

We encountered an unexpected error communicating with our servers.

StatusCodeError: 500 - "Internal Server Error"

Because you passed the --parallel flag, this run cannot proceed because it requires a valid response from our servers.

The --group flag you passed was: foo
The --ciBuildId flag you passed was: ciBuildId123

`

exports['e2e record api interaction errors api retries on error warns and does not create or update instances 1'] = `
We encountered an unexpected error communicating with our servers.

StatusCodeError: 500 - "Internal Server Error"

We will retry 3 more times in X second(s)...

We encountered an unexpected error communicating with our servers.

StatusCodeError: 500 - "Internal Server Error"

We will retry 2 more times in X second(s)...

We encountered an unexpected error communicating with our servers.

StatusCodeError: 500 - "Internal Server Error"

We will retry 1 more time in X second(s)...


====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (record_pass.cy.js)                                                        │
  │ Searched:   cypress/e2e/record_pass*                                                           │
  │ Params:     Tag: nightly, Group: foo, Parallel: true                                           │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘

We encountered an unexpected error communicating with our servers.

StatusCodeError: 500 - "Internal Server Error"

We will retry 3 more times in X second(s)...


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_pass.cy.js                                                               (1 of 1)
  Estimated: X second(s)


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
  │ Estimated:    X second(s)                                                                      │
  │ Spec Ran:     record_pass.cy.js                                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_pass.cy.js/yay it passes.png                 (400x1022)


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/record_pass.cy.js.mp4


  (Uploading Screenshots & Videos)

  - Done Uploading (1/1) /foo/bar/.projects/e2e/cypress/screenshots/record_pass.cy.js/yay it passes.png

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  record_pass.cy.js                        XX:XX        2        1        -        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        2        1        -        1        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12


`

exports['e2e record recordKey warns but does not exit when is forked pr and parallel 1'] = `
Warning: It looks like you are trying to record this run from a forked PR.

The Record Key is missing. Your CI provider is likely not passing private environment variables to builds from forks.

These results will not be recorded.

This error will not affect or change the exit code.

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (record_pass.cy.js)                                                        │
  │ Searched:   cypress/e2e/record_pass*                                                           │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_pass.cy.js                                                               (1 of 1)


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
  │ Spec Ran:     record_pass.cy.js                                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_pass.cy.js/yay it passes.png                 (400x1022)


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/record_pass.cy.js.mp4


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  record_pass.cy.js                        XX:XX        2        1        -        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        2        1        -        1        -  


`

exports['e2e record api interaction errors create run 402 - free plan exceeds monthly private tests errors and exits when on free plan and over recorded runs limit 1'] = `
You've exceeded the limit of private test results under your free plan this month. The limit is 500 private test results.

To continue recording tests this month you must upgrade your account. Please visit your billing to upgrade to another billing plan.

https://on.cypress.io/dashboard/organizations/org-id-1234/billing

`

exports['e2e record api interaction errors create run 402 - parallel feature not available in plan errors and exits when attempting parallel run when not available in plan 1'] = `
Parallelization is not included under your current billing plan.

To run your tests in parallel, please visit your billing and upgrade to another plan with parallelization.

https://on.cypress.io/dashboard/organizations/org-id-1234/billing

`

exports['e2e record api interaction errors create run 402 - unknown error errors and exits when there\'s an unknown 402 error 1'] = `
We encountered an unexpected error communicating with our servers.

StatusCodeError: 402

{
  "error": "Something went wrong"
}

There is likely something wrong with the request.

The --tag flag you passed was: 

`

exports['e2e record api interaction errors create run 402 - free plan exceeds monthly tests errors and exits when on free plan and over recorded tests limit 1'] = `
You've exceeded the limit of test results under your free plan this month. The limit is 500 test results.

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
  │ Specs:      1 found (record_pass.cy.js)                                                        │
  │ Searched:   cypress/e2e/record_pass*                                                           │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_pass.cy.js                                                               (1 of 1)
  Estimated: X second(s)


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
  │ Estimated:    X second(s)                                                                      │
  │ Spec Ran:     record_pass.cy.js                                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_pass.cy.js/yay it passes.png                 (400x1022)


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/record_pass.cy.js.mp4


  (Uploading Screenshots & Videos)

  - Done Uploading (1/1) /foo/bar/.projects/e2e/cypress/screenshots/record_pass.cy.js/yay it passes.png

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  record_pass.cy.js                        XX:XX        2        1        -        1        - │
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
  │ Specs:      1 found (record_pass.cy.js)                                                        │
  │ Searched:   cypress/e2e/record_pass*                                                           │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_pass.cy.js                                                               (1 of 1)
  Estimated: X second(s)


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
  │ Estimated:    X second(s)                                                                      │
  │ Spec Ran:     record_pass.cy.js                                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_pass.cy.js/yay it passes.png                 (400x1022)


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/record_pass.cy.js.mp4


  (Uploading Screenshots & Videos)

  - Done Uploading (1/1) /foo/bar/.projects/e2e/cypress/screenshots/record_pass.cy.js/yay it passes.png

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  record_pass.cy.js                        XX:XX        2        1        -        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        2        1        -        1        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12


`

exports['e2e record api interaction warnings create run warnings unknown warning warns with unknown warning code 1'] = `
Warning from Cypress Cloud: You are almost out of time

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
  │ Specs:      1 found (record_pass.cy.js)                                                        │
  │ Searched:   cypress/e2e/record_pass*                                                           │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_pass.cy.js                                                               (1 of 1)
  Estimated: X second(s)


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
  │ Estimated:    X second(s)                                                                      │
  │ Spec Ran:     record_pass.cy.js                                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_pass.cy.js/yay it passes.png                 (400x1022)


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/record_pass.cy.js.mp4


  (Uploading Screenshots & Videos)

  - Done Uploading (1/1) /foo/bar/.projects/e2e/cypress/screenshots/record_pass.cy.js/yay it passes.png

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  record_pass.cy.js                        XX:XX        2        1        -        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        2        1        -        1        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12


`

exports['e2e record passing passes 2'] = [
  {
    'stats': {
      'suites': 1,
      'tests': 2,
      'passes': 0,
      'pending': 0,
      'skipped': 1,
      'failures': 1,
      'wallClockStartedAt': '2018-02-01T20:14:19.323Z',
      'wallClockEndedAt': '2018-02-01T20:14:19.323Z',
      'wallClockDuration': 1234,
    },
    'tests': [
      {
        'clientId': 'r3',
        'state': 'failed',
        'displayError': 'Error: foo\n\nBecause this error occurred during a `before each` hook we are skipping the remaining tests in the current suite: `record fails`\n      [stack trace lines]',
        'attempts': [
          {
            'state': 'failed',
            'error': {
              'name': 'Error',
              'message': 'foo\n\nBecause this error occurred during a `before each` hook we are skipping the remaining tests in the current suite: `record fails`',
              'stack': '[stack trace lines]',
              'codeFrame': {
                'line': 3,
                'column': 11,
                'originalFile': 'cypress/e2e/record_fail.cy.js',
                'relativeFile': 'cypress/e2e/record_fail.cy.js',
                'absoluteFile': '/foo/bar/.projects/e2e/cypress/e2e/record_fail.cy.js',
                'frame': '  1 | describe(\'record fails\', () => {\n  2 |   beforeEach(() => {\n> 3 |     throw new Error(\'foo\')\n    |           ^\n  4 |   })\n  5 | \n  6 |   it(\'fails 1\', () => {})',
                'language': 'js',
              },
            },
            'timings': {
              'lifecycle': 100,
              'before each': [
                {
                  'hookId': 'h1',
                  'fnDuration': 400,
                  'afterFnDuration': 200,
                },
              ],
            },
            'failedFromHookId': 'h1',
            'wallClockStartedAt': '2018-02-01T20:14:19.323Z',
            'wallClockDuration': 1234,
            'videoTimestamp': 9999,
          },
        ],
      },
      {
        'clientId': 'r4',
        'state': 'skipped',
        'displayError': null,
        'attempts': [
          {
            'state': 'skipped',
            'error': null,
            'timings': null,
            'failedFromHookId': null,
            'wallClockStartedAt': null,
            'wallClockDuration': null,
            'videoTimestamp': null,
          },
        ],
      },
    ],
    'exception': null,
    'video': true,
    'screenshots': [
      {
        'screenshotId': 'some-random-id',
        'name': null,
        'testId': 'r3',
        'testAttemptIndex': 0,
        'takenAt': '2018-02-01T20:14:19.323Z',
        'height': 720,
        'width': 1280,
      },
    ],
    'reporterStats': {
      'suites': 1,
      'tests': 1,
      'passes': 0,
      'pending': 0,
      'failures': 1,
      'start': '2018-02-01T20:14:19.323Z',
      'end': '2018-02-01T20:14:19.323Z',
      'duration': 1234,
    },
    'metadata': {
      'studioCreated': 0,
      'studioExtended': 0,
    },
  },
  {
    'stats': {
      'suites': 1,
      'tests': 2,
      'passes': 1,
      'pending': 1,
      'skipped': 0,
      'failures': 0,
      'wallClockStartedAt': '2018-02-01T20:14:19.323Z',
      'wallClockEndedAt': '2018-02-01T20:14:19.323Z',
      'wallClockDuration': 1234,
    },
    'tests': [
      {
        'clientId': 'r3',
        'state': 'passed',
        'displayError': null,
        'attempts': [
          {
            'state': 'passed',
            'error': null,
            'timings': {
              'lifecycle': 100,
              'test': {
                'fnDuration': 400,
                'afterFnDuration': 200,
              },
            },
            'failedFromHookId': null,
            'wallClockStartedAt': '2018-02-01T20:14:19.323Z',
            'wallClockDuration': 1234,
            'videoTimestamp': 9999,
          },
        ],
      },
      {
        'clientId': 'r4',
        'state': 'pending',
        'displayError': null,
        'attempts': [
          {
            'state': 'pending',
            'error': null,
            'timings': null,
            'failedFromHookId': null,
            'wallClockStartedAt': null,
            'wallClockDuration': null,
            'videoTimestamp': null,
          },
        ],
      },
    ],
    'exception': null,
    'video': false,
    'screenshots': [
      {
        'screenshotId': 'some-random-id',
        'name': 'yay it passes',
        'testId': 'r3',
        'testAttemptIndex': 0,
        'takenAt': '2018-02-01T20:14:19.323Z',
        'height': 1022,
        'width': 400,
      },
    ],
    'reporterStats': {
      'suites': 1,
      'tests': 2,
      'passes': 1,
      'pending': 1,
      'failures': 0,
      'start': '2018-02-01T20:14:19.323Z',
      'end': '2018-02-01T20:14:19.323Z',
      'duration': 1234,
    },
    'metadata': {
      'studioCreated': 0,
      'studioExtended': 0,
    },
  },
  {
    'stats': {
      'suites': 0,
      'tests': 1,
      'passes': 0,
      'pending': 0,
      'skipped': 0,
      'failures': 1,
      'wallClockStartedAt': '2018-02-01T20:14:19.323Z',
      'wallClockEndedAt': '2018-02-01T20:14:19.323Z',
      'wallClockDuration': 1234,
    },
    'tests': [
      {
        'clientId': 'r2',
        'state': 'failed',
        'displayError': 'Error: The following error originated from your test code, not from Cypress.\n\n  > instantly fails\n\nWhen Cypress detects uncaught errors originating from your test code it will automatically fail the current test.\n\nCypress could not associate this error to any specific test.\n\nWe dynamically generated a new test to display this failure.\n      [stack trace lines]',
        'attempts': [
          {
            'state': 'failed',
            'error': {
              'name': 'Error',
              'message': 'The following error originated from your test code, not from Cypress.\n\n  > instantly fails\n\nWhen Cypress detects uncaught errors originating from your test code it will automatically fail the current test.\n\nCypress could not associate this error to any specific test.\n\nWe dynamically generated a new test to display this failure.',
              'stack': '[stack trace lines]',
              'codeFrame': {
                'line': 1,
                'column': 7,
                'originalFile': 'cypress/e2e/record_uncaught.cy.js',
                'relativeFile': 'cypress/e2e/record_uncaught.cy.js',
                'absoluteFile': '/foo/bar/.projects/e2e/cypress/e2e/record_uncaught.cy.js',
                'frame': '> 1 | throw new Error(\'instantly fails\')\n    |       ^\n  2 | ',
                'language': 'js',
              },
            },
            'timings': {
              'lifecycle': 100,
              'test': {
                'fnDuration': 400,
                'afterFnDuration': 200,
              },
            },
            'failedFromHookId': null,
            'wallClockStartedAt': '2018-02-01T20:14:19.323Z',
            'wallClockDuration': 1234,
            'videoTimestamp': 9999,
          },
        ],
      },
    ],
    'exception': null,
    'video': true,
    'screenshots': [
      {
        'screenshotId': 'some-random-id',
        'name': null,
        'testId': 'r2',
        'testAttemptIndex': 0,
        'takenAt': '2018-02-01T20:14:19.323Z',
        'height': 720,
        'width': 1280,
      },
    ],
    'reporterStats': {
      'suites': 0,
      'tests': 1,
      'passes': 0,
      'pending': 0,
      'failures': 1,
      'start': '2018-02-01T20:14:19.323Z',
      'end': '2018-02-01T20:14:19.323Z',
      'duration': 1234,
    },
    'metadata': {
      'studioCreated': 0,
      'studioExtended': 0,
    },
  },
]

exports['e2e record api interaction warnings create run warnings grace period - over private tests limit warns when over private test results 1'] = `
You've exceeded the limit of private test results under your free plan this month. The limit is 500 private test results.

Your plan is now in a grace period, which means your tests will still be recorded until 2999-12-31. Please upgrade your plan to continue recording tests on Cypress Cloud in the future.

https://on.cypress.io/dashboard/organizations/org-id-1234/billing

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (record_pass.cy.js)                                                        │
  │ Searched:   cypress/e2e/record_pass*                                                           │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_pass.cy.js                                                               (1 of 1)
  Estimated: X second(s)


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
  │ Estimated:    X second(s)                                                                      │
  │ Spec Ran:     record_pass.cy.js                                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_pass.cy.js/yay it passes.png                 (400x1022)


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/record_pass.cy.js.mp4


  (Uploading Screenshots & Videos)

  - Done Uploading (1/1) /foo/bar/.projects/e2e/cypress/screenshots/record_pass.cy.js/yay it passes.png

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  record_pass.cy.js                        XX:XX        2        1        -        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        2        1        -        1        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12


`

exports['e2e record api interaction warnings create run warnings grace period - over tests limit warns when over test results 1'] = `
You've exceeded the limit of test results under your free plan this month. The limit is 500 test results.

Your plan is now in a grace period, which means you will have the full benefits of your current plan until 2999-12-31.

Please visit your billing to upgrade your plan.

https://on.cypress.io/dashboard/organizations/org-id-1234/billing

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (record_pass.cy.js)                                                        │
  │ Searched:   cypress/e2e/record_pass*                                                           │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_pass.cy.js                                                               (1 of 1)
  Estimated: X second(s)


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
  │ Estimated:    X second(s)                                                                      │
  │ Spec Ran:     record_pass.cy.js                                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_pass.cy.js/yay it passes.png                 (400x1022)


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/record_pass.cy.js.mp4


  (Uploading Screenshots & Videos)

  - Done Uploading (1/1) /foo/bar/.projects/e2e/cypress/screenshots/record_pass.cy.js/yay it passes.png

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  record_pass.cy.js                        XX:XX        2        1        -        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        2        1        -        1        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12


`

exports['e2e record api interaction warnings create run warnings paid plan - over private tests limit warns when over private test results 1'] = `
You've exceeded the limit of test results under your current billing plan this month. The limit is 500 private test results.

To continue getting the full benefits of your current plan, please visit your billing to upgrade.

https://on.cypress.io/dashboard/organizations/org-id-1234/billing

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (record_pass.cy.js)                                                        │
  │ Searched:   cypress/e2e/record_pass*                                                           │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_pass.cy.js                                                               (1 of 1)
  Estimated: X second(s)


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
  │ Estimated:    X second(s)                                                                      │
  │ Spec Ran:     record_pass.cy.js                                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_pass.cy.js/yay it passes.png                 (400x1022)


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/record_pass.cy.js.mp4


  (Uploading Screenshots & Videos)

  - Done Uploading (1/1) /foo/bar/.projects/e2e/cypress/screenshots/record_pass.cy.js/yay it passes.png

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  record_pass.cy.js                        XX:XX        2        1        -        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        2        1        -        1        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12


`

exports['e2e record api interaction warnings create run warnings paid plan - over tests limit warns when over test results 1'] = `
You've exceeded the limit of test results under your current billing plan this month. The limit is 500 test results.

To continue getting the full benefits of your current plan, please visit your billing to upgrade.

https://on.cypress.io/dashboard/organizations/org-id-1234/billing

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (record_pass.cy.js)                                                        │
  │ Searched:   cypress/e2e/record_pass*                                                           │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_pass.cy.js                                                               (1 of 1)
  Estimated: X second(s)


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
  │ Estimated:    X second(s)                                                                      │
  │ Spec Ran:     record_pass.cy.js                                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_pass.cy.js/yay it passes.png                 (400x1022)


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/record_pass.cy.js.mp4


  (Uploading Screenshots & Videos)

  - Done Uploading (1/1) /foo/bar/.projects/e2e/cypress/screenshots/record_pass.cy.js/yay it passes.png

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  record_pass.cy.js                        XX:XX        2        1        -        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        2        1        -        1        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12


`

exports['e2e record api interaction warnings create run warnings free plan - over tests limit v2 warns when over test results 1'] = `
You've exceeded the limit of test results under your free billing plan this month. The limit is 500 test results.

To continue getting the full benefits of your current plan, please visit your billing to upgrade.

https://on.cypress.io/dashboard/organizations/org-id-1234/billing

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (record_pass.cy.js)                                                        │
  │ Searched:   cypress/e2e/record_pass*                                                           │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_pass.cy.js                                                               (1 of 1)
  Estimated: X second(s)


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
  │ Estimated:    X second(s)                                                                      │
  │ Spec Ran:     record_pass.cy.js                                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_pass.cy.js/yay it passes.png                 (400x1022)


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/record_pass.cy.js.mp4


  (Uploading Screenshots & Videos)

  - Done Uploading (1/1) /foo/bar/.projects/e2e/cypress/screenshots/record_pass.cy.js/yay it passes.png

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  record_pass.cy.js                        XX:XX        2        1        -        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        2        1        -        1        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12


`

exports['e2e record api interaction errors create run 500 errors and exits 1'] = `
We encountered an unexpected error communicating with our servers.

StatusCodeError: 500 - "Internal Server Error"

`

exports['e2e record api interaction errors create run 500 when grouping without parallelization errors and exits 1'] = `
We encountered an unexpected error communicating with our servers.

StatusCodeError: 500 - "Internal Server Error"

The --group flag you passed was: foo
The --ciBuildId flag you passed was: ciBuildId123

`

exports['e2e record api interaction errors create instance 500 without parallelization - does not proceed 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      2 found (a_record.cy.js, b_record.cy.js)                                           │
  │ Searched:   cypress/e2e/a_record.cy.js, cypress/e2e/b_record.cy.js                             │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘

We encountered an unexpected error communicating with our servers.

StatusCodeError: 500 - "Internal Server Error"

`

exports['e2e record api interaction errors create instance errors and exits on createInstance error 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (a_record_instantfail.cy.js)                                               │
  │ Searched:   cypress/e2e/a_record_instantfail.cy.js                                             │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘

We encountered an unexpected error communicating with our servers.

StatusCodeError: 500 - "Internal Server Error"

`

exports['e2e record api interaction errors postInstanceTests without parallelization errors and exits 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      2 found (a_record.cy.js, b_record.cy.js)                                           │
  │ Searched:   cypress/e2e/a_record.cy.js, cypress/e2e/b_record.cy.js                             │
  │ Params:     Tag: false, Group: foo, Parallel: false                                            │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  a_record.cy.js                                                                  (1 of 2)
  Estimated: X second(s)
We encountered an unexpected error communicating with our servers.

StatusCodeError: 500 - "Internal Server Error"

The --group flag you passed was: foo
The --ciBuildId flag you passed was: 1

`

exports['e2e record api interaction errors postInstanceTests with parallelization errors and exits 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      2 found (a_record.cy.js, b_record.cy.js)                                           │
  │ Searched:   cypress/e2e/a_record.cy.js, cypress/e2e/b_record.cy.js                             │
  │ Params:     Tag: false, Group: foo, Parallel: true                                             │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  a_record.cy.js                                                                  (1 of 2)
  Estimated: X second(s)
We encountered an unexpected error communicating with our servers.

StatusCodeError: 500 - "Internal Server Error"

Because you passed the --parallel flag, this run cannot proceed because it requires a valid response from our servers.

The --group flag you passed was: foo
The --ciBuildId flag you passed was: ciBuildId123

`

exports['e2e record api interaction errors postInstanceResults errors and exits in serial 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (record_pass.cy.js)                                                        │
  │ Searched:   cypress/e2e/record_pass*                                                           │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_pass.cy.js                                                               (1 of 1)
  Estimated: X second(s)


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
  │ Estimated:    X second(s)                                                                      │
  │ Spec Ran:     record_pass.cy.js                                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_pass.cy.js/yay it passes.png                 (400x1022)


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/record_pass.cy.js.mp4


  (Uploading Screenshots & Videos)

We encountered an unexpected error communicating with our servers.

StatusCodeError: 500 - "Internal Server Error"

`

exports['e2e record api skips specs records tests and exits without executing 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      2 found (a_record_instantfail.cy.js, b_record.cy.js)                               │
  │ Searched:   cypress/e2e/a_record_instantfail.cy.js, cypress/e2e/b_record.cy.js                 │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  a_record_instantfail.cy.js                                                      (1 of 2)
  Estimated: X second(s)

  This spec and its tests were skipped because the run has been canceled.

────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  b_record.cy.js                                                                  (2 of 2)
  Estimated: X second(s)


  b spec
    ✓ b test


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
  │ Estimated:    X second(s)                                                                      │
  │ Spec Ran:     b_record.cy.js                                                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Uploading Screenshots & Videos)

  - Nothing to Upload

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ -  a_record_instantfail.cy.js             SKIPPED        -        -        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  b_record.cy.js                           XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    -  The run was canceled                     XX:XX        1        1        -        -        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12


  Exiting with non-zero exit code because the run was canceled.

`

exports['e2e record api skips specs records tests and exits without executing in parallel 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      2 found (a_record_instantfail.cy.js, b_record.cy.js)                               │
  │ Searched:   cypress/e2e/a_record_instantfail.cy.js, cypress/e2e/b_record.cy.js                 │
  │ Params:     Tag: false, Group: abc, Parallel: true                                             │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  a_record_instantfail.cy.js                                                      (1 of 2)
  Estimated: X second(s)

  This spec and its tests were skipped because the run has been canceled.

────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  b_record.cy.js                                                                  (2 of 2)
  Estimated: X second(s)


  b spec
    ✓ b test


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
  │ Estimated:    X second(s)                                                                      │
  │ Spec Ran:     b_record.cy.js                                                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Uploading Screenshots & Videos)

  - Nothing to Upload

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ -  a_record_instantfail.cy.js             SKIPPED        -        -        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  b_record.cy.js                           XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    -  The run was canceled                     XX:XX        1        1        -        -        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12


  Exiting with non-zero exit code because the run was canceled.

`

exports['e2e record empty specs succeeds when empty spec file 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      2 found (empty_suite.cy.js, empty.cy.js)                                           │
  │ Searched:   cypress/e2e/empty_suite.cy.js, cypress/e2e/empty.cy.js                             │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  empty_suite.cy.js                                                               (1 of 2)
  Estimated: X second(s)


  0 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        0                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Estimated:    X second(s)                                                                      │
  │ Spec Ran:     empty_suite.cy.js                                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/empty_suite.cy.js.mp4


  (Uploading Screenshots & Videos)

  - Nothing to Upload

────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  empty.cy.js                                                                     (2 of 2)
  Estimated: X second(s)


  0 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        0                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Estimated:    X second(s)                                                                      │
  │ Spec Ran:     empty.cy.js                                                                      │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/empty.cy.js.mp4


  (Uploading Screenshots & Videos)

  - Nothing to Upload

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  empty_suite.cy.js                        XX:XX        -        -        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  empty.cy.js                              XX:XX        -        -        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        -        -        -        -        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12


`

exports['e2e record quiet mode respects quiet mode 1'] = `


  record pass
    ✓ passes
    - is pending


  1 passing
  1 pending


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/record_pass.cy.js.mp4


`

exports['e2e record api interaction errors create run 412 errors and exits when request schema is invalid 1'] = `
Recording this run failed. The request was invalid.

request should follow postRunRequest@2.0.0 schema

Errors:

[
  "data has additional properties: group, parallel, ciBuildId, tags, testingType, runnerCapabilities",
  "data.platform is the wrong type"
]

Request Sent:

{
  "ci": null,
  "specs": [
    "cypress/e2e/record_pass.cy.js"
  ],
  "commit": null,
  "group": null,
  "platform": null,
  "parallel": null,
  "ciBuildId": null,
  "projectId": "pid123",
  "recordKey": "f858a2bc-b469-4e48-be67-0876339ee7e1",
  "specPattern": "cypress/e2e/record_pass*",
  "tags": [
    ""
  ],
  "testingType": "e2e",
  "runnerCapabilities": {
    "dynamicSpecsInSerialMode": true,
    "skipSpecAction": true
  }
}

`

exports['e2e record video recording when videoUploadOnPasses=false does not upload when specs pass 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      2 found (record_fail.cy.js, record_pass.cy.js)                                     │
  │ Searched:   cypress/e2e/record_fail*, cypress/e2e/record_pass*                                 │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_fail.cy.js                                                               (1 of 2)
  Estimated: X second(s)


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
  │ Estimated:    X second(s)                                                                      │
  │ Spec Ran:     record_fail.cy.js                                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_fail.cy.js/record fails -- fails 1 -- be     (1280x720)
     fore each hook (failed).png                                                                    


  (Video)

  -  Started compressing: Compressing to 32 CRF                                                     
  -  Finished compressing: X second(s)                                               

  -  Video output: /XXX/XXX/XXX/cypress/videos/record_fail.cy.js.mp4


  (Uploading Screenshots & Videos)

  - Done Uploading (*/2) /foo/bar/.projects/e2e/cypress/screenshots/record_fail.cy.js/record fails -- fails 1 -- before each hook (failed).png
  - Done Uploading (*/2) /foo/bar/.projects/e2e/cypress/videos/record_fail.cy.js.mp4

────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_pass.cy.js                                                               (2 of 2)
  Estimated: X second(s)


  record pass
plugin stdout
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
  │ Estimated:    X second(s)                                                                      │
  │ Spec Ran:     record_pass.cy.js                                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_pass.cy.js/yay it passes.png                 (400x1022)


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/record_pass.cy.js.mp4


  (Uploading Screenshots & Videos)

  - Done Uploading (1/1) /foo/bar/.projects/e2e/cypress/screenshots/record_pass.cy.js/yay it passes.png

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  record_fail.cy.js                        XX:XX        2        -        1        -        1 │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  record_pass.cy.js                        XX:XX        2        1        -        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 2 failed (50%)                      XX:XX        4        1        1        1        1  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12


`

exports['e2e record video recording when video=false does not upload when not enabled 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (record_pass.cy.js)                                                        │
  │ Searched:   cypress/e2e/record_pass*                                                           │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_pass.cy.js                                                               (1 of 1)
  Estimated: X second(s)


  record pass
plugin stdout
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
  │ Estimated:    X second(s)                                                                      │
  │ Spec Ran:     record_pass.cy.js                                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_pass.cy.js/yay it passes.png                 (400x1022)


  (Uploading Screenshots & Videos)

  - Done Uploading (1/1) /foo/bar/.projects/e2e/cypress/screenshots/record_pass.cy.js/yay it passes.png

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  record_pass.cy.js                        XX:XX        2        1        -        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        2        1        -        1        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12


`

exports['e2e record api interaction errors create run 402 - auto cancel not available in plan errors and exits when auto cancel not available in plan 1'] = `
Auto Cancellation is not included under your current billing plan.

To enable this service, please visit your billing and upgrade to another plan with Auto Cancellation.

https://on.cypress.io/dashboard/organizations/org-id-1234/billing

`

exports['e2e record misconfiguration errors and exits when no browser found 1'] = `
Can't run because you've entered an invalid browser name.

Browser: browserDoesNotExist was not found on your system or is not supported by Cypress.

Cypress supports the following browsers:
 - electron
 - chrome
 - chromium
 - chrome:canary
 - edge
 - firefox

You can also use a custom browser: https://on.cypress.io/customize-browsers

Available browsers found on your system are:
- browser1
- browser2
- browser3
`

exports['e2e record api interaction errors sendPreflight [F1] 500 status code errors with empty body fails after retrying 1'] = `
We encountered an unexpected error communicating with our servers.

StatusCodeError: 500 - "Internal Server Error"

We will retry 1 more time in X second(s)...

We encountered an unexpected error communicating with our servers.

StatusCodeError: 500 - "Internal Server Error"

Because you passed the --parallel flag, this run cannot proceed because it requires a valid response from our servers.

The --group flag you passed was: foo
The --ciBuildId flag you passed was: ciBuildId123

`

exports['e2e record api interaction errors sendPreflight [F2] 404 status code with JSON body fails without retrying 1'] = `
We could not find a Cypress Cloud project with the projectId: pid123

This projectId came from your cypress-with-project-id.config.js file or an environment variable.

Please log into Cypress Cloud and find your project.

We will list the correct projectId in the 'Settings' tab.

Alternatively, you can create a new project directly from within the Cypress app.

https://on.cypress.io/cloud

`

exports['e2e record api interaction errors sendPreflight [F2] 404 status code with empty body fails without retrying 1'] = `
We could not find a Cypress Cloud project with the projectId: pid123

This projectId came from your cypress-with-project-id.config.js file or an environment variable.

Please log into Cypress Cloud and find your project.

We will list the correct projectId in the 'Settings' tab.

Alternatively, you can create a new project directly from within the Cypress app.

https://on.cypress.io/cloud

`

exports['e2e record api interaction errors sendPreflight [F3] 201 status code with invalid decryption fails without retrying 1'] = `
We encountered an unexpected error communicating with our servers.

DecryptionError: JWE Recipients missing or incorrect type

Because you passed the --parallel flag, this run cannot proceed because it requires a valid response from our servers.

The --group flag you passed was: foo
The --ciBuildId flag you passed was: ciBuildId123

`

exports['e2e record api interaction errors sendPreflight [F3] 200 status code with empty body fails without retrying 1'] = `
We encountered an unexpected error communicating with our servers.

DecryptionError: General JWE must be an object

Because you passed the --parallel flag, this run cannot proceed because it requires a valid response from our servers.

The --group flag you passed was: foo
The --ciBuildId flag you passed was: ciBuildId123

`

exports['e2e record api interaction errors sendPreflight [F4] 412 status code with valid decryption fails without retrying 1'] = `
Recording this run failed. The request was invalid.

Recording is not working

Errors:

[
  "attempted to send invalid data"
]

Request Sent:

{
  "projectId": "cy12345"
}

`

exports['e2e record api interaction errors sendPreflight [W1] warning message renders preflight warning messages prior to run warnings 1'] = `
Warning from Cypress Cloud: 

----------------------------------------------------------------------
This feature will not be supported soon, please check with Cypress to learn more: https://on.cypress.io/
----------------------------------------------------------------------

You've exceeded the limit of private test results under your free plan this month. The limit is 500 private test results.

Your plan is now in a grace period, which means your tests will still be recorded until 2999-12-31. Please upgrade your plan to continue recording tests on Cypress Cloud in the future.

https://on.cypress.io/dashboard/organizations/org-id-1234/billing

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (record_pass.cy.js)                                                        │
  │ Searched:   cypress/e2e/record_pass*                                                           │
  │ Params:     Tag: nightly, Group: foo, Parallel: true                                           │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  record_pass.cy.js                                                               (1 of 1)
  Estimated: X second(s)


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
  │ Estimated:    X second(s)                                                                      │
  │ Spec Ran:     record_pass.cy.js                                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/record_pass.cy.js/yay it passes.png                 (400x1022)


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/record_pass.cy.js.mp4


  (Uploading Screenshots & Videos)

  - Done Uploading (1/1) /foo/bar/.projects/e2e/cypress/screenshots/record_pass.cy.js/yay it passes.png

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  record_pass.cy.js                        XX:XX        2        1        -        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        2        1        -        1        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12


`

exports['e2e record api interaction errors sendPreflight [F1] socket errors fails after retrying 1'] = `
We encountered an unexpected error communicating with our servers.

RequestError: Error: socket hang up

We will retry 1 more time in X second(s)...

We encountered an unexpected error communicating with our servers.

RequestError: Error: socket hang up

Because you passed the --parallel flag, this run cannot proceed because it requires a valid response from our servers.

The --group flag you passed was: foo
The --ciBuildId flag you passed was: ciBuildId123

`

exports['e2e record api interaction errors sendPreflight [F3] 422 status code with invalid decryption fails without retrying 1'] = `
We encountered an unexpected error communicating with our servers.

DecryptionError: JWE Recipients missing or incorrect type

Because you passed the --parallel flag, this run cannot proceed because it requires a valid response from our servers.

The --group flag you passed was: foo
The --ciBuildId flag you passed was: ciBuildId123

`

exports['e2e record api interaction errors sendPreflight [F1] 500 status code errors with body fails after retrying 1'] = `
We encountered an unexpected error communicating with our servers.

StatusCodeError: 500 - "Internal Server Error"

We will retry 1 more time in X second(s)...

We encountered an unexpected error communicating with our servers.

StatusCodeError: 500 - "Internal Server Error"

Because you passed the --parallel flag, this run cannot proceed because it requires a valid response from our servers.

The --group flag you passed was: foo
The --ciBuildId flag you passed was: ciBuildId123

`

exports['e2e record api interaction errors sendPreflight [F5] 422 status code with valid decryption on createRun errors and exits when group name is in use 1'] = `
You passed the --group flag, but this group name has already been used for this run.

The existing run is: https://cloud.cypress.io/runs/12345

The --group flag you passed was: e2e-tests

If you are trying to parallelize this run, then also pass the --parallel flag, else pass a different group name.

https://on.cypress.io/run-group-name-not-unique

`
