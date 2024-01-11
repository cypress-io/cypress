exports['burn-in modified/new test PASSED_BURN_IN 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (always-passes.cy.js)                                                      │
  │ Searched:   cypress/e2e/always-passes.cy.js                                                    │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  always-passes.cy.js                                                             (1 of 1)
  Estimated: X second(s)


  always passes
    (Attempt 1 of 2) always passes
    (Attempt 2 of 2) always passes
    ✓ always passes


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
  │ Spec Ran:     always-passes.cy.js                                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Uploading Cloud Artifacts)

  - Video - Nothing to upload 
  - Screenshot - Nothing to upload 
  - Test Replay - Nothing to upload - Test Replay is disabled for this project. Enable Test Replay in Cloud project settings

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  always-passes.cy.js                      XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12


`

exports['burn-in modified/new test PASSED_MET_THRESHOLD 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (passes-first-attempt-flaky.cy.js)                                         │
  │ Searched:   cypress/e2e/passes-first-attempt-flaky.cy.js                                       │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  passes-first-attempt-flaky.cy.js                                                (1 of 1)
  Estimated: X second(s)


  deterministic flaky test
    ✓(Attempt 1 of 7) deterministically runs pass/fail on this test
    ✖(Attempt 2 of 7) deterministically runs pass/fail on this test
    ✓(Attempt 3 of 7) deterministically runs pass/fail on this test
    ✖(Attempt 4 of 7) deterministically runs pass/fail on this test
    ✓(Attempt 5 of 7) deterministically runs pass/fail on this test
    ✓ deterministically runs pass/fail on this test


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
  │ Spec Ran:     passes-first-attempt-flaky.cy.js                                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Uploading Cloud Artifacts)

  - Video - Nothing to upload 
  - Screenshot - Nothing to upload 
  - Test Replay - Nothing to upload - Test Replay is disabled for this project. Enable Test Replay in Cloud project settings

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  passes-first-attempt-flaky.cy.js         XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12


`

exports['burn-in modified/new test FAILED_REACHED_MAX_RETRIES 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (passes-first-attempt-flaky.cy.js)                                         │
  │ Searched:   cypress/e2e/passes-first-attempt-flaky.cy.js                                       │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  passes-first-attempt-flaky.cy.js                                                (1 of 1)
  Estimated: X second(s)


  deterministic flaky test
    ✓(Attempt 1 of 7) deterministically runs pass/fail on this test
    ✖(Attempt 2 of 7) deterministically runs pass/fail on this test
    ✓(Attempt 3 of 7) deterministically runs pass/fail on this test
    ✖(Attempt 4 of 7) deterministically runs pass/fail on this test
    ✓(Attempt 5 of 7) deterministically runs pass/fail on this test
    ✖(Attempt 6 of 7) deterministically runs pass/fail on this test
    ✓(Attempt 7 of 7) deterministically runs pass/fail on this test
    ✖ deterministically runs pass/fail on this test


  0 passing
  1 failing

  1) deterministic flaky test
       deterministically runs pass/fail on this test:
     [object Object]
AssertionError: expected true to be false
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Estimated:    X second(s)                                                                      │
  │ Spec Ran:     passes-first-attempt-flaky.cy.js                                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Uploading Cloud Artifacts)

  - Video - Nothing to upload 
  - Screenshot - Nothing to upload 
  - Test Replay - Nothing to upload - Test Replay is disabled for this project. Enable Test Replay in Cloud project settings

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  passes-first-attempt-flaky.cy.js         XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1        -        1        -        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12


`

exports['burn-in modified/new test FAILED_DID_NOT_MEET_THRESHOLD 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (passes-first-attempt-flaky.cy.js)                                         │
  │ Searched:   cypress/e2e/passes-first-attempt-flaky.cy.js                                       │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  passes-first-attempt-flaky.cy.js                                                (1 of 1)
  Estimated: X second(s)


  deterministic flaky test
    ✓(Attempt 1 of 6) deterministically runs pass/fail on this test
    ✖(Attempt 2 of 6) deterministically runs pass/fail on this test
    ✓(Attempt 3 of 6) deterministically runs pass/fail on this test
    ✖(Attempt 4 of 6) deterministically runs pass/fail on this test
    ✓(Attempt 5 of 6) deterministically runs pass/fail on this test
    ✖(Attempt 6 of 6) deterministically runs pass/fail on this test
    ✖ deterministically runs pass/fail on this test


  0 passing
  1 failing

  1) deterministic flaky test
       deterministically runs pass/fail on this test:
     AssertionError: expected true to be false
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Estimated:    X second(s)                                                                      │
  │ Spec Ran:     passes-first-attempt-flaky.cy.js                                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Uploading Cloud Artifacts)

  - Video - Nothing to upload 
  - Screenshot - Nothing to upload 
  - Test Replay - Nothing to upload - Test Replay is disabled for this project. Enable Test Replay in Cloud project settings

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  passes-first-attempt-flaky.cy.js         XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1        -        1        -        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12


`

exports['burn-in modified/new test FAILED_STOPPED_ON_FLAKE 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (passes-first-attempt-flaky.cy.js)                                         │
  │ Searched:   cypress/e2e/passes-first-attempt-flaky.cy.js                                       │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  passes-first-attempt-flaky.cy.js                                                (1 of 1)
  Estimated: X second(s)


  deterministic flaky test
    ✓(Attempt 1 of 7) deterministically runs pass/fail on this test
    ✖(Attempt 2 of 7) deterministically runs pass/fail on this test
    ✖ deterministically runs pass/fail on this test


  0 passing
  1 failing

  1) deterministic flaky test
       deterministically runs pass/fail on this test:
     AssertionError: expected true to be false
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Estimated:    X second(s)                                                                      │
  │ Spec Ran:     passes-first-attempt-flaky.cy.js                                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Uploading Cloud Artifacts)

  - Video - Nothing to upload 
  - Screenshot - Nothing to upload 
  - Test Replay - Nothing to upload - Test Replay is disabled for this project. Enable Test Replay in Cloud project settings

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  passes-first-attempt-flaky.cy.js         XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1        -        1        -        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12


`

exports['burn-in failing without flake PASSED_BURN_IN 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (always-passes.cy.js)                                                      │
  │ Searched:   cypress/e2e/always-passes.cy.js                                                    │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  always-passes.cy.js                                                             (1 of 1)
  Estimated: X second(s)


  always passes
    (Attempt 1 of 2) always passes
    (Attempt 2 of 2) always passes
    ✓ always passes


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
  │ Spec Ran:     always-passes.cy.js                                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Uploading Cloud Artifacts)

  - Video - Nothing to upload 
  - Screenshot - Nothing to upload 
  - Test Replay - Nothing to upload - Test Replay is disabled for this project. Enable Test Replay in Cloud project settings

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  always-passes.cy.js                      XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12


`

