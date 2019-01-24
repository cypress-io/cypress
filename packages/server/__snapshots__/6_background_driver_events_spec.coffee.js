exports['e2e background driver events sends driver events 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (background_driver_events_spec.coffee)                                     │
  │ Searched:   cypress/integration/background_driver_events_spec.coffee                           │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: background_driver_events_spec.coffee...                                         (1 of 1) 


test:start: fails to get
An error was thrown in your background file while executing the handler for the 'test:start' event.

This error is being ignored because the event cannot affect the results of the run.

The error we received was:

Error: Error thrown synchronously from "test:start". Should be ignored.
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

internal:commandEnqueue: log you had logs?
internal:commandEnqueue: get #non-existent
internal:commandStart: log you had logs?
internal:commandEnd: log you had logs?
internal:commandStart: get #non-existent
internal:commandRetry: get expected '#non-existent' to exist in the DOM
  1) fails to get
test:end: fails to get

The following error was thrown by a plugin in the background process. We've stopped running your tests because the background process crashed.

Error: Error thrown in promise from "test:end". Should be ignored.
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

  ┌────────────────────────────────────────────────────┐
  │ Tests:        0                                    │
  │ Passing:      0                                    │
  │ Failing:      1                                    │
  │ Pending:      0                                    │
  │ Skipped:      0                                    │
  │ Screenshots:  1                                    │
  │ Video:        true                                 │
  │ Duration:     X seconds                            │
  │ Spec Ran:     background_driver_events_spec.coffee │
  └────────────────────────────────────────────────────┘


  (Screenshots)

  - /foo/bar/.projects/background-driver-events/cypress/screenshots/background_driver_events_spec.coffee/fails to get (failed).png (1280x720)


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




  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/background-driver-events/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖ background_driver_events_spec.coffee      XX:XX        -        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    1 of 1 failed (100%)                        XX:XX        -        -        1        -        -  


`
