exports['lib/util/print-run .renderSummaryTable omits the flaky column when no test was flaky 1'] = `

================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  cypress/e2e/passing.cy.js                00:01        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        00:04        1        1        -        -        -  

`

exports['lib/util/print-run .renderSummaryTable counts tests that passed after failing 1'] = `

================================================================================

  (Run Finished)


       Spec                                       Tests  Passing  Failing  Pending  Skipped  Flaky  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  cypress/e2e/flaky-passing.cy      00:01        2        2        -        -        -      1 │
  │    .js                                                                                         │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  cypress/e2e/passing.cy.js         00:01        1        1        -        -        -      - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                 00:04        3        3        -        -        -      1  

`

exports['lib/util/print-run .renderSummaryTable counts tests that failed after passing 1'] = `

================================================================================

  (Run Finished)


       Spec                                       Tests  Passing  Failing  Pending  Skipped  Flaky  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  cypress/e2e/flaky-failing.cy      00:01        1        -        1        -        -      1 │
  │    .js                                                                                         │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)              00:04        1        -        1        -        -      1  

`

exports['lib/util/print-run .renderSummaryTable renders a dash for specs skipped by the cloud 1'] = `

================================================================================

  (Run Finished)


       Spec                                       Tests  Passing  Failing  Pending  Skipped  Flaky  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  cypress/e2e/flaky-passing.cy      00:01        2        2        -        -        -      1 │
  │    .js                                                                                         │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ -  cypress/e2e/skipped.cy.js       SKIPPED        -        -        -        -        -      - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    -  The run was canceled              00:04        2        2        -        -        -      1  

`

exports['lib/util/print-run .displayResults omits the flaky row when no test was flaky 1'] = `

  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     1 second                                                                         │
  │ Spec Ran:     cypress/e2e/passing.cy.js                                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘

`

exports['lib/util/print-run .displayResults includes the flaky row when a test was flaky 1'] = `

  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      2                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Flaky:        1                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     1 second                                                                         │
  │ Spec Ran:     cypress/e2e/flaky-passing.cy.js                                                  │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘

`