exports['burn-in failing without flake PASSED_MET_THRESHOLD 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (passes-first-attempt-flaky.cy.js)                                         │
  │ Searched:   cypress/e2e/passes-first-attempt-flaky.cy.js                                       │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  passes-first-attempt-flaky.cy.js                                                (1 of 1)
  Estimated: X second(s)


  deterministic flaky test
    ✓(Attempt 1 of 7) deterministically runs pass/fail on this test
    ✖(Attempt 2 of 7) deterministically runs pass/fail on this test
    ✓(Attempt 3 of 7) deterministically runs pass/fail on this test
    ✖(Attempt 4 of 7) deterministically runs pass/fail on this test
    ✓(Attempt 5 of 7) deterministically runs pass/fail on this test
    ✓ deterministically runs pass/fail on this test


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
  │ Spec Ran:     passes-first-attempt-flaky.cy.js                                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Uploading Cloud Artifacts)

  - Video - Nothing to upload 
  - Screenshot - Nothing to upload 
  - Test Replay - Nothing to upload - Test Replay is disabled for this project. Enable Test Replay in Cloud project settings

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  passes-first-attempt-flaky.cy.js         XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12


`

exports['burn-in failing without flake FAILED_REACHED_MAX_RETRIES 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (passes-first-attempt-flaky.cy.js)                                         │
  │ Searched:   cypress/e2e/passes-first-attempt-flaky.cy.js                                       │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  passes-first-attempt-flaky.cy.js                                                (1 of 1)
  Estimated: X second(s)


  deterministic flaky test
    ✓(Attempt 1 of 7) deterministically runs pass/fail on this test
    ✖(Attempt 2 of 7) deterministically runs pass/fail on this test
    ✓(Attempt 3 of 7) deterministically runs pass/fail on this test
    ✖(Attempt 4 of 7) deterministically runs pass/fail on this test
    ✓(Attempt 5 of 7) deterministically runs pass/fail on this test
    ✖(Attempt 6 of 7) deterministically runs pass/fail on this test
    ✓(Attempt 7 of 7) deterministically runs pass/fail on this test
    ✖ deterministically runs pass/fail on this test


  0 passing
  1 failing

  1) deterministic flaky test
       deterministically runs pass/fail on this test:
     [object Object]
AssertionError: expected true to be false
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Estimated:    X second(s)                                                                      │
  │ Spec Ran:     passes-first-attempt-flaky.cy.js                                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Uploading Cloud Artifacts)

  - Video - Nothing to upload 
  - Screenshot - Nothing to upload 
  - Test Replay - Nothing to upload - Test Replay is disabled for this project. Enable Test Replay in Cloud project settings

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  passes-first-attempt-flaky.cy.js         XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1        -        1        -        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12


`

exports['burn-in failing without flake FAILED_DID_NOT_MEET_THRESHOLD 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (passes-first-attempt-flaky.cy.js)                                         │
  │ Searched:   cypress/e2e/passes-first-attempt-flaky.cy.js                                       │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  passes-first-attempt-flaky.cy.js                                                (1 of 1)
  Estimated: X second(s)


  deterministic flaky test
    ✓(Attempt 1 of 6) deterministically runs pass/fail on this test
    ✖(Attempt 2 of 6) deterministically runs pass/fail on this test
    ✓(Attempt 3 of 6) deterministically runs pass/fail on this test
    ✖(Attempt 4 of 6) deterministically runs pass/fail on this test
    ✓(Attempt 5 of 6) deterministically runs pass/fail on this test
    ✖(Attempt 6 of 6) deterministically runs pass/fail on this test
    ✖ deterministically runs pass/fail on this test


  0 passing
  1 failing

  1) deterministic flaky test
       deterministically runs pass/fail on this test:
     AssertionError: expected true to be false
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Estimated:    X second(s)                                                                      │
  │ Spec Ran:     passes-first-attempt-flaky.cy.js                                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Uploading Cloud Artifacts)

  - Video - Nothing to upload 
  - Screenshot - Nothing to upload 
  - Test Replay - Nothing to upload - Test Replay is disabled for this project. Enable Test Replay in Cloud project settings

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  passes-first-attempt-flaky.cy.js         XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1        -        1        -        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12


`

exports['burn-in failing without flake FAILED_STOPPED_ON_FLAKE 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (passes-first-attempt-flaky.cy.js)                                         │
  │ Searched:   cypress/e2e/passes-first-attempt-flaky.cy.js                                       │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  passes-first-attempt-flaky.cy.js                                                (1 of 1)
  Estimated: X second(s)


  deterministic flaky test
    ✓(Attempt 1 of 7) deterministically runs pass/fail on this test
    ✖(Attempt 2 of 7) deterministically runs pass/fail on this test
    ✖ deterministically runs pass/fail on this test


  0 passing
  1 failing

  1) deterministic flaky test
       deterministically runs pass/fail on this test:
     AssertionError: expected true to be false
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Estimated:    X second(s)                                                                      │
  │ Spec Ran:     passes-first-attempt-flaky.cy.js                                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Uploading Cloud Artifacts)

  - Video - Nothing to upload 
  - Screenshot - Nothing to upload 
  - Test Replay - Nothing to upload - Test Replay is disabled for this project. Enable Test Replay in Cloud project settings

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  passes-first-attempt-flaky.cy.js         XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1        -        1        -        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12


`

exports['burn-in flaky test PASSED_BURN_IN 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (always-passes.cy.js)                                                      │
  │ Searched:   cypress/e2e/always-passes.cy.js                                                    │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  always-passes.cy.js                                                             (1 of 1)
  Estimated: X second(s)


  always passes
    (Attempt 1 of 4) always passes
    (Attempt 2 of 4) always passes
    (Attempt 3 of 4) always passes
    (Attempt 4 of 4) always passes
    ✓ always passes


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
  │ Spec Ran:     always-passes.cy.js                                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Uploading Cloud Artifacts)

  - Video - Nothing to upload 
  - Screenshot - Nothing to upload 
  - Test Replay - Nothing to upload - Test Replay is disabled for this project. Enable Test Replay in Cloud project settings

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  always-passes.cy.js                      XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12


