exports['e2e xhr / passes in global mode'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (xhr_spec.js)                                                              │
  │ Searched:   cypress/integration/xhr_spec.js                                                    │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  xhr_spec.js                                                                     (1 of 1)


  xhrs
    ✓ can encode + decode headers
    ✓ ensures that request headers + body go out and reach the server unscathed
    ✓ does not inject into json's contents from http server even requesting text/html
    ✓ does not inject into json's contents from file server even requesting text/html
    ✓ works prior to visit
    ✓ can stub a 100kb response
    ✓ spawns tasks with original NODE_OPTIONS
    server with 1 visit
      ✓ response body
      ✓ request body
      ✓ aborts


  10 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        10                                                                               │
  │ Passing:      10                                                                               │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     xhr_spec.js                                                                      │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/xhr_spec.js.mp4                     (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  xhr_spec.js                              XX:XX       10       10        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX       10       10        -        -        -  


`

exports['e2e xhr / passes through CLI'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (xhr_spec.js)                                                              │
  │ Searched:   cypress/integration/xhr_spec.js                                                    │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  xhr_spec.js                                                                     (1 of 1)


  xhrs
    ✓ can encode + decode headers
    ✓ ensures that request headers + body go out and reach the server unscathed
    ✓ does not inject into json's contents from http server even requesting text/html
    ✓ does not inject into json's contents from file server even requesting text/html
    ✓ works prior to visit
    ✓ can stub a 100kb response
    ✓ spawns tasks with original NODE_OPTIONS
    server with 1 visit
      ✓ response body
      ✓ request body
      ✓ aborts


  10 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        10                                                                               │
  │ Passing:      10                                                                               │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     xhr_spec.js                                                                      │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/xhr_spec.js.mp4                     (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  xhr_spec.js                              XX:XX       10       10        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX       10       10        -        -        -  


`
