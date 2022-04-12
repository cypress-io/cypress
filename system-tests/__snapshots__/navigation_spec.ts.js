exports['e2e cross origin navigation / captures cross origin failures when "experimentalSessionAndOrigin" config value is falsy'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:      1.2.3                                                                            │
  │ Browser:      FooBrowser 88                                                                    │
  │ Specs:        1 found (navigation_cross_origin_errors.ts)                                      │
  │ Searched:     cypress/integration/navigation_cross_origin_errors.ts                            │
  │ Experiments:  experimentalSessionAndOrigin=false                                                     │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  navigation_cross_origin_errors.ts                                               (1 of 1)


  navigation cross origin errors
    1) displays cross origin failures when "experimentalSessionAndOrigin" is turned off


  0 passing
  1 failing

  1) navigation cross origin errors
       displays cross origin failures when "experimentalSessionAndOrigin" is turned off:
     CypressError: Cypress detected a cross origin error happened on page load:

  > [Cross origin error message]

Before the page load, you were bound to the origin policy:

  > http://localhost:13370

A cross origin error happens when your application navigates to a new URL which does not match the origin policy above.

A new URL does not match the origin policy if the 'protocol', 'port' (if specified), and/or 'host' (unless of the same superdomain) are different.

Cypress does not allow you to navigate to a different origin URL within a single test.

You may need to restructure some of your test code to avoid this problem.

Alternatively you can also disable Chrome Web Security in Chromium-based browsers which will turn off this restriction by setting { chromeWebSecurity: false } in \`cypress.json\`.

https://on.cypress.io/cross-origin-violation
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
  │ Spec Ran:     navigation_cross_origin_errors.ts                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/navigation_cross_origin_errors.ts/navigation cr     (1280x720)
     oss origin errors -- displays cross origin failures when experimentalSessionAndOrigin                
     is turned off (failed).png                                                                     


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/navigation_cross_origin_errors.     (X second)
                          ts.mp4                                                                    


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  navigation_cross_origin_errors.ts        XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1        -        1        -        -  


`