`

exports['burn-in flaky test PASSED_MET_THRESHOLD 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (passes-first-attempt-flaky.cy.js)                                         │
  │ Searched:   cypress/e2e/passes-first-attempt-flaky.cy.js                                       │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  passes-first-attempt-flaky.cy.js                                                (1 of 1)
  Estimated: X second(s)


  deterministic flaky test
    ✓(Attempt 1 of 7) deterministically runs pass/fail on this test
    ✖(Attempt 2 of 7) deterministically runs pass/fail on this test
    ✓(Attempt 3 of 7) deterministically runs pass/fail on this test
    ✖(Attempt 4 of 7) deterministically runs pass/fail on this test
    ✓(Attempt 5 of 7) deterministically runs pass/fail on this test
    ✓ deterministically runs pass/fail on this test


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
  │ Spec Ran:     passes-first-attempt-flaky.cy.js                                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Uploading Cloud Artifacts)

  - Video - Nothing to upload 
  - Screenshot - Nothing to upload 
  - Test Replay - Nothing to upload - Test Replay is disabled for this project. Enable Test Replay in Cloud project settings

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  passes-first-attempt-flaky.cy.js         XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12


`

exports['burn-in flaky test FAILED_REACHED_MAX_RETRIES 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (passes-first-attempt-flaky.cy.js)                                         │
  │ Searched:   cypress/e2e/passes-first-attempt-flaky.cy.js                                       │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  passes-first-attempt-flaky.cy.js                                                (1 of 1)
  Estimated: X second(s)


  deterministic flaky test
    ✓(Attempt 1 of 7) deterministically runs pass/fail on this test
    ✖(Attempt 2 of 7) deterministically runs pass/fail on this test
    ✓(Attempt 3 of 7) deterministically runs pass/fail on this test
    ✖(Attempt 4 of 7) deterministically runs pass/fail on this test
    ✓(Attempt 5 of 7) deterministically runs pass/fail on this test
    ✖(Attempt 6 of 7) deterministically runs pass/fail on this test
    ✓(Attempt 7 of 7) deterministically runs pass/fail on this test
    ✖ deterministically runs pass/fail on this test


  0 passing
  1 failing

  1) deterministic flaky test
       deterministically runs pass/fail on this test:
     [object Object]
AssertionError: expected true to be false
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Estimated:    X second(s)                                                                      │
  │ Spec Ran:     passes-first-attempt-flaky.cy.js                                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Uploading Cloud Artifacts)

  - Video - Nothing to upload 
  - Screenshot - Nothing to upload 
  - Test Replay - Nothing to upload - Test Replay is disabled for this project. Enable Test Replay in Cloud project settings

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  passes-first-attempt-flaky.cy.js         XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1        -        1        -        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12


`

exports['burn-in flaky test FAILED_DID_NOT_MEET_THRESHOLD 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (passes-first-attempt-flaky.cy.js)                                         │
  │ Searched:   cypress/e2e/passes-first-attempt-flaky.cy.js                                       │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  passes-first-attempt-flaky.cy.js                                                (1 of 1)
  Estimated: X second(s)


  deterministic flaky test
    ✓(Attempt 1 of 6) deterministically runs pass/fail on this test
    ✖(Attempt 2 of 6) deterministically runs pass/fail on this test
    ✓(Attempt 3 of 6) deterministically runs pass/fail on this test
    ✖(Attempt 4 of 6) deterministically runs pass/fail on this test
    ✓(Attempt 5 of 6) deterministically runs pass/fail on this test
    ✖(Attempt 6 of 6) deterministically runs pass/fail on this test
    ✖ deterministically runs pass/fail on this test


  0 passing
  1 failing

  1) deterministic flaky test
       deterministically runs pass/fail on this test:
     AssertionError: expected true to be false
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Estimated:    X second(s)                                                                      │
  │ Spec Ran:     passes-first-attempt-flaky.cy.js                                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Uploading Cloud Artifacts)

  - Video - Nothing to upload 
  - Screenshot - Nothing to upload 
  - Test Replay - Nothing to upload - Test Replay is disabled for this project. Enable Test Replay in Cloud project settings

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  passes-first-attempt-flaky.cy.js         XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1        -        1        -        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12


`

exports['burn-in flaky test FAILED_STOPPED_ON_FLAKE 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (passes-first-attempt-flaky.cy.js)                                         │
  │ Searched:   cypress/e2e/passes-first-attempt-flaky.cy.js                                       │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  passes-first-attempt-flaky.cy.js                                                (1 of 1)
  Estimated: X second(s)


  deterministic flaky test
    ✓(Attempt 1 of 7) deterministically runs pass/fail on this test
    ✖(Attempt 2 of 7) deterministically runs pass/fail on this test
    ✖ deterministically runs pass/fail on this test


  0 passing
  1 failing

  1) deterministic flaky test
       deterministically runs pass/fail on this test:
     AssertionError: expected true to be false
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Estimated:    X second(s)                                                                      │
  │ Spec Ran:     passes-first-attempt-flaky.cy.js                                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Uploading Cloud Artifacts)

  - Video - Nothing to upload 
  - Screenshot - Nothing to upload 
  - Test Replay - Nothing to upload - Test Replay is disabled for this project. Enable Test Replay in Cloud project settings

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  passes-first-attempt-flaky.cy.js         XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1        -        1        -        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12


`

exports['burn-in cloud could not determine score PASSED_FIRST_ATTEMPT 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (always-passes.cy.js)                                                      │
  │ Searched:   cypress/e2e/always-passes.cy.js                                                    │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  always-passes.cy.js                                                             (1 of 1)
  Estimated: X second(s)


  always passes
    ✓ always passes


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
  │ Spec Ran:     always-passes.cy.js                                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Uploading Cloud Artifacts)

  - Video - Nothing to upload 
  - Screenshot - Nothing to upload 
  - Test Replay - Nothing to upload - Test Replay is disabled for this project. Enable Test Replay in Cloud project settings

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  always-passes.cy.js                      XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12


`

exports['burn-in cloud could not determine score PASSED_MET_THRESHOLD 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (deterministic-flaky.cy.js)                                                │
  │ Searched:   cypress/e2e/deterministic-flaky.cy.js                                              │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  deterministic-flaky.cy.js                                                       (1 of 1)
  Estimated: X second(s)


  deterministic flaky test
    ✖(Attempt 1 of 7) deterministically runs pass/fail on this test
    ✓(Attempt 2 of 7) deterministically runs pass/fail on this test
    ✖(Attempt 3 of 7) deterministically runs pass/fail on this test
    ✓(Attempt 4 of 7) deterministically runs pass/fail on this test
    ✖(Attempt 5 of 7) deterministically runs pass/fail on this test
    ✓(Attempt 6 of 7) deterministically runs pass/fail on this test
    ✓ deterministically runs pass/fail on this test


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
  │ Spec Ran:     deterministic-flaky.cy.js                                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Uploading Cloud Artifacts)

  - Video - Nothing to upload 
  - Screenshot - Nothing to upload 
  - Test Replay - Nothing to upload - Test Replay is disabled for this project. Enable Test Replay in Cloud project settings

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  deterministic-flaky.cy.js                XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12


