exports['e2e sessions / useSession/defineSession + utils test'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (session_spec.js)                                                          │
  │ Searched:   cypress/integration/session_spec.js                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  session_spec.js                                                                 (1 of 1)


  cross origin automations
    ✓ get localStorage
    ✓ set localStorage
    ✓ get localStorage from all origins
    ✓ only gets localStorage from origins visited in test

  with a blank session
    ✓ t1
    ✓ t2

  clears session data beforeEach test even with no useSession
    ✓ t1
    ✓ t2

  navigates to about:blank between tests
    ✓ t1
    ✓ t2

  navigates to special about:blank after useSession
    ✓ t1
    ✓ t2

  save/restore session with cookies and localStorage
    ✓ t1
    ✓ t2

  multiple sessions in test
    ✓ switch session during test

  session hooks - before/after
    ✓ t1
    ✓ t2

  options.validate called on subsequent useSessions
    ✓ t1
    ✓ t2

  options.validate returning false reruns steps
    ✓ t1
    ✓ t2

  consoleProps
    ✓ t1

  errors
    ✓ throws error when experimentalSessionSupport not enabled
    ✓ throws if multiple defineSession calls with same name


  24 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        24                                                                               │
  │ Passing:      24                                                                               │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     session_spec.js                                                                  │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  session_spec.js                          XX:XX       24       24        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX       24       24        -        -        -  


`
