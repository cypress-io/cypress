exports['e2e record passing passes 1'] = `
====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      4 found (record_error_spec.coffee, record_fail_spec.coffee, record_pass_spec.coff… │
  │ Searched:   cypress/integration/record*                                                        │
  │ Run URL:    https://dashboard.cypress.io/#/projects/cjvoj7/runs/12                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: record_error_spec.coffee...                                                     (1 of 4) 

Oops...we found an error preparing this test file:

  /foo/bar/.projects/e2e/cypress/integration/record_error_spec.coffee

The error was:

Error: Cannot find module '../it/does/not/exist' from '/foo/bar/.projects/e2e/cypress/integration'


This occurred while Cypress was compiling and bundling your test code. This is usually caused by:

- A missing file or dependency
- A syntax error in the file or one of its dependencies

Fix the error in your code and re-run your tests.

  (Results)

  ┌────────────────────────────────────────┐
  │ Tests:        0                        │
  │ Passing:      0                        │
  │ Failing:      1                        │
  │ Pending:      0                        │
  │ Skipped:      0                        │
  │ Screenshots:  0                        │
  │ Video:        true                     │
  │ Duration:     X seconds                │
  │ Spec Ran:     record_error_spec.coffee │
  └────────────────────────────────────────┘


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


  (Uploading Results)

  - Done Uploading (1/1) /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: record_fail_spec.coffee...                                                      (2 of 4) 


  record fails
    1) "before each" hook for "fails 1"


  0 passing
  1 failing

  1) record fails "before each" hook for "fails 1":
     Error: foo

Because this error occurred during a 'before each' hook we are skipping the remaining tests in the current suite: 'record fails'
      at stack trace line




  (Results)

  ┌───────────────────────────────────────┐
  │ Tests:        2                       │
  │ Passing:      0                       │
  │ Failing:      1                       │
  │ Pending:      0                       │
  │ Skipped:      1                       │
  │ Screenshots:  1                       │
  │ Video:        true                    │
  │ Duration:     X seconds               │
  │ Spec Ran:     record_fail_spec.coffee │
  └───────────────────────────────────────┘


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/record_fail_spec.coffee/record fails -- fails 1 -- before each hook (failed).png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


  (Uploading Results)

  - Done Uploading (1/2) /foo/bar/.projects/e2e/cypress/screenshots/record_fail_spec.coffee/record fails -- fails 1 -- before each hook (failed).png
  - Done Uploading (2/2) /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: record_pass_spec.coffee...                                                      (3 of 4) 


  record pass
    ✓ passes
    - is pending


  1 passing
  1 pending


  (Results)

  ┌───────────────────────────────────────┐
  │ Tests:        2                       │
  │ Passing:      1                       │
  │ Failing:      0                       │
  │ Pending:      1                       │
  │ Skipped:      0                       │
  │ Screenshots:  1                       │
  │ Video:        true                    │
  │ Duration:     X seconds               │
  │ Spec Ran:     record_pass_spec.coffee │
  └───────────────────────────────────────┘


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/record_pass_spec.coffee/yay it passes.png (202x1002)


  (Uploading Results)

  - Done Uploading (1/1) /foo/bar/.projects/e2e/cypress/screenshots/record_pass_spec.coffee/yay it passes.png

────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: record_uncaught_spec.coffee...                                                  (4 of 4) 


  1) An uncaught error was detected outside of a test

  0 passing
  1 failing

  1)  An uncaught error was detected outside of a test:
     Uncaught Error: instantly fails

This error originated from your test code, not from Cypress.

When Cypress detects uncaught errors originating from your test code it will automatically fail the current test.

Cypress could not associate this error to any specific test.

We dynamically generated a new test to display this failure.
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line




  (Results)

  ┌───────────────────────────────────────────┐
  │ Tests:        1                           │
  │ Passing:      0                           │
  │ Failing:      1                           │
  │ Pending:      0                           │
  │ Skipped:      0                           │
  │ Screenshots:  1                           │
  │ Video:        true                        │
  │ Duration:     X seconds                   │
  │ Spec Ran:     record_uncaught_spec.coffee │
  └───────────────────────────────────────────┘


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/record_uncaught_spec.coffee/An uncaught error was detected outside of a test (failed).png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


  (Uploading Results)

  - Done Uploading (1/2) /foo/bar/.projects/e2e/cypress/screenshots/record_uncaught_spec.coffee/An uncaught error was detected outside of a test (failed).png
  - Done Uploading (2/2) /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖ record_error_spec.coffee                  XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖ record_fail_spec.coffee                   XX:XX        2        -        1        -        1 │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔ record_pass_spec.coffee                   XX:XX        2        1        -        1        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖ record_uncaught_spec.coffee               XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    3 of 4 failed (75%)                         XX:XX        5        1        3        1        1  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/#/projects/cjvoj7/runs/12                                 

`

