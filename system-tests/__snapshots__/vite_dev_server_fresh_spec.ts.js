exports['@cypress/vite-dev-server react executes all of the tests for vite4.0.4-react 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      9 found (App.cy.jsx, AppCompilationError.cy.jsx, Errors.cy.jsx, MissingReact.cy.js │
  │             x, MissingReactInSpec.cy.jsx, Rerendering.cy.jsx, Unmount.cy.jsx, mount.cy.jsx, po │
  │             rt.cy.jsx)                                                                         │
  │ Searched:   **/*.cy.{js,jsx,ts,tsx}                                                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  App.cy.jsx                                                                      (1 of 9)


  ✓ renders hello world
  ✓ renders background

  2 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      2                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     App.cy.jsx                                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  AppCompilationError.cy.jsx                                                      (2 of 9)


  1) An uncaught error was detected outside of a test

  0 passing
  1 failing

  1) An uncaught error was detected outside of a test:
     TypeError: The following error originated from your test code, not from Cypress.

  > Failed to fetch dynamically imported module: http://localhost:8888/__cypress/src/@fs/foo/bar/.projects/vite4.0.4-react/src/AppCompilationError.cy.jsx

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
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     AppCompilationError.cy.jsx                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/AppCompilationError.cy.jsx/An uncaught error wa     (1280x581)
     s detected outside of a test (failed).png                                                      


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  Errors.cy.jsx                                                                   (3 of 9)


  Errors
    1) error on mount
    2) sync error
    3) async error
    4) command failure


  0 passing
  4 failing

  1) Errors
       error on mount:
     Error: The following error originated from your application code, not from Cypress.

  > mount error

When Cypress detects uncaught errors originating from your application it will automatically fail the current test.

This behavior is configurable, and you can choose to turn this off by listening to the \`uncaught:exception\` event.

https://on.cypress.io/uncaught-exception-from-application
      [stack trace lines]

  2) Errors
       sync error:
     Error: The following error originated from your application code, not from Cypress.

  > sync error

When Cypress detects uncaught errors originating from your application it will automatically fail the current test.

This behavior is configurable, and you can choose to turn this off by listening to the \`uncaught:exception\` event.

https://on.cypress.io/uncaught-exception-from-application
      [stack trace lines]

  3) Errors
       async error:
     Error: The following error originated from your application code, not from Cypress.

  > async error

When Cypress detects uncaught errors originating from your application it will automatically fail the current test.

This behavior is configurable, and you can choose to turn this off by listening to the \`uncaught:exception\` event.

https://on.cypress.io/uncaught-exception-from-application
      [stack trace lines]

  4) Errors
       command failure:
     AssertionError: Timed out retrying after 50ms: Expected to find element: \`element-that-does-not-exist\`, but never found it.
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        4                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      4                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  4                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     Errors.cy.jsx                                                                    │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/Errors.cy.jsx/Errors -- error on mount (failed)     (1280x581)
     .png                                                                                           
  -  /XXX/XXX/XXX/cypress/screenshots/Errors.cy.jsx/Errors -- sync error (failed).png     (1280x581)
  -  /XXX/XXX/XXX/cypress/screenshots/Errors.cy.jsx/Errors -- async error (failed).pn     (1280x581)
     g                                                                                              
  -  /XXX/XXX/XXX/cypress/screenshots/Errors.cy.jsx/Errors -- command failure (failed     (1280x581)
     ).png                                                                                          


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  MissingReact.cy.jsx                                                             (4 of 9)


  1) is missing React

  0 passing
  1 failing

  1) is missing React:
     ReferenceError: The following error originated from your application code, not from Cypress.

  > React is not defined

When Cypress detects uncaught errors originating from your application it will automatically fail the current test.

This behavior is configurable, and you can choose to turn this off by listening to the \`uncaught:exception\` event.

https://on.cypress.io/uncaught-exception-from-application
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     MissingReact.cy.jsx                                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/MissingReact.cy.jsx/is missing React (failed).p     (1280x581)
     ng                                                                                             


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  MissingReactInSpec.cy.jsx                                                       (5 of 9)


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
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     MissingReactInSpec.cy.jsx                                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/MissingReactInSpec.cy.jsx/is missing React in t     (1280x581)
     his file (failed).png                                                                          


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  Rerendering.cy.jsx                                                              (6 of 9)


  re-render
    ✓ maintains component state across re-renders


  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     Rerendering.cy.jsx                                                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  Unmount.cy.jsx                                                                  (7 of 9)


  Comp with componentWillUnmount
    ✓ calls the prop

  mount cleanup
    ✓ mount 1
    ✓ mount 2


  3 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        3                                                                                │
  │ Passing:      3                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     Unmount.cy.jsx                                                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  mount.cy.jsx                                                                    (8 of 9)


  mount
    ✓ does not error when rendering primitives
    teardown
      ✓ should mount
      ✓ should remove previous mounted component


  3 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        3                                                                                │
  │ Passing:      3                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     mount.cy.jsx                                                                     │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  port.cy.jsx                                                                     (9 of 9)


  ✓ ensures we have launched at the overridden port

  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     port.cy.jsx                                                                      │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  App.cy.jsx                               XX:XX        2        2        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  AppCompilationError.cy.jsx               XX:XX        1        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  Errors.cy.jsx                            XX:XX        4        -        4        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  MissingReact.cy.jsx                      XX:XX        1        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  MissingReactInSpec.cy.jsx                XX:XX        1        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  Rerendering.cy.jsx                       XX:XX        1        1        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  Unmount.cy.jsx                           XX:XX        3        3        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  mount.cy.jsx                             XX:XX        3        3        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  port.cy.jsx                              XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  4 of 9 failed (44%)                      XX:XX       17       10        7        -        -  


`

exports['@cypress/vite-dev-server react executes all of the tests for vite2.8.6-react 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      9 found (App.cy.jsx, AppCompilationError.cy.jsx, Errors.cy.jsx, MissingReact.cy.js │
  │             x, MissingReactInSpec.cy.jsx, Rerendering.cy.jsx, Unmount.cy.jsx, mount.cy.jsx, po │
  │             rt.cy.jsx)                                                                         │
  │ Searched:   **/*.cy.{js,jsx,ts,tsx}                                                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  App.cy.jsx                                                                      (1 of 9)


  ✓ renders hello world
  ✓ renders background

  2 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      2                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     App.cy.jsx                                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  AppCompilationError.cy.jsx                                                      (2 of 9)


  1) An uncaught error was detected outside of a test

  0 passing
  1 failing

  1) An uncaught error was detected outside of a test:
     TypeError: The following error originated from your test code, not from Cypress.

  > Failed to fetch dynamically imported module: http://localhost:8888/__cypress/src/@fs/foo/bar/.projects/vite2.8.6-react/src/AppCompilationError.cy.jsx

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
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     AppCompilationError.cy.jsx                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/AppCompilationError.cy.jsx/An uncaught error wa     (1280x581)
     s detected outside of a test (failed).png                                                      


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  Errors.cy.jsx                                                                   (3 of 9)


  Errors
    1) error on mount
    2) sync error
    3) async error
    4) command failure


  0 passing
  4 failing

  1) Errors
       error on mount:
     Error: The following error originated from your application code, not from Cypress.

  > mount error

