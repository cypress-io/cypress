exports['e2e web security when enabled fails 1'] = `
====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (web_security_spec.coffee)                                                 │
  │ Searched:   cypress/integration/web_security_spec.coffee                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: web_security_spec.coffee...                                                     (1 of 1) 


  web security
    1) fails when clicking <a> to another origin
    2) fails when submitted a form and being redirected to another origin
    3) fails when using a javascript redirect to another origin


  0 passing
  3 failing

  1) web security fails when clicking <a> to another origin:
     CypressError: Cypress detected a cross origin error happened on page load:

  > Blocked a frame with origin "http://localhost:5566" from accessing a cross-origin frame.

Before the page load, you were bound to the origin policy:
  > http://localhost:5566

A cross origin error happens when your application navigates to a new superdomain which does not match the origin policy above.

This typically happens in one of three ways:

1. You clicked an <a> that routed you outside of your application
2. You submitted a form and your server redirected you outside of your application
3. You used a javascript redirect to a page outside of your application

Cypress does not allow you to change superdomains within a single test.

You may need to restructure some of your test code to avoid this problem.

Alternatively you can also disable Chrome Web Security which will turn off this restriction by setting { chromeWebSecurity: false } in your 'cypress.json' file.

https://on.cypress.io/cross-origin-violation

      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line

  2) web security fails when submitted a form and being redirected to another origin:
     CypressError: Cypress detected a cross origin error happened on page load:

  > Blocked a frame with origin "http://localhost:5566" from accessing a cross-origin frame.

Before the page load, you were bound to the origin policy:
  > http://localhost:5566

A cross origin error happens when your application navigates to a new superdomain which does not match the origin policy above.

This typically happens in one of three ways:

1. You clicked an <a> that routed you outside of your application
2. You submitted a form and your server redirected you outside of your application
3. You used a javascript redirect to a page outside of your application

Cypress does not allow you to change superdomains within a single test.

You may need to restructure some of your test code to avoid this problem.

Alternatively you can also disable Chrome Web Security which will turn off this restriction by setting { chromeWebSecurity: false } in your 'cypress.json' file.

https://on.cypress.io/cross-origin-violation

      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line

  3) web security fails when using a javascript redirect to another origin:
     CypressError: Cypress detected a cross origin error happened on page load:

  > Blocked a frame with origin "http://localhost:5566" from accessing a cross-origin frame.

Before the page load, you were bound to the origin policy:
  > http://localhost:5566

A cross origin error happens when your application navigates to a new superdomain which does not match the origin policy above.

This typically happens in one of three ways:

1. You clicked an <a> that routed you outside of your application
2. You submitted a form and your server redirected you outside of your application
3. You used a javascript redirect to a page outside of your application

Cypress does not allow you to change superdomains within a single test.

You may need to restructure some of your test code to avoid this problem.

Alternatively you can also disable Chrome Web Security which will turn off this restriction by setting { chromeWebSecurity: false } in your 'cypress.json' file.

https://on.cypress.io/cross-origin-violation

      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line




  (Results)

  ┌────────────────────────────────────────┐
  │ Tests:        3                        │
  │ Passing:      0                        │
  │ Failing:      3                        │
  │ Pending:      0                        │
  │ Skipped:      0                        │
  │ Screenshots:  3                        │
  │ Video:        true                     │
  │ Duration:     X seconds                │
  │ Spec Ran:     web_security_spec.coffee │
  └────────────────────────────────────────┘


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/web_security_spec.coffee/web security -- fails when clicking a to another origin (failed).png (1280x720)
  - /foo/bar/.projects/e2e/cypress/screenshots/web_security_spec.coffee/web security -- fails when submitted a form and being redirected to another origin (failed).png (1280x720)
  - /foo/bar/.projects/e2e/cypress/screenshots/web_security_spec.coffee/web security -- fails when using a javascript redirect to another origin (failed).png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖ web_security_spec.coffee                  XX:XX        3        -        3        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    1 of 1 failed (100%)                        XX:XX        3        -        3        -        -  

`

exports['e2e web security when disabled fails 1'] = `
====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (web_security_spec.coffee)                                                 │
  │ Searched:   cypress/integration/web_security_spec.coffee                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: web_security_spec.coffee...                                                     (1 of 1) 


  web security
    ✓ fails when clicking <a> to another origin
    ✓ fails when submitted a form and being redirected to another origin
    ✓ fails when using a javascript redirect to another origin


  3 passing


  (Results)

  ┌────────────────────────────────────────┐
  │ Tests:        3                        │
  │ Passing:      3                        │
  │ Failing:      0                        │
  │ Pending:      0                        │
  │ Skipped:      0                        │
  │ Screenshots:  0                        │
  │ Video:        true                     │
  │ Duration:     X seconds                │
  │ Spec Ran:     web_security_spec.coffee │
  └────────────────────────────────────────┘


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔ web_security_spec.coffee                  XX:XX        3        3        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    All specs passed!                           XX:XX        3        3        -        -        -  

`

