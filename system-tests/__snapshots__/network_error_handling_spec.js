exports['e2e network error handling Cypress baseurl check tries 5 times in run mode 1'] = `
Cypress could not verify that this server is running:

  > http://never-gonna-exist.invalid

We are verifying this server because it has been configured as your baseUrl.

Cypress automatically waits until your server is accessible before running tests.

We will try connecting to it 3 more times...
We will try connecting to it 2 more times...
We will try connecting to it 1 more time...

Cypress failed to verify that your server is running.

Please start this server and then run Cypress again.

`

exports['e2e network error handling Cypress does not connect to the upstream proxy for the SNI server request 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (https_passthru.cy.js)                                                     │
  │ Searched:   cypress/e2e/https_passthru.cy.js                                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  https_passthru.cy.js                                                            (1 of 1)


  https passthru retries
    ✓ retries when visiting a non-test domain
    ✓ passes through the network error when it cannot connect to the proxy


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
  │ Spec Ran:     https_passthru.cy.js                                                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  https_passthru.cy.js                     XX:XX        2        2        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        2        2        -        -        -  


`

exports['e2e network error handling Cypress does not delay a 304 Not Modified in normal network conditions 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (network_error_304_handling.cy.js)                                         │
  │ Searched:   cypress/e2e/network_error_304_handling.cy.js                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  network_error_304_handling.cy.js                                                (1 of 1)


  network error 304 handling
    ✓ does not retry on 304 not modified


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
  │ Spec Ran:     network_error_304_handling.cy.js                                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  network_error_304_handling.cy.js         XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


`

exports['e2e network error handling Cypress does not delay a 304 Not Modified behind a proxy 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (network_error_304_handling.cy.js)                                         │
  │ Searched:   cypress/e2e/network_error_304_handling.cy.js                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  network_error_304_handling.cy.js                                                (1 of 1)


  network error 304 handling
    ✓ does not retry on 304 not modified


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
  │ Spec Ran:     network_error_304_handling.cy.js                                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  network_error_304_handling.cy.js         XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


`

exports['e2e network error handling Cypress does not delay a 304 Not Modified behind a proxy with transfer-encoding: chunked 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (network_error_304_handling.cy.js)                                         │
  │ Searched:   cypress/e2e/network_error_304_handling.cy.js                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  network_error_304_handling.cy.js                                                (1 of 1)


  network error 304 handling
    ✓ does not retry on 304 not modified


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
  │ Spec Ran:     network_error_304_handling.cy.js                                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  network_error_304_handling.cy.js         XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


`

exports['e2e network error handling Cypress tests run as expected 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (network_error_handling.cy.js)                                             │
  │ Searched:   cypress/e2e/network_error_handling.cy.js                                           │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  network_error_handling.cy.js                                                    (1 of 1)


  network error handling
    cy.visit() retries
      1) fails after retrying 5x
      ✓ works on the third try after two failed requests
      ✓ works on the third try after two 500 errors
      ✓ re-sends a <form> body on failures
    cy.request() retries
      2) fails after retrying 5x
      ✓ works on the third try after two failed requests
      ✓ works on the third try after two 500 errors
    subresource retries
      ✓ on <img> tags
      ✓ on <script> tags


  7 passing
  2 failing

  1) network error handling
       cy.visit() retries
         fails after retrying 5x:
     CypressError: \`cy.visit()\` failed trying to load:

http://localhost:13370/immediate-reset?visit

We attempted to make an http request to this URL but the request failed without a response.

We received this error at the network level:

  > Error: socket hang up

Common situations why this would fail:
  - you don't have internet access
  - you forgot to run / boot your web server
  - your web server isn't accessible
  - you have weird network configuration settings on your computer
      [stack trace lines]
  
  From Node.js Internals:
    Error: socket hang up
      [stack trace lines]

  2) network error handling
       cy.request() retries
         fails after retrying 5x:
     CypressError: \`cy.request()\` failed trying to load:

http://localhost:13370/immediate-reset?request

We attempted to make an http request to this URL but the request failed without a response.

We received this error at the network level:

  > Error: socket hang up

-----------------------------------------------------------

The request we sent was:

Method: GET
URL: http://localhost:13370/immediate-reset?request

-----------------------------------------------------------

Common situations why this would fail:
  - you don't have internet access
  - you forgot to run / boot your web server
  - your web server isn't accessible
  - you have weird network configuration settings on your computer

https://on.cypress.io/request
      [stack trace lines]
  
  From Node.js Internals:
    RequestError: Error: socket hang up
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        9                                                                                │
  │ Passing:      7                                                                                │
  │ Failing:      2                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  2                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     network_error_handling.cy.js                                                     │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/network_error_handling.cy.js/network error hand     (1280x720)
     ling -- cy.visit() retries -- fails after retrying 5x (failed).png                             
  -  /XXX/XXX/XXX/cypress/screenshots/network_error_handling.cy.js/network error hand     (1280x720)
     ling -- cy.request() retries -- fails after retrying 5x (failed).png                           


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  network_error_handling.cy.js             XX:XX        9        7        2        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        9        7        2        -        -  


`