`

exports['burn-in cloud could not determine score FAILED_REACHED_MAX_RETRIES 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (deterministic-flaky.cy.js)                                                │
  │ Searched:   cypress/e2e/deterministic-flaky.cy.js                                              │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  deterministic-flaky.cy.js                                                       (1 of 1)
  Estimated: X second(s)


  deterministic flaky test
    ✖(Attempt 1 of 7) deterministically runs pass/fail on this test
    ✓(Attempt 2 of 7) deterministically runs pass/fail on this test
    ✖(Attempt 3 of 7) deterministically runs pass/fail on this test
    ✓(Attempt 4 of 7) deterministically runs pass/fail on this test
    ✖(Attempt 5 of 7) deterministically runs pass/fail on this test
    ✓(Attempt 6 of 7) deterministically runs pass/fail on this test
    ✖(Attempt 7 of 7) deterministically runs pass/fail on this test
    ✖ deterministically runs pass/fail on this test


  0 passing
  1 failing

  1) deterministic flaky test
       deterministically runs pass/fail on this test:
     AssertionError: expected true to be false
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Estimated:    X second(s)                                                                      │
  │ Spec Ran:     deterministic-flaky.cy.js                                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Uploading Cloud Artifacts)

  - Video - Nothing to upload 
  - Screenshot - Nothing to upload 
  - Test Replay - Nothing to upload - Test Replay is disabled for this project. Enable Test Replay in Cloud project settings

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  deterministic-flaky.cy.js                XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1        -        1        -        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12


`

exports['burn-in cloud could not determine score FAILED_DID_NOT_MEET_THRESHOLD 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (deterministic-flaky.cy.js)                                                │
  │ Searched:   cypress/e2e/deterministic-flaky.cy.js                                              │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  deterministic-flaky.cy.js                                                       (1 of 1)
  Estimated: X second(s)


  deterministic flaky test
    ✖(Attempt 1 of 6) deterministically runs pass/fail on this test
    ✓(Attempt 2 of 6) deterministically runs pass/fail on this test
    ✖(Attempt 3 of 6) deterministically runs pass/fail on this test
    ✓(Attempt 4 of 6) deterministically runs pass/fail on this test
    ✖(Attempt 5 of 6) deterministically runs pass/fail on this test
    ✖ deterministically runs pass/fail on this test


  0 passing
  1 failing

  1) deterministic flaky test
       deterministically runs pass/fail on this test:
     AssertionError: expected true to be false
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Estimated:    X second(s)                                                                      │
  │ Spec Ran:     deterministic-flaky.cy.js                                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Uploading Cloud Artifacts)

  - Video - Nothing to upload 
  - Screenshot - Nothing to upload 
  - Test Replay - Nothing to upload - Test Replay is disabled for this project. Enable Test Replay in Cloud project settings

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  deterministic-flaky.cy.js                XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1        -        1        -        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12


`

exports['burn-in cloud could not determine score FAILED_STOPPED_ON_FLAKE 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (deterministic-flaky.cy.js)                                                │
  │ Searched:   cypress/e2e/deterministic-flaky.cy.js                                              │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  deterministic-flaky.cy.js                                                       (1 of 1)
  Estimated: X second(s)


  deterministic flaky test
    ✖(Attempt 1 of 7) deterministically runs pass/fail on this test
    ✓(Attempt 2 of 7) deterministically runs pass/fail on this test
    ✖ deterministically runs pass/fail on this test


  0 passing
  1 failing

  1) deterministic flaky test
       deterministically runs pass/fail on this test:
     [object Object]
AssertionError: expected true to be false
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Estimated:    X second(s)                                                                      │
  │ Spec Ran:     deterministic-flaky.cy.js                                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Uploading Cloud Artifacts)

  - Video - Nothing to upload 
  - Screenshot - Nothing to upload 
  - Test Replay - Nothing to upload - Test Replay is disabled for this project. Enable Test Replay in Cloud project settings

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  deterministic-flaky.cy.js                XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1        -        1        -        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12


`

exports['burn-in test is already burned-in PASSED_FIRST_ATTEMPT 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (always-passes.cy.js)                                                      │
  │ Searched:   cypress/e2e/always-passes.cy.js                                                    │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  always-passes.cy.js                                                             (1 of 1)
  Estimated: X second(s)


  always passes
    ✓ always passes


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
  │ Spec Ran:     always-passes.cy.js                                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Uploading Cloud Artifacts)

  - Video - Nothing to upload 
  - Screenshot - Nothing to upload 
  - Test Replay - Nothing to upload - Test Replay is disabled for this project. Enable Test Replay in Cloud project settings

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  always-passes.cy.js                      XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12


`

exports['burn-in test is already burned-in PASSED_MET_THRESHOLD 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (deterministic-flaky.cy.js)                                                │
  │ Searched:   cypress/e2e/deterministic-flaky.cy.js                                              │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  deterministic-flaky.cy.js                                                       (1 of 1)
  Estimated: X second(s)


  deterministic flaky test
    ✖(Attempt 1 of 7) deterministically runs pass/fail on this test
    ✓(Attempt 2 of 7) deterministically runs pass/fail on this test
    ✖(Attempt 3 of 7) deterministically runs pass/fail on this test
    ✓(Attempt 4 of 7) deterministically runs pass/fail on this test
    ✖(Attempt 5 of 7) deterministically runs pass/fail on this test
    ✓(Attempt 6 of 7) deterministically runs pass/fail on this test
    ✓ deterministically runs pass/fail on this test


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
  │ Spec Ran:     deterministic-flaky.cy.js                                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Uploading Cloud Artifacts)

  - Video - Nothing to upload 
  - Screenshot - Nothing to upload 
  - Test Replay - Nothing to upload - Test Replay is disabled for this project. Enable Test Replay in Cloud project settings

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  deterministic-flaky.cy.js                XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12


`

exports['burn-in test is already burned-in FAILED_REACHED_MAX_RETRIES 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (deterministic-flaky.cy.js)                                                │
  │ Searched:   cypress/e2e/deterministic-flaky.cy.js                                              │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  deterministic-flaky.cy.js                                                       (1 of 1)
  Estimated: X second(s)


  deterministic flaky test
    ✖(Attempt 1 of 7) deterministically runs pass/fail on this test
    ✓(Attempt 2 of 7) deterministically runs pass/fail on this test
    ✖(Attempt 3 of 7) deterministically runs pass/fail on this test
    ✓(Attempt 4 of 7) deterministically runs pass/fail on this test
    ✖(Attempt 5 of 7) deterministically runs pass/fail on this test
    ✓(Attempt 6 of 7) deterministically runs pass/fail on this test
    ✖(Attempt 7 of 7) deterministically runs pass/fail on this test
    ✖ deterministically runs pass/fail on this test


  0 passing
  1 failing

  1) deterministic flaky test
       deterministically runs pass/fail on this test:
     AssertionError: expected true to be false
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Estimated:    X second(s)                                                                      │
  │ Spec Ran:     deterministic-flaky.cy.js                                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Uploading Cloud Artifacts)

  - Video - Nothing to upload 
  - Screenshot - Nothing to upload 
  - Test Replay - Nothing to upload - Test Replay is disabled for this project. Enable Test Replay in Cloud project settings

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  deterministic-flaky.cy.js                XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1        -        1        -        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12


