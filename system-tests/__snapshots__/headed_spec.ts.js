exports['e2e headed runs multiple specs in headed mode - [chrome] 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:      1.2.3                                                                            │
  │ Browser:      FooBrowser 88                                                                    │
  │ Specs:        2 found (dom-content.spec.js, withFailure.spec.js)                               │
  │ Searched:     cypress/e2e/dom-content.spec.js, cypress/e2e/withFailure.spec.js                 │
  │ Experiments:  experimentalInteractiveRunEvents=true                                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  dom-content.spec.js                                                             (1 of 2)


  Dom Content
    ✓ renders the test content


  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     dom-content.spec.js                                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/dom-content.spec.js.mp4             (X second)


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  withFailure.spec.js                                                             (2 of 2)


  withFailure
    1) fails
    ✓ passes
    ✓ passes with delay
    ✓ passes again


  3 passing
  1 failing

  1) withFailure
       fails:
     AssertionError: expected true to equal false
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        4                                                                                │
  │ Passing:      3                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     withFailure.spec.js                                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/withFailure.spec.js/withFailure -- fails (faile    (2400x1738)
     d).png                                                                                         


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/withFailure.spec.js.mp4             (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  dom-content.spec.js                      XX:XX        1        1        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  withFailure.spec.js                      XX:XX        4        3        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 2 failed (50%)                      XX:XX        5        4        1        -        -  


`

exports['e2e headed runs multiple specs in headed mode - [firefox] 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:      1.2.3                                                                            │
  │ Browser:      FooBrowser 88                                                                    │
  │ Specs:        2 found (dom-content.spec.js, withFailure.spec.js)                               │
  │ Searched:     cypress/e2e/dom-content.spec.js, cypress/e2e/withFailure.spec.js                 │
  │ Experiments:  experimentalInteractiveRunEvents=true                                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  dom-content.spec.js                                                             (1 of 2)


  Dom Content
    ✓ renders the test content


  1 passing

Warning: We failed processing this video.

This error will not alter the exit code.

TimeoutError: operation timed out
      [stack trace lines]


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
  │ Spec Ran:     dom-content.spec.js                                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  withFailure.spec.js                                                             (2 of 2)


  withFailure
    1) fails
    ✓ passes
    ✓ passes with delay
    ✓ passes again


  3 passing
  1 failing

  1) withFailure
       fails:
     AssertionError: expected true to equal false
      [stack trace lines]



Warning: We failed processing this video.

This error will not alter the exit code.

TimeoutError: operation timed out
      [stack trace lines]


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        4                                                                                │
  │ Passing:      3                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     withFailure.spec.js                                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/withFailure.spec.js/withFailure -- fails (faile    (3584x1904)
     d).png                                                                                         


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  dom-content.spec.js                      XX:XX        1        1        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  withFailure.spec.js                      XX:XX        4        3        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 2 failed (50%)                      XX:XX        5        4        1        -        -  


`

exports['e2e headed runs multiple specs in headed mode - [electron] 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:      1.2.3                                                                            │
  │ Browser:      FooBrowser 88                                                                    │
  │ Specs:        2 found (dom-content.spec.js, withFailure.spec.js)                               │
  │ Searched:     cypress/e2e/dom-content.spec.js, cypress/e2e/withFailure.spec.js                 │
  │ Experiments:  experimentalInteractiveRunEvents=true                                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  dom-content.spec.js                                                             (1 of 2)


  Dom Content
    ✓ renders the test content


  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     dom-content.spec.js                                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/dom-content.spec.js.mp4             (X second)


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  withFailure.spec.js                                                             (2 of 2)


  withFailure
    1) fails
    ✓ passes
    ✓ passes with delay
    ✓ passes again


  3 passing
  1 failing

  1) withFailure
       fails:
     AssertionError: expected true to equal false
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        4                                                                                │
  │ Passing:      3                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     withFailure.spec.js                                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/withFailure.spec.js/withFailure -- fails (faile    (3584x2018)
     d).png                                                                                         


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/withFailure.spec.js.mp4             (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  dom-content.spec.js                      XX:XX        1        1        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  withFailure.spec.js                      XX:XX        4        3        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 2 failed (50%)                      XX:XX        5        4        1        -        -  


`
