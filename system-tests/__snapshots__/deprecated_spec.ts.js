exports['deprecated before:browser:launch args / push and no return - warns user exactly once'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (app_spec.js)                                                              │
  │ Searched:   cypress/integration/app_spec.js                                                    │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  app_spec.js                                                                     (1 of 1)
Deprecation Warning: The \`before:browser:launch\` plugin event changed its signature in version \`4.0.0\`

The \`before:browser:launch\` plugin event switched from yielding the second argument as an \`array\` of browser arguments to an options \`object\` with an \`args\` property.

We've detected that your code is still using the previous, deprecated interface signature.

This code will not work in a future version of Cypress. Please see the upgrade guide: https://on.cypress.io/deprecated-before-browser-launch-args


  ✓ asserts on browser args

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
  │ Spec Ran:     app_spec.js                                                                      │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  app_spec.js                              XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


`

exports['deprecated before:browser:launch args / using non-deprecated API - no warning'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (app_spec.js)                                                              │
  │ Searched:   cypress/integration/app_spec.js                                                    │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  app_spec.js                                                                     (1 of 1)


  ✓ asserts on browser args

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
  │ Spec Ran:     app_spec.js                                                                      │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  app_spec.js                              XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


`

exports['deprecated before:browser:launch args / no mutate return'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (app_spec.js)                                                              │
  │ Searched:   cypress/integration/app_spec.js                                                    │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  app_spec.js                                                                     (1 of 1)


  ✓ asserts on browser args

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
  │ Spec Ran:     app_spec.js                                                                      │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  app_spec.js                              XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


`

exports['deprecated before:browser:launch args / concat return returns once per spec'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      2 found (app_spec.js, app_spec2.js)                                                │
  │ Searched:   cypress/integration/app_spec.js, cypress/integration/app_spec2.js                  │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  app_spec.js                                                                     (1 of 2)
Deprecation Warning: The \`before:browser:launch\` plugin event changed its signature in version \`4.0.0\`

The \`before:browser:launch\` plugin event switched from yielding the second argument as an \`array\` of browser arguments to an options \`object\` with an \`args\` property.

We've detected that your code is still using the previous, deprecated interface signature.

This code will not work in a future version of Cypress. Please see the upgrade guide: https://on.cypress.io/deprecated-before-browser-launch-args


  ✓ asserts on browser args

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
  │ Spec Ran:     app_spec.js                                                                      │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  app_spec2.js                                                                    (2 of 2)
Deprecation Warning: The \`before:browser:launch\` plugin event changed its signature in version \`4.0.0\`

The \`before:browser:launch\` plugin event switched from yielding the second argument as an \`array\` of browser arguments to an options \`object\` with an \`args\` property.

We've detected that your code is still using the previous, deprecated interface signature.

This code will not work in a future version of Cypress. Please see the upgrade guide: https://on.cypress.io/deprecated-before-browser-launch-args


  ✓ 2 - asserts on browser args

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
  │ Spec Ran:     app_spec2.js                                                                     │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  app_spec.js                              XX:XX        1        1        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  app_spec2.js                             XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        2        2        -        -        -  


`

exports['deprecated before:browser:launch args / fails when adding unknown properties to launchOptions'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (app_spec.js)                                                              │
  │ Searched:   cypress/integration/app_spec.js                                                    │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  app_spec.js                                                                     (1 of 1)
The \`launchOptions\` object returned by your plugin's \`before:browser:launch\` handler contained unexpected properties:

- foo
- width
- height

\`launchOptions\` may only contain the properties:

- preferences
- extensions
- args

https://on.cypress.io/browser-launch-api

`

exports['deprecated before:browser:launch args / displays errors thrown and aborts the run'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      2 found (app_spec.js, app_spec2.js)                                                │
  │ Searched:   cypress/integration/app_spec.js, cypress/integration/app_spec2.js                  │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  app_spec.js                                                                     (1 of 2)
Error thrown from plugins handler
Error: Error thrown from plugins handler
      [stack trace lines]
`

exports['deprecated before:browser:launch args / displays promises rejected and aborts the run'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      2 found (app_spec.js, app_spec2.js)                                                │
  │ Searched:   cypress/integration/app_spec.js, cypress/integration/app_spec2.js                  │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  app_spec.js                                                                     (1 of 2)
Promise rejected from plugins handler
Error: Promise rejected from plugins handler
      [stack trace lines]
`