`

exports['burn-in test is already burned-in FAILED_DID_NOT_MEET_THRESHOLD 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (deterministic-flaky.cy.js)                                                │
  │ Searched:   cypress/e2e/deterministic-flaky.cy.js                                              │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  deterministic-flaky.cy.js                                                       (1 of 1)
  Estimated: X second(s)


  deterministic flaky test
    ✖(Attempt 1 of 6) deterministically runs pass/fail on this test
    ✓(Attempt 2 of 6) deterministically runs pass/fail on this test
    ✖(Attempt 3 of 6) deterministically runs pass/fail on this test
    ✓(Attempt 4 of 6) deterministically runs pass/fail on this test
    ✖(Attempt 5 of 6) deterministically runs pass/fail on this test
    ✖ deterministically runs pass/fail on this test


  0 passing
  1 failing

  1) deterministic flaky test
       deterministically runs pass/fail on this test:
     AssertionError: expected true to be false
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Estimated:    X second(s)                                                                      │
  │ Spec Ran:     deterministic-flaky.cy.js                                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Uploading Cloud Artifacts)

  - Video - Nothing to upload 
  - Screenshot - Nothing to upload 
  - Test Replay - Nothing to upload - Test Replay is disabled for this project. Enable Test Replay in Cloud project settings

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  deterministic-flaky.cy.js                XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1        -        1        -        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12


`

exports['burn-in test is already burned-in FAILED_STOPPED_ON_FLAKE 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (deterministic-flaky.cy.js)                                                │
  │ Searched:   cypress/e2e/deterministic-flaky.cy.js                                              │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  deterministic-flaky.cy.js                                                       (1 of 1)
  Estimated: X second(s)


  deterministic flaky test
    ✖(Attempt 1 of 7) deterministically runs pass/fail on this test
    ✓(Attempt 2 of 7) deterministically runs pass/fail on this test
    ✖ deterministically runs pass/fail on this test


  0 passing
  1 failing

  1) deterministic flaky test
       deterministically runs pass/fail on this test:
     [object Object]
AssertionError: expected true to be false
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Estimated:    X second(s)                                                                      │
  │ Spec Ran:     deterministic-flaky.cy.js                                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Uploading Cloud Artifacts)

  - Video - Nothing to upload 
  - Screenshot - Nothing to upload 
  - Test Replay - Nothing to upload - Test Replay is disabled for this project. Enable Test Replay in Cloud project settings

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  deterministic-flaky.cy.js                XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1        -        1        -        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12


`

exports['burn-in override default burn-in config PASSED_BURN_IN 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (always-passes.cy.js)                                                      │
  │ Searched:   cypress/e2e/always-passes.cy.js                                                    │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  always-passes.cy.js                                                             (1 of 1)
  Estimated: X second(s)


  always passes
    (Attempt 1 of 3) always passes
    (Attempt 2 of 3) always passes
    (Attempt 3 of 3) always passes
    ✓ always passes


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
  │ Spec Ran:     always-passes.cy.js                                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Uploading Cloud Artifacts)

  - Video - Nothing to upload 
  - Screenshot - Nothing to upload 
  - Test Replay - Nothing to upload - Test Replay is disabled for this project. Enable Test Replay in Cloud project settings

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  always-passes.cy.js                      XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12


`

exports['burn-in override burn-in not allowed PASSED_FIRST_ATTEMPT 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (always-passes.cy.js)                                                      │
  │ Searched:   cypress/e2e/always-passes.cy.js                                                    │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  always-passes.cy.js                                                             (1 of 1)
  Estimated: X second(s)


  always passes
    ✓ always passes


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
  │ Spec Ran:     always-passes.cy.js                                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Uploading Cloud Artifacts)

  - Video - Nothing to upload 
  - Screenshot - Nothing to upload 
  - Test Replay - Nothing to upload - Test Replay is disabled for this project. Enable Test Replay in Cloud project settings

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  always-passes.cy.js                      XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12


`

exports['burn-in modified/new test FAILED_HOOK_FAILED with all failing hooks 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (failing-all-hooks.runner.cy.js)                                           │
  │ Searched:   cypress/e2e/runner/failing-all-hooks.runner.cy.js                                  │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  failing-all-hooks.runner.cy.js                                                  (1 of 1)
  Estimated: X second(s)


  simple failing hook spec
    before hooks
      1) "before all" hook for "never gets here"
    beforeEach hooks
      2) "before each" hook for "never gets here"
    afterEach hooks
      3) "after each" hook for "fails this"
    after hooks
      ✓ runs this
      4) "after all" hook for "fails on this"


  1 passing
  4 failing

  1) simple failing hook spec
       before hooks
         "before all" hook for "never gets here":
     AssertionError: before - before hooks

Because this error occurred during a \`before all\` hook we are skipping the remaining tests in the current suite: \`before hooks\`
      [stack trace lines]

  2) simple failing hook spec
       beforeEach hooks
         "before each" hook for "never gets here":
     AssertionError: beforeEach - beforeEach hooks

Because this error occurred during a \`before each\` hook we are skipping the remaining tests in the current suite: \`beforeEach hooks\`
      [stack trace lines]

  3) simple failing hook spec
       afterEach hooks
         "after each" hook for "fails this":
     AssertionError: afterEach - afterEach hooks

Because this error occurred during a \`after each\` hook we are skipping the remaining tests in the current suite: \`afterEach hooks\`
      [stack trace lines]

  4) simple failing hook spec
       after hooks
         "after all" hook for "fails on this":
     AssertionError: after - after hooks

Because this error occurred during a \`after all\` hook we are skipping the remaining tests in the current suite: \`after hooks\`
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        6                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      4                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      1                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Estimated:    X second(s)                                                                      │
  │ Spec Ran:     failing-all-hooks.runner.cy.js                                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Uploading Cloud Artifacts)

  - Video - Nothing to upload 
  - Screenshot - Nothing to upload 
  - Test Replay - Nothing to upload - Test Replay is disabled for this project. Enable Test Replay in Cloud project settings

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  failing-all-hooks.runner.cy.js           XX:XX        6        1        4        -        1 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        6        1        4        -        1  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12


`