When Cypress detects uncaught errors originating from your application it will automatically fail the current test.

This behavior is configurable, and you can choose to turn this off by listening to the \`uncaught:exception\` event.

https://on.cypress.io/uncaught-exception-from-application
      [stack trace lines]

  2) Errors
       sync error:
     Error: The following error originated from your application code, not from Cypress.

  > sync error

When Cypress detects uncaught errors originating from your application it will automatically fail the current test.

This behavior is configurable, and you can choose to turn this off by listening to the \`uncaught:exception\` event.

https://on.cypress.io/uncaught-exception-from-application
      [stack trace lines]

  3) Errors
       async error:
     Error: The following error originated from your application code, not from Cypress.

  > async error

When Cypress detects uncaught errors originating from your application it will automatically fail the current test.

This behavior is configurable, and you can choose to turn this off by listening to the \`uncaught:exception\` event.

https://on.cypress.io/uncaught-exception-from-application
      [stack trace lines]

  4) Errors
       command failure:
     AssertionError: Timed out retrying after 50ms: Expected to find element: \`element-that-does-not-exist\`, but never found it.
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        4                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      4                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  4                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     Errors.cy.jsx                                                                    │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/Errors.cy.jsx/Errors -- error on mount (failed)     (1280x581)
     .png                                                                                           
  -  /XXX/XXX/XXX/cypress/screenshots/Errors.cy.jsx/Errors -- sync error (failed).png     (1280x581)
  -  /XXX/XXX/XXX/cypress/screenshots/Errors.cy.jsx/Errors -- async error (failed).pn     (1280x581)
     g                                                                                              
  -  /XXX/XXX/XXX/cypress/screenshots/Errors.cy.jsx/Errors -- command failure (failed     (1280x581)
     ).png                                                                                          


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  MissingReact.cy.jsx                                                             (4 of 9)


  1) is missing React

  0 passing
  1 failing

  1) is missing React:
     ReferenceError: The following error originated from your application code, not from Cypress.

  > React is not defined

When Cypress detects uncaught errors originating from your application it will automatically fail the current test.

This behavior is configurable, and you can choose to turn this off by listening to the \`uncaught:exception\` event.

https://on.cypress.io/uncaught-exception-from-application
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     MissingReact.cy.jsx                                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/MissingReact.cy.jsx/is missing React (failed).p     (1280x581)
     ng                                                                                             


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  MissingReactInSpec.cy.jsx                                                       (5 of 9)


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
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     MissingReactInSpec.cy.jsx                                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/MissingReactInSpec.cy.jsx/is missing React in t     (1280x581)
     his file (failed).png                                                                          


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  Rerendering.cy.jsx                                                              (6 of 9)


  re-render
    ✓ maintains component state across re-renders


  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     Rerendering.cy.jsx                                                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  Unmount.cy.jsx                                                                  (7 of 9)


  Comp with componentWillUnmount
    ✓ calls the prop

  mount cleanup
    ✓ mount 1
    ✓ mount 2


  3 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        3                                                                                │
  │ Passing:      3                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     Unmount.cy.jsx                                                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  mount.cy.jsx                                                                    (8 of 9)


  mount
    ✓ does not error when rendering primitives
    teardown
      ✓ should mount
      ✓ should remove previous mounted component


  3 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        3                                                                                │
  │ Passing:      3                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     mount.cy.jsx                                                                     │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  port.cy.jsx                                                                     (9 of 9)


  ✓ ensures we have launched at the overridden port

  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     port.cy.jsx                                                                      │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  App.cy.jsx                               XX:XX        2        2        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  AppCompilationError.cy.jsx               XX:XX        1        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  Errors.cy.jsx                            XX:XX        4        -        4        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  MissingReact.cy.jsx                      XX:XX        1        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  MissingReactInSpec.cy.jsx                XX:XX        1        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  Rerendering.cy.jsx                       XX:XX        1        1        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  Unmount.cy.jsx                           XX:XX        3        3        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  mount.cy.jsx                             XX:XX        3        3        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  port.cy.jsx                              XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  4 of 9 failed (44%)                      XX:XX       17       10        7        -        -  


`

