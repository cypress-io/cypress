exports['e2e plugin run events / sends events'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:      1.2.3                                                                            │
  │ Browser:      FooBrowser 88                                                                    │
  │ Specs:        2 found (run_events_spec_1.cy.js, run_events_spec_2.cy.js)                       │
  │ Searched:     cypress/e2e/**/*.cy.{js,jsx,ts,tsx}                                              │
  │ Experiments:  experimentalInteractiveRunEvents=true                                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘

before:run: cypress/e2e/run_events_spec_1.cy.js electron
before:run is awaited

────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  run_events_spec_1.cy.js                                                         (1 of 2)
before:spec: cypress/e2e/run_events_spec_1.cy.js
before:spec is awaited


  ✓ is true

  1 passing

spec:end: cypress/e2e/run_events_spec_1.cy.js { tests: 1, passes: 1, failures: 0 }
after:spec is awaited

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
  │ Spec Ran:     run_events_spec_1.cy.js                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  run_events_spec_2.cy.js                                                         (2 of 2)
before:spec: cypress/e2e/run_events_spec_2.cy.js
before:spec is awaited


  ✓ is true

  1 passing

spec:end: cypress/e2e/run_events_spec_2.cy.js { tests: 1, passes: 1, failures: 0 }
after:spec is awaited

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
  │ Spec Ran:     run_events_spec_2.cy.js                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘

after:run: { totalTests: 2, totalPassed: 2, totalFailed: 0 }
after:run is awaited

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  run_events_spec_1.cy.js                  XX:XX        1        1        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  run_events_spec_2.cy.js                  XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        2        2        -        -        -  


`

exports['e2e plugin run events / handles video being deleted in after:spec'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (run_events_spec_1.cy.js)                                                  │
  │ Searched:   cypress/e2e/*1.cy.js                                                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  run_events_spec_1.cy.js                                                         (1 of 1)


  ✓ is true

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
  │ Spec Ran:     run_events_spec_1.cy.js                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  run_events_spec_1.cy.js                  XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


`

exports['e2e plugin run events / fails run if event handler throws'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      2 found (run_events_spec_1.cy.js, run_events_spec_2.cy.js)                         │
  │ Searched:   cypress/e2e/**/*.cy.{js,jsx,ts,tsx}                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  run_events_spec_1.cy.js                                                         (1 of 2)
An error was thrown in your plugins file while executing the handler for the before:spec event.

The error we received was:

Error: error thrown in before:spec
      [stack trace lines]
`

exports['e2e plugin run events / handles async before:spec'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      2 found (run_events_spec_1.cy.js, run_events_spec_2.cy.js)                         │
  │ Searched:   cypress/e2e/**/*.cy.{js,jsx,ts,tsx}                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  run_events_spec_1.cy.js                                                         (1 of 2)
<---- before:spec promise start
received args {
  fileExtension: '.js',
  baseName: 'run_events_spec_1.cy.js',
  fileName: 'run_events_spec_1',
  specFileExtension: '.cy.js',
  relativeToCommonRoot: 'run_events_spec_1.cy.js',
  specType: 'integration',
  name: 'run_events_spec_1.cy.js',
  relative: 'cypress/e2e/run_events_spec_1.cy.js',
  absolute: '/foo/bar/.projects/plugin-run-events/cypress/e2e/run_events_spec_1.cy.js'
}
----> before:spec: Promise resolved!


  ✓ is true

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
  │ Spec Ran:     run_events_spec_1.cy.js                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  run_events_spec_2.cy.js                                                         (2 of 2)
<---- before:spec promise start
received args {
  fileExtension: '.js',
  baseName: 'run_events_spec_2.cy.js',
  fileName: 'run_events_spec_2',
  specFileExtension: '.cy.js',
  relativeToCommonRoot: 'run_events_spec_2.cy.js',
  specType: 'integration',
  name: 'run_events_spec_2.cy.js',
  relative: 'cypress/e2e/run_events_spec_2.cy.js',
  absolute: '/foo/bar/.projects/plugin-run-events/cypress/e2e/run_events_spec_2.cy.js'
}
----> before:spec: Promise resolved!


  ✓ is true

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
  │ Spec Ran:     run_events_spec_2.cy.js                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  run_events_spec_1.cy.js                  XX:XX        1        1        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  run_events_spec_2.cy.js                  XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        2        2        -        -        -  


`
