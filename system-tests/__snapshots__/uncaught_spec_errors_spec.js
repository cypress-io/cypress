exports['e2e uncaught errors / failing1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (uncaught_synchronous_before_tests_parsed.js)                              │
  │ Searched:   cypress/integration/uncaught_synchronous_before_tests_parsed.js                    │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  uncaught_synchronous_before_tests_parsed.js                                     (1 of 1)


  1) An uncaught error was detected outside of a test

  0 passing
  1 failing

  1) An uncaught error was detected outside of a test:
     ReferenceError: The following error originated from your test code, not from Cypress.

  > foo is not defined

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
  │ Spec Ran:     uncaught_synchronous_before_tests_parsed.js                                      │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/uncaught_synchronous_before_tests_parsed.js/An      (1280x720)
     uncaught error was detected outside of a test (failed).png                                     


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/uncaught_synchronous_before_tes     (X second)
                          ts_parsed.js.mp4                                                          


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  uncaught_synchronous_before_tests_p      XX:XX        1        -        1        -        - │
  │    arsed.js                                                                                    │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1        -        1        -        -  


`

exports['e2e uncaught errors / failing2'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (uncaught_synchronous_during_hook_spec.js)                                 │
  │ Searched:   cypress/integration/uncaught_synchronous_during_hook_spec.js                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  uncaught_synchronous_during_hook_spec.js                                        (1 of 1)


  1) An uncaught error was detected outside of a test

  0 passing
  1 failing

  1) An uncaught error was detected outside of a test:
     ReferenceError: The following error originated from your test code, not from Cypress.

  > foo is not defined

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
  │ Spec Ran:     uncaught_synchronous_during_hook_spec.js                                         │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/uncaught_synchronous_during_hook_spec.js/An unc     (1280x720)
     aught error was detected outside of a test (failed).png                                        


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/uncaught_synchronous_during_hoo     (X second)
                          k_spec.js.mp4                                                             


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  uncaught_synchronous_during_hook_sp      XX:XX        1        -        1        -        - │
  │    ec.js                                                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1        -        1        -        -  


`

exports['e2e uncaught errors / failing3'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (uncaught_during_test_spec.js)                                             │
  │ Searched:   cypress/integration/uncaught_during_test_spec.js                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  uncaught_during_test_spec.js                                                    (1 of 1)


  foo
    1) fails with setTimeout
    2) fails with setTimeout and done
    ✓ passes with fail handler after failing with setTimeout
    3) fails with async app code error
    ✓ passes with fail handler after failing with async app code error
    - fails with promise


  2 passing
  1 pending
  3 failing

  1) foo
       fails with setTimeout:
     ReferenceError: The following error originated from your test code, not from Cypress.

  > foo is not defined

When Cypress detects uncaught errors originating from your test code it will automatically fail the current test.
      [stack trace lines]

  2) foo
       fails with setTimeout and done:
     ReferenceError: The following error originated from your test code, not from Cypress.

  > foo is not defined

When Cypress detects uncaught errors originating from your test code it will automatically fail the current test.
      [stack trace lines]

  3) foo
       fails with async app code error:
     ReferenceError: The following error originated from your application code, not from Cypress.

  > qax is not defined

When Cypress detects uncaught errors originating from your application it will automatically fail the current test.

This behavior is configurable, and you can choose to turn this off by listening to the \`uncaught:exception\` event.

https://on.cypress.io/uncaught-exception-from-application
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        6                                                                                │
  │ Passing:      2                                                                                │
  │ Failing:      3                                                                                │
  │ Pending:      1                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  3                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     uncaught_during_test_spec.js                                                     │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/uncaught_during_test_spec.js/foo -- fails with      (1280x720)
     setTimeout (failed).png                                                                        
  -  /XXX/XXX/XXX/cypress/screenshots/uncaught_during_test_spec.js/foo -- fails with      (1280x720)
     setTimeout and done (failed).png                                                               
  -  /XXX/XXX/XXX/cypress/screenshots/uncaught_during_test_spec.js/foo -- fails with      (1280x720)
     async app code error (failed).png                                                              


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/uncaught_during_test_spec.js.mp     (X second)
                          4                                                                         


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  uncaught_during_test_spec.js             XX:XX        6        2        3        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        6        2        3        1        -  


`

exports['e2e uncaught errors / failing4'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (uncaught_during_hook_spec.js)                                             │
  │ Searched:   cypress/integration/uncaught_during_hook_spec.js                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  uncaught_during_hook_spec.js                                                    (1 of 1)


  foo
    1) "before all" hook for "does not run"

  bar
    ✓ runs


  1 passing
  1 failing

  1) foo
       "before all" hook for "does not run":
     ReferenceError: The following error originated from your test code, not from Cypress.

  > foo is not defined

When Cypress detects uncaught errors originating from your test code it will automatically fail the current test.

Because this error occurred during a \`before all\` hook we are skipping the remaining tests in the current suite: \`foo\`
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     uncaught_during_hook_spec.js                                                     │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/uncaught_during_hook_spec.js/foo -- does not ru     (1280x720)
     n -- before all hook (failed).png                                                              


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/uncaught_during_hook_spec.js.mp     (X second)
                          4                                                                         


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  uncaught_during_hook_spec.js             XX:XX        2        1        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        2        1        1        -        -  


`

exports['e2e uncaught errors / failing5'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (caught_async_sync_test_spec.js)                                           │
  │ Searched:   cypress/integration/caught_async_sync_test_spec.js                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  caught_async_sync_test_spec.js                                                  (1 of 1)


  foo
    1) baz fails
    2) bar fails
    3) quux fails
    4) quux2 fails
    ✓ quux3 passes
    ✓ quux4 passes
    ✓ quux5 passes
    ✓ quux6 passes


  4 passing
  4 failing

  1) foo
       baz fails:
     ReferenceError: foo is not defined
      [stack trace lines]

  2) foo
       bar fails:
     ReferenceError: foo is not defined
      [stack trace lines]

  3) foo
       quux fails:
     ReferenceError: foo is not defined
      [stack trace lines]

  4) foo
       quux2 fails:
     ReferenceError: foo is not defined
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        8                                                                                │
  │ Passing:      4                                                                                │
  │ Failing:      4                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  4                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     caught_async_sync_test_spec.js                                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/caught_async_sync_test_spec.js/foo -- baz fails     (1280x720)
      (failed).png                                                                                  
  -  /XXX/XXX/XXX/cypress/screenshots/caught_async_sync_test_spec.js/foo -- bar fails     (1280x720)
      (failed).png                                                                                  
  -  /XXX/XXX/XXX/cypress/screenshots/caught_async_sync_test_spec.js/foo -- quux fail     (1280x720)
     s (failed).png                                                                                 
  -  /XXX/XXX/XXX/cypress/screenshots/caught_async_sync_test_spec.js/foo -- quux2 fai     (1280x720)
     ls (failed).png                                                                                


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/caught_async_sync_test_spec.js.     (X second)
                          mp4                                                                       


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  caught_async_sync_test_spec.js           XX:XX        8        4        4        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        8        4        4        -        -  


`
