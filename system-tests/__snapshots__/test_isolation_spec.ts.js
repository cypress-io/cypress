exports['Test Isolation / fires events in the right order with the right arguments - headed: false - noExit: false'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:      1.2.3                                                                            │
  │ Browser:      FooBrowser 88                                                                    │
  │ Specs:        1 found (test-isolation.spec.js)                                                 │
  │ Searched:     cypress/e2e/test-isolation.spec.js                                               │
  │ Experiments:  experimentalInteractiveRunEvents=true                                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  test-isolation.spec.js                                                          (1 of 1)


  test isolation
    ✓ passes 1
    ✓ passes 2
    ✓ passes 3


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
  │ Spec Ran:     test-isolation.spec.js                                                           │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  test-isolation.spec.js                   XX:XX        3        3        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        3        3        -        -        -  


`

exports['Test Isolation / fires events in the right order with the right arguments - headed: true - noExit: false'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:      1.2.3                                                                            │
  │ Browser:      FooBrowser 88                                                                    │
  │ Specs:        1 found (test-isolation.spec.js)                                                 │
  │ Searched:     cypress/e2e/test-isolation.spec.js                                               │
  │ Experiments:  experimentalInteractiveRunEvents=true                                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  test-isolation.spec.js                                                          (1 of 1)


  test isolation
    ✓ passes 1
    ✓ passes 2
    ✓ passes 3


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
  │ Spec Ran:     test-isolation.spec.js                                                           │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  test-isolation.spec.js                   XX:XX        3        3        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        3        3        -        -        -  


`

exports['Test Isolation / fires events in the right order with the right arguments - headed: true - noExit: true'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:      1.2.3                                                                            │
  │ Browser:      FooBrowser 88                                                                    │
  │ Specs:        1 found (test-isolation.spec.js)                                                 │
  │ Searched:     cypress/e2e/test-isolation.spec.js                                               │
  │ Experiments:  experimentalInteractiveRunEvents=true                                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  test-isolation.spec.js                                                          (1 of 1)


  test isolation
    ✓ passes 1
    ✓ passes 2
    ✓ passes 3


  3 passing

not exiting due to options.exit being false

`

exports['Test Isolation / fires events in the right order with the right arguments - headed: false - noExit: true'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:      1.2.3                                                                            │
  │ Browser:      FooBrowser 88                                                                    │
  │ Specs:        1 found (test-isolation.spec.js)                                                 │
  │ Searched:     cypress/e2e/test-isolation.spec.js                                               │
  │ Experiments:  experimentalInteractiveRunEvents=true                                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  test-isolation.spec.js                                                          (1 of 1)


  test isolation
    ✓ passes 1
    ✓ passes 2
    ✓ passes 3


  3 passing

not exiting due to options.exit being false

`
