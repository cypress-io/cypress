exports['e2e background events fails 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (app_spec.coffee)                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: app_spec.coffee...                                                              (1 of 1) 



The following error was thrown by a plugin in the background process. We've stopped running your tests because the background process crashed.

Error: Async error from background file
    at stack trace line
    at stack trace line
    at stack trace line
    at stack trace line


  (Results)

  ┌───────────────────────────────┐
  │ Tests:        0               │
  │ Passing:      0               │
  │ Failing:      1               │
  │ Pending:      0               │
  │ Skipped:      0               │
  │ Screenshots:  0               │
  │ Video:        true            │
  │ Duration:     X seconds       │
  │ Spec Ran:     app_spec.coffee │
  └───────────────────────────────┘


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/background-async-error/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖ app_spec.coffee                           XX:XX        -        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    1 of 1 failed (100%)                        XX:XX        -        -        1        -        -  


`

exports['e2e background events passes 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (app_spec.coffee)                                                          │
  │ Searched:   cypress/integration/app_spec.coffee                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: app_spec.coffee...                                                              (1 of 1) 


  ✓ is another spec
  ✓ is another spec

  2 passing


  (Results)

  ┌───────────────────────────────┐
  │ Tests:        2               │
  │ Passing:      2               │
  │ Failing:      0               │
  │ Pending:      0               │
  │ Skipped:      0               │
  │ Screenshots:  0               │
  │ Video:        true            │
  │ Duration:     X seconds       │
  │ Spec Ran:     app_spec.coffee │
  └───────────────────────────────┘


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/working-preprocessor/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔ app_spec.coffee                           XX:XX        2        2        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    All specs passed!                           XX:XX        2        2        -        -        -  


`

exports['e2e background events can modify config from background 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (app_spec.coffee)                                                          │
  │ Searched:   cypress/integration/app_spec.coffee                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: app_spec.coffee...                                                              (1 of 1) 


  ✓ overrides config
  ✓ overrides env

  2 passing


  (Results)

  ┌───────────────────────────────┐
  │ Tests:        2               │
  │ Passing:      2               │
  │ Failing:      0               │
  │ Pending:      0               │
  │ Skipped:      0               │
  │ Screenshots:  0               │
  │ Video:        true            │
  │ Duration:     X seconds       │
  │ Spec Ran:     app_spec.coffee │
  └───────────────────────────────┘


  (Video)

  - Started processing:   Compressing to 20 CRF
  - Finished processing:  /foo/bar/.projects/background-config/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔ app_spec.coffee                           XX:XX        2        2        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    All specs passed!                           XX:XX        2        2        -        -        -  


`

exports['e2e background events works with user extensions 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (app_spec.coffee)                                                          │
  │ Searched:   cypress/integration/app_spec.coffee                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: app_spec.coffee...                                                              (1 of 1) 

Warning: Cypress can only record videos when using the built in 'electron' browser.

You have set the browser to: 'chrome'

A video will not be recorded when using this browser.


  ✓ can inject text from an extension

  1 passing


  (Results)

  ┌───────────────────────────────┐
  │ Tests:        1               │
  │ Passing:      1               │
  │ Failing:      0               │
  │ Pending:      0               │
  │ Skipped:      0               │
  │ Screenshots:  0               │
  │ Video:        false           │
  │ Duration:     X seconds       │
  │ Spec Ran:     app_spec.coffee │
  └───────────────────────────────┘


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔ app_spec.coffee                           XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    All specs passed!                           XX:XX        1        1        -        -        -  


`

exports['e2e background events handles absolute path to backgroundFile 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (absolute_spec.coffee)                                                     │
  │ Searched:   cypress/integration/absolute_spec.coffee                                           │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: absolute_spec.coffee...                                                         (1 of 1) 


  ✓ uses the background file

  1 passing


  (Results)

  ┌────────────────────────────────────┐
  │ Tests:        1                    │
  │ Passing:      1                    │
  │ Failing:      0                    │
  │ Pending:      0                    │
  │ Skipped:      0                    │
  │ Screenshots:  0                    │
  │ Video:        true                 │
  │ Duration:     X seconds            │
  │ Spec Ran:     absolute_spec.coffee │
  └────────────────────────────────────┘


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/background-absolute-path/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔ absolute_spec.coffee                      XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    All specs passed!                           XX:XX        1        1        -        -        -  


`

exports['e2e background events calls screenshot for cy.screenshot() and failure screenshots 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (after_screenshot_spec.coffee)                                             │
  │ Searched:   cypress/integration/after_screenshot_spec.coffee                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: after_screenshot_spec.coffee...                                                 (1 of 1) 


  ✓ cy.screenshot() - replacement
  ✓ cy.screenshot() - ignored values
  ✓ cy.screenshot() - invalid return
  1) failure screenshot - rename

  3 passing
  1 failing

  1)  failure screenshot - rename:
     Error: test error
      at stack trace line




  (Results)

  ┌────────────────────────────────────────────┐
  │ Tests:        4                            │
  │ Passing:      3                            │
  │ Failing:      1                            │
  │ Pending:      0                            │
  │ Skipped:      0                            │
  │ Screenshots:  4                            │
  │ Video:        true                         │
  │ Duration:     X seconds                    │
  │ Spec Ran:     after_screenshot_spec.coffee │
  └────────────────────────────────────────────┘


  (Screenshots)

  - /foo/bar/.projects/background-after-screenshot/screenshot-replacement.png (2x2)
  - /foo/bar/.projects/background-after-screenshot/cypress/screenshots/after_screenshot_spec.coffee/ignored-values.png (1280x720)
  - /foo/bar/.projects/background-after-screenshot/cypress/screenshots/after_screenshot_spec.coffee/invalid-return.png (1280x720)
  - /foo/bar/.projects/background-after-screenshot/screenshot-replacement.png (1x1)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/background-after-screenshot/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖ after_screenshot_spec.coffee              XX:XX        4        3        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    1 of 1 failed (100%)                        XX:XX        4        3        1        -        -  


`

exports['e2e background events errors when pluginsFile is used in config 1'] = `
A configuration option you have supplied has been renamed.

Please rename pluginsFile to backgroundFile

`

exports['e2e background events errors when backgroundFile path is default and plugins/index.js exists 1'] = `
The "plugins file" has been renamed to the "background file" and has a new default path.

Please rename
  cypress/plugins/index.js
to
  cypress/background/index.js

`
