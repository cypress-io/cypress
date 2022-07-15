exports['@cypress/webpack-dev-server react executes all of the tests for webpack4_wds3-react 1'] = `
ℹ ｢wds｣: Project is running at http://localhost:xxxx/webpack-dev-server/
ℹ ｢wds｣: webpack output is served from /__cypress/src
ℹ ｢wds｣: Content not from webpack is served from /foo/bar/.projects/webpack4_wds3-react

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
ℹ ｢wdm｣: Failed to compile.


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

  > Module build failed (from [..]):
SyntaxError: /foo/bar/.projects/webpack4_wds3-react/src/AppCompilationError.cy.jsx: Unexpected token, expected "," (9:0)

   7 |   cy.get('h1').contains('Hello World')
   8 | }
>  9 | })
     | ^
  10 |
      [stack trace lines]

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

exports['@cypress/webpack-dev-server react executes all of the tests for webpack4_wds4-react 1'] = `

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
Module build failed (from [..]):
SyntaxError: /foo/bar/.projects/webpack4_wds4-react/src/AppCompilationError.cy.jsx: Unexpected token, expected "," (9:0)

   7 |   cy.get('h1').contains('Hello World')
   8 | }
>  9 | })
     | ^
  10 |
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

  > Module build failed (from [..]):
SyntaxError: /foo/bar/.projects/webpack4_wds4-react/src/AppCompilationError.cy.jsx: Unexpected token, expected "," (9:0)

   7 |   cy.get('h1').contains('Hello World')
   8 | }
>  9 | })
     | ^
  10 |
      [stack trace lines]

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

exports['@cypress/webpack-dev-server react executes all of the tests for webpack5_wds3-react 1'] = `
ℹ ｢wds｣: Project is running at http://localhost:xxxx/webpack-dev-server/
ℹ ｢wds｣: webpack output is served from /__cypress/src
ℹ ｢wds｣: Content not from webpack is served from /foo/bar/.projects/webpack5_wds3-react

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
ℹ ｢wdm｣: Failed to compile.


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

  > Module build failed (from [..]):
SyntaxError: /foo/bar/.projects/webpack5_wds3-react/src/AppCompilationError.cy.jsx: Unexpected token, expected "," (9:0)

   7 |   cy.get('h1').contains('Hello World')
   8 | }
>  9 | })
     | ^
  10 |
      [stack trace lines]

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

exports['@cypress/webpack-dev-server react executes all of the tests for webpack5_wds4-react 1'] = `

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
10 assets
58 modules

ERROR in ./src/AppCompilationError.cy.jsx
Module build failed (from [..]):
SyntaxError: /foo/bar/.projects/webpack5_wds4-react/src/AppCompilationError.cy.jsx: Unexpected token, expected "," (9:0)

   7 |   cy.get('h1').contains('Hello World')
   8 | }
>  9 | })
     | ^
  10 |
      [stack trace lines]

webpack x.x.x compiled with x errors in xxx ms


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

  > Module build failed (from [..]):
SyntaxError: /foo/bar/.projects/webpack5_wds4-react/src/AppCompilationError.cy.jsx: Unexpected token, expected "," (9:0)

   7 |   cy.get('h1').contains('Hello World')
   8 | }
>  9 | })
     | ^
  10 |
      [stack trace lines]

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
