exports['e2e record api interaction errors create run 402 - unknown error errors and exits when there\'s an unknown 402 error 1'] = `
We encountered an unexpected error talking to our servers.

There is likely something wrong with the request.

The server's response was:

StatusCodeError: 402

{
  "error": "Something went wrong"
}

`

exports['e2e record api interaction errors create instance does not update instance 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (record_pass_spec.coffee)                                                  │
  │ Searched:   cypress/integration/record_pass*                                                   │
  │ Params:     Group: false, Parallel: false                                                      │
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
  │ Params:     Group: false, Parallel: false                                                      │
  │ Run URL:    https://dashboard.cypress.io/#/projects/cjvoj7/runs/12                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: record_pass_spec.coffee...                                                      (1 of 1) 
  Estimated: 8 seconds


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
  │ Estimated:    8 seconds               │
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
  │ Params:     Group: false, Parallel: false                                                      │
  │ Run URL:    https://dashboard.cypress.io/#/projects/cjvoj7/runs/12                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: record_pass_spec.coffee...                                                      (1 of 1) 
  Estimated: 8 seconds


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
  │ Estimated:    8 seconds               │
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

exports['e2e record api interaction errors uploading assets warns but proceeds 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (record_pass_spec.coffee)                                                  │
  │ Searched:   cypress/integration/record_pass*                                                   │
  │ Params:     Group: false, Parallel: false                                                      │
  │ Run URL:    https://dashboard.cypress.io/#/projects/cjvoj7/runs/12                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: record_pass_spec.coffee...                                                      (1 of 1) 
  Estimated: 8 seconds


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
  │ Estimated:    8 seconds               │
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
  │ Params:     Group: foo, Parallel: true                                                         │
  │ Run URL:    https://dashboard.cypress.io/#/projects/cjvoj7/runs/12                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘

We encountered an unexpected error talking to our servers.

We will retry 3 more times in 1 second...

The server's response was:

StatusCodeError: 500 - "Internal Server Error"

────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: record_pass_spec.coffee...                                                      (1 of 1) 
  Estimated: 5 seconds


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
  │ Estimated:    5 seconds               │
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

exports['e2e record api interaction warnings create run warnings grace period warns when over private test recordings 1'] = `
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
  │ Params:     Group: false, Parallel: false                                                      │
  │ Run URL:    https://dashboard.cypress.io/#/projects/cjvoj7/runs/12                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: record_pass_spec.coffee...                                                      (1 of 1) 
  Estimated: 8 seconds


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
  │ Estimated:    8 seconds               │
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

exports['e2e record api interaction warnings create run warnings paid plan warns when over private test recordings 1'] = `
You've exceeded the limit of private test recordings under your current billing plan this month. The limit is 500 private test recordings.

To upgrade your account, please visit your billing to upgrade to another billing plan.

https://on.cypress.io/dashboard/organizations/org-id-1234/billing

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (record_pass_spec.coffee)                                                  │
  │ Searched:   cypress/integration/record_pass*                                                   │
  │ Params:     Group: false, Parallel: false                                                      │
  │ Run URL:    https://dashboard.cypress.io/#/projects/cjvoj7/runs/12                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: record_pass_spec.coffee...                                                      (1 of 1) 
  Estimated: 8 seconds


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
  │ Estimated:    8 seconds               │
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