exports['e2e record api interaction errors recordKey and projectId errors and exits 1'] = `We failed trying to authenticate this project: pid123

Your Record Key is invalid: f858a...ee7e1

It may have been recently revoked by you or another user.

Please log into the Dashboard to see the updated token.

https://on.cypress.io/dashboard/projects/pid123
`

exports['e2e record api interaction errors project 404 errors and exits 1'] = `We could not find a project with the ID: pid123

This projectId came from your cypress.json file or an environment variable.

Please log into the Dashboard and find your project.

We will list the correct projectId in the 'Settings' tab.

Alternatively, you can create a new project using the Desktop Application.

https://on.cypress.io/dashboard
`

exports['e2e record api interaction errors create run warns and does not create or update instances 1'] = `Warning: We encountered an error talking to our servers.

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
                                                                                                    
  Running: record_pass_spec.coffee...                                                      (1 of 1) 


  record pass
    ✓ passes
    - is pending


  1 passing
  1 pending


  (Results)

  ┌───────────────────────────────────────┐
  │ Tests:        2                       │
  │ Passing:      1                       │
  │ Failing:      0                       │
  │ Pending:      1                       │
  │ Skipped:      0                       │
  │ Screenshots:  1                       │
  │ Video:        true                    │
  │ Duration:     X seconds               │
  │ Spec Ran:     record_pass_spec.coffee │
  └───────────────────────────────────────┘


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/record_pass_spec.coffee/yay it passes.png (202x1002)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔ record_pass_spec.coffee                   XX:XX        2        1        -        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    All specs passed!                           XX:XX        2        1        -        1        -  

`

exports['e2e record api interaction errors create instance does not update instance 1'] = `
====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (record_pass_spec.coffee)                                                  │
  │ Searched:   cypress/integration/record_pass*                                                   │
  │ Run URL:    https://dashboard.cypress.io/#/projects/cjvoj7/runs/12                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘

Warning: We encountered an error talking to our servers.

This run will not be recorded.

This error will not alter the exit code.

StatusCodeError: 500 - "Internal Server Error"

────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: record_pass_spec.coffee...                                                      (1 of 1) 


  record pass
    ✓ passes
    - is pending


  1 passing
  1 pending


  (Results)

  ┌───────────────────────────────────────┐
  │ Tests:        2                       │
  │ Passing:      1                       │
  │ Failing:      0                       │
  │ Pending:      1                       │
  │ Skipped:      0                       │
  │ Screenshots:  1                       │
  │ Video:        true                    │
  │ Duration:     X seconds               │
  │ Spec Ran:     record_pass_spec.coffee │
  └───────────────────────────────────────┘


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/record_pass_spec.coffee/yay it passes.png (202x1002)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔ record_pass_spec.coffee                   XX:XX        2        1        -        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    All specs passed!                           XX:XX        2        1        -        1        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/#/projects/cjvoj7/runs/12                                 

`

