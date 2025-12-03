exports['e2e xhr / passes in global mode'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (xhr.cy.js)                                                                │
  │ Searched:   cypress/e2e/xhr.cy.js                                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  xhr.cy.js                                                                       (1 of 1)


  xhrs
    ✓ can encode + decode headers
    ✓ ensures that request headers + body go out and reach the server unscathed
    ✓ does not inject into json's contents from http server even requesting text/html
    ✓ does not inject into json's contents from file server even requesting text/html
    ✓ works prior to visit
    ✓ can stub a 100kb response
Warning: Cookies may not have been applied to synchronous XHR request: http://www.foobar.com:1919/json. Learn more: https://on.cypress.io/synchronous-xhr-requests

Warning: Synchronous XHR request was not intercepted: http://www.foobar.com:1919/json. Learn more: https://on.cypress.io/synchronous-xhr-requests

Warning: Cookies may not have been set for synchronous XHR response: http://www.foobar.com:1919/json. Learn more: https://on.cypress.io/synchronous-xhr-requests

    ✓ displays warnings in the terminal when using sync XHR requests
    server with 1 visit
      ✓ response body
      ✓ request body
      - aborts


  9 passing
  1 pending


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        10                                                                               │
  │ Passing:      9                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      1                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     xhr.cy.js                                                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  xhr.cy.js                                XX:XX       10        9        -        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX       10        9        -        1        -  


`

exports['e2e xhr / passes through CLI'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (xhr.cy.js)                                                                │
  │ Searched:   cypress/e2e/xhr.cy.js                                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  xhr.cy.js                                                                       (1 of 1)


  xhrs
    ✓ can encode + decode headers
    ✓ ensures that request headers + body go out and reach the server unscathed
    ✓ does not inject into json's contents from http server even requesting text/html
    ✓ does not inject into json's contents from file server even requesting text/html
    ✓ works prior to visit
    ✓ can stub a 100kb response
Warning: Cookies may not have been applied to synchronous XHR request: http://www.foobar.com:1919/json. Learn more: https://on.cypress.io/synchronous-xhr-requests

Warning: Synchronous XHR request was not intercepted: http://www.foobar.com:1919/json. Learn more: https://on.cypress.io/synchronous-xhr-requests

Warning: Cookies may not have been set for synchronous XHR response: http://www.foobar.com:1919/json. Learn more: https://on.cypress.io/synchronous-xhr-requests

    ✓ displays warnings in the terminal when using sync XHR requests
    server with 1 visit
      ✓ response body
      ✓ request body
      - aborts


  9 passing
  1 pending


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        10                                                                               │
  │ Passing:      9                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      1                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     xhr.cy.js                                                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  xhr.cy.js                                XX:XX       10        9        -        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX       10        9        -        1        -  


`
