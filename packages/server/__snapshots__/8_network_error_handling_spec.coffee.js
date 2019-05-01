exports['e2e network error handling Cypress baseurl check tries 5 times in run mode 1'] = `

Cypress could not verify that the server set as your \`baseUrl\` is running: http://never-gonna-exist.invalid

Your tests likely make requests to this \`baseUrl\` and these tests will fail if you don't boot your server.

We will retry 3 more times in 1 second...

Cypress could not verify that the server set as your \`baseUrl\` is running: http://never-gonna-exist.invalid

Your tests likely make requests to this \`baseUrl\` and these tests will fail if you don't boot your server.

We will retry 2 more times in 2 seconds...

Cypress could not verify that the server set as your \`baseUrl\` is running: http://never-gonna-exist.invalid

Your tests likely make requests to this \`baseUrl\` and these tests will fail if you don't boot your server.

We will retry 1 more time in 2 seconds...
Cypress could not verify that the server set as your \`baseUrl\` is running:

  > http://never-gonna-exist.invalid

Your tests likely make requests to this \`baseUrl\` and these tests will fail if you don't boot your server.

Please start this server and then run Cypress again.

`

exports['e2e network error handling Cypress tests run as expected 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (network_error_handling_spec.js)                                           │
  │ Searched:   cypress/integration/network_error_handling_spec.js                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: network_error_handling_spec.js...                                               (1 of 1) 


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

  1) network error handling cy.visit() retries fails after retrying 5x:
     CypressError: cy.visit() failed trying to load:

http://localhost:13370/immediate-reset?visit

We attempted to make an http request to this URL but the request failed without a response.

We received this error at the network level:

  > Error: socket hang up

Common situations why this would fail:
  - you don't have internet access
  - you forgot to run / boot your web server
  - your web server isn't accessible
  - you have weird network configuration settings on your computer

The stack trace for this error is:

Error: socket hang up
    at stack trace line
    at stack trace line
    at stack trace line
    at stack trace line
    at stack trace line

      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line

  2) network error handling cy.request() retries fails after retrying 5x:
     CypressError: cy.request() failed trying to load:

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

The stack trace for this error is:

RequestError: Error: socket hang up
    at stack trace line
    at stack trace line
    at stack trace line
    at stack trace line
    at stack trace line
    at stack trace line
    at stack trace line
    at stack trace line
    at stack trace line
    at stack trace line
    at stack trace line

      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line




  (Results)

  ┌──────────────────────────────────────────────┐
  │ Tests:        9                              │
  │ Passing:      7                              │
  │ Failing:      2                              │
  │ Pending:      0                              │
  │ Skipped:      0                              │
  │ Screenshots:  2                              │
  │ Video:        true                           │
  │ Duration:     X seconds                      │
  │ Spec Ran:     network_error_handling_spec.js │
  └──────────────────────────────────────────────┘


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/network_error_handling_spec.js/network error handling -- cy.visit() retries -- fails after retrying 5x (failed).png (1280x720)
  - /foo/bar/.projects/e2e/cypress/screenshots/network_error_handling_spec.js/network error handling -- cy.request() retries -- fails after retrying 5x (failed).png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖ network_error_handling_spec.js            XX:XX        9        7        2        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    1 of 1 failed (100%)                        XX:XX        9        7        2        -        -  


`
