exports['e2e web security / when enabled / fails'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (web_security_spec.coffee)                                                 │
  │ Searched:   cypress/integration/web_security_spec.coffee                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  web_security_spec.coffee                                                        (1 of 1)


  web security
    1) fails when clicking <a> to another origin
    2) fails when submitted a form and being redirected to another origin
    3) fails when using a javascript redirect to another origin


  0 passing
  3 failing

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




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        3                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      3                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  3                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     web_security_spec.coffee                                                         │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/web_security_spec.coffee/web security -- fails      (1280x720)
     when clicking a to another origin (failed).png                                                 
  -  /XXX/XXX/XXX/cypress/screenshots/web_security_spec.coffee/web security -- fails      (1280x720)
     when submitted a form and being redirected to another origin (failed).png                      
  -  /XXX/XXX/XXX/cypress/screenshots/web_security_spec.coffee/web security -- fails      (1280x720)
     when using a javascript redirect to another origin (failed).png                                


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/web_security_spec.coffee.mp4        (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  web_security_spec.coffee                 XX:XX        3        -        3        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        3        -        3        -        -  


`

exports['e2e web security / when disabled / passes'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (web_security_spec.coffee)                                                 │
  │ Searched:   cypress/integration/web_security_spec.coffee                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  web_security_spec.coffee                                                        (1 of 1)


  web security
    ✓ fails when clicking <a> to another origin
    ✓ fails when submitted a form and being redirected to another origin
    ✓ fails when using a javascript redirect to another origin


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
  │ Spec Ran:     web_security_spec.coffee                                                         │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/web_security_spec.coffee.mp4        (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  web_security_spec.coffee                 XX:XX        3        3        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        3        3        -        -        -  


`

exports['firefox / displays warning when firefox and chromeWebSecurity:false'] = `

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