exports['e2e record api interaction errors update instance does not update instance stdout 1'] = `
====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (record_pass_spec.coffee)                                                  │
  │ Searched:   cypress/integration/record_pass*                                                   │
  │ Run URL:    https://dashboard.cypress.io/#/projects/cjvoj7/runs/12                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: record_pass_spec.coffee...                                                      (1 of 1) 


  record pass
    ✓ passes
    - is pending


  1 passing
  1 pending


  (Results)

  ┌───────────────────────────────────────┐
  │ Tests:        2                       │
  │ Passing:      1                       │
  │ Failing:      0                       │
  │ Pending:      1                       │
  │ Skipped:      0                       │
  │ Screenshots:  1                       │
  │ Video:        true                    │
  │ Duration:     X seconds               │
  │ Spec Ran:     record_pass_spec.coffee │
  └───────────────────────────────────────┘


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/record_pass_spec.coffee/yay it passes.png (202x1002)


  (Uploading Results)

Warning: We encountered an error talking to our servers.

This run will not be recorded.

This error will not alter the exit code.

StatusCodeError: 500 - "Internal Server Error"

====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔ record_pass_spec.coffee                   XX:XX        2        1        -        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    All specs passed!                           XX:XX        2        1        -        1        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/#/projects/cjvoj7/runs/12                                 

`

exports['e2e record api interaction errors update instance stdout warns but proceeds 1'] = `
====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (record_pass_spec.coffee)                                                  │
  │ Searched:   cypress/integration/record_pass*                                                   │
  │ Run URL:    https://dashboard.cypress.io/#/projects/cjvoj7/runs/12                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: record_pass_spec.coffee...                                                      (1 of 1) 


  record pass
    ✓ passes
    - is pending


  1 passing
  1 pending


  (Results)

  ┌───────────────────────────────────────┐
  │ Tests:        2                       │
  │ Passing:      1                       │
  │ Failing:      0                       │
  │ Pending:      1                       │
  │ Skipped:      0                       │
  │ Screenshots:  1                       │
  │ Video:        true                    │
  │ Duration:     X seconds               │
  │ Spec Ran:     record_pass_spec.coffee │
  └───────────────────────────────────────┘


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/record_pass_spec.coffee/yay it passes.png (202x1002)


  (Uploading Results)

  - Done Uploading (1/1) /foo/bar/.projects/e2e/cypress/screenshots/record_pass_spec.coffee/yay it passes.png
Warning: We encountered an error talking to our servers.

This run will not be recorded.

This error will not alter the exit code.

StatusCodeError: 500 - "Internal Server Error"

====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔ record_pass_spec.coffee                   XX:XX        2        1        -        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    All specs passed!                           XX:XX        2        1        -        1        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/#/projects/cjvoj7/runs/12                                 

`

exports['e2e record failing errors and exits without projectId 1'] = `You passed the --record flag but this project has not been setup to record.

This project is missing the 'projectId' inside of 'cypress.json'.

We cannot uniquely identify this project without this id.

You need to setup this project to record. This will generate a unique 'projectId'.

Alternatively if you omit the --record flag this project will run without recording.

https://on.cypress.io/recording-project-runs
`

exports['e2e record recordKey errors and exits without recordKey 1'] = `You passed the --record flag but did not provide us your Record Key.

You can pass us your Record Key like this:

  cypress run --record --key <record_key>

You can also set the key as an environment variable with the name CYPRESS_RECORD_KEY.

https://on.cypress.io/how-do-i-record-runs
`

exports['e2e record projectId errors and exits without projectId 1'] = `You passed the --record flag but this project has not been setup to record.

This project is missing the 'projectId' inside of 'cypress.json'.

We cannot uniquely identify this project without this id.

You need to setup this project to record. This will generate a unique 'projectId'.

Alternatively if you omit the --record flag this project will run without recording.

https://on.cypress.io/recording-project-runs
`

