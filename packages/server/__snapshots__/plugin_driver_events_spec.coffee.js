exports['e2e plugins sends driver events 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (plugin_driver_events_spec.coffee)                                         │
  │ Searched:   cypress/integration/plugin_driver_events_spec.coffee                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: plugin_driver_events_spec.coffee...                                             (1 of 1) 


before:test:run: fails to get
command:enqueued: log you had logs?
command:enqueued: get #non-existent
command:start: log you had logs?
command:end: log you had logs?
command:start: get #non-existent
command:retry: get expected '#non-existent' to exist in the DOM
  1) fails to get
after:test:run: fails to get

  0 passing
  1 failing

  1)  fails to get:
     CypressError: Timed out retrying: Expected to find element: '#non-existent', but never found it.
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

  ┌────────────────────────────────────────────────┐
  │ Tests:        1                                │
  │ Passing:      0                                │
  │ Failing:      1                                │
  │ Pending:      0                                │
  │ Skipped:      0                                │
  │ Screenshots:  1                                │
  │ Video:        true                             │
  │ Duration:     X seconds                        │
  │ Spec Ran:     plugin_driver_events_spec.coffee │
  └────────────────────────────────────────────────┘


  (Screenshots)

  - /foo/bar/.projects/plugin-driver-events/cypress/screenshots/plugin_driver_events_spec.coffee/fails to get (failed).png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/plugin-driver-events/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖ plugin_driver_events_spec.coffee          XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    1 of 1 failed (100%)                        XX:XX        1        -        1        -        -  


`
