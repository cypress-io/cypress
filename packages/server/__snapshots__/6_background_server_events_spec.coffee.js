exports['e2e background server events sends server events 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      2 found (background_server_events_1_spec.coffee, background_server_events_2_spec.… │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘

before:run cypress/integration/background_server_events_1_spec.coffee
before:run is awaited

────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: background_server_events_1_spec.coffee...                                       (1 of 2) 
before:spec: cypress/integration/background_server_events_1_spec.coffee
before:spec is awaited


  ✓ passes

  1 passing


  (Results)

  ┌──────────────────────────────────────────────────────┐
  │ Tests:        1                                      │
  │ Passing:      1                                      │
  │ Failing:      0                                      │
  │ Pending:      0                                      │
  │ Skipped:      0                                      │
  │ Screenshots:  0                                      │
  │ Video:        true                                   │
  │ Duration:     X seconds                              │
  │ Spec Ran:     background_server_events_1_spec.coffee │
  └──────────────────────────────────────────────────────┘


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/background-server-events/cypress/videos/abc123.mp4 (X seconds)

after:spec: cypress/integration/background_server_events_1_spec.coffee { tests: 1, passes: 1, failures: 0 }
after:spec is awaited

────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: background_server_events_2_spec.coffee...                                       (2 of 2) 
before:spec: cypress/integration/background_server_events_2_spec.coffee
before:spec is awaited


  1) fails

  0 passing
  1 failing

  1)  fails:

      AssertionError: expected true to be false
      + expected - actual

      -true
      +false
      
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

  ┌──────────────────────────────────────────────────────┐
  │ Tests:        1                                      │
  │ Passing:      0                                      │
  │ Failing:      1                                      │
  │ Pending:      0                                      │
  │ Skipped:      0                                      │
  │ Screenshots:  1                                      │
  │ Video:        true                                   │
  │ Duration:     X seconds                              │
  │ Spec Ran:     background_server_events_2_spec.coffee │
  └──────────────────────────────────────────────────────┘


  (Screenshots)

  - /foo/bar/.projects/background-server-events/cypress/screenshots/background_server_events_2_spec.coffee/fails (failed).png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/background-server-events/cypress/videos/abc123.mp4 (X seconds)

after:spec: cypress/integration/background_server_events_2_spec.coffee { tests: 1, passes: 0, failures: 1 }
after:spec is awaited
after:run: { totalTests: 2, totalPassed: 1, totalFailed: 1 }
after:run is awaited

====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔ background_server_events_1_spec.coff…     XX:XX        1        1        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖ background_server_events_2_spec.coff…     XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    1 of 2 failed (50%)                         XX:XX        2        1        1        -        -  


`

exports['e2e background server events fails run if server event handler throws 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (background_server_events_throw.coffee)                                    │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: background_server_events_throw.coffee...                                        (1 of 1) 
An error was thrown in your background file while executing the handler for the 'before:spec' event.

The error we received was:

Error: before:spec throws error
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


`