exports['e2e record api interaction errors recordKey and projectId errors and exits on 401 1'] = `We failed trying to authenticate this project: pid123

Your Record Key is invalid: f858a...ee7e1

It may have been recently revoked by you or another user.

Please log into the Dashboard to see the updated token.

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
  │ Run URL:    https://dashboard.cypress.io/#/projects/cjvoj7/runs/12                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: record_pass_spec.coffee...                                                      (1 of 1) 


  record pass
    ✓ passes
    - is pending


  1 passing
  1 pending


  (Results)

  ┌───────────────────────────────────────┐
  │ Tests:        2                       │
  │ Passing:      1                       │
  │ Failing:      0                       │
  │ Pending:      1                       │
  │ Skipped:      0                       │
  │ Screenshots:  1                       │
  │ Video:        false                   │
  │ Duration:     X seconds               │
  │ Spec Ran:     record_pass_spec.coffee │
  └───────────────────────────────────────┘


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/record_pass_spec.coffee/yay it passes.png (202x1002)


  (Uploading Results)

  - Done Uploading (1/1) /foo/bar/.projects/e2e/cypress/screenshots/record_pass_spec.coffee/yay it passes.png

====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔ record_pass_spec.coffee                   XX:XX        2        1        -        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    All specs passed!                           XX:XX        2        1        -        1        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/#/projects/cjvoj7/runs/12                                 

`

exports['e2e record api interaction errors uploading assets warns but proceeds 1'] = `
====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (record_pass_spec.coffee)                                                  │
  │ Searched:   cypress/integration/record_pass*                                                   │
  │ Run URL:    https://dashboard.cypress.io/#/projects/cjvoj7/runs/12                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: record_pass_spec.coffee...                                                      (1 of 1) 


  record pass
    ✓ passes
    - is pending


  1 passing
  1 pending


  (Results)

  ┌───────────────────────────────────────┐
  │ Tests:        2                       │
  │ Passing:      1                       │
  │ Failing:      0                       │
  │ Pending:      1                       │
  │ Skipped:      0                       │
  │ Screenshots:  1                       │
  │ Video:        true                    │
  │ Duration:     X seconds               │
  │ Spec Ran:     record_pass_spec.coffee │
  └───────────────────────────────────────┘


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/record_pass_spec.coffee/yay it passes.png (202x1002)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


  (Uploading Results)

  - Failed Uploading (1/2) /foo/bar/.projects/e2e/cypress/screenshots/record_pass_spec.coffee/yay it passes.png
  - Failed Uploading (2/2) /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔ record_pass_spec.coffee                   XX:XX        2        1        -        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    All specs passed!                           XX:XX        2        1        -        1        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/#/projects/cjvoj7/runs/12                                 

`

exports['e2e record misconfiguration errors and exits when no browser found 1'] = `Can't run because you've entered an invalid browser.

Browser: 'browserDoesNotExist' was not found on your system.

Available browsers found are: browser1, browser2, browser3
`

exports['e2e record misconfiguration errors and exits when no specs found 1'] = `Can't run because no spec files were found.

We searched for any files matching this glob pattern:

cypress/integration/notfound/**
`

exports['e2e record recordKey warns but does not exit when is forked pr 1'] = `Warning: It looks like you are trying to record this run from a forked PR.

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
                                                                                                    
  Running: record_pass_spec.coffee...                                                      (1 of 1) 


  record pass
    ✓ passes
    - is pending


  1 passing
  1 pending


  (Results)

  ┌───────────────────────────────────────┐
  │ Tests:        2                       │
  │ Passing:      1                       │
  │ Failing:      0                       │
  │ Pending:      1                       │
  │ Skipped:      0                       │
  │ Screenshots:  1                       │
  │ Video:        true                    │
  │ Duration:     X seconds               │
  │ Spec Ran:     record_pass_spec.coffee │
  └───────────────────────────────────────┘


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/record_pass_spec.coffee/yay it passes.png (202x1002)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔ record_pass_spec.coffee                   XX:XX        2        1        -        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    All specs passed!                           XX:XX        2        1        -        1        -  

`

