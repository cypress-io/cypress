exports['component testing projects with compilation errors executes all of the tests for vite2.8.6-react 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      4 found (App.cy.jsx, AppCompilationError.cy.jsx, MissingReact.cy.jsx, MissingReact │
  │             InSpec.cy.jsx)                                                                     │
  │ Searched:   **/*.cy.{js,jsx,ts,tsx}                                                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  App.cy.jsx                                                                      (1 of 4)


  ✓ renders hello world

  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     App.cy.jsx                                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/App.cy.jsx.mp4                      (X second)


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  AppCompilationError.cy.jsx                                                      (2 of 4)


  1) An uncaught error was detected outside of a test

  0 passing
  1 failing

  1) An uncaught error was detected outside of a test:
     TypeError: The following error originated from your test code, not from Cypress.

  > Failed to fetch dynamically imported module: http://localhost:3000/__cypress/src/src/AppCompilationError.cy.jsx

When Cypress detects uncaught errors originating from your test code it will automatically fail the current test.

Cypress could not associate this error to any specific test.

We dynamically generated a new test to display this failure.
  




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
  │ Spec Ran:     AppCompilationError.cy.jsx                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/AppCompilationError.cy.jsx/An uncaught error wa     (1280x720)
     s detected outside of a test (failed).png                                                      


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/AppCompilationError.cy.jsx.mp4      (X second)


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  MissingReact.cy.jsx                                                             (3 of 4)


  1) is missing React

  0 passing
  1 failing

  1) is missing React:
     ReferenceError: The following error originated from your test code, not from Cypress.

  > React is not defined

When Cypress detects uncaught errors originating from your test code it will automatically fail the current test.
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
  │ Spec Ran:     MissingReact.cy.jsx                                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/MissingReact.cy.jsx/is missing React (failed).p     (1280x720)
     ng                                                                                             


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/MissingReact.cy.jsx.mp4             (X second)


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  MissingReactInSpec.cy.jsx                                                       (4 of 4)


  1) is missing React in this file

  0 passing
  1 failing

  1) is missing React in this file:
     ReferenceError: React is not defined
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
  │ Spec Ran:     MissingReactInSpec.cy.jsx                                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/MissingReactInSpec.cy.jsx/is missing React in t     (1280x720)
     his file (failed).png                                                                          


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/MissingReactInSpec.cy.jsx.mp4       (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  App.cy.jsx                               XX:XX        1        1        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  AppCompilationError.cy.jsx               XX:XX        1        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  MissingReact.cy.jsx                      XX:XX        1        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  MissingReactInSpec.cy.jsx                XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  3 of 4 failed (75%)                      XX:XX        4        1        3        -        -  


`

exports['component testing projects with compilation errors executes all of the tests for vite2.9.1-react 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      4 found (App.cy.jsx, AppCompilationError.cy.jsx, MissingReact.cy.jsx, MissingReact │
  │             InSpec.cy.jsx)                                                                     │
  │ Searched:   **/*.cy.{js,jsx,ts,tsx}                                                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  App.cy.jsx                                                                      (1 of 4)


  ✓ renders hello world

  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     App.cy.jsx                                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/App.cy.jsx.mp4                      (X second)


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  AppCompilationError.cy.jsx                                                      (2 of 4)


  1) An uncaught error was detected outside of a test

  0 passing
  1 failing

  1) An uncaught error was detected outside of a test:
     TypeError: The following error originated from your test code, not from Cypress.

  > Failed to fetch dynamically imported module: http://localhost:3000/__cypress/src/src/AppCompilationError.cy.jsx

When Cypress detects uncaught errors originating from your test code it will automatically fail the current test.

Cypress could not associate this error to any specific test.

We dynamically generated a new test to display this failure.
  




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
  │ Spec Ran:     AppCompilationError.cy.jsx                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/AppCompilationError.cy.jsx/An uncaught error wa     (1280x720)
     s detected outside of a test (failed).png                                                      


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/AppCompilationError.cy.jsx.mp4      (X second)


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  MissingReact.cy.jsx                                                             (3 of 4)


  1) is missing React

  0 passing
  1 failing

  1) is missing React:
     ReferenceError: The following error originated from your test code, not from Cypress.

  > React is not defined

