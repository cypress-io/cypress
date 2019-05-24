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
                                                                                                    
  Running: stdout_failing_spec.coffee...                                                   (1 of 1) 


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
      at stack trace line




  (Results)

  ┌──────────────────────────────────────────┐
  │ Tests:        5                          │
  │ Passing:      2                          │
  │ Failing:      3                          │
  │ Pending:      0                          │
  │ Skipped:      0                          │
  │ Screenshots:  3                          │
  │ Video:        true                       │
  │ Duration:     X seconds                  │
  │ Spec Ran:     stdout_failing_spec.coffee │
  └──────────────────────────────────────────┘


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/stdout_failing_spec.coffee/stdout_failing_spec -- fails (failed).png (1280x720)
  - /foo/bar/.projects/e2e/cypress/screenshots/stdout_failing_spec.coffee/stdout_failing_spec -- failing hook -- is failing -- before each hook (failed).png (1280x720)
  - /foo/bar/.projects/e2e/cypress/screenshots/stdout_failing_spec.coffee/stdout_failing_spec -- passing hook -- is failing (failed).png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖ stdout_failing_spec.coffee                XX:XX        5        2        3        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    1 of 1 failed (100%)                        XX:XX        5        2        3        -        -  


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
                                                                                                    
  Running: stdout_exit_early_failing_spec.coffee...                                        (1 of 1) 

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

  ┌─────────────────────────────────────────────────────┐
  │ Tests:        0                                     │
  │ Passing:      0                                     │
  │ Failing:      1                                     │
  │ Pending:      0                                     │
  │ Skipped:      0                                     │
  │ Screenshots:  0                                     │
  │ Video:        true                                  │
  │ Duration:     X seconds                             │
  │ Spec Ran:     stdout_exit_early_failing_spec.coffee │
  └─────────────────────────────────────────────────────┘


Oops...we found an error preparing this test file:

  /foo/bar/.projects/e2e/cypress/support/index.js

The error was:

<anonymous>:1:2: error: unexpected >
+>
 ^

This occurred while Cypress was compiling and bundling your test code. This is usually caused by:

- A missing file or dependency
- A syntax error in the file or one of its dependencies

Fix the error in your code and re-run your tests.

  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖ stdout_exit_early_failing_spec.coffee     XX:XX        -        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    1 of 1 failed (100%)                        XX:XX        -        -        1        -        -  


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
                                                                                                    
  Running: stdout_passing_spec.coffee...                                                   (1 of 1) 


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

  ┌──────────────────────────────────────────┐
  │ Tests:        8                          │
  │ Passing:      8                          │
  │ Failing:      0                          │
  │ Pending:      0                          │
  │ Skipped:      0                          │
  │ Screenshots:  0                          │
  │ Video:        true                       │
  │ Duration:     X seconds                  │
  │ Spec Ran:     stdout_passing_spec.coffee │
  └──────────────────────────────────────────┘


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔ stdout_passing_spec.coffee                XX:XX        8        8        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    All specs passed!                           XX:XX        8        8        -        -        -  


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
                                                                                                    
  Running: simple_spec.coffee...                                                           (1 of 1) 

Warning: Cypress can only record videos when running headlessly.

You have set the 'electron' browser to run headed.

A video will not be recorded when using this mode.


  ✓ is true

  1 passing


  (Results)

  ┌──────────────────────────────────┐
  │ Tests:        1                  │
  │ Passing:      1                  │
  │ Failing:      0                  │
  │ Pending:      0                  │
  │ Skipped:      0                  │
  │ Screenshots:  0                  │
  │ Video:        false              │
  │ Duration:     X seconds          │
  │ Spec Ran:     simple_spec.coffee │
  └──────────────────────────────────┘


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔ simple_spec.coffee                        XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    All specs passed!                           XX:XX        1        1        -        -        -  


`

exports['e2e stdout logs that chrome cannot be recorded 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (simple_spec.coffee)                                                       │
  │ Searched:   cypress/integration/simple_spec.coffee                                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: simple_spec.coffee...                                                           (1 of 1) 

Warning: Cypress can only record videos when using the built in 'electron' browser.

You have set the browser to: 'chrome'

A video will not be recorded when using this browser.


  ✓ is true

  1 passing


  (Results)

  ┌──────────────────────────────────┐
  │ Tests:        1                  │
  │ Passing:      1                  │
  │ Failing:      0                  │
  │ Pending:      0                  │
  │ Skipped:      0                  │
  │ Screenshots:  0                  │
  │ Video:        false              │
  │ Duration:     X seconds          │
  │ Spec Ran:     simple_spec.coffee │
  └──────────────────────────────────┘


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔ simple_spec.coffee                        XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    All specs passed!                           XX:XX        1        1        -        -        -  


`
