exports['e2e browser crashing / gracefully handles CDP-simulated crashes'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      4 found (browser_crashing_sadface1_spec.js, browser_crashing_sadface2_spec.js, bro │
  │             wser_crashing_sadface3_spec.js, browser_crashing_sadface4_spec.js)                 │
  │ Searched:   cypress/integration/browser_crashing_sadface*_spec.js                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  browser_crashing_sadface1_spec.js                                               (1 of 4)


  e2e browser sadface1 spec

We detected that the FooBrowser process running your tests just exited unexpectedly.

This error occurs whenever Cypress detects the browser exited before tests could finish running.

Learn more at https://on.cypress.io/browser-process-crashed

  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        0                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     browser_crashing_sadface1_spec.js                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/browser_crashing_sadface1_spec.     (X second)
                          js.mp4                                                                    


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  browser_crashing_sadface2_spec.js                                               (2 of 4)


  e2e browser sadface2 spec
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
  │ Spec Ran:     browser_crashing_sadface2_spec.js                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/browser_crashing_sadface2_spec.     (X second)
                          js.mp4                                                                    


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  browser_crashing_sadface3_spec.js                                               (3 of 4)


  e2e browser sadface3 spec

We detected that the FooBrowser process running your tests just exited unexpectedly.

This error occurs whenever Cypress detects the browser exited before tests could finish running.

Learn more at https://on.cypress.io/browser-process-crashed

  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        0                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     browser_crashing_sadface3_spec.js                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/browser_crashing_sadface3_spec.     (X second)
                          js.mp4                                                                    


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  browser_crashing_sadface4_spec.js                                               (4 of 4)


  e2e browser sadface4 spec
    1) fails


  0 passing
  1 failing

  1) e2e browser sadface4 spec fails:
     Error: foo
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     browser_crashing_sadface4_spec.js                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/browser_crashing_sadface4_spec.js/e2e browser s     (1280x720)
     adface4 spec -- fails (failed).png                                                             


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/browser_crashing_sadface4_spec.     (X second)
                          js.mp4                                                                    


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  browser_crashing_sadface1_spec.js        XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  browser_crashing_sadface2_spec.js        XX:XX        1        1        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  browser_crashing_sadface3_spec.js        XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  browser_crashing_sadface4_spec.js        XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  3 of 4 failed (75%)                      XX:XX        2        1        3        -        -  


`
