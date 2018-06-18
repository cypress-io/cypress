exports['e2e plugins fails 1'] = `
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

Error: The following error was thrown by a plugin. We've stopped running your tests because a plugin crashed.

Error: Async error from plugins file
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
  - Finished processing:  /foo/bar/.projects/plugins-async-error/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖ app_spec.coffee                           XX:XX        -        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    1 of 1 failed (100%)                        XX:XX        -        -        1        -        -  

`

exports['e2e plugins passes 1'] = `
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

exports['e2e plugins can modify config from plugins 1'] = `
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
  - Finished processing:  /foo/bar/.projects/plugin-config/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔ app_spec.coffee                           XX:XX        2        2        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    All specs passed!                           XX:XX        2        2        -        -        -  

`

exports['e2e plugins works with user extensions 1'] = `
====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                          │
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

exports['e2e plugins handles absolute path to pluginsFile 1'] = `
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


  ✓ uses the plugins file

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
  - Finished processing:  /foo/bar/.projects/plugins-absolute-path/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔ absolute_spec.coffee                      XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    All specs passed!                           XX:XX        1        1        -        -        -  

`

