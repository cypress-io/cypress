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


  a test suite with a browser crash
    ✓ navigates to about:blank

We detected that the Chrome Renderer process just crashed.

We have failed the current spec but will continue running the next spec.

This can happen for a number of different reasons.

If you're running lots of tests on a memory intense application.
  - Try increasing the CPU/memory on the machine you're running on.
  - Try enabling experimentalMemoryManagement in your config file.
  - Try lowering numTestsKeptInMemory in your config file during 'cypress open'.

You can learn more here:

https://on.cypress.io/renderer-process-crashed

  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     chrome_tab_crash.cy.js                                                           │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


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
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     simple.cy.js                                                                     │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  chrome_tab_crash.cy.js                   XX:XX        2        1        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  simple.cy.js                             XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 2 failed (50%)                      XX:XX        3        2        1        -        -  


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


  a test suite with a browser crash
    ✓ navigates to about:blank

We detected that the Electron Renderer process just crashed.

We have failed the current spec but will continue running the next spec.

This can happen for a number of different reasons.

If you're running lots of tests on a memory intense application.
  - Try increasing the CPU/memory on the machine you're running on.
  - Try enabling experimentalMemoryManagement in your config file.
  - Try lowering numTestsKeptInMemory in your config file during 'cypress open'.

You can learn more here:

https://on.cypress.io/renderer-process-crashed

  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     chrome_tab_crash.cy.js                                                           │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


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
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     simple.cy.js                                                                     │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  chrome_tab_crash.cy.js                   XX:XX        2        1        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  simple.cy.js                             XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 2 failed (50%)                      XX:XX        3        2        1        -        -  


`

exports['Browser Crash Handling / when the browser process crashes in chrome / fails w/ video off'] = `

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

We have failed the current spec but will continue running the next spec.

This can happen for many different reasons:

- You wrote an endless loop and you must fix your own code
- You are running lots of tests on a memory intense application
- You are running in a memory starved VM environment
- There are problems with your GPU / GPU drivers
- There are browser bugs

  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     chrome_process_crash.cy.js                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


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
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     simple.cy.js                                                                     │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  chrome_process_crash.cy.js               XX:XX        1        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  simple.cy.js                             XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 2 failed (50%)                      XX:XX        2        1        1        -        -  


`

exports['Browser Crash Handling / when the browser process crashes in chrome / fails w/ video on'] = `

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

We have failed the current spec but will continue running the next spec.

This can happen for many different reasons:

- You wrote an endless loop and you must fix your own code
- You are running lots of tests on a memory intense application
- You are running in a memory starved VM environment
- There are problems with your GPU / GPU drivers
- There are browser bugs

  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
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

  -  Video output: /XXX/XXX/XXX/cypress/videos/simple.cy.js.mp4


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  chrome_process_crash.cy.js               XX:XX        1        -        1        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  simple.cy.js                             XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 2 failed (50%)                      XX:XX        2        1        1        -        -  


`

exports['Browser Crash Handling / when the window closes mid launch of the browser process / passes'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      2 found (abort_beforeunload_event_child.cy.ts, abort_beforeunload_event.cy.ts)     │
  │ Searched:   cypress/e2e/abort_beforeunload_event_child.cy.ts, cypress/e2e/abort_beforeunload_e │
  │             vent.cy.ts                                                                         │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  abort_beforeunload_event_child.cy.ts                                            (1 of 2)


  ✓ will exit even if an beforeload event dialog is present in a child window

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
  │ Spec Ran:     abort_beforeunload_event_child.cy.ts                                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  abort_beforeunload_event.cy.ts                                                  (2 of 2)


  ✓ will exit even if an beforeload event dialog is present

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
  │ Spec Ran:     abort_beforeunload_event.cy.ts                                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  abort_beforeunload_event_child.cy.t      XX:XX        1        1        -        -        - │
  │    s                                                                                           │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  abort_beforeunload_event.cy.ts           XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        2        2        -        -        -  


`

exports['Browser Crash Handling / when the browser process is killed in chrome / fails'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      2 found (chrome_process_kill.cy.js, simple.cy.js)                                  │
  │ Searched:   cypress/e2e/chrome_process_kill.cy.js, cypress/e2e/simple.cy.js                    │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  chrome_process_kill.cy.js                                                       (1 of 2)


We detected that the Chrome browser process closed unexpectedly.

We have failed the current spec and aborted the run.

`

exports['Browser Crash Handling / when the tab closes in chrome / fails'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      2 found (chrome_tab_close.cy.js, simple.cy.js)                                     │
  │ Searched:   cypress/e2e/chrome_tab_close.cy.js, cypress/e2e/simple.cy.js                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  chrome_tab_close.cy.js                                                          (1 of 2)


We detected that the Chrome tab running Cypress tests closed unexpectedly.

We have failed the current spec and aborted the run.

`

exports['Browser Crash Handling / when the tab closes in electron / fails'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      2 found (chrome_tab_close.cy.js, simple.cy.js)                                     │
  │ Searched:   cypress/e2e/chrome_tab_close.cy.js, cypress/e2e/simple.cy.js                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  chrome_tab_close.cy.js                                                          (1 of 2)


We detected that the electron tab running Cypress tests closed unexpectedly.

We have failed the current spec and aborted the run.

`