exports['burn-in modified/new test PASSED_BURN_IN 2'] = [
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'NONE',
  },
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': 'PASSED_BURN_IN',
    'initialStrategy': 'BURN_IN',
  },
]

exports['burn-in modified/new test PASSED_MET_THRESHOLD 2'] = [
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'NONE',
  },
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)',
      'codeFrame': {
        'line': 10,
        'column': 26,
        'originalFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'relativeFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'BURN_IN',
  },
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)',
      'codeFrame': {
        'line': 10,
        'column': 26,
        'originalFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'relativeFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': 'PASSED_MET_THRESHOLD',
    'initialStrategy': 'RETRY',
  },
]

exports['burn-in modified/new test FAILED_REACHED_MAX_RETRIES 2'] = [
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'NONE',
  },
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)',
      'codeFrame': {
        'line': 10,
        'column': 26,
        'originalFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'relativeFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'BURN_IN',
  },
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)',
      'codeFrame': {
        'line': 10,
        'column': 26,
        'originalFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'relativeFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)',
      'codeFrame': {
        'line': 10,
        'column': 26,
        'originalFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'relativeFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'passed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)',
      'codeFrame': {
        'line': 10,
        'column': 26,
        'originalFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'relativeFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': 'FAILED_REACHED_MAX_RETRIES',
    'initialStrategy': 'RETRY',
  },
]

exports['burn-in modified/new test FAILED_DID_NOT_MEET_THRESHOLD 2'] = [
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'NONE',
  },
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)',
      'codeFrame': {
        'line': 10,
        'column': 26,
        'originalFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'relativeFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'BURN_IN',
  },
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)',
      'codeFrame': {
        'line': 10,
        'column': 26,
        'originalFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'relativeFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)',
      'codeFrame': {
        'line': 10,
        'column': 26,
        'originalFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'relativeFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': 'FAILED_DID_NOT_MEET_THRESHOLD',
    'initialStrategy': 'RETRY',
  },
]

exports['burn-in modified/new test FAILED_STOPPED_ON_FLAKE 2'] = [
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'NONE',
  },
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)',
      'codeFrame': {
        'line': 10,
        'column': 26,
        'originalFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'relativeFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': 'FAILED_STOPPED_ON_FLAKE',
    'initialStrategy': 'BURN_IN',
  },
]

exports['burn-in modified/new test FAILED_HOOK_FAILED with all failing hooks 2'] = [
  [
    {
      'state': 'failed',
      'error': {
        'name': 'AssertionError',
        'message': 'before - before hooks\n\nBecause this error occurred during a `before all` hook we are skipping the remaining tests in the current suite: `before hooks`',
        'stack': '    at Context.eval (webpack:///./cypress/e2e/support/generate-mocha-tests.js:55:14)',
        'codeFrame': {
          'line': 55,
          'column': 15,
          'originalFile': 'cypress/e2e/support/generate-mocha-tests.js',
          'relativeFile': 'cypress/e2e/support/generate-mocha-tests.js',
          'absoluteFile': '/path/to/absoluteFile',
          'frame': '  53 |           debug(`hook fail: ${type}`)\n  54 | \n> 55 |           win.assert(false, message)\n     |               ^\n  56 | \n  57 |           throw new Error(`hook failed: ${type}`)\n  58 |         }',
          'language': 'js',
        },
      },
      'timings': {
        'lifecycle': 'Any.Number',
        'before all': [
          {
            'hookId': 'h1',
            'fnDuration': 'Any.Number',
            'afterFnDuration': 'Any.Number',
          },
        ],
      },
      'failedFromHookId': 'h1',
      'wallClockStartedAt': 'Any.ISODate',
      'wallClockDuration': 'Any.Number',
      'videoTimestamp': null,
      'reasonToStop': 'FAILED_HOOK_FAILED',
      'initialStrategy': 'NONE',
    },
  ],
  [
    {
      'state': 'failed',
      'error': {
        'name': 'AssertionError',
        'message': 'beforeEach - beforeEach hooks\n\nBecause this error occurred during a `before each` hook we are skipping the remaining tests in the current suite: `beforeEach hooks`',
        'stack': '    at Context.eval (webpack:///./cypress/e2e/support/generate-mocha-tests.js:55:14)',
        'codeFrame': {
          'line': 55,
          'column': 15,
          'originalFile': 'cypress/e2e/support/generate-mocha-tests.js',
          'relativeFile': 'cypress/e2e/support/generate-mocha-tests.js',
          'absoluteFile': '/path/to/absoluteFile',
          'frame': '  53 |           debug(`hook fail: ${type}`)\n  54 | \n> 55 |           win.assert(false, message)\n     |               ^\n  56 | \n  57 |           throw new Error(`hook failed: ${type}`)\n  58 |         }',
          'language': 'js',
        },
      },
      'timings': {
        'lifecycle': 'Any.Number',
        'before each': [
          {
            'hookId': 'h2',
            'fnDuration': 'Any.Number',
            'afterFnDuration': 'Any.Number',
          },
        ],
      },
      'failedFromHookId': 'h2',
      'wallClockStartedAt': 'Any.ISODate',
      'wallClockDuration': 'Any.Number',
      'videoTimestamp': null,
      'reasonToStop': 'FAILED_HOOK_FAILED',
      'initialStrategy': 'NONE',
    },
  ],
  [
    {
      'state': 'failed',
      'error': {
        'name': 'AssertionError',
        'message': 'afterEach - afterEach hooks\n\nBecause this error occurred during a `after each` hook we are skipping the remaining tests in the current suite: `afterEach hooks`',
        'stack': '    at Context.eval (webpack:///./cypress/e2e/support/generate-mocha-tests.js:55:14)',
        'codeFrame': {
          'line': 55,
          'column': 15,
          'originalFile': 'cypress/e2e/support/generate-mocha-tests.js',
          'relativeFile': 'cypress/e2e/support/generate-mocha-tests.js',
          'absoluteFile': '/path/to/absoluteFile',
          'frame': '  53 |           debug(`hook fail: ${type}`)\n  54 | \n> 55 |           win.assert(false, message)\n     |               ^\n  56 | \n  57 |           throw new Error(`hook failed: ${type}`)\n  58 |         }',
          'language': 'js',
        },
      },
      'timings': {
        'lifecycle': 'Any.Number',
        'test': {
          'fnDuration': 'Any.Number',
          'afterFnDuration': 'Any.Number',
        },
        'after each': [
          {
            'hookId': 'h3',
            'fnDuration': 'Any.Number',
            'afterFnDuration': 'Any.Number',
          },
        ],
      },
      'failedFromHookId': 'h3',
      'wallClockStartedAt': 'Any.ISODate',
      'wallClockDuration': 'Any.Number',
      'videoTimestamp': null,
      'reasonToStop': 'FAILED_HOOK_FAILED',
      'initialStrategy': 'NONE',
    },
  ],
  [
    {
      'state': 'skipped',
      'error': null,
      'timings': null,
      'failedFromHookId': null,
      'wallClockStartedAt': null,
      'wallClockDuration': null,
      'videoTimestamp': null,
      'reasonToStop': null,
      'initialStrategy': null,
    },
  ],
  [
    {
      'state': 'passed',
      'error': null,
      'timings': {
        'lifecycle': 'Any.Number',
        'test': {
          'fnDuration': 'Any.Number',
          'afterFnDuration': 'Any.Number',
        },
      },
      'failedFromHookId': null,
      'wallClockStartedAt': 'Any.ISODate',
      'wallClockDuration': 'Any.Number',
      'videoTimestamp': null,
      'reasonToStop': 'PASSED_FIRST_ATTEMPT',
      'initialStrategy': 'NONE',
    },
  ],
  [
    {
      'state': 'failed',
      'error': {
        'name': 'AssertionError',
        'message': 'after - after hooks\n\nBecause this error occurred during a `after all` hook we are skipping the remaining tests in the current suite: `after hooks`',
        'stack': '    at Context.eval (webpack:///./cypress/e2e/support/generate-mocha-tests.js:55:14)',
        'codeFrame': {
          'line': 55,
          'column': 15,
          'originalFile': 'cypress/e2e/support/generate-mocha-tests.js',
          'relativeFile': 'cypress/e2e/support/generate-mocha-tests.js',
          'absoluteFile': '/path/to/absoluteFile',
          'frame': '  53 |           debug(`hook fail: ${type}`)\n  54 | \n> 55 |           win.assert(false, message)\n     |               ^\n  56 | \n  57 |           throw new Error(`hook failed: ${type}`)\n  58 |         }',
          'language': 'js',
        },
      },
      'timings': {
        'lifecycle': 'Any.Number',
        'test': {
          'fnDuration': 'Any.Number',
          'afterFnDuration': 'Any.Number',
        },
        'after all': [
          {
            'hookId': 'h4',
            'fnDuration': 'Any.Number',
            'afterFnDuration': 'Any.Number',
          },
        ],
      },
      'failedFromHookId': 'h4',
      'wallClockStartedAt': 'Any.ISODate',
      'wallClockDuration': 'Any.Number',
      'videoTimestamp': null,
      'reasonToStop': 'FAILED_HOOK_FAILED',
      'initialStrategy': 'NONE',
    },
  ],
]