When Cypress detects uncaught errors originating from your test code it will automatically fail the current test.
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
  │ Spec Ran:     MissingReact.cy.jsx                                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/MissingReact.cy.jsx/is missing React (failed).p     (1280x720)
     ng                                                                                             


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/MissingReact.cy.jsx.mp4             (X second)


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  MissingReactInSpec.cy.jsx                                                       (4 of 4)


  1) is missing React in this file

  0 passing
  1 failing

  1) is missing React in this file:
     ReferenceError: React is not defined
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
  │ Spec Ran:     MissingReactInSpec.cy.jsx                                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/MissingReactInSpec.cy.jsx/is missing React in t     (1280x720)
     his file (failed).png                                                                          


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/MissingReactInSpec.cy.jsx.mp4       (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  App.cy.jsx                               XX:XX        1        1        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  AppCompilationError.cy.jsx               XX:XX        1        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  MissingReact.cy.jsx                      XX:XX        1        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  MissingReactInSpec.cy.jsx                XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  3 of 4 failed (75%)                      XX:XX        4        1        3        -        -  


`

exports['component testing projects with compilation errors executes all of the tests for webpack4_wds3-react 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      4 found (App.cy.jsx, AppCompilationError.cy.jsx, MissingReact.cy.jsx, MissingReact │
  │             InSpec.cy.jsx)                                                                     │
  │ Searched:   **/*.cy.{js,jsx,ts,tsx}                                                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  App.cy.jsx                                                                      (1 of 4)
   48 modules

ERROR in ./src/AppCompilationError.cy.jsx
Module build failed (from /private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/babel-loader/lib/index.js):
SyntaxError: /foo/bar/.projects/webpack4_wds3-react/src/AppCompilationError.cy.jsx: Unexpected token, expected "," (6:15)

  4 |
  5 | it('renders hello world', () => {
> 6 |   mount(<App />adf)
    |                ^
  7 |   cy.get('h1').contains('Hello World')
  8 | })
  9 |
      [stack trace lines]


  ✓ renders hello world

  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     App.cy.jsx                                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/App.cy.jsx.mp4                      (X second)


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  AppCompilationError.cy.jsx                                                      (2 of 4)


  1) An uncaught error was detected outside of a test

  0 passing
  1 failing

  1) An uncaught error was detected outside of a test:
     Error: The following error originated from your test code, not from Cypress.

  > Module build failed (from /private/tmp/cy-system-tests-node-modules/webpack4_wds3-react/node_modules/babel-loader/lib/index.js):
SyntaxError: /foo/bar/.projects/webpack4_wds3-react/src/AppCompilationError.cy.jsx: Unexpected token, expected "," (6:15)

  4 |
  5 | it('renders hello world', () => {
> 6 |   mount(<App />adf)
    |                ^
  7 |   cy.get('h1').contains('Hello World')
  8 | })
  9 |
      [stack trace lines]

When Cypress detects uncaught errors originating from your test code it will automatically fail the current test.

Cypress could not associate this error to any specific test.

We dynamically generated a new test to display this failure.
      at eval (webpack:///./src/AppCompilationError.cy.jsx?:1:7)
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
  │ Spec Ran:     AppCompilationError.cy.jsx                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/AppCompilationError.cy.jsx/An uncaught error wa     (1280x720)
     s detected outside of a test (failed).png                                                      


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/AppCompilationError.cy.jsx.mp4      (X second)


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  MissingReact.cy.jsx                                                             (3 of 4)


  1) is missing React

  0 passing
  1 failing

  1) is missing React:
     ReferenceError: The following error originated from your test code, not from Cypress.

  > React is not defined

When Cypress detects uncaught errors originating from your test code it will automatically fail the current test.
      at MissingReact (webpack:///./src/MissingReact.jsx?:4:3)
      at renderWithHooks (webpack:////Users/ryanm/pr-validations/cypress/node_modules/react-dom/cjs/react-dom.development.js?:12938:18)
      at mountIndeterminateComponent (webpack:////Users/ryanm/pr-validations/cypress/node_modules/react-dom/cjs/react-dom.development.js?:15020:13)
      at beginWork (webpack:////Users/ryanm/pr-validations/cypress/node_modules/react-dom/cjs/react-dom.development.js?:15625:16)
      at performUnitOfWork (webpack:////Users/ryanm/pr-validations/cypress/node_modules/react-dom/cjs/react-dom.development.js?:19312:12)
      at workLoop (webpack:////Users/ryanm/pr-validations/cypress/node_modules/react-dom/cjs/react-dom.development.js?:19352:24)
      at HTMLUnknownElement.callCallback (webpack:////Users/ryanm/pr-validations/cypress/node_modules/react-dom/cjs/react-dom.development.js?:149:14)
      at Object.invokeGuardedCallbackDev (webpack:////Users/ryanm/pr-validations/cypress/node_modules/react-dom/cjs/react-dom.development.js?:199:16)
      at invokeGuardedCallback (webpack:////Users/ryanm/pr-validations/cypress/node_modules/react-dom/cjs/react-dom.development.js?:256:31)
      at replayUnitOfWork (webpack:////Users/ryanm/pr-validations/cypress/node_modules/react-dom/cjs/react-dom.development.js?:18578:5)




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
  │ Spec Ran:     MissingReact.cy.jsx                                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/MissingReact.cy.jsx/is missing React (failed).p     (1280x720)
     ng                                                                                             


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/MissingReact.cy.jsx.mp4             (X second)


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  MissingReactInSpec.cy.jsx                                                       (4 of 4)


  1) is missing React in this file

  0 passing
  1 failing

  1) is missing React in this file:
     ReferenceError: React is not defined
      at Context.eval (webpack:///./src/MissingReactInSpec.cy.jsx?:8:77)
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
  │ Spec Ran:     MissingReactInSpec.cy.jsx                                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/MissingReactInSpec.cy.jsx/is missing React in t     (1280x720)
     his file (failed).png                                                                          


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/MissingReactInSpec.cy.jsx.mp4       (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  App.cy.jsx                               XX:XX        1        1        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  AppCompilationError.cy.jsx               XX:XX        1        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  MissingReact.cy.jsx                      XX:XX        1        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  MissingReactInSpec.cy.jsx                XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  3 of 4 failed (75%)                      XX:XX        4        1        3        -        -  


`

exports['component testing projects with compilation errors executes all of the tests for webpack4_wds4-react 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      4 found (App.cy.jsx, AppCompilationError.cy.jsx, MissingReact.cy.jsx, MissingReact │
  │             InSpec.cy.jsx)                                                                     │
  │ Searched:   **/*.cy.{js,jsx,ts,tsx}                                                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  App.cy.jsx                                                                      (1 of 4)
   48 modules

ERROR in ./src/AppCompilationError.cy.jsx
Module build failed (from /private/tmp/cy-system-tests-node-modules/webpack4_wds4-react/node_modules/babel-loader/lib/index.js):
SyntaxError: /foo/bar/.projects/webpack4_wds4-react/src/AppCompilationError.cy.jsx: Unexpected token, expected "," (6:15)

  4 |
  5 | it('renders hello world', () => {
> 6 |   mount(<App />adf)
    |                ^
  7 |   cy.get('h1').contains('Hello World')
  8 | })
  9 |
      [stack trace lines]


  ✓ renders hello world

  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     App.cy.jsx                                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/App.cy.jsx.mp4                      (X second)


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  AppCompilationError.cy.jsx                                                      (2 of 4)


  1) An uncaught error was detected outside of a test

  0 passing
  1 failing

  1) An uncaught error was detected outside of a test:
     Error: The following error originated from your test code, not from Cypress.

  > Module build failed (from /private/tmp/cy-system-tests-node-modules/webpack4_wds4-react/node_modules/babel-loader/lib/index.js):
SyntaxError: /foo/bar/.projects/webpack4_wds4-react/src/AppCompilationError.cy.jsx: Unexpected token, expected "," (6:15)

  4 |
  5 | it('renders hello world', () => {
> 6 |   mount(<App />adf)
    |                ^
  7 |   cy.get('h1').contains('Hello World')
  8 | })
  9 |
      [stack trace lines]

When Cypress detects uncaught errors originating from your test code it will automatically fail the current test.

Cypress could not associate this error to any specific test.

We dynamically generated a new test to display this failure.
      at eval (webpack:///./src/AppCompilationError.cy.jsx?:1:7)
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
  │ Spec Ran:     AppCompilationError.cy.jsx                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/AppCompilationError.cy.jsx/An uncaught error wa     (1280x720)
     s detected outside of a test (failed).png                                                      


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/AppCompilationError.cy.jsx.mp4      (X second)


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  MissingReact.cy.jsx                                                             (3 of 4)


  1) is missing React

  0 passing
  1 failing

  1) is missing React:
     ReferenceError: The following error originated from your test code, not from Cypress.

  > React is not defined

When Cypress detects uncaught errors originating from your test code it will automatically fail the current test.
      at MissingReact (webpack:///./src/MissingReact.jsx?:4:3)
      at renderWithHooks (webpack:////Users/ryanm/pr-validations/cypress/node_modules/react-dom/cjs/react-dom.development.js?:12938:18)
      at mountIndeterminateComponent (webpack:////Users/ryanm/pr-validations/cypress/node_modules/react-dom/cjs/react-dom.development.js?:15020:13)
      at beginWork (webpack:////Users/ryanm/pr-validations/cypress/node_modules/react-dom/cjs/react-dom.development.js?:15625:16)
      at performUnitOfWork (webpack:////Users/ryanm/pr-validations/cypress/node_modules/react-dom/cjs/react-dom.development.js?:19312:12)
      at workLoop (webpack:////Users/ryanm/pr-validations/cypress/node_modules/react-dom/cjs/react-dom.development.js?:19352:24)
      at HTMLUnknownElement.callCallback (webpack:////Users/ryanm/pr-validations/cypress/node_modules/react-dom/cjs/react-dom.development.js?:149:14)
      at Object.invokeGuardedCallbackDev (webpack:////Users/ryanm/pr-validations/cypress/node_modules/react-dom/cjs/react-dom.development.js?:199:16)
      at invokeGuardedCallback (webpack:////Users/ryanm/pr-validations/cypress/node_modules/react-dom/cjs/react-dom.development.js?:256:31)
      at replayUnitOfWork (webpack:////Users/ryanm/pr-validations/cypress/node_modules/react-dom/cjs/react-dom.development.js?:18578:5)




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
  │ Spec Ran:     MissingReact.cy.jsx                                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/MissingReact.cy.jsx/is missing React (failed).p     (1280x720)
     ng                                                                                             


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/MissingReact.cy.jsx.mp4             (X second)


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  MissingReactInSpec.cy.jsx                                                       (4 of 4)


  1) is missing React in this file

  0 passing
  1 failing

  1) is missing React in this file:
     ReferenceError: React is not defined
      at Context.eval (webpack:///./src/MissingReactInSpec.cy.jsx?:8:77)
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
  │ Spec Ran:     MissingReactInSpec.cy.jsx                                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/MissingReactInSpec.cy.jsx/is missing React in t     (1280x720)
     his file (failed).png                                                                          


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/MissingReactInSpec.cy.jsx.mp4       (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  App.cy.jsx                               XX:XX        1        1        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  AppCompilationError.cy.jsx               XX:XX        1        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  MissingReact.cy.jsx                      XX:XX        1        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  MissingReactInSpec.cy.jsx                XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  3 of 4 failed (75%)                      XX:XX        4        1        3        -        -  


`

exports['component testing projects with compilation errors executes all of the tests for webpack5_wds3-react 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      4 found (App.cy.jsx, AppCompilationError.cy.jsx, MissingReact.cy.jsx, MissingReact │
  │             InSpec.cy.jsx)                                                                     │
  │ Searched:   **/*.cy.{js,jsx,ts,tsx}                                                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  App.cy.jsx                                                                      (1 of 4)
   48 modules

ERROR in ./src/AppCompilationError.cy.jsx
Module build failed (from /private/tmp/cy-system-tests-node-modules/webpack5_wds3-react/node_modules/babel-loader/lib/index.js):
SyntaxError: /foo/bar/.projects/webpack5_wds3-react/src/AppCompilationError.cy.jsx: Unexpected token, expected "," (6:15)

  4 |
  5 | it('renders hello world', () => {
> 6 |   mount(<App />adf)
    |                ^
  7 |   cy.get('h1').contains('Hello World')
  8 | })
  9 |
      [stack trace lines]


  ✓ renders hello world

  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     App.cy.jsx                                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/App.cy.jsx.mp4                      (X second)


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  AppCompilationError.cy.jsx                                                      (2 of 4)


  1) An uncaught error was detected outside of a test

  0 passing
  1 failing

  1) An uncaught error was detected outside of a test:
     Error: The following error originated from your test code, not from Cypress.

  > Module build failed (from /private/tmp/cy-system-tests-node-modules/webpack5_wds3-react/node_modules/babel-loader/lib/index.js):
