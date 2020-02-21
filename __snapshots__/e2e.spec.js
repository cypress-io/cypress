exports['can test test: cypress/tests/e2e/compile-error.js 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (e2e/compile-error.js)                                                     │
  │ Searched:   cypress/tests/e2e/compile-error.js                                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  e2e/compile-error.js                                                            (1 of 1)

Oops...we found an error preparing this test file:

  cypress/tests/e2e/compile-error.js

The error was:

Error: Webpack Compilation Error
./cypress/tests/e2e/compile-error.js
Module build failed (from ./node_modules/babel-loader/lib/index.js):
SyntaxError: /[cwd]/cypress/tests/e2e/compile-error.js: Unexpected token, expected "," (14:27)

  12 | 
  13 | describe('foo', ()=>{
> 14 |   it('has syntax error' () => {}})
     |                            ^
  15 | })
  16 | 

 @ multi ./cypress/tests/e2e/compile-error.js main[0]


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
  │ Spec Ran:     e2e/compile-error.js                                                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /[cwd]/cypress/videos/e2e/compile-error.js.mp4                  (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  e2e/compile-error.js                     XX:XX        -        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        -        -        1        -        -  


`