exports['@cypress/vite-dev-server react executes all of the tests for vite2.9.1-react 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      9 found (App.cy.jsx, AppCompilationError.cy.jsx, Errors.cy.jsx, MissingReact.cy.js │
  │             x, MissingReactInSpec.cy.jsx, Rerendering.cy.jsx, Unmount.cy.jsx, mount.cy.jsx, po │
  │             rt.cy.jsx)                                                                         │
  │ Searched:   **/*.cy.{js,jsx,ts,tsx}                                                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  App.cy.jsx                                                                      (1 of 9)


  ✓ renders hello world
  ✓ renders background

  2 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      2                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     App.cy.jsx                                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  AppCompilationError.cy.jsx                                                      (2 of 9)


  1) An uncaught error was detected outside of a test

  0 passing
  1 failing

  1) An uncaught error was detected outside of a test:
     TypeError: The following error originated from your test code, not from Cypress.

  > Failed to fetch dynamically imported module: http://localhost:8888/__cypress/src/@fs/foo/bar/.projects/vite2.9.1-react/src/AppCompilationError.cy.jsx

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
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     AppCompilationError.cy.jsx                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/AppCompilationError.cy.jsx/An uncaught error wa     (1280x581)
     s detected outside of a test (failed).png                                                      


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  Errors.cy.jsx                                                                   (3 of 9)


  Errors
    1) error on mount
    2) sync error
    3) async error
    4) command failure


  0 passing
  4 failing

  1) Errors
       error on mount:
     Error: The following error originated from your application code, not from Cypress.

  > mount error

When Cypress detects uncaught errors originating from your application it will automatically fail the current test.

This behavior is configurable, and you can choose to turn this off by listening to the \`uncaught:exception\` event.

https://on.cypress.io/uncaught-exception-from-application
      [stack trace lines]

  2) Errors
       sync error:
     Error: The following error originated from your application code, not from Cypress.

  > sync error

When Cypress detects uncaught errors originating from your application it will automatically fail the current test.

This behavior is configurable, and you can choose to turn this off by listening to the \`uncaught:exception\` event.

https://on.cypress.io/uncaught-exception-from-application
      [stack trace lines]

  3) Errors
       async error:
     Error: The following error originated from your application code, not from Cypress.

  > async error

When Cypress detects uncaught errors originating from your application it will automatically fail the current test.

This behavior is configurable, and you can choose to turn this off by listening to the \`uncaught:exception\` event.

https://on.cypress.io/uncaught-exception-from-application
      [stack trace lines]

  4) Errors
       command failure:
     AssertionError: Timed out retrying after 50ms: Expected to find element: \`element-that-does-not-exist\`, but never found it.
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        4                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      4                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  4                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     Errors.cy.jsx                                                                    │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/Errors.cy.jsx/Errors -- error on mount (failed)     (1280x581)
     .png                                                                                           
  -  /XXX/XXX/XXX/cypress/screenshots/Errors.cy.jsx/Errors -- sync error (failed).png     (1280x581)
  -  /XXX/XXX/XXX/cypress/screenshots/Errors.cy.jsx/Errors -- async error (failed).pn     (1280x581)
     g                                                                                              
  -  /XXX/XXX/XXX/cypress/screenshots/Errors.cy.jsx/Errors -- command failure (failed     (1280x581)
     ).png                                                                                          


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  MissingReact.cy.jsx                                                             (4 of 9)


  1) is missing React

  0 passing
  1 failing

  1) is missing React:
     ReferenceError: The following error originated from your application code, not from Cypress.

  > React is not defined

When Cypress detects uncaught errors originating from your application it will automatically fail the current test.

This behavior is configurable, and you can choose to turn this off by listening to the \`uncaught:exception\` event.

https://on.cypress.io/uncaught-exception-from-application
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     MissingReact.cy.jsx                                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/MissingReact.cy.jsx/is missing React (failed).p     (1280x581)
     ng                                                                                             


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  MissingReactInSpec.cy.jsx                                                       (5 of 9)


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
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     MissingReactInSpec.cy.jsx                                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/MissingReactInSpec.cy.jsx/is missing React in t     (1280x581)
     his file (failed).png                                                                          


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  Rerendering.cy.jsx                                                              (6 of 9)


  re-render
    ✓ maintains component state across re-renders


  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     Rerendering.cy.jsx                                                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  Unmount.cy.jsx                                                                  (7 of 9)


  Comp with componentWillUnmount
    ✓ calls the prop

  mount cleanup
    ✓ mount 1
    ✓ mount 2


  3 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        3                                                                                │
  │ Passing:      3                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     Unmount.cy.jsx                                                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  mount.cy.jsx                                                                    (8 of 9)


  mount
    ✓ does not error when rendering primitives
    teardown
      ✓ should mount
      ✓ should remove previous mounted component


  3 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        3                                                                                │
  │ Passing:      3                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     mount.cy.jsx                                                                     │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  port.cy.jsx                                                                     (9 of 9)


  ✓ ensures we have launched at the overridden port

  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     port.cy.jsx                                                                      │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  App.cy.jsx                               XX:XX        2        2        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  AppCompilationError.cy.jsx               XX:XX        1        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  Errors.cy.jsx                            XX:XX        4        -        4        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  MissingReact.cy.jsx                      XX:XX        1        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  MissingReactInSpec.cy.jsx                XX:XX        1        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  Rerendering.cy.jsx                       XX:XX        1        1        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  Unmount.cy.jsx                           XX:XX        3        3        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  mount.cy.jsx                             XX:XX        3        3        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  port.cy.jsx                              XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  4 of 9 failed (44%)                      XX:XX       17       10        7        -        -  


`

exports['@cypress/vite-dev-server react executes all of the tests for vite3.0.2-react 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      9 found (App.cy.jsx, AppCompilationError.cy.jsx, Errors.cy.jsx, MissingReact.cy.js │
  │             x, MissingReactInSpec.cy.jsx, Rerendering.cy.jsx, Unmount.cy.jsx, mount.cy.jsx, po │
  │             rt.cy.jsx)                                                                         │
  │ Searched:   **/*.cy.{js,jsx,ts,tsx}                                                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  App.cy.jsx                                                                      (1 of 9)


  ✓ renders hello world
  ✓ renders background

  2 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      2                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     App.cy.jsx                                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  AppCompilationError.cy.jsx                                                      (2 of 9)


  1) An uncaught error was detected outside of a test

  0 passing
  1 failing

  1) An uncaught error was detected outside of a test:
     TypeError: The following error originated from your test code, not from Cypress.

  > Failed to fetch dynamically imported module: http://localhost:8888/__cypress/src/@fs/foo/bar/.projects/vite3.0.2-react/src/AppCompilationError.cy.jsx

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
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     AppCompilationError.cy.jsx                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/AppCompilationError.cy.jsx/An uncaught error wa     (1280x581)
     s detected outside of a test (failed).png                                                      


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  Errors.cy.jsx                                                                   (3 of 9)


  Errors
    1) error on mount
    2) sync error
    3) async error
    4) command failure


  0 passing
  4 failing

  1) Errors
       error on mount:
     Error: The following error originated from your application code, not from Cypress.

  > mount error

