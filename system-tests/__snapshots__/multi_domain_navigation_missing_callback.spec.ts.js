exports['e2e multi domain errors / captures the stack trace correctly for multi-domain errors to point users to their "switchToDomain" callback'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (multi_domain_navigation_missing_callback_spec.ts)                         │
  │ Searched:   cypress/integration/multi_domain_navigation_missing_callback_spec.ts               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  multi_domain_navigation_missing_callback_spec.ts                                (1 of 1)


  multi-domain - navigation missing callback
    ✓ passes since switchToDomain callback exists
    1) fails since switchToDomain callback is not registered for new cross origin domain
    ✓ passes since switchToDomain callback exists


  2 passing
  1 failing

  1) multi-domain - navigation missing callback
       fails since switchToDomain callback is not registered for new cross origin domain:
     CypressError: Cypress detected a cross origin error happened on page load:

  > [Cross origin error message]

Before the page load, you were bound to the origin policy:

  > http://localhost:3500

A cross origin error happens when your application navigates to a new URL which does not match the origin policy above.

A new URL does not match the origin policy if the 'protocol', 'port' (if specified), and/or 'host' (unless of the same superdomain) are different.

If cross origin navigation was intentional, \`cy.switchToDomain()\` needs to immediately follow a cross origin navigation event.  

Otherwise, Cypress does not allow you to navigate to a different origin URL within a single test.

https://on.cypress.io/switch-to-domain
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        3                                                                                │
  │ Passing:      2                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     multi_domain_navigation_missing_callback_spec.ts                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/multi_domain_navigation_missing_callback_spec.t     (1280x720)
     s/multi-domain - navigation missing callback -- fails since switchToDomain callb               
     ack is not registered for new cross origin domain (failed).png                                 


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/multi_domain_navigation_missing     (X second)
                          _callback_spec.ts.mp4                                                     


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  multi_domain_navigation_missing_cal      XX:XX        3        2        1        -        - │
  │    lback_spec.ts                                                                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        3        2        1        -        -  


`
