exports['e2e busted support file passes 1'] = `
====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (app_spec.coffee)                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: app_spec.coffee...                                                              (1 of 1) 

Oops...we found an error preparing this test file:

  /foo/bar/.projects/busted-support-file/cypress/support/index.js

The error was:

Error: Cannot find module './does/not/exist' from '/foo/bar/.projects/busted-support-file/cypress/support'


This occurred while Cypress was compiling and bundling your test code. This is usually caused by:

- A missing file or dependency
- A syntax error in the file or one of its dependencies

Fix the error in your code and re-run your tests.

  (Results)

  ┌───────────────────────────────┐
  │ Tests:        0               │
  │ Passing:      0               │
  │ Failing:      1               │
  │ Pending:      0               │
  │ Skipped:      0               │
  │ Screenshots:  0               │
  │ Video:        true            │
  │ Duration:     X seconds       │
  │ Spec Ran:     app_spec.coffee │
  └───────────────────────────────┘


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/busted-support-file/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖ app_spec.coffee                           XX:XX        -        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    1 of 1 failed (100%)                        XX:XX        -        -        1        -        -  

`

