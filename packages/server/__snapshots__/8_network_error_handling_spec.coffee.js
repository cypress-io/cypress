exports['e2e network error handling Cypress baseurl check tries 5 times in run mode 1'] = `
Cypress could not verify that this server is running:

  > http://never-gonna-exist.invalid

We are verifying this server because it has been configured as your \`baseUrl\`.

Cypress automatically waits until your server is accessible before running tests.

We will try connecting to it 3 more times...
We will try connecting to it 2 more times...
We will try connecting to it 1 more time...

Cypress failed to verify that your server is running.

Please start this server and then run Cypress again.

`

exports['e2e network error handling Cypress retries HTTPS passthrough behind a proxy 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (https_passthru_spec.js)                                                   │
  │ Searched:   cypress/integration/https_passthru_spec.js                                         │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: https_passthru_spec.js...                                                       (1 of 1) 


  https passthru retries
    ✓ retries when visiting a non-test domain
    ✓ passes through the network error when it cannot connect to the proxy


  2 passing


  (Results)

  ┌──────────────────────────────────────┐
  │ Tests:        2                      │
  │ Passing:      2                      │
  │ Failing:      0                      │
  │ Pending:      0                      │
  │ Skipped:      0                      │
  │ Screenshots:  0                      │
  │ Video:        true                   │
  │ Duration:     X seconds              │
  │ Spec Ran:     https_passthru_spec.js │
  └──────────────────────────────────────┘


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔ https_passthru_spec.js                    XX:XX        2        2        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    All specs passed!                           XX:XX        2        2        -        -        -  


`

exports['e2e network error handling Cypress does not connect to the upstream proxy for the SNI server request 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (https_passthru_spec.js)                                                   │
  │ Searched:   cypress/integration/https_passthru_spec.js                                         │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: https_passthru_spec.js...                                                       (1 of 1) 


  https passthru retries
    ✓ retries when visiting a non-test domain
    ✓ passes through the network error when it cannot connect to the proxy


  2 passing


  (Results)

  ┌──────────────────────────────────────┐
  │ Tests:        2                      │
  │ Passing:      2                      │
  │ Failing:      0                      │
  │ Pending:      0                      │
  │ Skipped:      0                      │
  │ Screenshots:  0                      │
  │ Video:        true                   │
  │ Duration:     X seconds              │
  │ Spec Ran:     https_passthru_spec.js │
  └──────────────────────────────────────┘


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔ https_passthru_spec.js                    XX:XX        2        2        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    All specs passed!                           XX:XX        2        2        -        -        -  


`

exports['e2e network error handling Cypress does not delay a 304 Not Modified in normal network conditions 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (network_error_304_handling_spec.js)                                       │
  │ Searched:   cypress/integration/network_error_304_handling_spec.js                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: network_error_304_handling_spec.js...                                           (1 of 1) 


  network error 304 handling
    ✓ does not retry on 304 not modified


  1 passing


  (Results)

  ┌──────────────────────────────────────────────────┐
  │ Tests:        1                                  │
  │ Passing:      1                                  │
  │ Failing:      0                                  │
  │ Pending:      0                                  │
  │ Skipped:      0                                  │
  │ Screenshots:  0                                  │
  │ Video:        true                               │
  │ Duration:     X seconds                          │
  │ Spec Ran:     network_error_304_handling_spec.js │
  └──────────────────────────────────────────────────┘


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔ network_error_304_handling_spec.js        XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    All specs passed!                           XX:XX        1        1        -        -        -  


`

exports['e2e network error handling Cypress does not delay a 304 Not Modified behind a proxy 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (network_error_304_handling_spec.js)                                       │
  │ Searched:   cypress/integration/network_error_304_handling_spec.js                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: network_error_304_handling_spec.js...                                           (1 of 1) 


  network error 304 handling
    ✓ does not retry on 304 not modified


  1 passing


  (Results)

  ┌──────────────────────────────────────────────────┐
  │ Tests:        1                                  │
  │ Passing:      1                                  │
  │ Failing:      0                                  │
  │ Pending:      0                                  │
  │ Skipped:      0                                  │
  │ Screenshots:  0                                  │
  │ Video:        true                               │
  │ Duration:     X seconds                          │
  │ Spec Ran:     network_error_304_handling_spec.js │
  └──────────────────────────────────────────────────┘


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔ network_error_304_handling_spec.js        XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    All specs passed!                           XX:XX        1        1        -        -        -  


`

exports['e2e network error handling Cypress does not delay a 304 Not Modified behind a proxy with transfer-encoding: chunked 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (network_error_304_handling_spec.js)                                       │
  │ Searched:   cypress/integration/network_error_304_handling_spec.js                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: network_error_304_handling_spec.js...                                           (1 of 1) 


  network error 304 handling
    ✓ does not retry on 304 not modified


  1 passing


  (Results)

  ┌──────────────────────────────────────────────────┐
  │ Tests:        1                                  │
  │ Passing:      1                                  │
  │ Failing:      0                                  │
  │ Pending:      0                                  │
  │ Skipped:      0                                  │
  │ Screenshots:  0                                  │
  │ Video:        true                               │
  │ Duration:     X seconds                          │
  │ Spec Ran:     network_error_304_handling_spec.js │
  └──────────────────────────────────────────────────┘


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔ network_error_304_handling_spec.js        XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    All specs passed!                           XX:XX        1        1        -        -        -  


`
