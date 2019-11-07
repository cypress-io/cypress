exports['e2e stdout displays errors from failures 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (stdout_failing_spec.coffee)                                               │
  │ Searched:   cypress/integration/stdout_failing_spec.coffee                                     │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  stdout_failing_spec.coffee                                                      (1 of 1)


  stdout_failing_spec
    ✓ passes
    1) fails
    ✓ doesnt fail
    failing hook
      2) "before each" hook for "is failing"
    passing hook
      3) is failing


  2 passing
  3 failing

  1) stdout_failing_spec fails:
     Error: foo
      at stack trace line

  2) stdout_failing_spec failing hook "before each" hook for "is failing":
     CypressError: cy.visit() failed trying to load:

/does-not-exist.html

We failed looking for this file at the path:

/foo/bar/.projects/e2e/does-not-exist.html

The internal Cypress web server responded with:

  > 404: Not Found

Because this error occurred during a 'before each' hook we are skipping the remaining tests in the current suite: 'failing hook'
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

  3) stdout_failing_spec passing hook is failing:
     CypressError: cy.visit() failed trying to load:

/does-not-exist.html

We failed looking for this file at the path:

/foo/bar/.projects/e2e/does-not-exist.html

The internal Cypress web server responded with:

  > 404: Not Found
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

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        5                                                                                │
  │ Passing:      2                                                                                │
  │ Failing:      3                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  3                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     stdout_failing_spec.coffee                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/stdout_failing_spec.coffee/stdout_failing_spec      (1280x720)
     -- fails (failed).png                                                                          
  -  /XXX/XXX/XXX/cypress/screenshots/stdout_failing_spec.coffee/stdout_failing_spec      (1280x720)
     -- failing hook -- is failing -- before each hook (failed).png                                 
  -  /XXX/XXX/XXX/cypress/screenshots/stdout_failing_spec.coffee/stdout_failing_spec      (1280x720)
     -- passing hook -- is failing (failed).png                                                     


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/stdout_failing_spec.coffee.mp4      (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  stdout_failing_spec.coffee               XX:XX        5        2        3        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        5        2        3        -        -  


`

exports['e2e stdout displays errors from exiting early due to bundle errors 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (stdout_exit_early_failing_spec.coffee)                                    │
  │ Searched:   cypress/integration/stdout_exit_early_failing_spec.coffee                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  stdout_exit_early_failing_spec.coffee                                           (1 of 1)

Oops...we found an error preparing this test file:

  /foo/bar/.projects/e2e/cypress/integration/stdout_exit_early_failing_spec.coffee

The error was:

/foo/bar/.projects/e2e/cypress/integration/stdout_exit_early_failing_spec.coffee:1
+>
 ^
ParseError: unexpected >

This occurred while Cypress was compiling and bundling your test code. This is usually caused by:

- A missing file or dependency
- A syntax error in the file or one of its dependencies

Fix the error in your code and re-run your tests.

  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        0                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     stdout_exit_early_failing_spec.coffee                                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/stdout_exit_early_failing_spec.     (X second)
                          coffee.mp4                                                                


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  stdout_exit_early_failing_spec.coff      XX:XX        -        -        1        -        - │
  │    ee                                                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        -        -        1        -        -  


`

exports['e2e stdout does not duplicate suites or tests between visits 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (stdout_passing_spec.coffee)                                               │
  │ Searched:   cypress/integration/stdout_passing_spec.coffee                                     │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  stdout_passing_spec.coffee                                                      (1 of 1)


  stdout_passing_spec
    file
      ✓ visits file
    google
      ✓ visits google
      ✓ google2
    apple
      ✓ apple1
      ✓ visits apple
    subdomains
      ✓ cypress1
      ✓ visits cypress
      ✓ cypress3


  8 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        8                                                                                │
  │ Passing:      8                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     stdout_passing_spec.coffee                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/stdout_passing_spec.coffee.mp4      (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  stdout_passing_spec.coffee               XX:XX        8        8        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        8        8        -        -        -  


`

exports['e2e stdout logs that electron cannot be recorded in headed mode 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (simple_spec.coffee)                                                       │
  │ Searched:   cypress/integration/simple_spec.coffee                                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  simple_spec.coffee                                                              (1 of 1)

Warning: Cypress can only record videos when running headlessly.

You have set the 'electron' browser to run headed.

A video will not be recorded when using this mode.


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
  │ Spec Ran:     simple_spec.coffee                                                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  simple_spec.coffee                       XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


`

exports['e2e stdout / logs that chrome cannot be recorded'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (simple_spec.coffee)                                                       │
  │ Searched:   cypress/integration/simple_spec.coffee                                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  simple_spec.coffee                                                              (1 of 1)


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
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     simple_spec.coffee                                                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/simple_spec.coffee.mp4              (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  simple_spec.coffee                       XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


`

exports['e2e stdout displays fullname of nested specfile 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      3 found (nested-1/nested-2/nested-3/spec.coffee, nested-1/nested-2/nested-3/stdout │
  │             _specfile_display_spec_with_a_really_long_name_that_never_has_a_line_break_or_new_ │
  │             line.coffee, nested-1/nested-2/nested-3/stdout_specfile.coffee)                    │
  │ Searched:   cypress/integration/nested-1/nested-2/nested-3/*                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  nested-1/nested-2/nested-3/spec.coffee                                          (1 of 3)


  stdout_specfile_display_spec
    ✓ passes


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
  │ Spec Ran:     nested-1/nested-2/nested-3/spec.coffee                                           │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/nested-1/nested-2/nested-3/spec     (X second)
                          .coffee.mp4                                                               


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  nested-1/nested-2/nested-3/stdout_specfile_display_spec_with_a_reall            (2 of 3)
            y_long_name_that_never_has_a_line_break_or_new_line.coffee                              


  stdout_specfile_display_spec
    ✓ passes


  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     nested-1/nested-2/nested-3/stdout_specfile_display_spec_with_a_really_long_name_ │
  │               that_never_has_a_line_break_or_new_line.coffee                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/nested-1/nested-2/nested-3/stdout_specfile_disp     (1000x660)
     lay_spec_with_a_really_long_name_that_never_has_a_line_break_or_new_line.coffee/               
     stdout_specfile_display_spec -- passes.png                                                     


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/nested-1/nested-2/nested-3/stdo     (X second)
                          ut_specfile_display_spec_with_a_really_long_name_that_never               
                          _has_a_line_break_or_new_line.coffee.mp4                                  


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  nested-1/nested-2/nested-3/stdout_specfile.coffee                               (3 of 3)


  stdout_specfile_display_spec
    ✓ passes


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
  │ Spec Ran:     nested-1/nested-2/nested-3/stdout_specfile.coffee                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/nested-1/nested-2/nested-3/stdo     (X second)
                          ut_specfile.coffee.mp4                                                    


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  nested-1/nested-2/nested-3/spec.cof      XX:XX        1        1        -        -        - │
  │    fee                                                                                         │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  nested-1/nested-2/nested-3/stdout_s      XX:XX        1        1        -        -        - │
  │    pecfile_display_spec_with_a_really_                                                         │
  │    long_name_that_never_has_a_line_bre                                                         │
  │    ak_or_new_line.coffee                                                                       │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  nested-1/nested-2/nested-3/stdout_s      XX:XX        1        1        -        -        - │
  │    pecfile.coffee                                                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        3        3        -        -        -  


`
