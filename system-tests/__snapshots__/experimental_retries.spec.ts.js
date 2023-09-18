exports['e2e retries.experimentalStrategy / experimentalBurnIn=false / "detect-flake-and-pass-on-threshold" / passes / only runs the first attempt of the test if the test passes'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (always-passes.cy.js)                                                      │
  │ Searched:   cypress/e2e/always-passes.cy.js                                                    │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  always-passes.cy.js                                                             (1 of 1)


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
  │ Spec Ran:     always-passes.cy.js                                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  always-passes.cy.js                      XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


`

exports['e2e retries.experimentalStrategy / experimentalBurnIn=false / "detect-flake-and-pass-on-threshold" / passes / retries up to the "passesRequired" limit if the config can be satisfied'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (deterministic-flaky.cy.js)                                                │
  │ Searched:   cypress/e2e/deterministic-flaky.cy.js                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  deterministic-flaky.cy.js                                                       (1 of 1)


  deterministic flaky test
    ✖(Attempt 1 of 10) deterministically runs pass/fail on this test
    ✓(Attempt 2 of 10) deterministically runs pass/fail on this test
    ✖(Attempt 3 of 10) deterministically runs pass/fail on this test
    ✓(Attempt 4 of 10) deterministically runs pass/fail on this test
    ✖(Attempt 5 of 10) deterministically runs pass/fail on this test
    ✓(Attempt 6 of 10) deterministically runs pass/fail on this test
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
  │ Spec Ran:     deterministic-flaky.cy.js                                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  deterministic-flaky.cy.js                XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


`

exports['e2e retries.experimentalStrategy / experimentalBurnIn=false / "detect-flake-and-pass-on-threshold" / passes / retries up to the "passesRequired" limit if the config can be satisfied (max attempts)'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (deterministic-flaky.cy.js)                                                │
  │ Searched:   cypress/e2e/deterministic-flaky.cy.js                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  deterministic-flaky.cy.js                                                       (1 of 1)


  deterministic flaky test
    ✖(Attempt 1 of 10) deterministically runs pass/fail on this test
    ✓(Attempt 2 of 10) deterministically runs pass/fail on this test
    ✖(Attempt 3 of 10) deterministically runs pass/fail on this test
    ✓(Attempt 4 of 10) deterministically runs pass/fail on this test
    ✖(Attempt 5 of 10) deterministically runs pass/fail on this test
    ✓(Attempt 6 of 10) deterministically runs pass/fail on this test
    ✖(Attempt 7 of 10) deterministically runs pass/fail on this test
    ✓(Attempt 8 of 10) deterministically runs pass/fail on this test
    ✖(Attempt 9 of 10) deterministically runs pass/fail on this test
    ✓(Attempt 10 of 10) deterministically runs pass/fail on this test
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
  │ Spec Ran:     deterministic-flaky.cy.js                                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  deterministic-flaky.cy.js                XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


`

exports['e2e retries.experimentalStrategy / experimentalBurnIn=false / "detect-flake-and-pass-on-threshold" / fails / short-circuits if the needed "passesRequired" cannot be satisfied by the remaining attempts available'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (deterministic-flaky.cy.js)                                                │
  │ Searched:   cypress/e2e/deterministic-flaky.cy.js                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  deterministic-flaky.cy.js                                                       (1 of 1)


  deterministic flaky test
    ✖(Attempt 1 of 6) deterministically runs pass/fail on this test
    ✓(Attempt 2 of 6) deterministically runs pass/fail on this test
    ✖(Attempt 3 of 6) deterministically runs pass/fail on this test
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
  │ Spec Ran:     deterministic-flaky.cy.js                                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  deterministic-flaky.cy.js                XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1        -        1        -        -  


`

exports['e2e retries.experimentalStrategy / experimentalBurnIn=false / "detect-flake-and-pass-on-threshold" / fails / retries up to the "passesRequired" limit if the config can be satisfied (max attempts possible)'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (deterministic-flaky.cy.js)                                                │
  │ Searched:   cypress/e2e/deterministic-flaky.cy.js                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  deterministic-flaky.cy.js                                                       (1 of 1)


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
  │ Spec Ran:     deterministic-flaky.cy.js                                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  deterministic-flaky.cy.js                XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1        -        1        -        -  


`

exports['e2e retries.experimentalStrategy / experimentalBurnIn=false / "detect-flake-but-always-fail" / passes / only runs the first attempt of the test if the test passes'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (always-passes.cy.js)                                                      │
  │ Searched:   cypress/e2e/always-passes.cy.js                                                    │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  always-passes.cy.js                                                             (1 of 1)


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
  │ Spec Ran:     always-passes.cy.js                                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  always-passes.cy.js                      XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


`

exports['e2e retries.experimentalStrategy / experimentalBurnIn=false / "detect-flake-but-always-fail" / fails / runs all attempts of the test if the first attempt fails and "stopIfAnyPassed=false"'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (deterministic-flaky.cy.js)                                                │
  │ Searched:   cypress/e2e/deterministic-flaky.cy.js                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  deterministic-flaky.cy.js                                                       (1 of 1)


  deterministic flaky test
    ✖(Attempt 1 of 10) deterministically runs pass/fail on this test
    ✓(Attempt 2 of 10) deterministically runs pass/fail on this test
    ✖(Attempt 3 of 10) deterministically runs pass/fail on this test
    ✓(Attempt 4 of 10) deterministically runs pass/fail on this test
    ✖(Attempt 5 of 10) deterministically runs pass/fail on this test
    ✓(Attempt 6 of 10) deterministically runs pass/fail on this test
    ✖(Attempt 7 of 10) deterministically runs pass/fail on this test
    ✓(Attempt 8 of 10) deterministically runs pass/fail on this test
    ✖(Attempt 9 of 10) deterministically runs pass/fail on this test
    ✓(Attempt 10 of 10) deterministically runs pass/fail on this test
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
  │ Spec Ran:     deterministic-flaky.cy.js                                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  deterministic-flaky.cy.js                XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1        -        1        -        -  


`

exports['e2e retries.experimentalStrategy / experimentalBurnIn=false / "detect-flake-but-always-fail" / fails / runs attempts of the test if the first attempt fails until the test passes if "stopIfAnyPassed=true"'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (deterministic-flaky.cy.js)                                                │
  │ Searched:   cypress/e2e/deterministic-flaky.cy.js                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  deterministic-flaky.cy.js                                                       (1 of 1)


  deterministic flaky test
    ✖(Attempt 1 of 10) deterministically runs pass/fail on this test
    ✓(Attempt 2 of 10) deterministically runs pass/fail on this test
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
  │ Spec Ran:     deterministic-flaky.cy.js                                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  deterministic-flaky.cy.js                XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1        -        1        -        -  


`

exports['e2e retries.experimentalStrategy / experimentalBurnIn=false / "detect-flake-and-pass-on-threshold" / exercises experimental-retries suite to verify console reporter and final status code are correct.'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      8 found (can-retry-from-afterEach.retries.mochaEvents.cy.js, can-retry-from-before │
  │             Each.retries.mochaEvents.cy.js, cant-retry-from-before.retries.mochaEvents.cy.js,  │
  │             does-not-serialize-dom-error.cy.js, simple-fail.retries.mochaEvents.cy.js, test-re │
  │             try-with-h...)                                                                     │
  │ Searched:   cypress/e2e/runner/experimental-retries/*                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  can-retry-from-afterEach.retries.mochaEvents.cy.js                              (1 of 8)


  suite 1
    ✖(Attempt 1 of 10) test 1
    ✓(Attempt 2 of 10) test 1
    ✓(Attempt 3 of 10) test 1
    ✓(Attempt 4 of 10) test 1
    ✓(Attempt 5 of 10) test 1
    ✓(Attempt 6 of 10) test 1
    ✓ test 1
    ✓ test 2
    ✓ test 3

  suite 2
    ✖(Attempt 1 of 10) test 1
    ✓(Attempt 2 of 10) test 1
    ✖(Attempt 2 of 10) test 1
    ✓(Attempt 3 of 10) test 1
    ✓(Attempt 4 of 10) test 1
    ✓(Attempt 5 of 10) test 1
    ✓(Attempt 6 of 10) test 1
    ✓(Attempt 7 of 10) test 1
    ✓ test 1

  suite 3
    ✓ test 1


  5 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        5                                                                                │
  │ Passing:      5                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     can-retry-from-afterEach.retries.mochaEvents.cy.js                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  can-retry-from-beforeEach.retries.mochaEvents.cy.js                             (2 of 8)


  suite 1
    ✖(Attempt 1 of 10) test 1
    ✓(Attempt 2 of 10) test 1
    ✓(Attempt 3 of 10) test 1
    ✓(Attempt 4 of 10) test 1
    ✓(Attempt 5 of 10) test 1
    ✓(Attempt 6 of 10) test 1
    ✓ test 1


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
  │ Spec Ran:     can-retry-from-beforeEach.retries.mochaEvents.cy.js                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  cant-retry-from-before.retries.mochaEvents.cy.js                                (3 of 8)


  suite 1
    ✖ "before all" hook for "test 1" (NaNms)


  0 passing
  1 failing

  1) suite 1
       "before all" hook for "test 1":
     Error: Because this error occurred during a \`before all\` hook we are skipping the remaining tests in the current suite: \`suite 1\`

Although you have test retries enabled, we do not retry tests when \`before all\` or \`after all\` hooks fail
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
  │ Spec Ran:     cant-retry-from-before.retries.mochaEvents.cy.js                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  does-not-serialize-dom-error.cy.js                                              (4 of 8)


  ✖(Attempt 1 of 10) visits
  ✖(Attempt 2 of 10) visits
  ✖(Attempt 3 of 10) visits
  ✖(Attempt 4 of 10) visits
  ✖(Attempt 5 of 10) visits
  ✖(Attempt 6 of 10) visits
  ✖ visits

  0 passing
  1 failing

  1) visits:
     AssertionError: Timed out retrying after 200ms: expected '<button#button>' not to be 'visible'
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
  │ Spec Ran:     does-not-serialize-dom-error.cy.js                                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  simple-fail.retries.mochaEvents.cy.js                                           (5 of 8)


  suite 1
    ✖(Attempt 1 of 10) test 1
    ✓(Attempt 2 of 10) test 1
    ✓(Attempt 3 of 10) test 1
    ✓(Attempt 4 of 10) test 1
    ✓(Attempt 5 of 10) test 1
    ✓(Attempt 6 of 10) test 1
    ✓ test 1


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
  │ Spec Ran:     simple-fail.retries.mochaEvents.cy.js                                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  test-retry-with-hooks.retries.mochaEvents.cy.js                                 (6 of 8)


  suite 1
    ✖(Attempt 1 of 10) test 1
    ✓(Attempt 2 of 10) test 1
    ✓(Attempt 3 of 10) test 1
    ✓(Attempt 4 of 10) test 1
    ✓(Attempt 5 of 10) test 1
    ✓(Attempt 6 of 10) test 1
    ✓ test 1


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
  │ Spec Ran:     test-retry-with-hooks.retries.mochaEvents.cy.js                                  │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  test-retry-with-only.retries.mochaEvents.cy.js                                  (7 of 8)


  suite 1
    ✖(Attempt 1 of 10) test 2
    ✓(Attempt 2 of 10) test 2
    ✓(Attempt 3 of 10) test 2
    ✓(Attempt 4 of 10) test 2
    ✓(Attempt 5 of 10) test 2
    ✓(Attempt 6 of 10) test 2
    ✓ test 2


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
  │ Spec Ran:     test-retry-with-only.retries.mochaEvents.cy.js                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  three-tests-with-retry.retries.mochaEvents.cy.js                                (8 of 8)


  suite 1
    ✓ test 1
    ✖(Attempt 1 of 10) test 2
    ✖(Attempt 2 of 10) test 2
    ✓(Attempt 3 of 10) test 2
    ✓(Attempt 4 of 10) test 2
    ✓(Attempt 5 of 10) test 2
    ✓(Attempt 6 of 10) test 2
    ✓(Attempt 7 of 10) test 2
    ✓ test 2
    ✓ test 3


  3 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        3                                                                                │
  │ Passing:      3                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     three-tests-with-retry.retries.mochaEvents.cy.js                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  can-retry-from-afterEach.retries.mo      XX:XX        5        5        -        -        - │
  │    chaEvents.cy.js                                                                             │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  can-retry-from-beforeEach.retries.m      XX:XX        1        1        -        -        - │
  │    ochaEvents.cy.js                                                                            │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  cant-retry-from-before.retries.moch      XX:XX        1        -        1        -        - │
  │    aEvents.cy.js                                                                               │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  does-not-serialize-dom-error.cy.js       XX:XX        1        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  simple-fail.retries.mochaEvents.cy.      XX:XX        1        1        -        -        - │
  │    js                                                                                          │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  test-retry-with-hooks.retries.mocha      XX:XX        1        1        -        -        - │
  │    Events.cy.js                                                                                │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  test-retry-with-only.retries.mochaE      XX:XX        1        1        -        -        - │
  │    vents.cy.js                                                                                 │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  three-tests-with-retry.retries.moch      XX:XX        3        3        -        -        - │
  │    aEvents.cy.js                                                                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  2 of 8 failed (25%)                      XX:XX       14       12        2        -        -  


`

exports['e2e retries.experimentalStrategy / experimentalBurnIn=false / "detect-flake-but-always-fail" / exercises experimental-retries suite to verify console reporter and final status code are correct.'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      8 found (can-retry-from-afterEach.retries.mochaEvents.cy.js, can-retry-from-before │
  │             Each.retries.mochaEvents.cy.js, cant-retry-from-before.retries.mochaEvents.cy.js,  │
  │             does-not-serialize-dom-error.cy.js, simple-fail.retries.mochaEvents.cy.js, test-re │
  │             try-with-h...)                                                                     │
  │ Searched:   cypress/e2e/runner/experimental-retries/*                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  can-retry-from-afterEach.retries.mochaEvents.cy.js                              (1 of 8)


  suite 1
    ✖(Attempt 1 of 10) test 1
    ✓(Attempt 2 of 10) test 1
    ✓(Attempt 3 of 10) test 1
    ✓(Attempt 4 of 10) test 1
    ✓(Attempt 5 of 10) test 1
    ✓(Attempt 6 of 10) test 1
    ✓(Attempt 7 of 10) test 1
    ✓(Attempt 8 of 10) test 1
    ✓(Attempt 9 of 10) test 1
    ✓(Attempt 10 of 10) test 1
    ✖ test 1
    ✓ test 2
    ✓ test 3

  suite 2
    ✖(Attempt 1 of 10) test 1
    ✓(Attempt 2 of 10) test 1
    ✖(Attempt 2 of 10) test 1
    ✓(Attempt 3 of 10) test 1
    ✓(Attempt 4 of 10) test 1
    ✓(Attempt 5 of 10) test 1
    ✓(Attempt 6 of 10) test 1
    ✓(Attempt 7 of 10) test 1
    ✓(Attempt 8 of 10) test 1
    ✓(Attempt 9 of 10) test 1
    ✓(Attempt 10 of 10) test 1
    ✖ test 1

  suite 3
    ✓ test 1


  3 passing
  2 failing

  1) suite 1
       test 1:
     
  [object Object]
  Error
      [stack trace lines]

  2) suite 2
       test 1:
     
  [object Object]
  Error
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        5                                                                                │
  │ Passing:      3                                                                                │
  │ Failing:      2                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     can-retry-from-afterEach.retries.mochaEvents.cy.js                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  can-retry-from-beforeEach.retries.mochaEvents.cy.js                             (2 of 8)


  suite 1
    ✖(Attempt 1 of 10) test 1
    ✓(Attempt 2 of 10) test 1
    ✓(Attempt 3 of 10) test 1
    ✓(Attempt 4 of 10) test 1
    ✓(Attempt 5 of 10) test 1
    ✓(Attempt 6 of 10) test 1
    ✓(Attempt 7 of 10) test 1
    ✓(Attempt 8 of 10) test 1
    ✓(Attempt 9 of 10) test 1
    ✓(Attempt 10 of 10) test 1
    ✖ test 1


  0 passing
  1 failing

  1) suite 1
       test 1:
     
  [object Object]
  Error
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
  │ Spec Ran:     can-retry-from-beforeEach.retries.mochaEvents.cy.js                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  cant-retry-from-before.retries.mochaEvents.cy.js                                (3 of 8)


  suite 1
    ✖ "before all" hook for "test 1" (NaNms)


  0 passing
  1 failing

  1) suite 1
       "before all" hook for "test 1":
     Error: Because this error occurred during a \`before all\` hook we are skipping the remaining tests in the current suite: \`suite 1\`

Although you have test retries enabled, we do not retry tests when \`before all\` or \`after all\` hooks fail
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
  │ Spec Ran:     cant-retry-from-before.retries.mochaEvents.cy.js                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  does-not-serialize-dom-error.cy.js                                              (4 of 8)


  ✖(Attempt 1 of 10) visits
  ✖(Attempt 2 of 10) visits
  ✖(Attempt 3 of 10) visits
  ✖(Attempt 4 of 10) visits
  ✖(Attempt 5 of 10) visits
  ✖(Attempt 6 of 10) visits
  ✖(Attempt 7 of 10) visits
  ✖(Attempt 8 of 10) visits
  ✖(Attempt 9 of 10) visits
  ✖(Attempt 10 of 10) visits
  ✖ visits

  0 passing
  1 failing

  1) visits:
     AssertionError: Timed out retrying after 200ms: expected '<button#button>' not to be 'visible'
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
  │ Spec Ran:     does-not-serialize-dom-error.cy.js                                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  simple-fail.retries.mochaEvents.cy.js                                           (5 of 8)


  suite 1
    ✖(Attempt 1 of 10) test 1
    ✓(Attempt 2 of 10) test 1
    ✓(Attempt 3 of 10) test 1
    ✓(Attempt 4 of 10) test 1
    ✓(Attempt 5 of 10) test 1
    ✓(Attempt 6 of 10) test 1
    ✓(Attempt 7 of 10) test 1
    ✓(Attempt 8 of 10) test 1
    ✓(Attempt 9 of 10) test 1
    ✓(Attempt 10 of 10) test 1
    ✖ test 1


  0 passing
  1 failing

  1) suite 1
       test 1:
     [object Object]
Error: test 1
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
  │ Spec Ran:     simple-fail.retries.mochaEvents.cy.js                                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  test-retry-with-hooks.retries.mochaEvents.cy.js                                 (6 of 8)


  suite 1
    ✖(Attempt 1 of 10) test 1
    ✓(Attempt 2 of 10) test 1
    ✓(Attempt 3 of 10) test 1
    ✓(Attempt 4 of 10) test 1
    ✓(Attempt 5 of 10) test 1
    ✓(Attempt 6 of 10) test 1
    ✓(Attempt 7 of 10) test 1
    ✓(Attempt 8 of 10) test 1
    ✓(Attempt 9 of 10) test 1
    ✓(Attempt 10 of 10) test 1
    ✖ test 1


  0 passing
  1 failing

  1) suite 1
       test 1:
     [object Object]
Error: test 1
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
  │ Spec Ran:     test-retry-with-hooks.retries.mochaEvents.cy.js                                  │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  test-retry-with-only.retries.mochaEvents.cy.js                                  (7 of 8)


  suite 1
    ✖(Attempt 1 of 10) test 2
    ✓(Attempt 2 of 10) test 2
    ✓(Attempt 3 of 10) test 2
    ✓(Attempt 4 of 10) test 2
    ✓(Attempt 5 of 10) test 2
    ✓(Attempt 6 of 10) test 2
    ✓(Attempt 7 of 10) test 2
    ✓(Attempt 8 of 10) test 2
    ✓(Attempt 9 of 10) test 2
    ✓(Attempt 10 of 10) test 2
    ✖ test 2


  0 passing
  1 failing

  1) suite 1
       test 2:
     [object Object]
Error: test 2
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
  │ Spec Ran:     test-retry-with-only.retries.mochaEvents.cy.js                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  three-tests-with-retry.retries.mochaEvents.cy.js                                (8 of 8)


  suite 1
    ✓ test 1
    ✖(Attempt 1 of 10) test 2
    ✖(Attempt 2 of 10) test 2
    ✓(Attempt 3 of 10) test 2
    ✓(Attempt 4 of 10) test 2
    ✓(Attempt 5 of 10) test 2
    ✓(Attempt 6 of 10) test 2
    ✓(Attempt 7 of 10) test 2
    ✓(Attempt 8 of 10) test 2
    ✓(Attempt 9 of 10) test 2
    ✓(Attempt 10 of 10) test 2
    ✖ test 2
    ✓ test 3


  2 passing
  1 failing

  1) suite 1
       test 2:
     
  [object Object]
  Error
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        3                                                                                │
  │ Passing:      2                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     three-tests-with-retry.retries.mochaEvents.cy.js                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  can-retry-from-afterEach.retries.mo      XX:XX        5        3        2        -        - │
  │    chaEvents.cy.js                                                                             │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  can-retry-from-beforeEach.retries.m      XX:XX        1        -        1        -        - │
  │    ochaEvents.cy.js                                                                            │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  cant-retry-from-before.retries.moch      XX:XX        1        -        1        -        - │
  │    aEvents.cy.js                                                                               │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  does-not-serialize-dom-error.cy.js       XX:XX        1        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  simple-fail.retries.mochaEvents.cy.      XX:XX        1        -        1        -        - │
  │    js                                                                                          │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  test-retry-with-hooks.retries.mocha      XX:XX        1        -        1        -        - │
  │    Events.cy.js                                                                                │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  test-retry-with-only.retries.mochaE      XX:XX        1        -        1        -        - │
  │    vents.cy.js                                                                                 │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  three-tests-with-retry.retries.moch      XX:XX        3        2        1        -        - │
  │    aEvents.cy.js                                                                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  8 of 8 failed (100%)                     XX:XX       14        5        9        -        -  


`

exports['e2e retries.experimentalStrategy / experimentalBurnIn=false / "detect-flake-but-always-fail" / exercises experimental-retries suite to verify console reporter and final status code are correct (stopIfAnyPassed=true).'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      8 found (can-retry-from-afterEach.retries.mochaEvents.cy.js, can-retry-from-before │
  │             Each.retries.mochaEvents.cy.js, cant-retry-from-before.retries.mochaEvents.cy.js,  │
  │             does-not-serialize-dom-error.cy.js, simple-fail.retries.mochaEvents.cy.js, test-re │
  │             try-with-h...)                                                                     │
  │ Searched:   cypress/e2e/runner/experimental-retries/*                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  can-retry-from-afterEach.retries.mochaEvents.cy.js                              (1 of 8)


  suite 1
    ✖(Attempt 1 of 10) test 1
    ✓(Attempt 2 of 10) test 1
    ✖ test 1
    ✓ test 2
    ✓ test 3

  suite 2
    ✖(Attempt 1 of 10) test 1
    ✓(Attempt 2 of 10) test 1
    ✖ test 1
    ✖(Attempt 2 of 10) test 1
    ✓(Attempt 3 of 10) test 1
    ✖ test 1

  suite 3
    ✓ test 1


  3 passing
  3 failing

  1) suite 1
       test 1:
     
  [object Object]
  Error
      [stack trace lines]

  2) suite 2
       test 1:
     
  [object Object]
  Error
      [stack trace lines]

  3) suite 2
       test 1:
     
  [object Object]
  Error
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        5                                                                                │
  │ Passing:      3                                                                                │
  │ Failing:      2                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     can-retry-from-afterEach.retries.mochaEvents.cy.js                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  can-retry-from-beforeEach.retries.mochaEvents.cy.js                             (2 of 8)


  suite 1
    ✖(Attempt 1 of 10) test 1
    ✓(Attempt 2 of 10) test 1
    ✖ test 1


  0 passing
  1 failing

  1) suite 1
       test 1:
     
  [object Object]
  Error
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
  │ Spec Ran:     can-retry-from-beforeEach.retries.mochaEvents.cy.js                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  cant-retry-from-before.retries.mochaEvents.cy.js                                (3 of 8)


  suite 1
    ✖ "before all" hook for "test 1" (NaNms)


  0 passing
  1 failing

  1) suite 1
       "before all" hook for "test 1":
     Error: Because this error occurred during a \`before all\` hook we are skipping the remaining tests in the current suite: \`suite 1\`

Although you have test retries enabled, we do not retry tests when \`before all\` or \`after all\` hooks fail
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
  │ Spec Ran:     cant-retry-from-before.retries.mochaEvents.cy.js                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  does-not-serialize-dom-error.cy.js                                              (4 of 8)


  ✖(Attempt 1 of 10) visits
  ✖(Attempt 2 of 10) visits
  ✖(Attempt 3 of 10) visits
  ✖(Attempt 4 of 10) visits
  ✖(Attempt 5 of 10) visits
  ✖(Attempt 6 of 10) visits
  ✖(Attempt 7 of 10) visits
  ✖(Attempt 8 of 10) visits
  ✖(Attempt 9 of 10) visits
  ✖(Attempt 10 of 10) visits
  ✖ visits

  0 passing
  1 failing

  1) visits:
     AssertionError: Timed out retrying after 200ms: expected '<button#button>' not to be 'visible'
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
  │ Spec Ran:     does-not-serialize-dom-error.cy.js                                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  simple-fail.retries.mochaEvents.cy.js                                           (5 of 8)


  suite 1
    ✖(Attempt 1 of 10) test 1
    ✓(Attempt 2 of 10) test 1
    ✖ test 1


  0 passing
  1 failing

  1) suite 1
       test 1:
     [object Object]
Error: test 1
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
  │ Spec Ran:     simple-fail.retries.mochaEvents.cy.js                                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  test-retry-with-hooks.retries.mochaEvents.cy.js                                 (6 of 8)


  suite 1
    ✖(Attempt 1 of 10) test 1
    ✓(Attempt 2 of 10) test 1
    ✖ test 1


  0 passing
  1 failing

  1) suite 1
       test 1:
     [object Object]
Error: test 1
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
  │ Spec Ran:     test-retry-with-hooks.retries.mochaEvents.cy.js                                  │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  test-retry-with-only.retries.mochaEvents.cy.js                                  (7 of 8)


  suite 1
    ✖(Attempt 1 of 10) test 2
    ✓(Attempt 2 of 10) test 2
    ✖ test 2


  0 passing
  1 failing

  1) suite 1
       test 2:
     [object Object]
Error: test 2
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
  │ Spec Ran:     test-retry-with-only.retries.mochaEvents.cy.js                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  three-tests-with-retry.retries.mochaEvents.cy.js                                (8 of 8)


  suite 1
    ✓ test 1
    ✖(Attempt 1 of 10) test 2
    ✖(Attempt 2 of 10) test 2
    ✓(Attempt 3 of 10) test 2
    ✖ test 2
    ✓ test 3


  2 passing
  1 failing

  1) suite 1
       test 2:
     
  [object Object]
  Error
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        3                                                                                │
  │ Passing:      2                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     three-tests-with-retry.retries.mochaEvents.cy.js                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  can-retry-from-afterEach.retries.mo      XX:XX        5        3        2        -        - │
  │    chaEvents.cy.js                                                                             │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  can-retry-from-beforeEach.retries.m      XX:XX        1        -        1        -        - │
  │    ochaEvents.cy.js                                                                            │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  cant-retry-from-before.retries.moch      XX:XX        1        -        1        -        - │
  │    aEvents.cy.js                                                                               │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  does-not-serialize-dom-error.cy.js       XX:XX        1        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  simple-fail.retries.mochaEvents.cy.      XX:XX        1        -        1        -        - │
  │    js                                                                                          │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  test-retry-with-hooks.retries.mocha      XX:XX        1        -        1        -        - │
  │    Events.cy.js                                                                                │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  test-retry-with-only.retries.mochaE      XX:XX        1        -        1        -        - │
  │    vents.cy.js                                                                                 │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  three-tests-with-retry.retries.moch      XX:XX        3        2        1        -        - │
  │    aEvents.cy.js                                                                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  8 of 8 failed (100%)                     XX:XX       14        5        9        -        -  


`