exports['burn-in failing without flake PASSED_BURN_IN 2'] = [
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'NONE',
  },
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': 'PASSED_BURN_IN',
    'initialStrategy': 'BURN_IN',
  },
]

exports['burn-in failing without flake PASSED_MET_THRESHOLD 2'] = [
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'NONE',
  },
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)',
      'codeFrame': {
        'line': 10,
        'column': 26,
        'originalFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'relativeFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'BURN_IN',
  },
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)',
      'codeFrame': {
        'line': 10,
        'column': 26,
        'originalFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'relativeFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': 'PASSED_MET_THRESHOLD',
    'initialStrategy': 'RETRY',
  },
]

exports['burn-in failing without flake FAILED_REACHED_MAX_RETRIES 2'] = [
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'NONE',
  },
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)',
      'codeFrame': {
        'line': 10,
        'column': 26,
        'originalFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'relativeFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'BURN_IN',
  },
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)',
      'codeFrame': {
        'line': 10,
        'column': 26,
        'originalFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'relativeFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)',
      'codeFrame': {
        'line': 10,
        'column': 26,
        'originalFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'relativeFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'passed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)',
      'codeFrame': {
        'line': 10,
        'column': 26,
        'originalFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'relativeFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': 'FAILED_REACHED_MAX_RETRIES',
    'initialStrategy': 'RETRY',
  },
]

exports['burn-in failing without flake FAILED_DID_NOT_MEET_THRESHOLD 2'] = [
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'NONE',
  },
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)',
      'codeFrame': {
        'line': 10,
        'column': 26,
        'originalFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'relativeFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'BURN_IN',
  },
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)',
      'codeFrame': {
        'line': 10,
        'column': 26,
        'originalFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'relativeFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)',
      'codeFrame': {
        'line': 10,
        'column': 26,
        'originalFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'relativeFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': 'FAILED_DID_NOT_MEET_THRESHOLD',
    'initialStrategy': 'RETRY',
  },
]

exports['burn-in failing without flake FAILED_STOPPED_ON_FLAKE 2'] = [
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'NONE',
  },
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)',
      'codeFrame': {
        'line': 10,
        'column': 26,
        'originalFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'relativeFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': 'FAILED_STOPPED_ON_FLAKE',
    'initialStrategy': 'BURN_IN',
  },
]

exports['burn-in flaky test PASSED_BURN_IN 2'] = [
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'NONE',
  },
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'BURN_IN',
  },
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'BURN_IN',
  },
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': 'PASSED_BURN_IN',
    'initialStrategy': 'BURN_IN',
  },
]

exports['burn-in flaky test PASSED_MET_THRESHOLD 2'] = [
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'NONE',
  },
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)',
      'codeFrame': {
        'line': 10,
        'column': 26,
        'originalFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'relativeFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'BURN_IN',
  },
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)',
      'codeFrame': {
        'line': 10,
        'column': 26,
        'originalFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'relativeFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': 'PASSED_MET_THRESHOLD',
    'initialStrategy': 'RETRY',
  },
]

exports['burn-in flaky test FAILED_REACHED_MAX_RETRIES 2'] = [
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'NONE',
  },
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)',
      'codeFrame': {
        'line': 10,
        'column': 26,
        'originalFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'relativeFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'BURN_IN',
  },
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)',
      'codeFrame': {
        'line': 10,
        'column': 26,
        'originalFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'relativeFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)',
      'codeFrame': {
        'line': 10,
        'column': 26,
        'originalFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'relativeFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'passed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)',
      'codeFrame': {
        'line': 10,
        'column': 26,
        'originalFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'relativeFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': 'FAILED_REACHED_MAX_RETRIES',
    'initialStrategy': 'RETRY',
  },
]

exports['burn-in flaky test FAILED_DID_NOT_MEET_THRESHOLD 2'] = [
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'NONE',
  },
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)',
      'codeFrame': {
        'line': 10,
        'column': 26,
        'originalFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'relativeFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'BURN_IN',
  },
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)',
      'codeFrame': {
        'line': 10,
        'column': 26,
        'originalFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'relativeFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)',
      'codeFrame': {
        'line': 10,
        'column': 26,
        'originalFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'relativeFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': 'FAILED_DID_NOT_MEET_THRESHOLD',
    'initialStrategy': 'RETRY',
  },
]

