exports['e2e forms / <form> submissions / passes with https on localhost'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (form_submission_multipart_spec.coffee)                                    │
  │ Searched:   cypress/integration/form_submission_multipart_spec.coffee                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  form_submission_multipart_spec.coffee                                           (1 of 1)


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


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        7                                                                                │
  │ Passing:      7                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     form_submission_multipart_spec.coffee                                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/form_submission_multipart_spec.     (X second)
                          coffee.mp4                                                                


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  form_submission_multipart_spec.coff      XX:XX        7        7        -        -        - │
  │    ee                                                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        7        7        -        -        -  


`

exports['e2e forms / <form> submissions / passes with http on localhost'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (form_submission_multipart_spec.coffee)                                    │
  │ Searched:   cypress/integration/form_submission_multipart_spec.coffee                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  form_submission_multipart_spec.coffee                                           (1 of 1)


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


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        7                                                                                │
  │ Passing:      7                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     form_submission_multipart_spec.coffee                                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/form_submission_multipart_spec.     (X second)
                          coffee.mp4                                                                


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  form_submission_multipart_spec.coff      XX:XX        7        7        -        -        - │
  │    ee                                                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        7        7        -        -        -  


`

exports['e2e forms / submissions with jquery XHR POST / failing'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (form_submission_failing_spec.coffee)                                      │
  │ Searched:   cypress/integration/form_submission_failing_spec.coffee                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  form_submission_failing_spec.coffee                                             (1 of 1)


  form submission fails
    1) fails without an explicit wait when an element is immediately found


  0 passing
  1 failing

  1) form submission fails
       fails without an explicit wait when an element is immediately found:
     AssertionError: expected '<form>' to contain 'form success!'
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     form_submission_failing_spec.coffee                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/form_submission_failing_spec.coffee/form submis     (1280x720)
     sion fails -- fails without an explicit wait when an element is immediately foun               
     d (failed).png                                                                                 


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/form_submission_failing_spec.co     (X second)
                          ffee.mp4                                                                  


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  form_submission_failing_spec.coffee      XX:XX        1    └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1  

`

exports['e2e forms / submissions with jquery XHR POST / passing'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (form_submission_passing_spec.coffee)                                      │
  │ Searched:   cypress/integration/form_submission_passing_spec.coffee                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  form_submission_passing_spec.coffee                                             (1 of 1)


  form submissions
    ✓ will find 'form success' message by default (after retrying)
    ✓ needs an explicit should when an element is immediately found


  2 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      2                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     form_submission_passing_spec.coffee                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/form_submission_passing_spec.co     (X second)
                          ffee.mp4                                                                  


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  form_submission_passing_spec.coffee      XX:XX        2        2        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        2        2        -        -        -  


`
