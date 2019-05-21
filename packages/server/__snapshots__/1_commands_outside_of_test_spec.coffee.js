exports['e2e commands outside of test fails on cy commands 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (commands_outside_of_test_spec.coffee)                                     │
  │ Searched:   cypress/integration/commands_outside_of_test_spec.coffee                           │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: commands_outside_of_test_spec.coffee...                                         (1 of 1) 


  1) An uncaught error was detected outside of a test

  0 passing
  1 failing

  1)  An uncaught error was detected outside of a test:
     Uncaught CypressError: Cannot call "cy.viewport()" outside a running test.

This usually happens when you accidentally write commands outside an it(...) test.

If that is the case, just move these commands inside an it(...) test.

Check your test file for errors.

https://on.cypress.io/cannot-execute-commands-outside-test

This error originated from your test code, not from Cypress.

When Cypress detects uncaught errors originating from your test code it will automatically fail the current test.

Cypress could not associate this error to any specific test.

We dynamically generated a new test to display this failure.
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

  ┌────────────────────────────────────────────────────┐
  │ Tests:        1                                    │
  │ Passing:      0                                    │
  │ Failing:      1                                    │
  │ Pending:      0                                    │
  │ Skipped:      0                                    │
  │ Screenshots:  1                                    │
  │ Video:        true                                 │
  │ Duration:     X seconds                            │
  │ Spec Ran:     commands_outside_of_test_spec.coffee │
  └────────────────────────────────────────────────────┘


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/commands_outside_of_test_spec.coffee/An uncaught error was detected outside of a test (failed).png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖ commands_outside_of_test_spec.coffee      XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    1 of 1 failed (100%)                        XX:XX        1        -        1        -        -  


`

exports['e2e commands outside of test fails on failing assertions 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (assertions_failing_outside_of_test_spec.coffee)                           │
  │ Searched:   cypress/integration/assertions_failing_outside_of_test_spec.coffee                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: assertions_failing_outside_of_test_spec.coffee...                               (1 of 1) 


  1) An uncaught error was detected outside of a test

  0 passing
  1 failing

  1)  An uncaught error was detected outside of a test:

      expected true to be false

This error originated from your test code, not from Cypress.

When Cypress detects uncaught errors originating from your test code it will automatically fail the current test.

Cypress could not associate this error to any specific test.

We dynamically generated a new test to display this failure.
      + expected - actual

      -true
      +false
      
  AssertionError: expected true to be false




  (Results)

  ┌──────────────────────────────────────────────────────────────┐
  │ Tests:        1                                              │
  │ Passing:      0                                              │
  │ Failing:      1                                              │
  │ Pending:      0                                              │
  │ Skipped:      0                                              │
  │ Screenshots:  1                                              │
  │ Video:        true                                           │
  │ Duration:     X seconds                                      │
  │ Spec Ran:     assertions_failing_outside_of_test_spec.coffee │
  └──────────────────────────────────────────────────────────────┘


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/assertions_failing_outside_of_test_spec.coffee/An uncaught error was detected outside of a test (failed).png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖ assertions_failing_outside_of_test_s…     XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    1 of 1 failed (100%)                        XX:XX        1        -        1        -        -  


`

exports['e2e commands outside of test passes on passing assertions 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (assertions_passing_outside_of_test_spec.coffee)                           │
  │ Searched:   cypress/integration/assertions_passing_outside_of_test_spec.coffee                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: assertions_passing_outside_of_test_spec.coffee...                               (1 of 1) 


  0 passing


  (Results)

  ┌──────────────────────────────────────────────────────────────┐
  │ Tests:        0                                              │
  │ Passing:      0                                              │
  │ Failing:      0                                              │
  │ Pending:      0                                              │
  │ Skipped:      0                                              │
  │ Screenshots:  0                                              │
  │ Video:        true                                           │
  │ Duration:     X seconds                                      │
  │ Spec Ran:     assertions_passing_outside_of_test_spec.coffee │
  └──────────────────────────────────────────────────────────────┘


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔ assertions_passing_outside_of_test_s…     XX:XX        -        -        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    All specs passed!                           XX:XX        -        -        -        -        -  


`
