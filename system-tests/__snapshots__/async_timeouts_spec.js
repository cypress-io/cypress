exports['e2e async timeouts / failing1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (async_timeouts_spec.js)                                                   │
  │ Searched:   cypress/integration/async_timeouts_spec.js                                         │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  async_timeouts_spec.js                                                          (1 of 1)


  async
    1) bar fails
    2) fails async after cypress command


  0 passing
  2 failing

  1) async
       bar fails:
     CypressError: Timed out after \`100ms\`. The \`done()\` callback was never invoked!
      [stack trace lines]

  2) async
       fails async after cypress command:
     CypressError: Timed out after \`100ms\`. The \`done()\` callback was never invoked!
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      2                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  2                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     async_timeouts_spec.js                                                           │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/async_timeouts_spec.js/async -- bar fails (fail     (1280x720)
     ed).png                                                                                        
  -  /XXX/XXX/XXX/cypress/screenshots/async_timeouts_spec.js/async -- fails async aft     (1280x720)
     er cypress command (failed).png                                                                


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/async_timeouts_spec.js.mp4          (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  async_timeouts_spec.js                   XX:XX        2        -        2        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        2        -        2        -        -  


`
