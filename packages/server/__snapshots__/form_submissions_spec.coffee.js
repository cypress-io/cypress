exports['e2e form submissions passing 1'] = `
====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (form_submission_passing_spec.coffee)                                      │
  │ Searched:   cypress/integration/form_submission_passing_spec.coffee                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: form_submission_passing_spec.coffee...                                          (1 of 1) 


  form submissions
    ✓ will find 'form success' message by default (after retrying)
    ✓ needs an explicit should when an element is immediately found


  2 passing


  (Results)

  ┌───────────────────────────────────────────────────┐
  │ Tests:        2                                   │
  │ Passing:      2                                   │
  │ Failing:      0                                   │
  │ Pending:      0                                   │
  │ Skipped:      0                                   │
  │ Screenshots:  0                                   │
  │ Video:        true                                │
  │ Duration:     X seconds                           │
  │ Spec Ran:     form_submission_passing_spec.coffee │
  └───────────────────────────────────────────────────┘


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔ form_submission_passing_spec.coffee       XX:XX        2        2        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    All specs passed!                           XX:XX        2        2        -        -        -  

`

exports['e2e form submissions failing 1'] = `
====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (form_submission_failing_spec.coffee)                                      │
  │ Searched:   cypress/integration/form_submission_failing_spec.coffee                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: form_submission_failing_spec.coffee...                                          (1 of 1) 


  form submission fails
    1) fails without an explicit wait when an element is immediately found


  0 passing
  1 failing

  1) form submission fails fails without an explicit wait when an element is immediately found:
     AssertionError: expected '<form>' to contain 'form success!'
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line




  (Results)

  ┌───────────────────────────────────────────────────┐
  │ Tests:        1                                   │
  │ Passing:      0                                   │
  │ Failing:      1                                   │
  │ Pending:      0                                   │
  │ Skipped:      0                                   │
  │ Screenshots:  1                                   │
  │ Video:        true                                │
  │ Duration:     X seconds                           │
  │ Spec Ran:     form_submission_failing_spec.coffee │
  └───────────────────────────────────────────────────┘


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/form_submission_failing_spec.coffee/form submission fails -- fails without an explicit wait when an element is immediately found (failed).png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖ form_submission_failing_spec.coffee       XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    1 of 1 failed (100%)                        XX:XX        1        -        1        -        -  

`