SyntaxError: /foo/bar/.projects/webpack5_wds3-react/src/AppCompilationError.cy.jsx: Unexpected token, expected "," (6:15)

  4 |
  5 | it('renders hello world', () => {
> 6 |   mount(<App />adf)
    |                ^
  7 |   cy.get('h1').contains('Hello World')
  8 | })
  9 |
      [stack trace lines]

When Cypress detects uncaught errors originating from your test code it will automatically fail the current test.

Cypress could not associate this error to any specific test.

We dynamically generated a new test to display this failure.
      at eval (webpack:///./src/AppCompilationError.cy.jsx?:1:7)
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
  │ Spec Ran:     AppCompilationError.cy.jsx                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/AppCompilationError.cy.jsx/An uncaught error wa     (1280x720)
     s detected outside of a test (failed).png                                                      


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/AppCompilationError.cy.jsx.mp4      (X second)


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  MissingReact.cy.jsx                                                             (3 of 4)


  1) is missing React

  0 passing
  1 failing

  1) is missing React:
     ReferenceError: The following error originated from your test code, not from Cypress.

  > React is not defined

When Cypress detects uncaught errors originating from your test code it will automatically fail the current test.
      at MissingReact (webpack:///./src/MissingReact.jsx?:4:3)
      at renderWithHooks (webpack:////Users/ryanm/pr-validations/cypress/node_modules/react-dom/cjs/react-dom.development.js?:12938:18)
      at mountIndeterminateComponent (webpack:////Users/ryanm/pr-validations/cypress/node_modules/react-dom/cjs/react-dom.development.js?:15020:13)
      at beginWork (webpack:////Users/ryanm/pr-validations/cypress/node_modules/react-dom/cjs/react-dom.development.js?:15625:16)
      at performUnitOfWork (webpack:////Users/ryanm/pr-validations/cypress/node_modules/react-dom/cjs/react-dom.development.js?:19312:12)
      at workLoop (webpack:////Users/ryanm/pr-validations/cypress/node_modules/react-dom/cjs/react-dom.development.js?:19352:24)
      at HTMLUnknownElement.callCallback (webpack:////Users/ryanm/pr-validations/cypress/node_modules/react-dom/cjs/react-dom.development.js?:149:14)
      at Object.invokeGuardedCallbackDev (webpack:////Users/ryanm/pr-validations/cypress/node_modules/react-dom/cjs/react-dom.development.js?:199:16)
      at invokeGuardedCallback (webpack:////Users/ryanm/pr-validations/cypress/node_modules/react-dom/cjs/react-dom.development.js?:256:31)
      at replayUnitOfWork (webpack:////Users/ryanm/pr-validations/cypress/node_modules/react-dom/cjs/react-dom.development.js?:18578:5)




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
  │ Spec Ran:     MissingReact.cy.jsx                                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/MissingReact.cy.jsx/is missing React (failed).p     (1280x720)
     ng                                                                                             


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/MissingReact.cy.jsx.mp4             (X second)


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  MissingReactInSpec.cy.jsx                                                       (4 of 4)


  1) is missing React in this file

  0 passing
  1 failing

  1) is missing React in this file:
     ReferenceError: React is not defined
      at Context.eval (webpack:///./src/MissingReactInSpec.cy.jsx?:8:77)
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
  │ Spec Ran:     MissingReactInSpec.cy.jsx                                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/MissingReactInSpec.cy.jsx/is missing React in t     (1280x720)
     his file (failed).png                                                                          


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/MissingReactInSpec.cy.jsx.mp4       (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  App.cy.jsx                               XX:XX        1        1        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  AppCompilationError.cy.jsx               XX:XX        1        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  MissingReact.cy.jsx                      XX:XX        1        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  MissingReactInSpec.cy.jsx                XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  3 of 4 failed (75%)                      XX:XX        4        1        3        -        -  


`

exports['component testing projects with compilation errors executes all of the tests for webpack5_wds4-react 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      4 found (App.cy.jsx, AppCompilationError.cy.jsx, MissingReact.cy.jsx, MissingReact │
  │             InSpec.cy.jsx)                                                                     │
  │ Searched:   **/*.cy.{js,jsx,ts,tsx}                                                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  App.cy.jsx                                                                      (1 of 4)
   48 modules

ERROR in ./src/AppCompilationError.cy.jsx
Module build failed (from /private/tmp/cy-system-tests-node-modules/webpack5_wds4-react/node_modules/babel-loader/lib/index.js):
SyntaxError: /foo/bar/.projects/webpack5_wds4-react/src/AppCompilationError.cy.jsx: Unexpected token, expected "," (6:15)

  4 |
  5 | it('renders hello world', () => {
> 6 |   mount(<App />adf)
    |                ^
  7 |   cy.get('h1').contains('Hello World')
  8 | })
  9 |
      [stack trace lines]


  ✓ renders hello world

  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     App.cy.jsx                                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/App.cy.jsx.mp4                      (X second)


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  AppCompilationError.cy.jsx                                                      (2 of 4)


  1) An uncaught error was detected outside of a test

  0 passing
  1 failing

  1) An uncaught error was detected outside of a test:
     Error: The following error originated from your test code, not from Cypress.

  > Module build failed (from /private/tmp/cy-system-tests-node-modules/webpack5_wds4-react/node_modules/babel-loader/lib/index.js):
SyntaxError: /foo/bar/.projects/webpack5_wds4-react/src/AppCompilationError.cy.jsx: Unexpected token, expected "," (6:15)

  4 |
  5 | it('renders hello world', () => {
> 6 |   mount(<App />adf)
    |                ^
  7 |   cy.get('h1').contains('Hello World')
  8 | })
  9 |
      [stack trace lines]

When Cypress detects uncaught errors originating from your test code it will automatically fail the current test.

Cypress could not associate this error to any specific test.

We dynamically generated a new test to display this failure.
      at eval (webpack:///./src/AppCompilationError.cy.jsx?:1:7)
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
  │ Spec Ran:     AppCompilationError.cy.jsx                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/AppCompilationError.cy.jsx/An uncaught error wa     (1280x720)
     s detected outside of a test (failed).png                                                      


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/AppCompilationError.cy.jsx.mp4      (X second)


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  MissingReact.cy.jsx                                                             (3 of 4)


  1) is missing React

  0 passing
  1 failing

  1) is missing React:
     ReferenceError: The following error originated from your test code, not from Cypress.

  > React is not defined

When Cypress detects uncaught errors originating from your test code it will automatically fail the current test.
      at MissingReact (webpack:///./src/MissingReact.jsx?:4:3)
      at renderWithHooks (webpack:////Users/ryanm/pr-validations/cypress/node_modules/react-dom/cjs/react-dom.development.js?:12938:18)
      at mountIndeterminateComponent (webpack:////Users/ryanm/pr-validations/cypress/node_modules/react-dom/cjs/react-dom.development.js?:15020:13)
      at beginWork (webpack:////Users/ryanm/pr-validations/cypress/node_modules/react-dom/cjs/react-dom.development.js?:15625:16)
      at performUnitOfWork (webpack:////Users/ryanm/pr-validations/cypress/node_modules/react-dom/cjs/react-dom.development.js?:19312:12)
      at workLoop (webpack:////Users/ryanm/pr-validations/cypress/node_modules/react-dom/cjs/react-dom.development.js?:19352:24)
      at HTMLUnknownElement.callCallback (webpack:////Users/ryanm/pr-validations/cypress/node_modules/react-dom/cjs/react-dom.development.js?:149:14)
      at Object.invokeGuardedCallbackDev (webpack:////Users/ryanm/pr-validations/cypress/node_modules/react-dom/cjs/react-dom.development.js?:199:16)
      at invokeGuardedCallback (webpack:////Users/ryanm/pr-validations/cypress/node_modules/react-dom/cjs/react-dom.development.js?:256:31)
      at replayUnitOfWork (webpack:////Users/ryanm/pr-validations/cypress/node_modules/react-dom/cjs/react-dom.development.js?:18578:5)




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
  │ Spec Ran:     MissingReact.cy.jsx                                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/MissingReact.cy.jsx/is missing React (failed).p     (1280x720)
     ng                                                                                             


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/MissingReact.cy.jsx.mp4             (X second)


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  MissingReactInSpec.cy.jsx                                                       (4 of 4)


  1) is missing React in this file

  0 passing
  1 failing

  1) is missing React in this file:
     ReferenceError: React is not defined
      at Context.eval (webpack:///./src/MissingReactInSpec.cy.jsx?:8:77)
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
  │ Spec Ran:     MissingReactInSpec.cy.jsx                                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/MissingReactInSpec.cy.jsx/is missing React in t     (1280x720)
     his file (failed).png                                                                          


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/MissingReactInSpec.cy.jsx.mp4       (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  App.cy.jsx                               XX:XX        1        1        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  AppCompilationError.cy.jsx               XX:XX        1        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  MissingReact.cy.jsx                      XX:XX        1        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  MissingReactInSpec.cy.jsx                XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  3 of 4 failed (75%)                      XX:XX        4        1        3        -        -  


`
