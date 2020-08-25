exports['e2e caught and uncaught hooks errors / failing1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (hook_caught_error_failing_spec.coffee)                                    │
  │ Searched:   cypress/integration/hook_caught_error_failing_spec.coffee                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  hook_caught_error_failing_spec.coffee                                           (1 of 1)


  ✓ t1a
  s1a
    1) "before each" hook for "t2a"

  s2a
    ✓ t5a
    ✓ t6a
    ✓ t7a

  s3a
    2) "before all" hook for "t8a"

  s4a
    3) "before all" hook for "t10a"

  s5a
    ✓ fires all test:after:run events


  5 passing
  3 failing

  1) s1a
       "before each" hook for "t2a":
     AssertionError: Timed out retrying: Expected to find element: \`.does-not-exist\`, but never found it.

Because this error occurred during a \`before each\` hook we are skipping the remaining tests in the current suite: \`s1a\`
      [stack trace lines]

  2) s3a
       "before all" hook for "t8a":
     Error: s3a before hook failed

Because this error occurred during a \`before all\` hook we are skipping the remaining tests in the current suite: \`s3a\`
      [stack trace lines]

  3) s4a
       "before all" hook for "t10a":
     Error: s4a before hook failed

Because this error occurred during a \`before all\` hook we are skipping the remaining tests in the current suite: \`s4a\`
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        11                                                                               │
  │ Passing:      5                                                                                │
  │ Failing:      3                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      3                                                                                │
  │ Screenshots:  3                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     hook_caught_error_failing_spec.coffee                                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/hook_caught_error_failing_spec.coffee/s1a -- t2     (1280x720)
     a -- before each hook (failed).png                                                             
  -  /XXX/XXX/XXX/cypress/screenshots/hook_caught_error_failing_spec.coffee/s3a -- t8     (1280x720)
     a -- before all hook (failed).png                                                              
  -  /XXX/XXX/XXX/cypress/screenshots/hook_caught_error_failing_spec.coffee/s4a -- t1     (1280x720)
     0a -- before all hook (failed).png                                                             


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/hook_caught_error_failing_spec.     (X second)
                          coffee.mp4                                                                


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  hook_caught_error_failing_spec.coff      XX:XX       11        5        3        -        3 │
  │    ee                                                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX       11        5        3        -        3  


`

exports['e2e caught and uncaught hooks errors / failing2'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (hook_uncaught_error_failing_spec.coffee)                                  │
  │ Searched:   cypress/integration/hook_uncaught_error_failing_spec.coffee                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  hook_uncaught_error_failing_spec.coffee                                         (1 of 1)


  ✓ t1b
  s1b
    1) "before each" hook for "t2b"

  s2b
    ✓ t5b
    ✓ t6b
    ✓ t7b


  4 passing
  1 failing

  1) s1b
       "before each" hook for "t2b":
     ReferenceError: The following error originated from your application code, not from Cypress.

  > foo is not defined

When Cypress detects uncaught errors originating from your application it will automatically fail the current test.

This behavior is configurable, and you can choose to turn this off by listening to the \`uncaught:exception\` event.

https://on.cypress.io/uncaught-exception-from-application

Because this error occurred during a \`before each\` hook we are skipping the remaining tests in the current suite: \`s1b\`
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        7                                                                                │
  │ Passing:      4                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      2                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     hook_uncaught_error_failing_spec.coffee                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/hook_uncaught_error_failing_spec.coffee/s1b --      (1280x720)
     t2b -- before each hook (failed).png                                                           


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/hook_uncaught_error_failing_spe     (X second)
                          c.coffee.mp4                                                              


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  hook_uncaught_error_failing_spec.co      XX:XX        7        4        1        -        2 │
  │    ffee                                                                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        7        4        1        -        2  


`

exports['e2e caught and uncaught hooks errors / failing3'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (hook_uncaught_root_error_failing_spec.coffee)                             │
  │ Searched:   cypress/integration/hook_uncaught_root_error_failing_spec.coffee                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  hook_uncaught_root_error_failing_spec.coffee                                    (1 of 1)


  1) "before each" hook for "t1c"

  0 passing
  1 failing

  1) "before each" hook for "t1c":
     ReferenceError: The following error originated from your application code, not from Cypress.

  > foo is not defined

When Cypress detects uncaught errors originating from your application it will automatically fail the current test.

This behavior is configurable, and you can choose to turn this off by listening to the \`uncaught:exception\` event.

https://on.cypress.io/uncaught-exception-from-application

Because this error occurred during a \`before each\` hook we are skipping all of the remaining tests.
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        4                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      3                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     hook_uncaught_root_error_failing_spec.coffee                                     │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/hook_uncaught_root_error_failing_spec.coffee/t1     (1280x720)
     c -- before each hook (failed).png                                                             


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/hook_uncaught_root_error_failin     (X second)
                          g_spec.coffee.mp4                                                         


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  hook_uncaught_root_error_failing_sp      XX:XX        4        -        1        -        3 │
  │    ec.coffee                                                                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        4        -        1        -        3  


`

exports['e2e caught and uncaught hooks errors / failing4'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (hook_uncaught_error_events_failing_spec.coffee)                           │
  │ Searched:   cypress/integration/hook_uncaught_error_events_failing_spec.coffee                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  hook_uncaught_error_events_failing_spec.coffee                                  (1 of 1)


  uncaught hook error should continue to fire all mocha events
    s1
      1) "before each" hook for "does not run"
    s2
      ✓ does run
      ✓ also runs


  2 passing
  1 failing

  1) uncaught hook error should continue to fire all mocha events
       s1
         "before each" hook for "does not run":
     ReferenceError: The following error originated from your application code, not from Cypress.

  > foo is not defined

When Cypress detects uncaught errors originating from your application it will automatically fail the current test.

This behavior is configurable, and you can choose to turn this off by listening to the \`uncaught:exception\` event.

https://on.cypress.io/uncaught-exception-from-application

Because this error occurred during a \`before each\` hook we are skipping the remaining tests in the current suite: \`s1\`
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        3                                                                                │
  │ Passing:      2                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     hook_uncaught_error_events_failing_spec.coffee                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/hook_uncaught_error_events_failing_spec.coffee/     (1280x720)
     uncaught hook error should continue to fire all mocha events -- s1 -- does not r               
     un -- before each hook (failed).png                                                            


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/hook_uncaught_error_events_fail     (X second)
                          ing_spec.coffee.mp4                                                       


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  hook_uncaught_error_events_failing_      XX:XX        3        2        1        -        - │
  │    spec.coffee                                                                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        3        2        1        -        -  


`
