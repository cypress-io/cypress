exports['e2e web security / when enabled / fails'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:      1.2.3                                                                            │
  │ Browser:      FooBrowser 88                                                                    │
  │ Specs:        1 found (web_security_spec.js)                                                   │
  │ Searched:     cypress/integration/web_security_spec.js                                         │
  │ Experiments:  experimentalSessionAndOrigin=true                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  web_security_spec.js                                                            (1 of 1)


  web security
    1) fails when clicking <a> to another origin
    2) fails when submitted a form and being redirected to another origin
    3) fails when using a javascript redirect to another origin
    4) fails when doing a CORS request cross-origin
    ✓ finds the correct spec bridge even if a previous spec bridge host is a subset of the current host


  1 passing
  4 failing

  1) web security
       fails when clicking <a> to another origin:
     CypressError: Timed out after waiting \`5000ms\` for your remote page to load on origin(s):

- \`http://localhost:4466\`

A cross-origin request for \`https://www.foo.com:44665/cross_origin\` was detected.

A command that triggers cross-origin navigation must be immediately followed by a \`cy.origin()\` command:

\`cy.origin('https://foo.com:44665', () => {\`
\`  <commands targeting https://www.foo.com:44665 go here>\`
\`})\`

If the cross-origin request was an intermediary state, you can try increasing the \`pageLoadTimeout\` value in \`cypress.json\` to wait longer.

Browsers will not fire the \`load\` event until all stylesheets and scripts are done downloading.

When this \`load\` event occurs, Cypress will continue running commands.

https://on.cypress.io/origin
      [stack trace lines]

  2) web security
       fails when submitted a form and being redirected to another origin:
     CypressError: Timed out after waiting \`5000ms\` for your remote page to load on origin(s):

- \`http://localhost:4466\`

A cross-origin request for \`https://www.foo.com:44665/cross_origin\` was detected.

A command that triggers cross-origin navigation must be immediately followed by a \`cy.origin()\` command:

\`cy.origin('https://foo.com:44665', () => {\`
\`  <commands targeting https://www.foo.com:44665 go here>\`
\`})\`

If the cross-origin request was an intermediary state, you can try increasing the \`pageLoadTimeout\` value in \`cypress.json\` to wait longer.

Browsers will not fire the \`load\` event until all stylesheets and scripts are done downloading.

When this \`load\` event occurs, Cypress will continue running commands.

https://on.cypress.io/origin
      [stack trace lines]

  3) web security
       fails when using a javascript redirect to another origin:
     CypressError: Timed out after waiting \`5000ms\` for your remote page to load on origin(s):

- \`http://localhost:4466\`

A cross-origin request for \`https://www.foo.com:44665/cross_origin\` was detected.

A command that triggers cross-origin navigation must be immediately followed by a \`cy.origin()\` command:

\`cy.origin('https://foo.com:44665', () => {\`
\`  <commands targeting https://www.foo.com:44665 go here>\`
\`})\`

If the cross-origin request was an intermediary state, you can try increasing the \`pageLoadTimeout\` value in \`cypress.json\` to wait longer.

Browsers will not fire the \`load\` event until all stylesheets and scripts are done downloading.

When this \`load\` event occurs, Cypress will continue running commands.

https://on.cypress.io/origin
      [stack trace lines]

  4) web security
       fails when doing a CORS request cross-origin:
     AssertionError: Timed out retrying after 500ms: Expected to find content: 'success!' but never did.
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        5                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      4                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  4                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     web_security_spec.js                                                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/web_security_spec.js/web security -- fails when     (1280x720)
      clicking a to another origin (failed).png                                                     
  -  /XXX/XXX/XXX/cypress/screenshots/web_security_spec.js/web security -- fails when     (1280x720)
      submitted a form and being redirected to another origin (failed).png                          
  -  /XXX/XXX/XXX/cypress/screenshots/web_security_spec.js/web security -- fails when     (1280x720)
      using a javascript redirect to another origin (failed).png                                    
  -  /XXX/XXX/XXX/cypress/screenshots/web_security_spec.js/web security -- fails when     (1280x720)
      doing a CORS request cross-origin (failed).png                                                


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/web_security_spec.js.mp4            (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  web_security_spec.js                     XX:XX        5        1        4        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        5        1        4        -        -  


`

exports['e2e web security / when disabled / passes'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:      1.2.3                                                                            │
  │ Browser:      FooBrowser 88                                                                    │
  │ Specs:        1 found (web_security_spec.js)                                                   │
  │ Searched:     cypress/integration/web_security_spec.js                                         │
  │ Experiments:  experimentalSessionAndOrigin=true                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  web_security_spec.js                                                            (1 of 1)


  web security
    ✓ fails when clicking <a> to another origin
    ✓ fails when submitted a form and being redirected to another origin
    ✓ fails when using a javascript redirect to another origin
    ✓ fails when doing a CORS request cross-origin
    ✓ finds the correct spec bridge even if a previous spec bridge host is a subset of the current host


  5 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        5                                                                                │
  │ Passing:      5                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     web_security_spec.js                                                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/web_security_spec.js.mp4            (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  web_security_spec.js                     XX:XX        5        5        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        5        5        -        -        -  


`

exports['e2e web security / firefox / displays warning when firefox and chromeWebSecurity:false'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (simple_passing_spec.js)                                                   │
  │ Searched:   cypress/integration/simple_passing_spec.js                                         │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  simple_passing_spec.js                                                          (1 of 1)

Your project has set the configuration option: chromeWebSecurity to false

This option will not have an effect in Firefox. Tests that rely on web security being disabled will not run as expected.


  simple passing spec
    ✓ passes


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
  │ Spec Ran:     simple_passing_spec.js                                                           │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/simple_passing_spec.js.mp4          (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  simple_passing_spec.js                   XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


`
