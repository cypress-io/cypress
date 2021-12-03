exports['e2e forms / <form> submissions / passes with https on localhost'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (cypress/integration/form_submission_multipart_spec.js)                    │
  │ Searched:   /foo/bar/.projects/e2e/cypress/integrati │
  │             on/form_submission_multipart_spec.js                                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  cypress/integration/form_submission_multipart_spec.js                           (1 of 1)


  <form> submissions
    ✓ can submit a form correctly
    ✓ can submit a multipart/form-data form correctly
    can submit a multipart/form-data form with attachments
      ✓ image/png
      ✓ application/pdf
      ✓ image/jpeg
      ✓ large application/pdf
      ✓ large image/jpeg


  7 passing

Warning: We failed processing this video.

This error will not alter the exit code.

TimeoutError: operation timed out
      [stack trace lines]


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        7                                                                                │
  │ Passing:      7                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     cypress/integration/form_submission_multipart_spec.js                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  cypress/integration/form_submission      XX:XX        7        7        -        -        - │
  │    _multipart_spec.js                                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        7        7        -        -        -  


`

exports['e2e forms / <form> submissions / passes with http on localhost'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (cypress/integration/form_submission_multipart_spec.js)                    │
  │ Searched:   /foo/bar/.projects/e2e/cypress/integrati │
  │             on/form_submission_multipart_spec.js                                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  cypress/integration/form_submission_multipart_spec.js                           (1 of 1)


  <form> submissions
    ✓ can submit a form correctly
    ✓ can submit a multipart/form-data form correctly
    can submit a multipart/form-data form with attachments
      ✓ image/png
      ✓ application/pdf
      ✓ image/jpeg
      ✓ large application/pdf
      ✓ large image/jpeg


  7 passing

Warning: We failed processing this video.

This error will not alter the exit code.

TimeoutError: operation timed out
      [stack trace lines]


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        7                                                                                │
  │ Passing:      7                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     cypress/integration/form_submission_multipart_spec.js                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  cypress/integration/form_submission      XX:XX        7        7        -        -        - │
  │    _multipart_spec.js                                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        7        7        -        -        -  


`

exports['e2e forms / submissions with jquery XHR POST / failing'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (cypress/integration/form_submission_failing_spec.js)                      │
  │ Searched:   /foo/bar/.projects/e2e/cypress/integrati │
  │             on/form_submission_failing_spec.js                                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  cypress/integration/form_submission_failing_spec.js                             (1 of 1)


  form submission fails
    1) fails without an explicit wait when an element is immediately found


  0 passing
  1 failing

  1) form submission fails
       fails without an explicit wait when an element is immediately found:
     AssertionError: expected '<form>' to contain 'form success!'
      [stack trace lines]



Warning: We failed processing this video.

This error will not alter the exit code.

TimeoutError: operation timed out
      [stack trace lines]


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     cypress/integration/form_submission_failing_spec.js                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /foo/bar/.projects/e2e/cypress/screens     (1280x720)
     hots/cypress/integration/form_submission_failing_spec.js/form submission fails -               
     - fails without an explicit wait when an element is immediately found (failed).p               
     ng                                                                                             


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  cypress/integration/form_submission      XX:XX        1    │    _failing_spec.js                                                                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1  

`

exports['e2e forms / submissions with jquery XHR POST / passing'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (cypress/integration/form_submission_passing_spec.js)                      │
  │ Searched:   /foo/bar/.projects/e2e/cypress/integrati │
  │             on/form_submission_passing_spec.js                                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  cypress/integration/form_submission_passing_spec.js                             (1 of 1)


  form submissions
    ✓ will find 'form success' message by default (after retrying)
    ✓ needs an explicit should when an element is immediately found


  2 passing

Warning: We failed processing this video.

This error will not alter the exit code.

TimeoutError: operation timed out
      [stack trace lines]


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      2                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     cypress/integration/form_submission_passing_spec.js                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  cypress/integration/form_submission      XX:XX        2        2        -        -        - │
  │    _passing_spec.js                                                                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        2        2        -        -        -  


`
