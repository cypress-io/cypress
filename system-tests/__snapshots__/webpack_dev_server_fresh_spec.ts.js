exports['@cypress/webpack-dev-server react executes all of the tests for webpack4_wds3-react 1'] = `
ℹ ｢wds｣: XXXX
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
     CypressError: \`cy.then()\` timed out after waiting \`1000ms\`.

Your callback function returned a promise that never resolved.

The callback function was:

function () {
    var _a, _b, _c;

    var el = getContainerEl();

    if (!el) {
      throw new Error(["[@cypress/react] \\uD83D\\uDD25 Hmm, cannot find root element to mount the component. Searched for " + ROOT_SELECTOR].join(' '));
    }

    var key = rerenderKey !== null && rerenderKey !== void 0 ? rerenderKey : // @ts-ignore provide unique key to the the wrapped component to make sure we are rerendering between tests
    (((_c = (_b = (_a = Cypress === null || Cypress === void 0 ? void 0 : Cypress.mocha) === null || _a === void 0 ? void 0 : _a.getRunner()) === null || _b === void 0 ? void 0 : _b.test) === null || _c === void 0 ? void 0 : _c.title) || '') + Math.random();
    var props = {
      key: key
    };

    var logMount = function () {
      if (options.log !== false) {
        Cypress.log({
          name: type,
          type: 'parent',
          message: [message],
          // @ts-ignore
          $el: el.children.item(0),
          consoleProps: function () {
            return {
              // @ts-ignore protect the use of jsx functional components use ReactNode
              props: jsx.props,
              description: type === 'mount' ? 'Mounts React component' : 'Rerenders mounted React component',
              home: 'https://github.com/cypress-io/cypress'
            };
          }
        }).snapshot('mounted').end();
      }
    };

    return importReactModules().then(function (_a) {
      var react = _a.react,
          reactDom = _a.reactDom,
          majorVersion = _a.majorVersion;
      var reactDomToUse = options.ReactDom || reactDom;
      lastMountedReactDom = reactDomToUse;
      var reactComponent = react.createElement(options.strict ? react.StrictMode : react.Fragment, props, jsx); // since we always surround the component with a fragment
      // let's get back the original component

      var userComponent = reactComponent.props.children;

      if (majorVersion <= 17) {
        reactDom.render(reactComponent, el);
      } else {
        var root = reactDom.createRoot(el);
        root.render(reactComponent);
      }

      logMount();
      return (// Separate alias and returned value. Alias returns the component only, and the thenable returns the additional functions
        cy.wrap(userComponent, {
          log: false
        }).as(displayName).then(function () {
          return cy.wrap({
            component: userComponent,
            rerender: function (newComponent) {
              return _mount('rerender', newComponent, options, key);
            },
            unmount: function () {
              return _unmount({
                boundComponentMessage: jsxComponentName,
                log: true
              });
            }
          }, {
            log: false
          });
        }) // by waiting, we delaying test execution for the next tick of event loop
        // and letting hooks and component lifecycle methods to execute mount
        // https://github.com/bahmutov/cypress-react-unit-test/issues/200
        .wait(0, {
          log: false
        })
      );
    }); // Bluebird types are terrible. I don't think the return type can be carried without this cast
  }

https://on.cypress.io/then
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
   49 modules

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
ℹ ｢wds｣: XXXX
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
     CypressError: \`cy.then()\` timed out after waiting \`1000ms\`.

Your callback function returned a promise that never resolved.

The callback function was:

function () {
    var _a, _b, _c;

    var el = getContainerEl();

    if (!el) {
      throw new Error(["[@cypress/react] \\uD83D\\uDD25 Hmm, cannot find root element to mount the component. Searched for " + ROOT_SELECTOR].join(' '));
    }

    var key = rerenderKey !== null && rerenderKey !== void 0 ? rerenderKey : // @ts-ignore provide unique key to the the wrapped component to make sure we are rerendering between tests
    (((_c = (_b = (_a = Cypress === null || Cypress === void 0 ? void 0 : Cypress.mocha) === null || _a === void 0 ? void 0 : _a.getRunner()) === null || _b === void 0 ? void 0 : _b.test) === null || _c === void 0 ? void 0 : _c.title) || '') + Math.random();
    var props = {
      key: key
    };

    var logMount = function () {
      if (options.log !== false) {
        Cypress.log({
          name: type,
          type: 'parent',
          message: [message],
          // @ts-ignore
          $el: el.children.item(0),
          consoleProps: function () {
            return {
              // @ts-ignore protect the use of jsx functional components use ReactNode
              props: jsx.props,
              description: type === 'mount' ? 'Mounts React component' : 'Rerenders mounted React component',
              home: 'https://github.com/cypress-io/cypress'
            };
          }
        }).snapshot('mounted').end();
      }
    };

    return importReactModules().then(function (_a) {
      var react = _a.react,
          reactDom = _a.reactDom,
          majorVersion = _a.majorVersion;
      var reactDomToUse = options.ReactDom || reactDom;
      lastMountedReactDom = reactDomToUse;
      var reactComponent = react.createElement(options.strict ? react.StrictMode : react.Fragment, props, jsx); // since we always surround the component with a fragment
      // let's get back the original component

      var userComponent = reactComponent.props.children;

      if (majorVersion <= 17) {
        reactDom.render(reactComponent, el);
      } else {
        var root = reactDom.createRoot(el);
        root.render(reactComponent);
      }

      logMount();
      return (// Separate alias and returned value. Alias returns the component only, and the thenable returns the additional functions
        cy.wrap(userComponent, {
          log: false
        }).as(displayName).then(function () {
          return cy.wrap({
            component: userComponent,
            rerender: function (newComponent) {
              return _mount('rerender', newComponent, options, key);
            },
            unmount: function () {
              return _unmount({
                boundComponentMessage: jsxComponentName,
                log: true
              });
            }
          }, {
            log: false
          });
        }) // by waiting, we delaying test execution for the next tick of event loop
        // and letting hooks and component lifecycle methods to execute mount
        // https://github.com/bahmutov/cypress-react-unit-test/issues/200
        .wait(0, {
          log: false
        })
      );
    }); // Bluebird types are terrible. I don't think the return type can be carried without this cast
  }

https://on.cypress.io/then
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
12 assets
59 modules

ERROR in ./src/AppCompilationError.cy.jsx
Module build failed (from [..]):
SyntaxError: /foo/bar/.projects/webpack5_wds4-react/src/AppCompilationError.cy.jsx: Unexpected token, expected "," (9:0)

   7 |   cy.get('h1').contains('Hello World')
   8 | }
>  9 | })
     | ^
  10 |
      [stack trace lines]

XXXX error in 3208 ms


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
