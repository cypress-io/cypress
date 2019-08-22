exports['cy.visit performance tests pass in chrome 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (fast_visit_spec.coffee)                                                   │
  │ Searched:   cypress/integration/fast_visit_spec.coffee                                         │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: fast_visit_spec.coffee...                                                       (1 of 1) 

Warning: Cypress can only record videos when using the built in 'electron' browser.

You have set the browser to: 'chrome'

A video will not be recorded when using this browser.


  on localhost 95% of visits are faster than XX:XX, 80% are faster than XX:XX
histogram line
histogram line
histogram line
histogram line
histogram line
histogram line
histogram line
histogram line
histogram line
histogram line
histogram line
histogram line
histogram line
histogram line
histogram line
    ✓ with connection: close
histogram line
histogram line
histogram line
histogram line
histogram line
histogram line
histogram line
histogram line
histogram line
histogram line
histogram line
histogram line
histogram line
histogram line
histogram line
    ✓ with connection: keep-alive


  2 passing


  (Results)

  ┌──────────────────────────────────────┐
  │ Tests:        2                      │
  │ Passing:      2                      │
  │ Failing:      0                      │
  │ Pending:      0                      │
  │ Skipped:      0                      │
  │ Screenshots:  0                      │
  │ Video:        false                  │
  │ Duration:     X seconds              │
  │ Spec Ran:     fast_visit_spec.coffee │
  └──────────────────────────────────────┘


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔ fast_visit_spec.coffee                    XX:XX        2        2        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    All specs passed!                           XX:XX        2        2        -        -        -  


`

exports['cy.visit performance tests pass in electron 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (fast_visit_spec.coffee)                                                   │
  │ Searched:   cypress/integration/fast_visit_spec.coffee                                         │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: fast_visit_spec.coffee...                                                       (1 of 1) 


  on localhost 95% of visits are faster than XX:XX, 80% are faster than XX:XX
histogram line
histogram line
histogram line
histogram line
histogram line
histogram line
histogram line
histogram line
histogram line
histogram line
histogram line
histogram line
histogram line
histogram line
histogram line
    ✓ with connection: close
histogram line
histogram line
histogram line
histogram line
histogram line
histogram line
histogram line
histogram line
histogram line
histogram line
histogram line
histogram line
histogram line
histogram line
histogram line
    ✓ with connection: keep-alive


  2 passing


  (Results)

  ┌──────────────────────────────────────┐
  │ Tests:        2                      │
  │ Passing:      2                      │
  │ Failing:      0                      │
  │ Pending:      0                      │
  │ Skipped:      0                      │
  │ Screenshots:  0                      │
  │ Video:        true                   │
  │ Duration:     X seconds              │
  │ Spec Ran:     fast_visit_spec.coffee │
  └──────────────────────────────────────┘


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔ fast_visit_spec.coffee                    XX:XX        2        2        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    All specs passed!                           XX:XX        2        2        -        -        -  


`