When Cypress detects uncaught errors originating from your application it will automatically fail the current test.

This behavior is configurable, and you can choose to turn this off by listening to the \`uncaught:exception\` event.

https://on.cypress.io/uncaught-exception-from-application
      [stack trace lines]

  2) Errors
       sync error:
     Error: The following error originated from your application code, not from Cypress.

  > sync error

When Cypress detects uncaught errors originating from your application it will automatically fail the current test.

This behavior is configurable, and you can choose to turn this off by listening to the \`uncaught:exception\` event.

https://on.cypress.io/uncaught-exception-from-application
      [stack trace lines]

  3) Errors
       async error:
     Error: The following error originated from your application code, not from Cypress.

  > async error

When Cypress detects uncaught errors originating from your application it will automatically fail the current test.

This behavior is configurable, and you can choose to turn this off by listening to the \`uncaught:exception\` event.

https://on.cypress.io/uncaught-exception-from-application
      [stack trace lines]

  4) Errors
       command failure:
     AssertionError: Timed out retrying after 50ms: Expected to find element: \`element-that-does-not-exist\`, but never found it.
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        4                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      4                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  4                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     Errors.cy.jsx                                                                    │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/Errors.cy.jsx/Errors -- error on mount (failed)     (1280x581)
     .png                                                                                           
  -  /XXX/XXX/XXX/cypress/screenshots/Errors.cy.jsx/Errors -- sync error (failed).png     (1280x581)
  -  /XXX/XXX/XXX/cypress/screenshots/Errors.cy.jsx/Errors -- async error (failed).pn     (1280x581)
     g                                                                                              
  -  /XXX/XXX/XXX/cypress/screenshots/Errors.cy.jsx/Errors -- command failure (failed     (1280x581)
     ).png                                                                                          


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  MissingReact.cy.jsx                                                             (4 of 9)


  1) is missing React

  0 passing
  1 failing

  1) is missing React:
     ReferenceError: The following error originated from your application code, not from Cypress.

  > React is not defined

When Cypress detects uncaught errors originating from your application it will automatically fail the current test.

This behavior is configurable, and you can choose to turn this off by listening to the \`uncaught:exception\` event.

https://on.cypress.io/uncaught-exception-from-application
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     MissingReact.cy.jsx                                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/MissingReact.cy.jsx/is missing React (failed).p     (1280x581)
     ng                                                                                             


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  MissingReactInSpec.cy.jsx                                                       (5 of 9)


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
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     MissingReactInSpec.cy.jsx                                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/MissingReactInSpec.cy.jsx/is missing React in t     (1280x581)
     his file (failed).png                                                                          


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  Rerendering.cy.jsx                                                              (6 of 9)


  re-render
    ✓ maintains component state across re-renders


  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     Rerendering.cy.jsx                                                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  Unmount.cy.jsx                                                                  (7 of 9)


  Comp with componentWillUnmount
    ✓ calls the prop

  mount cleanup
    ✓ mount 1
    ✓ mount 2


  3 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        3                                                                                │
  │ Passing:      3                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     Unmount.cy.jsx                                                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  mount.cy.jsx                                                                    (8 of 9)


  mount
    ✓ does not error when rendering primitives
    teardown
      ✓ should mount
      ✓ should remove previous mounted component


  3 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        3                                                                                │
  │ Passing:      3                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     mount.cy.jsx                                                                     │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  port.cy.jsx                                                                     (9 of 9)


  ✓ ensures we have launched at the overridden port

  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     port.cy.jsx                                                                      │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  App.cy.jsx                               XX:XX        2        2        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  AppCompilationError.cy.jsx               XX:XX        1        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  Errors.cy.jsx                            XX:XX        4        -        4        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  MissingReact.cy.jsx                      XX:XX        1        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  MissingReactInSpec.cy.jsx                XX:XX        1        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  Rerendering.cy.jsx                       XX:XX        1        1        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  Unmount.cy.jsx                           XX:XX        3        3        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  mount.cy.jsx                             XX:XX        3        3        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  port.cy.jsx                              XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  4 of 9 failed (44%)                      XX:XX       17       10        7        -        -  


`

