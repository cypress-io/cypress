exports['e2e network error handling fails 1'] = `

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
    retries
      1) retries 3x
      ✓ works on the third try after two failed requests


  1 passing
  1 failing

  1) network error handling retries retries 3x:
     CypressError: cy.visit() failed trying to load:

http://localhost:13370/immediate-reset

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




  (Results)

  ┌──────────────────────────────────────────────┐
  │ Tests:        2                              │
  │ Passing:      1                              │
  │ Failing:      1                              │
  │ Pending:      0                              │
  │ Skipped:      0                              │
  │ Screenshots:  1                              │
  │ Video:        true                           │
  │ Duration:     X seconds                      │
  │ Spec Ran:     network_error_handling_spec.js │
  └──────────────────────────────────────────────┘


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/network_error_handling_spec.js/network error handling -- retries -- retries 3x (failed).png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖ network_error_handling_spec.js            XX:XX        2        1        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    1 of 1 failed (100%)                        XX:XX        2        1        1        -        -  


`
