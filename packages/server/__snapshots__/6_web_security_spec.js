exports['e2e web security / when enabled / fails'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (web_security_spec.js)                                                     │
  │ Searched:   cypress/integration/web_security_spec.js                                           │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  web_security_spec.js                                                            (1 of 1)


  web security
    1) fails when clicking <a> to another origin
    2) fails when submitted a form and being redirected to another origin
    3) fails when using a javascript redirect to another origin
    4) fails when doing a CORS request cross-origin


  0 passing
  4 failing

  1) web security
       fails when clicking <a> to another origin:
     CypressError: Cypress detected a cross origin error happened on page load:

  > [Cross origin error message]

Before the page load, you were bound to the origin policy:

  > http://localhost:4466

A cross origin error happens when your application navigates to a new URL which does not match the origin policy above.

A new URL does not match the origin policy if the 'protocol', 'port' (if specified), and/or 'host' (unless of the same superdomain) are different.

Cypress does not allow you to navigate to a different origin URL within a single test.

You may need to restructure some of your test code to avoid this problem.

Alternatively you can also disable Chrome Web Security in Chromium-based browsers which will turn off this restriction by setting { chromeWebSecurity: false } in \`cypress.json\`.

https://on.cypress.io/cross-origin-violation
      [stack trace lines]

  2) web security
       fails when submitted a form and being redirected to another origin:
     CypressError: Cypress detected a cross origin error happened on page load:

  > [Cross origin error message]

Before the page load, you were bound to the origin policy:

  > http://localhost:4466

A cross origin error happens when your application navigates to a new URL which does not match the origin policy above.

A new URL does not match the origin policy if the 'protocol', 'port' (if specified), and/or 'host' (unless of the same superdomain) are different.

Cypress does not allow you to navigate to a different origin URL within a single test.

You may need to restructure some of your test code to avoid this problem.

Alternatively you can also disable Chrome Web Security in Chromium-based browsers which will turn off this restriction by setting { chromeWebSecurity: false } in \`cypress.json\`.

https://on.cypress.io/cross-origin-violation
      [stack trace lines]

  3) web security
       fails when using a javascript redirect to another origin:
     CypressError: Cypress detected a cross origin error happened on page load:

  > [Cross origin error message]

Before the page load, you were bound to the origin policy:

  > http://localhost:4466

A cross origin error happens when your application navigates to a new URL which does not match the origin policy above.

A new URL does not match the origin policy if the 'protocol', 'port' (if specified), and/or 'host' (unless of the same superdomain) are different.

Cypress does not allow you to navigate to a different origin URL within a single test.

You may need to restructure some of your test code to avoid this problem.

Alternatively you can also disable Chrome Web Security in Chromium-based browsers which will turn off this restriction by setting { chromeWebSecurity: false } in \`cypress.json\`.

https://on.cypress.io/cross-origin-violation
      [stack trace lines]

  4) web security
       fails when doing a CORS request cross-origin:
     AssertionError: Timed out retrying: Expected to find content: 'success!' but never did.
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        4                                                                                │
  │ Passing:      0                                                                                │
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
  │ ✖  web_security_spec.js                     XX:XX        4        -        4        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        4        -        4        -        -  


`

exports['e2e web security / when disabled / passes'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (web_security_spec.js)                                                     │
  │ Searched:   cypress/integration/web_security_spec.js                                           │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  web_security_spec.js                                                            (1 of 1)


  web security
    ✓ fails when clicking <a> to another origin
    ✓ fails when submitted a form and being redirected to another origin
    ✓ fails when using a javascript redirect to another origin
    ✓ fails when doing a CORS request cross-origin


  4 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        4                                                                                │
  │ Passing:      4                                                                                │
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
  │ ✔  web_security_spec.js                     XX:XX        4        4        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        4        4        -        -        -  


`

exports['e2e web security / firefox / displays warning when firefox and chromeWebSecurity:false'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (simple_passing_spec.coffee)                                               │
  │ Searched:   cypress/integration/simple_passing_spec.coffee                                     │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  simple_passing_spec.coffee                                                      (1 of 1)

Your project has set the configuration option: \`chromeWebSecurity: false\`

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
  │ Spec Ran:     simple_passing_spec.coffee                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/simple_passing_spec.coffee.mp4      (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  simple_passing_spec.coffee               XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


`
