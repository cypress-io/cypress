exports['e2e sessions / session tests'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (session.cy.js)                                                            │
  │ Searched:   cypress/e2e/session.cy.js                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  session.cy.js                                                                   (1 of 1)


  cross origin automations
    ✓ get storage
    ✓ get storage w/ sessionStorage
    ✓ set storage
    ✓ get localStorage from all origins
    ✓ only gets localStorage from origins visited in test

  args
    ✓ accepts string or object as id
    ✓ uses sorted stringify and rejects duplicate registrations

  with a blank session
    ✓ t1
    ✓ t2

  clears session data beforeEach test even with no session
    ✓ t1
    ✓ t2

  navigates to about:blank between tests and shows warning about session lifecycle
    ✓ t1
    ✓ t2

  navigates to special about:blank after session
    ✓ t1
    ✓ t2

  save/restore session with cookies and localStorage
    ✓ t1
    ✓ t2

  multiple sessions in test
    ✓ switch session during test

  multiple sessions in test - can switch without redefining
    ✓ switch session during test

  options.validate reruns steps when returning false
    ✓ t1
    ✓ t2

  options.validate reruns steps when resolving false
    ✓ t1
    ✓ t2

  options.validate reruns steps when rejecting
    ✓ t1
    ✓ t2

  options.validate reruns steps when throwing
    ✓ t1
    ✓ t2

  options.validate reruns steps when resolving false in cypress command
    ✓ t1
    ✓ t2

  options.validate reruns steps when resolving false in cypress chainer
    ✓ t1
    ✓ t2

  options.validate reruns steps when failing cypress command
    ✓ t1
    ✓ t2

  options.validate reruns steps when failing cy.request
    ✓ t1
    ✓ t2

  options.validate failing test
    ✓ test fails when options.validate after setup fails command
    ✓ test fails when options.validate after setup throws
    ✓ test fails when options.validate after setup rejects
    ✓ test fails when options.validate after setup returns false
    ✓ test fails when options.validate after setup resolves false
    ✓ test fails when options.validate after setup returns Chainer<false>

  can wait for login redirect automatically
    ✓ t1

  can wait for a js redirect with an assertion
    ✓ t1

  same session name, different options, multiple tests
    ✓ t1
    ✓ t2

  consoleProps
    - t1

  ignores setting insecure context data when on secure context
    no cross origin secure origins, nothing to clear
      ✓ sets insecure content
      ✓ nothing to clear - 1/2
      ✓ nothing to clear - 2/2
    only secure origins cleared
      ✓ sets insecure content
      ✓ switches to secure context - clears only secure context data - 1/2
      ✓ clears only secure context data - 2/2

  errors
    ✓ throws error when experimentalSessionSupport not enabled
    ✓ throws if session has not been defined during current test
    ✓ throws if multiple session calls with same name but different options


  54 passing
  1 pending


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        55                                                                               │
  │ Passing:      54                                                                               │
  │ Failing:      0                                                                                │
  │ Pending:      1                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     session.cy.js                                                                    │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  session.cy.js                            XX:XX       55       54        -        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX       55       54        -        1        -  


`

exports['e2e sessions / sessions persist on reload, and clear between specs'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      2 found (session_persist_spec_1.js, session_persist_spec_2.js)                     │
  │ Searched:   cypress/e2e/session_persist_spec_1.js, cypress/e2e/session_persist_spec_2.js       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  session_persist_spec_1.js                                                       (1 of 2)


  persist saved sessions between spec reruns


  persist saved sessions between spec reruns
    ✓ sets session


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
  │ Spec Ran:     session_persist_spec_1.js                                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  session_persist_spec_2.js                                                       (2 of 2)


  after running spec with saved session
    ✓ has an initially blank session on new spec


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
  │ Spec Ran:     session_persist_spec_2.js                                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  session_persist_spec_1.js                XX:XX        1        1        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  session_persist_spec_2.js                XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        2        2        -        -        -  


`
