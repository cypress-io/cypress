exports['e2e config passes 1'] = `
====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (config_passing_spec.coffee)                                               │
  │ Searched:   cypress/integration/config_passing_spec.coffee                                     │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: config_passing_spec.coffee...                                                   (1 of 1) 


  Cypress.config()
    ✓ has Cypress.version set to a string
    ✓ has os platform
    ✓ has os architecture


  3 passing


  (Results)

  ┌──────────────────────────────────────────┐
  │ Tests:        3                          │
  │ Passing:      3                          │
  │ Failing:      0                          │
  │ Pending:      0                          │
  │ Skipped:      0                          │
  │ Screenshots:  0                          │
  │ Video:        true                       │
  │ Duration:     X seconds                  │
  │ Spec Ran:     config_passing_spec.coffee │
  └──────────────────────────────────────────┘


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔ config_passing_spec.coffee                   Xs        3        3        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    All specs passed!                              Xs        3        3        -        -        -  

`

exports['e2e config fails 1'] = `
====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (config_failing_spec.coffee)                                               │
  │ Searched:   cypress/integration/config_failing_spec.coffee                                     │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: config_failing_spec.coffee...                                                   (1 of 1) 


  config
    1) times out looking for a missing element


  0 passing
  1 failing

  1) config times out looking for a missing element:
     CypressError: Timed out retrying: Expected to find element: '#bar', but never found it.
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

  ┌──────────────────────────────────────────┐
  │ Tests:        1                          │
  │ Passing:      0                          │
  │ Failing:      1                          │
  │ Pending:      0                          │
  │ Skipped:      0                          │
  │ Screenshots:  1                          │
  │ Video:        true                       │
  │ Duration:     X seconds                  │
  │ Spec Ran:     config_failing_spec.coffee │
  └──────────────────────────────────────────┘


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/config -- times out looking for a missing element.png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖ config_failing_spec.coffee                   Xs        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    1 of 1 failed (100%)                           Xs        1        -        1        -        -  

`