exports['burn-in flaky test FAILED_STOPPED_ON_FLAKE 2'] = [
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'NONE',
  },
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)',
      'codeFrame': {
        'line': 10,
        'column': 26,
        'originalFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'relativeFile': 'cypress/e2e/passes-first-attempt-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': 'FAILED_STOPPED_ON_FLAKE',
    'initialStrategy': 'BURN_IN',
  },
]

exports['burn-in cloud could not determine score PASSED_FIRST_ATTEMPT 2'] = [
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': 'PASSED_FIRST_ATTEMPT',
    'initialStrategy': 'NONE',
  },
]

exports['burn-in cloud could not determine score PASSED_MET_THRESHOLD 2'] = [
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)',
      'codeFrame': {
        'line': 12,
        'column': 26,
        'originalFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'relativeFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'NONE',
  },
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)',
      'codeFrame': {
        'line': 12,
        'column': 26,
        'originalFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'relativeFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)',
      'codeFrame': {
        'line': 12,
        'column': 26,
        'originalFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'relativeFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': 'PASSED_MET_THRESHOLD',
    'initialStrategy': 'RETRY',
  },
]

exports['burn-in cloud could not determine score FAILED_REACHED_MAX_RETRIES 2'] = [
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)',
      'codeFrame': {
        'line': 12,
        'column': 26,
        'originalFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'relativeFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'NONE',
  },
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)',
      'codeFrame': {
        'line': 12,
        'column': 26,
        'originalFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'relativeFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)',
      'codeFrame': {
        'line': 12,
        'column': 26,
        'originalFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'relativeFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)',
      'codeFrame': {
        'line': 12,
        'column': 26,
        'originalFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'relativeFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': 'FAILED_REACHED_MAX_RETRIES',
    'initialStrategy': 'RETRY',
  },
]

exports['burn-in cloud could not determine score FAILED_DID_NOT_MEET_THRESHOLD 2'] = [
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)',
      'codeFrame': {
        'line': 12,
        'column': 26,
        'originalFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'relativeFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'NONE',
  },
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)',
      'codeFrame': {
        'line': 12,
        'column': 26,
        'originalFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'relativeFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)',
      'codeFrame': {
        'line': 12,
        'column': 26,
        'originalFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'relativeFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': 'FAILED_DID_NOT_MEET_THRESHOLD',
    'initialStrategy': 'RETRY',
  },
]

exports['burn-in cloud could not determine score FAILED_STOPPED_ON_FLAKE 2'] = [
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)',
      'codeFrame': {
        'line': 12,
        'column': 26,
        'originalFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'relativeFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'NONE',
  },
  {
    'state': 'passed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)',
      'codeFrame': {
        'line': 12,
        'column': 26,
        'originalFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'relativeFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': 'FAILED_STOPPED_ON_FLAKE',
    'initialStrategy': 'RETRY',
  },
]

exports['burn-in test is already burned-in PASSED_FIRST_ATTEMPT 2'] = [
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': 'PASSED_FIRST_ATTEMPT',
    'initialStrategy': 'NONE',
  },
]

exports['burn-in test is already burned-in PASSED_MET_THRESHOLD 2'] = [
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)',
      'codeFrame': {
        'line': 12,
        'column': 26,
        'originalFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'relativeFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'NONE',
  },
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)',
      'codeFrame': {
        'line': 12,
        'column': 26,
        'originalFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'relativeFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)',
      'codeFrame': {
        'line': 12,
        'column': 26,
        'originalFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'relativeFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': 'PASSED_MET_THRESHOLD',
    'initialStrategy': 'RETRY',
  },
]

exports['burn-in test is already burned-in FAILED_REACHED_MAX_RETRIES 2'] = [
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)',
      'codeFrame': {
        'line': 12,
        'column': 26,
        'originalFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'relativeFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'NONE',
  },
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)',
      'codeFrame': {
        'line': 12,
        'column': 26,
        'originalFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'relativeFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)',
      'codeFrame': {
        'line': 12,
        'column': 26,
        'originalFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'relativeFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)',
      'codeFrame': {
        'line': 12,
        'column': 26,
        'originalFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'relativeFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': 'FAILED_REACHED_MAX_RETRIES',
    'initialStrategy': 'RETRY',
  },
]

exports['burn-in test is already burned-in FAILED_DID_NOT_MEET_THRESHOLD 2'] = [
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)',
      'codeFrame': {
        'line': 12,
        'column': 26,
        'originalFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'relativeFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'NONE',
  },
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)',
      'codeFrame': {
        'line': 12,
        'column': 26,
        'originalFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'relativeFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'RETRY',
  },
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)',
      'codeFrame': {
        'line': 12,
        'column': 26,
        'originalFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'relativeFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': 'FAILED_DID_NOT_MEET_THRESHOLD',
    'initialStrategy': 'RETRY',
  },
]

exports['burn-in test is already burned-in FAILED_STOPPED_ON_FLAKE 2'] = [
  {
    'state': 'failed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)',
      'codeFrame': {
        'line': 12,
        'column': 26,
        'originalFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'relativeFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'NONE',
  },
  {
    'state': 'passed',
    'error': {
      'name': 'AssertionError',
      'message': 'expected true to be false',
      'stack': '    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)',
      'codeFrame': {
        'line': 12,
        'column': 26,
        'originalFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'relativeFile': 'cypress/e2e/deterministic-flaky.cy.js',
        'absoluteFile': '/path/to/absoluteFile',
        'frame': '  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })',
        'language': 'js',
      },
    },
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': 'FAILED_STOPPED_ON_FLAKE',
    'initialStrategy': 'RETRY',
  },
]

exports['burn-in override default burn-in config PASSED_BURN_IN 2'] = [
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'NONE',
  },
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': null,
    'initialStrategy': 'BURN_IN',
  },
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': 'PASSED_BURN_IN',
    'initialStrategy': 'BURN_IN',
  },
]

exports['burn-in override burn-in not allowed PASSED_FIRST_ATTEMPT 2'] = [
  {
    'state': 'passed',
    'error': null,
    'timings': {
      'lifecycle': 'Any.Number',
      'test': {
        'fnDuration': 'Any.Number',
        'afterFnDuration': 'Any.Number',
      },
    },
    'failedFromHookId': null,
    'wallClockStartedAt': 'Any.ISODate',
    'wallClockDuration': 'Any.Number',
    'videoTimestamp': null,
    'reasonToStop': 'PASSED_FIRST_ATTEMPT',
    'initialStrategy': 'NONE',
  },
]
