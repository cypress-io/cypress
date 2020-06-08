exports['e2e commands outside of test / passes on passing assertions'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (assertions_passing_outside_of_test_spec.coffee)                           │
  │ Searched:   cypress/integration/assertions_passing_outside_of_test_spec.coffee                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  assertions_passing_outside_of_test_spec.coffee                                  (1 of 1)


  0 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        0                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     assertions_passing_outside_of_test_spec.coffee                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/assertions_passing_outside_of_t     (X second)
                          est_spec.coffee.mp4                                                       


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  assertions_passing_outside_of_test_      XX:XX        -        -        -        -        - │
  │    spec.coffee                                                                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        -        -        -        -        -  


`

exports['e2e commands outside of test / fails on failing assertions'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (assertions_failing_outside_of_test_spec.coffee)                           │
  │ Searched:   cypress/integration/assertions_failing_outside_of_test_spec.coffee                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  assertions_failing_outside_of_test_spec.coffee                                  (1 of 1)


  1) An uncaught error was detected outside of a test

  0 passing
  1 failing

  1) An uncaught error was detected outside of a test:
     AssertionError: The following error originated from your test code, not from Cypress.

  > expected true to be false

When Cypress detects uncaught errors originating from your test code it will automatically fail the current test.

Cypress could not associate this error to any specific test.

We dynamically generated a new test to display this failure.
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
  │ Spec Ran:     assertions_failing_outside_of_test_spec.coffee                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/assertions_failing_outside_of_test_spec.coffee/     (1280x720)
     An uncaught error was detected outside of a test (failed).png                                  


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/assertions_failing_outside_of_t     (X second)
                          est_spec.coffee.mp4                                                       


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  assertions_failing_outside_of_test_      XX:XX        1        -        1        -        - │
  │    spec.coffee                                                                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1        -        1        -        -  


`

exports['e2e commands outside of test / fails on cy commands'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (commands_outside_of_test_spec.coffee)                                     │
  │ Searched:   cypress/integration/commands_outside_of_test_spec.coffee                           │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  commands_outside_of_test_spec.coffee                                            (1 of 1)


  1) An uncaught error was detected outside of a test

  0 passing
  1 failing

  1) An uncaught error was detected outside of a test:
     CypressError: The following error originated from your test code, not from Cypress.

  > Cannot call \`cy.viewport()\` outside a running test.

This usually happens when you accidentally write commands outside an \`it(...)\` test.

If that is the case, just move these commands inside an \`it(...)\` test.

Check your test file for errors.

When Cypress detects uncaught errors originating from your test code it will automatically fail the current test.

Cypress could not associate this error to any specific test.

We dynamically generated a new test to display this failure.

https://on.cypress.io/cannot-execute-commands-outside-test
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
  │ Spec Ran:     commands_outside_of_test_spec.coffee                                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/commands_outside_of_test_spec.coffee/An uncaugh     (1280x720)
     t error was detected outside of a test (failed).png                                            


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/commands_outside_of_test_spec.c     (X second)
                          offee.mp4                                                                 


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  commands_outside_of_test_spec.coffe      XX:XX        1        -        1        -        - │
  │    e                                                                                           │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1        -        1        -        -  


`
