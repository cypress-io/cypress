exports['e2e uncaught errors failing1 1'] = `
====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (uncaught_synchronous_before_tests_parsed.coffee)                          │
  │ Searched:   cypress/integration/uncaught_synchronous_before_tests_parsed.coffee                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: uncaught_synchronous_before_tests_parsed.coffee...                              (1 of 1) 


  1) An uncaught error was detected outside of a test

  0 passing
  1 failing

  1)  An uncaught error was detected outside of a test:
     Uncaught ReferenceError: foo is not defined

This error originated from your test code, not from Cypress.

When Cypress detects uncaught errors originating from your test code it will automatically fail the current test.

Cypress could not associate this error to any specific test.

We dynamically generated a new test to display this failure.
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line




  (Results)

  ┌───────────────────────────────────────────────────────────────┐
  │ Tests:        1                                               │
  │ Passing:      0                                               │
  │ Failing:      1                                               │
  │ Pending:      0                                               │
  │ Skipped:      0                                               │
  │ Screenshots:  1                                               │
  │ Video:        true                                            │
  │ Duration:     X seconds                                       │
  │ Spec Ran:     uncaught_synchronous_before_tests_parsed.coffee │
  └───────────────────────────────────────────────────────────────┘


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/An uncaught error was detected outside of a test.png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖ uncaught_synchronous_before_tests_par…       Xs        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    1 of 1 failed (100%)                           Xs        1        -        1        -        -  

`

exports['e2e uncaught errors failing2 1'] = `
====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (uncaught_synchronous_during_hook_spec.coffee)                             │
  │ Searched:   cypress/integration/uncaught_synchronous_during_hook_spec.coffee                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: uncaught_synchronous_during_hook_spec.coffee...                                 (1 of 1) 


  1) An uncaught error was detected outside of a test

  0 passing
  1 failing

  1)  An uncaught error was detected outside of a test:
     Uncaught ReferenceError: foo is not defined

This error originated from your test code, not from Cypress.

When Cypress detects uncaught errors originating from your test code it will automatically fail the current test.

Cypress could not associate this error to any specific test.

We dynamically generated a new test to display this failure.
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line




  (Results)

  ┌────────────────────────────────────────────────────────────┐
  │ Tests:        1                                            │
  │ Passing:      0                                            │
  │ Failing:      1                                            │
  │ Pending:      0                                            │
  │ Skipped:      0                                            │
  │ Screenshots:  1                                            │
  │ Video:        true                                         │
  │ Duration:     X seconds                                    │
  │ Spec Ran:     uncaught_synchronous_during_hook_spec.coffee │
  └────────────────────────────────────────────────────────────┘


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/An uncaught error was detected outside of a test.png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖ uncaught_synchronous_during_hook_spec…       Xs        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    1 of 1 failed (100%)                           Xs        1        -        1        -        -  

`

exports['e2e uncaught errors failing3 1'] = `
====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (uncaught_during_test_spec.coffee)                                         │
  │ Searched:   cypress/integration/uncaught_during_test_spec.coffee                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: uncaught_during_test_spec.coffee...                                             (1 of 1) 


  foo
    1) bar


  0 passing
  1 failing

  1) foo bar:
     Uncaught ReferenceError: foo is not defined

This error originated from your test code, not from Cypress.

When Cypress detects uncaught errors originating from your test code it will automatically fail the current test.
      at stack trace line




  (Results)

  ┌────────────────────────────────────────────────┐
  │ Tests:        1                                │
  │ Passing:      0                                │
  │ Failing:      1                                │
  │ Pending:      0                                │
  │ Skipped:      0                                │
  │ Screenshots:  1                                │
  │ Video:        true                             │
  │ Duration:     X seconds                        │
  │ Spec Ran:     uncaught_during_test_spec.coffee │
  └────────────────────────────────────────────────┘


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/foo -- bar.png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖ uncaught_during_test_spec.coffee             Xs        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    1 of 1 failed (100%)                           Xs        1        -        1        -        -  

`

exports['e2e uncaught errors failing4 1'] = `
====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (uncaught_during_hook_spec.coffee)                                         │
  │ Searched:   cypress/integration/uncaught_during_hook_spec.coffee                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: uncaught_during_hook_spec.coffee...                                             (1 of 1) 


  foo
    1) "before all" hook for "does not run"

  bar
    ✓ runs


  1 passing
  1 failing

  1) foo "before all" hook for "does not run":
     Uncaught ReferenceError: foo is not defined

This error originated from your test code, not from Cypress.

When Cypress detects uncaught errors originating from your test code it will automatically fail the current test.

Because this error occurred during a 'before all' hook we are skipping the remaining tests in the current suite: 'foo'
      at stack trace line




  (Results)

  ┌────────────────────────────────────────────────┐
  │ Tests:        2                                │
  │ Passing:      1                                │
  │ Failing:      1                                │
  │ Pending:      0                                │
  │ Skipped:      0                                │
  │ Screenshots:  1                                │
  │ Video:        true                             │
  │ Duration:     X seconds                        │
  │ Spec Ran:     uncaught_during_hook_spec.coffee │
  └────────────────────────────────────────────────┘


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/foo -- does not run -- before all hook.png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖ uncaught_during_hook_spec.coffee             Xs        2        1        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    1 of 1 failed (100%)                           Xs        2        1        1        -        -  

`

exports['e2e uncaught errors failing5 1'] = `
====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (caught_async_sync_test_spec.coffee)                                       │
  │ Searched:   cypress/integration/caught_async_sync_test_spec.coffee                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: caught_async_sync_test_spec.coffee...                                           (1 of 1) 


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

  1) foo baz fails:
     ReferenceError: foo is not defined
      at stack trace line

  2) foo bar fails:
     ReferenceError: foo is not defined
      at stack trace line

  3) foo quux fails:
     ReferenceError: foo is not defined
      at stack trace line

  4) foo quux2 fails:
     ReferenceError: foo is not defined
      at stack trace line




  (Results)

  ┌──────────────────────────────────────────────────┐
  │ Tests:        8                                  │
  │ Passing:      4                                  │
  │ Failing:      4                                  │
  │ Pending:      0                                  │
  │ Skipped:      0                                  │
  │ Screenshots:  4                                  │
  │ Video:        true                               │
  │ Duration:     X seconds                          │
  │ Spec Ran:     caught_async_sync_test_spec.coffee │
  └──────────────────────────────────────────────────┘


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/foo -- baz fails.png (1280x720)
  - /foo/bar/.projects/e2e/cypress/screenshots/foo -- bar fails.png (1280x720)
  - /foo/bar/.projects/e2e/cypress/screenshots/foo -- quux fails.png (1280x720)
  - /foo/bar/.projects/e2e/cypress/screenshots/foo -- quux2 fails.png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖ caught_async_sync_test_spec.coffee           Xs        8        4        4        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    1 of 1 failed (100%)                           Xs        8        4        4        -        -  

`

