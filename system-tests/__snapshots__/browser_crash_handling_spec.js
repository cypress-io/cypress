exports['Browser Crash Handling / when the tab crashes in chrome / fails'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      2 found (chrome_tab_crash.cy.js, simple.cy.js)                                     │
  │ Searched:   cypress/e2e/chrome_tab_crash.cy.js, cypress/e2e/simple.cy.js                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  chrome_tab_crash.cy.js                                                          (1 of 2)



We detected that the Chromium Renderer process just crashed.

This is the equivalent to seeing the 'sad face' when Chrome dies.

This can happen for a number of different reasons:

- You wrote an endless loop and you must fix your own code
- You are running Docker (there is an easy fix for this: see link below)
- You are running lots of tests on a memory intense application.
    - Try enabling experimentalMemoryManagement in your config file.
    - Try lowering numTestsKeptInMemory in your config file.
- You are running in a memory starved VM environment.
    - Try enabling experimentalMemoryManagement in your config file.
    - Try lowering numTestsKeptInMemory in your config file.
- There are problems with your GPU / GPU drivers
- There are browser bugs in Chromium

You can learn more including how to fix Docker here:

https://on.cypress.io/renderer-process-crashed

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
  │ Spec Ran:     chrome_tab_crash.cy.js                                                           │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: X second(s)                                                

  -  Video output: /XXX/XXX/XXX/cypress/videos/chrome_tab_crash.cy.js.mp4


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  simple.cy.js                                                                    (2 of 2)


  ✓ is true

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
  │ Spec Ran:     simple.cy.js                                                                     │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: X second(s)                                                

  -  Video output: /XXX/XXX/XXX/cypress/videos/simple.cy.js.mp4


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  chrome_tab_crash.cy.js                   XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  simple.cy.js                             XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 2 failed (50%)                      XX:XX        1        1        1        -        -  


`

exports['Browser Crash Handling / when the tab crashes in electron / fails'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      2 found (chrome_tab_crash.cy.js, simple.cy.js)                                     │
  │ Searched:   cypress/e2e/chrome_tab_crash.cy.js, cypress/e2e/simple.cy.js                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  chrome_tab_crash.cy.js                                                          (1 of 2)



We detected that the Chromium Renderer process just crashed.

This is the equivalent to seeing the 'sad face' when Chrome dies.

This can happen for a number of different reasons:

- You wrote an endless loop and you must fix your own code
- You are running Docker (there is an easy fix for this: see link below)
- You are running lots of tests on a memory intense application.
    - Try enabling experimentalMemoryManagement in your config file.
    - Try lowering numTestsKeptInMemory in your config file.
- You are running in a memory starved VM environment.
    - Try enabling experimentalMemoryManagement in your config file.
    - Try lowering numTestsKeptInMemory in your config file.
- There are problems with your GPU / GPU drivers
- There are browser bugs in Chromium

You can learn more including how to fix Docker here:

https://on.cypress.io/renderer-process-crashed

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
  │ Spec Ran:     chrome_tab_crash.cy.js                                                           │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: X second(s)                                                

  -  Video output: /XXX/XXX/XXX/cypress/videos/chrome_tab_crash.cy.js.mp4


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  simple.cy.js                                                                    (2 of 2)


  ✓ is true

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
  │ Spec Ran:     simple.cy.js                                                                     │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: X second(s)                                                

  -  Video output: /XXX/XXX/XXX/cypress/videos/simple.cy.js.mp4


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  chrome_tab_crash.cy.js                   XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  simple.cy.js                             XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 2 failed (50%)                      XX:XX        1        1        1        -        -  


`

exports['Browser Crash Handling / when the browser process crashes in chrome / fails'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      2 found (chrome_process_crash.cy.js, simple.cy.js)                                 │
  │ Searched:   cypress/e2e/chrome_process_crash.cy.js, cypress/e2e/simple.cy.js                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  chrome_process_crash.cy.js                                                      (1 of 2)



We detected that the Chrome process just crashed with code 'null' and signal 'SIGTRAP'.

We have failed the current test and have relaunched Chrome.

This can happen for many different reasons:

- You wrote an endless loop and you must fix your own code
- You are running lots of tests on a memory intense application
- You are running in a memory starved VM environment
- There are problems with your GPU / GPU drivers
- There are browser bugs

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
  │ Spec Ran:     chrome_process_crash.cy.js                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: X second(s)                                                

  -  Video output: /XXX/XXX/XXX/cypress/videos/chrome_process_crash.cy.js.mp4


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  simple.cy.js                                                                    (2 of 2)


  ✓ is true

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
  │ Spec Ran:     simple.cy.js                                                                     │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: X second(s)                                                

  -  Video output: /XXX/XXX/XXX/cypress/videos/simple.cy.js.mp4


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  chrome_process_crash.cy.js               XX:XX        -        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  simple.cy.js                             XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 2 failed (50%)                      XX:XX        1        1        1        -        -  


`

exports['Browser Crash Handling / when the browser process crashes in electron / fails'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      2 found (chrome_process_crash.cy.js, simple.cy.js)                                 │
  │ Searched:   cypress/e2e/chrome_process_crash.cy.js, cypress/e2e/simple.cy.js                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  chrome_process_crash.cy.js                                                      (1 of 2)



`
