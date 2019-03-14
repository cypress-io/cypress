exports['e2e launching browsers by path fails with bad browser path 1'] = `
We could not identify a known browser at the path you provided: \`/this/aint/gonna/be/found\`

The output from the command we ran was:

 Command failed: /bin/sh -c /this/aint/gonna/be/found --version
/bin/sh: 1: /this/aint/gonna/be/found: not found


`

exports['e2e launching browsers by path works with an installed browser path 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    Custom FooBrowser 88                                                               │
  │ Specs:      1 found (simple_spec.coffee)                                                       │
  │ Searched:   cypress/integration/simple_spec.coffee                                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: simple_spec.coffee...                                                           (1 of 1) 

Warning: Cypress can only record videos when using the built in 'electron' browser.

You have set the browser to: 'chrome'

A video will not be recorded when using this browser.


  ✓ is true

  1 passing


  (Results)

  ┌──────────────────────────────────┐
  │ Tests:        1                  │
  │ Passing:      1                  │
  │ Failing:      0                  │
  │ Pending:      0                  │
  │ Skipped:      0                  │
  │ Screenshots:  0                  │
  │ Video:        false              │
  │ Duration:     X seconds          │
  │ Spec Ran:     simple_spec.coffee │
  └──────────────────────────────────┘


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔ simple_spec.coffee                        XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    All specs passed!                           XX:XX        1        1        -        -        -  


`