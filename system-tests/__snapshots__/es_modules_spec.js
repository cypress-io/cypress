exports['e2e es modules passes 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (es_modules_in_coffee_spec.coffee)                                         │
  │ Searched:   cypress/e2e/es_modules_in_coffee_spec.coffee                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  es_modules_in_coffee_spec.coffee                                                (1 of 1)


  imports work
    ✓ foo coffee
    ✓ bar babel
    ✓ dom jsx


  3 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        3                                                                                │
  │ Passing:      3                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     es_modules_in_coffee_spec.coffee                                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/es_modules_in_coffee_spec.coffee.mp4


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  es_modules_in_coffee_spec.coffee         XX:XX        3        3        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        3        3        -        -        -  


`

exports['e2e es modules fails 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (es_module_import_failing.cy.js)                                           │
  │ Searched:   cypress/e2e/es_module_import_failing.cy.js                                         │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  es_module_import_failing.cy.js                                                  (1 of 1)

Oops...we found an error preparing this test file:

  > cypress/e2e/es_module_import_failing.cy.js

The error was:

Error: Webpack Compilation Error
Module build failed (from [..]):
SyntaxError: /foo/bar/.projects/e2e/lib/fail.js: Unexpected token (2:0)

  1 | export default {
> 2 |
    | ^
      [stack trace lines]

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
  │ Spec Ran:     es_module_import_failing.cy.js                                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/es_module_import_failing.cy.js.mp4


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  es_module_import_failing.cy.js           XX:XX        -        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        -        -        1        -        -  


`
