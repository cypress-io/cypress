exports['e2e plugins preprocessor passes with working preprocessor 1'] = `

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


  ✓ is another spec
  ✓ is another spec

  2 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      2                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     app_spec.js                                                                      │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/app_spec.js.mp4                     (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  app_spec.js                              XX:XX        2        2        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        2        2        -        -        -  


`

exports['e2e plugins can modify config from plugins 1'] = `

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


  ✓ overrides config
  ✓ overrides env

  2 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      2                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     app_spec.js                                                                      │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 20 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/app_spec.js.mp4                     (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  app_spec.js                              XX:XX        2        2        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        2        2        -        -        -  


`

exports['e2e plugins catches invalid browsers list returned from plugins 1'] = `
An invalid configuration value returned from the plugins file: \`cypress/plugins/index.js\`

Expected at least one browser

`

exports['e2e plugins catches invalid browser returned from plugins 1'] = `
An invalid configuration value returned from the plugins file: \`cypress/plugins/index.js\`

Found an error while validating the \`browsers\` list. Expected \`displayName\` to be a non-empty string. Instead the value was: \`{"name":"browser name","family":"chromium"}\`

`

exports['e2e plugins can filter browsers from config 1'] = `
Can't run because you've entered an invalid browser name.

Browser: 'chrome' was not found on your system or is not supported by Cypress.

Cypress supports the following browsers:
- chrome
- chromium
- edge
- electron
- firefox

You can also use a custom browser: https://on.cypress.io/customize-browsers

Available browsers found on your system are:
- electron

`

exports['e2e plugins / works with user extensions'] = `

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


  ✓ can inject text from an extension

  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     app_spec.js                                                                      │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/app_spec.js.mp4                     (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  app_spec.js                              XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


`

exports['e2e plugins handles absolute path to pluginsFile 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (absolute_spec.js)                                                         │
  │ Searched:   cypress/integration/absolute_spec.js                                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  absolute_spec.js                                                                (1 of 1)


  ✓ uses the plugins file

  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     absolute_spec.js                                                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/absolute_spec.js.mp4                (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  absolute_spec.js                         XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


`

exports['e2e plugins calls after:screenshot for cy.screenshot() and failure screenshots 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (after_screenshot_spec.js)                                                 │
  │ Searched:   cypress/integration/after_screenshot_spec.js                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  after_screenshot_spec.js                                                        (1 of 1)


  ✓ cy.screenshot() - replacement
  ✓ cy.screenshot() - ignored values
  ✓ cy.screenshot() - invalid return
  1) failure screenshot - rename

  3 passing
  1 failing

  1) failure screenshot - rename:
     Error: test error
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        4                                                                                │
  │ Passing:      3                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  3                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     after_screenshot_spec.js                                                         │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/screenshot-replacement.png                                                   (YxX)
  -  /XXX/XXX/XXX/cypress/screenshots/after_screenshot_spec.js/ignored-values.png              (YxX)
  -  /XXX/XXX/XXX/cypress/screenshots/after_screenshot_spec.js/invalid-return.png              (YxX)


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/after_screenshot_spec.js.mp4        (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  after_screenshot_spec.js                 XX:XX        4        3        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        4        3        1        -        -  


`

exports['e2e plugins catches invalid viewportWidth returned from plugins 1'] = `
An invalid configuration value returned from the plugins file: \`cypress/plugins/index.js\`

Expected \`viewportWidth\` to be a number. Instead the value was: \`"foo"\`

`

exports['e2e plugins fails when there is an async error inside an event handler 1'] = `

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

The following error was thrown by a plugin. We stopped running your tests because a plugin crashed. Please check your plugins file (\`/foo/bar/.projects/plugins-async-error/cypress/plugins/index.js\`)

 Error: Async error from plugins file
      [stack trace lines]

  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        0                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     app_spec.js                                                                      │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/app_spec.js.mp4                     (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  app_spec.js                              XX:XX        -        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        -        -        1        -        -  


`

exports['e2e plugins fails when there is no function exported 1'] = `
The \`pluginsFile\` must export a function with the following signature:

\`\`\`
module.exports = function (on, config) {
  // configure plugins here
}
\`\`\`

Learn more: https://on.cypress.io/plugins-api

We loaded the \`pluginsFile\` from: \`/foo/bar/.projects/plugin-empty/cypress/plugins/index.js\`

It exported:

 {}

`

exports['e2e plugins fails when invalid event is registered 1'] = `
The following validation error was thrown by your plugins file (\`/foo/bar/.projects/plugin-validation-error/cypress/plugins/index.js\`).

 Error: You must pass a valid event name when registering a plugin.

You passed: \`invalid:event\`

The following are valid events:
- file:preprocessor
- before:browser:launch
- task
- after:screenshot

      [stack trace lines]
`

exports['e2e plugins does not report more screenshots than exist if user overwrites screenshot in afterScreenshot hook 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (after_screenshot_overwrite_spec.js)                                       │
  │ Searched:   cypress/integration/after_screenshot_overwrite_spec.js                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  after_screenshot_overwrite_spec.js                                              (1 of 1)


  ✓ cy.screenshot() - replacement
  ✓ cy.screenshot() - replacement
  ✓ cy.screenshot() - replacement

  3 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        3                                                                                │
  │ Passing:      3                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     after_screenshot_overwrite_spec.js                                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/screenshot-replacement.png                                                   (2x2)


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/after_screenshot_overwrite_spec     (X second)
                          .js.mp4                                                               


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  after_screenshot_overwrite_spec.js       XX:XX        3        3        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        3        3        -        -        -  


`

exports['e2e plugins does not report more screenshots than exist if user overwrites previous screenshot in afterScreenshot 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (after_screenshot_overwrite_spec.js)                                       │
  │ Searched:   cypress/integration/after_screenshot_overwrite_spec.js                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  after_screenshot_overwrite_spec.js                                              (1 of 1)


  ✓ cy.screenshot() - replacement
  ✓ cy.screenshot() - replacement
  ✓ cy.screenshot() - replacement

  3 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        3                                                                                │
  │ Passing:      3                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     after_screenshot_overwrite_spec.js                                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/screenshot-replacement.png                                                   (2x2)


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/after_screenshot_overwrite_spec     (X second)
                          .js.mp4                                                                   


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  after_screenshot_overwrite_spec.js       XX:XX        3        3        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        3        3        -        -        -  


`
