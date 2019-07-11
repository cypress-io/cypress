exports['e2e interception spec character encodings does not mangle iso-8859-1 text 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (iso-8859-1_spec.js)                                                       │
  │ Searched:   cypress/integration/iso-8859-1_spec.js                                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: iso-8859-1_spec.js...                                                           (1 of 1) 

Warning: Cypress can only record videos when using the built in 'electron' browser.

You have set the browser to: 'chrome'

A video will not be recorded when using this browser.


  Characters ISO-8859-1 tests
    without gzip
      ✓ Validation 1
      ✓ Validation 2
      ✓ Validation 3
      ✓ Validation 4
      ✓ Validation 4
      ✓ Validation 5
      ✓ Validation 6
    with gzip
      ✓ Validation 1
      ✓ Validation 2
      ✓ Validation 3
      ✓ Validation 4
      ✓ Validation 4
      ✓ Validation 5
      ✓ Validation 6


  14 passing


  (Results)

  ┌──────────────────────────────────┐
  │ Tests:        14                 │
  │ Passing:      14                 │
  │ Failing:      0                  │
  │ Pending:      0                  │
  │ Skipped:      0                  │
  │ Screenshots:  0                  │
  │ Video:        false              │
  │ Duration:     X seconds          │
  │ Spec Ran:     iso-8859-1_spec.js │
  └──────────────────────────────────┘


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔ iso-8859-1_spec.js                        XX:XX       14       14        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    All specs passed!                           XX:XX       14       14        -        -        -  


`