exports['@cypress/vite-dev-server / react / executes all of the tests for vite2.8.6-react when port is statically configured'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (port.cy.jsx)                                                              │
  │ Searched:   src/port.cy.jsx                                                                    │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  port.cy.jsx                                                                     (1 of 1)


  ✓ ensures we have launched at the overridden port

  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     port.cy.jsx                                                                      │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  port.cy.jsx                              XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


`

exports['@cypress/vite-dev-server / react / executes all of the tests for vite2.9.1-react when port is statically configured'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (port.cy.jsx)                                                              │
  │ Searched:   src/port.cy.jsx                                                                    │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  port.cy.jsx                                                                     (1 of 1)


  ✓ ensures we have launched at the overridden port

  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     port.cy.jsx                                                                      │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  port.cy.jsx                              XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


`

exports['@cypress/vite-dev-server / react / executes all of the tests for vite3.0.2-react when port is statically configured'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (port.cy.jsx)                                                              │
  │ Searched:   src/port.cy.jsx                                                                    │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  port.cy.jsx                                                                     (1 of 1)


  ✓ ensures we have launched at the overridden port

  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     port.cy.jsx                                                                      │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  port.cy.jsx                              XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


`

exports['@cypress/vite-dev-server / react / executes all of the tests for vite4.0.4-react when port is statically configured'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (port.cy.jsx)                                                              │
  │ Searched:   src/port.cy.jsx                                                                    │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  port.cy.jsx                                                                     (1 of 1)


  ✓ ensures we have launched at the overridden port

  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     port.cy.jsx                                                                      │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  port.cy.jsx                              XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


`

exports['@cypress/vite-dev-server react executes all of the tests for vite5.2.8-react 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      9 found (App.cy.jsx, AppCompilationError.cy.jsx, Errors.cy.jsx, MissingReact.cy.js │
  │             x, MissingReactInSpec.cy.jsx, Rerendering.cy.jsx, Unmount.cy.jsx, mount.cy.jsx, po │
  │             rt.cy.jsx)                                                                         │
  │ Searched:   **/*.cy.{js,jsx,ts,tsx}                                                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  App.cy.jsx                                                                      (1 of 9)


  ✓ renders hello world
  ✓ renders background

  2 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      2                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     App.cy.jsx                                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  AppCompilationError.cy.jsx                                                      (2 of 9)


  1) An uncaught error was detected outside of a test

  0 passing
  1 failing

  1) An uncaught error was detected outside of a test:
     TypeError: The following error originated from your test code, not from Cypress.

  > Failed to fetch dynamically imported module: http://localhost:8888/__cypress/src/@fs/foo/bar/.projects/vite5.2.8-react/src/AppCompilationError.cy.jsx

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
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     AppCompilationError.cy.jsx                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/AppCompilationError.cy.jsx/An uncaught error wa     (1280x581)
     s detected outside of a test (failed).png                                                      


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  Errors.cy.jsx                                                                   (3 of 9)


  Errors
    1) error on mount
    2) sync error
    3) async error
    4) command failure


  0 passing
  4 failing

  1) Errors
       error on mount:
     Error: The following error originated from your application code, not from Cypress.

  > mount error

When Cypress detects uncaught errors originating from your application it will automatically fail the current test.

This behavior is configurable, and you can choose to turn this off by listening to the \`uncaught:exception\` event.

https://on.cypress.io/uncaught-exception-from-application
      [stack trace lines]

  2) Errors
       sync error:
     Error: The following error originated from your application code, not from Cypress.

  > sync error

When Cypress detects uncaught errors originating from your application it will automatically fail the current test.

This behavior is configurable, and you can choose to turn this off by listening to the \`uncaught:exception\` event.

https://on.cypress.io/uncaught-exception-from-application
      [stack trace lines]

  3) Errors
       async error:
     Error: The following error originated from your application code, not from Cypress.

  > async error

When Cypress detects uncaught errors originating from your application it will automatically fail the current test.

This behavior is configurable, and you can choose to turn this off by listening to the \`uncaught:exception\` event.

https://on.cypress.io/uncaught-exception-from-application
      [stack trace lines]

  4) Errors
       command failure:
     AssertionError: Timed out retrying after 50ms: Expected to find element: \`element-that-does-not-exist\`, but never found it.
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        4                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      4                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  4                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     Errors.cy.jsx                                                                    │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/Errors.cy.jsx/Errors -- error on mount (failed)     (1280x581)
     .png                                                                                           
  -  /XXX/XXX/XXX/cypress/screenshots/Errors.cy.jsx/Errors -- sync error (failed).png     (1280x581)
  -  /XXX/XXX/XXX/cypress/screenshots/Errors.cy.jsx/Errors -- async error (failed).pn     (1280x581)
     g                                                                                              
  -  /XXX/XXX/XXX/cypress/screenshots/Errors.cy.jsx/Errors -- command failure (failed     (1280x581)
     ).png                                                                                          


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  MissingReact.cy.jsx                                                             (4 of 9)


  1) is missing React

  0 passing
  1 failing

  1) is missing React:
     ReferenceError: The following error originated from your application code, not from Cypress.

  > React is not defined

When Cypress detects uncaught errors originating from your application it will automatically fail the current test.

This behavior is configurable, and you can choose to turn this off by listening to the \`uncaught:exception\` event.

https://on.cypress.io/uncaught-exception-from-application
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     MissingReact.cy.jsx                                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/MissingReact.cy.jsx/is missing React (failed).p     (1280x581)
     ng                                                                                             


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  MissingReactInSpec.cy.jsx                                                       (5 of 9)


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
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     MissingReactInSpec.cy.jsx                                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/MissingReactInSpec.cy.jsx/is missing React in t     (1280x581)
     his file (failed).png                                                                          


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  Rerendering.cy.jsx                                                              (6 of 9)


  re-render
    ✓ maintains component state across re-renders


  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     Rerendering.cy.jsx                                                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  Unmount.cy.jsx                                                                  (7 of 9)


  Comp with componentWillUnmount
    ✓ calls the prop

  mount cleanup
    ✓ mount 1
    ✓ mount 2


  3 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        3                                                                                │
  │ Passing:      3                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     Unmount.cy.jsx                                                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  mount.cy.jsx                                                                    (8 of 9)


  mount
    ✓ does not error when rendering primitives
    teardown
      ✓ should mount
      ✓ should remove previous mounted component


  3 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        3                                                                                │
  │ Passing:      3                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     mount.cy.jsx                                                                     │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  port.cy.jsx                                                                     (9 of 9)


  ✓ ensures we have launched at the overridden port

  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     port.cy.jsx                                                                      │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  App.cy.jsx                               XX:XX        2        2        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  AppCompilationError.cy.jsx               XX:XX        1        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  Errors.cy.jsx                            XX:XX        4        -        4        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  MissingReact.cy.jsx                      XX:XX        1        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  MissingReactInSpec.cy.jsx                XX:XX        1        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  Rerendering.cy.jsx                       XX:XX        1        1        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  Unmount.cy.jsx                           XX:XX        3        3        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  mount.cy.jsx                             XX:XX        3        3        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  port.cy.jsx                              XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  4 of 9 failed (44%)                      XX:XX       17       10        7        -        -  


`

exports['@cypress/vite-dev-server / react / executes all of the tests for vite5.2.8-react when port is statically configured'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (port.cy.jsx)                                                              │
  │ Searched:   src/port.cy.jsx                                                                    │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  port.cy.jsx                                                                     (1 of 1)


  ✓ ensures we have launched at the overridden port

  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     port.cy.jsx                                                                      │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  port.cy.jsx                              XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


`
