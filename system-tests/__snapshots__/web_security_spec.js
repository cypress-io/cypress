exports['e2e web security / when enabled / fails'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:      1.2.3                                                                            │
  │ Browser:      FooBrowser 88                                                                    │
  │ Specs:        1 found (web_security.cy.js)                                                     │
  │ Searched:     cypress/e2e/web_security.cy.js                                                   │
  │ Experiments:  experimentalSessionAndOrigin=false                                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  web_security.cy.js                                                              (1 of 1)


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
     CypressError: Cypress detected a cross origin error happened on page load:

  > [Cross origin error message]

Before the page load, you were bound to the origin:

  > http://localhost:4466

A cross origin error happens when your application navigates to a new URL which does not match the origin above.

A new URL does not match the origin if the 'protocol', 'port' (if specified), and/or 'host' are different.

Cypress does not allow you to navigate to a different origin URL within a single test.

You may need to restructure some of your test code to avoid this problem.

Alternatively you can also disable Chrome Web Security in Chromium-based browsers which will turn off this restriction by setting { chromeWebSecurity: false } in \`cypress.config.js\`.

https://on.cypress.io/cross-origin-violation
      [stack trace lines]

  2) web security
       fails when submitted a form and being redirected to another origin:
     CypressError: Cypress detected a cross origin error happened on page load:

  > [Cross origin error message]

Before the page load, you were bound to the origin:

  > http://localhost:4466

A cross origin error happens when your application navigates to a new URL which does not match the origin above.

A new URL does not match the origin if the 'protocol', 'port' (if specified), and/or 'host' are different.

Cypress does not allow you to navigate to a different origin URL within a single test.

You may need to restructure some of your test code to avoid this problem.

Alternatively you can also disable Chrome Web Security in Chromium-based browsers which will turn off this restriction by setting { chromeWebSecurity: false } in \`cypress.config.js\`.

https://on.cypress.io/cross-origin-violation
      [stack trace lines]

  3) web security
       fails when using a javascript redirect to another origin:
     CypressError: Cypress detected a cross origin error happened on page load:

  > [Cross origin error message]

Before the page load, you were bound to the origin:

  > http://localhost:4466

A cross origin error happens when your application navigates to a new URL which does not match the origin above.

A new URL does not match the origin if the 'protocol', 'port' (if specified), and/or 'host' are different.

Cypress does not allow you to navigate to a different origin URL within a single test.

You may need to restructure some of your test code to avoid this problem.

Alternatively you can also disable Chrome Web Security in Chromium-based browsers which will turn off this restriction by setting { chromeWebSecurity: false } in \`cypress.config.js\`.

https://on.cypress.io/cross-origin-violation
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
  │ Spec Ran:     web_security.cy.js                                                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/web_security.cy.js/web security -- fails when c     (1280x720)
     licking a to another origin (failed).png                                                       
  -  /XXX/XXX/XXX/cypress/screenshots/web_security.cy.js/web security -- fails when s     (1280x720)
     ubmitted a form and being redirected to another origin (failed).png                            
  -  /XXX/XXX/XXX/cypress/screenshots/web_security.cy.js/web security -- fails when u     (1280x720)
     sing a javascript redirect to another origin (failed).png                                      
  -  /XXX/XXX/XXX/cypress/screenshots/web_security.cy.js/web security -- fails when d     (1280x720)
     oing a CORS request cross-origin (failed).png                                                  


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/web_security.cy.js.mp4              (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  web_security.cy.js                       XX:XX        5        1        4        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        5        1        4        -        -  


`

exports['e2e web security / when disabled / passes'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:      1.2.3                                                                            │
  │ Browser:      FooBrowser 88                                                                    │
  │ Specs:        1 found (web_security.cy.js)                                                     │
  │ Searched:     cypress/e2e/web_security.cy.js                                                   │
  │ Experiments:  experimentalSessionAndOrigin=false                                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  web_security.cy.js                                                              (1 of 1)


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
  │ Spec Ran:     web_security.cy.js                                                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/web_security.cy.js.mp4              (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  web_security.cy.js                       XX:XX        5        5        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        5        5        -        -        -  


`

exports['e2e web security / firefox / displays warning when firefox and chromeWebSecurity:false'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (simple_passing.cy.js)                                                     │
  │ Searched:   cypress/e2e/simple_passing.cy.js                                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  simple_passing.cy.js                                                            (1 of 1)

Your project has set the configuration option: \`chromeWebSecurity\` to \`false\`.

This option will not have an effect in Firefox. Tests that rely on web security being disabled will not run as expected.


  simple passing spec
    ✓ passes


  1 passing

Warning: We failed processing this video.

This error will not alter the exit code.

TimeoutError: operation timed out
      [stack trace lines]


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
  │ Spec Ran:     simple_passing.cy.js                                                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  simple_passing.cy.js                     XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


`

exports['e2e web security / when experimentalSessionAndOrigin is enabled / fails'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:      1.2.3                                                                            │
  │ Browser:      FooBrowser 88                                                                    │
  │ Specs:        1 found (web_security.cy.js)                                                     │
  │ Searched:     cypress/e2e/web_security.cy.js                                                   │
  │ Experiments:  experimentalSessionAndOrigin=true                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  web_security.cy.js                                                              (1 of 1)


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

      Timed out retrying after 50ms
      + expected - actual

      +'https://www.foo.com:44665/cross_origin'
      
      [stack trace lines]

  2) web security
       fails when submitted a form and being redirected to another origin:

      Timed out retrying after 50ms
      + expected - actual

      +'https://www.foo.com:44665/cross_origin'
      
      [stack trace lines]

  3) web security
       fails when using a javascript redirect to another origin:

      Timed out retrying after 50ms
      + expected - actual

      +'https://www.foo.com:44665/cross_origin'
      
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
  │ Spec Ran:     web_security.cy.js                                                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/web_security.cy.js/web security -- fails when c     (1280x720)
     licking a to another origin (failed).png                                                       
  -  /XXX/XXX/XXX/cypress/screenshots/web_security.cy.js/web security -- fails when s     (1280x720)
     ubmitted a form and being redirected to another origin (failed).png                            
  -  /XXX/XXX/XXX/cypress/screenshots/web_security.cy.js/web security -- fails when u     (1280x720)
     sing a javascript redirect to another origin (failed).png                                      
  -  /XXX/XXX/XXX/cypress/screenshots/web_security.cy.js/web security -- fails when d     (1280x720)
     oing a CORS request cross-origin (failed).png                                                  


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/web_security.cy.js.mp4              (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  web_security.cy.js                       XX:XX        5        1        4        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        5        1        4        -        -  


`
