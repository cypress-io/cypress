exports['e2e browserify, babel, es2015 passes 1'] = `
====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (browserify_babel_es2015_passing_spec.coffee)                              │
  │ Searched:   cypress/integration/browserify_babel_es2015_passing_spec.coffee                    │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: browserify_babel_es2015_passing_spec.coffee...                                  (1 of 1) 


  imports work
    ✓ foo coffee
    ✓ bar babel
    ✓ dom jsx


  3 passing


  (Results)

  ┌───────────────────────────────────────────────────────────┐
  │ Tests:        3                                           │
  │ Passing:      3                                           │
  │ Failing:      0                                           │
  │ Pending:      0                                           │
  │ Skipped:      0                                           │
  │ Screenshots:  0                                           │
  │ Video:        true                                        │
  │ Duration:     X seconds                                   │
  │ Spec Ran:     browserify_babel_es2015_passing_spec.coffee │
  └───────────────────────────────────────────────────────────┘


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔ browserify_babel_es2015_passing_spec…     XX:XX        3        3        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    All specs passed!                           XX:XX        3        3        -        -        -  

`

exports['e2e browserify, babel, es2015 fails 1'] = `
====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (browserify_babel_es2015_failing_spec.js)                                  │
  │ Searched:   cypress/integration/browserify_babel_es2015_failing_spec.js                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: browserify_babel_es2015_failing_spec.js...                                      (1 of 1) 

Oops...we found an error preparing this test file:

  /foo/bar/.projects/e2e/cypress/integration/browserify_babel_es2015_failing_spec.js

The error was:

SyntaxError: /foo/bar/.projects/e2e/lib/fail.js: Unexpected token, expected { (1:7)
> 1 | export defalt "foo"
    |        ^


This occurred while Cypress was compiling and bundling your test code. This is usually caused by:

- A missing file or dependency
- A syntax error in the file or one of its dependencies

Fix the error in your code and re-run your tests.

  (Results)

  ┌───────────────────────────────────────────────────────┐
  │ Tests:        0                                       │
  │ Passing:      0                                       │
  │ Failing:      1                                       │
  │ Pending:      0                                       │
  │ Skipped:      0                                       │
  │ Screenshots:  0                                       │
  │ Video:        true                                    │
  │ Duration:     X seconds                               │
  │ Spec Ran:     browserify_babel_es2015_failing_spec.js │
  └───────────────────────────────────────────────────────┘


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖ browserify_babel_es2015_failing_spec…     XX:XX        -        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    1 of 1 failed (100%)                        XX:XX        -        -        1        -        -  

`

