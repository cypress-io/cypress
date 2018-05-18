exports['e2e domain passing 1'] = `
====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (domain_spec.coffee)                                                       │
  │ Searched:   cypress/integration/domain_spec.coffee                                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: domain_spec.coffee...                                                           (1 of 1) 


  localhost
    ✓ can visit

  com.au
    ✓ can visit

  herokuapp.com
    ✓ can visit


  3 passing


  (Results)

  ┌──────────────────────────────────┐
  │ Tests:        3                  │
  │ Passing:      3                  │
  │ Failing:      0                  │
  │ Pending:      0                  │
  │ Skipped:      0                  │
  │ Screenshots:  0                  │
  │ Video:        true               │
  │ Duration:     X seconds          │
  │ Spec Ran:     domain_spec.coffee │
  └──────────────────────────────────┘


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔ domain_spec.coffee                           Xs        3        3        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    All specs passed!                              Xs        3        3        -        -        -  

`

