exports['e2e sessions / handles spec and global sessions persistence on spec reload, and switching specs'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      2 found (session_persist_1.cy.js, session_persist_2.cy.js)                         │
  │ Searched:   cypress/e2e/session/session_persist_1.cy.js, cypress/e2e/session/session_persist_2 │
  │             .cy.js                                                                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  session_persist_1.cy.js                                                         (1 of 2)


  creates global session
    ✓ creates global sessions
    ✓ restores global session
    ✓ creates spec session
    ✓ restores spec session


  4 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        4                                                                                │
  │ Passing:      4                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     session_persist_1.cy.js                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  session_persist_2.cy.js                                                         (2 of 2)


  ✓ restores global session from last spec
  ✓ creates spec session since it is a new spec

  2 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      2                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     session_persist_2.cy.js                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  session_persist_1.cy.js                  XX:XX        4        4        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  session_persist_2.cy.js                  XX:XX        2        2        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        6        6        -        -        -  


`

exports['e2e sessions / session tests'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (session.cy.js)                                                            │
  │ Searched:   cypress/e2e/session/session.cy.js                                                  │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  session.cy.js                                                                   (1 of 1)


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

  can wait for login redirect automatically
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


  35 passing
  1 pending


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        36                                                                               │
  │ Passing:      35                                                                               │
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
  │ ✔  session.cy.js                            XX:XX       36       35        -        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX       36       35        -        1        -  


`
