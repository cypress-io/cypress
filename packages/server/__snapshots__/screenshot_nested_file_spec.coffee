exports['e2e screenshot in nested spec passes 1'] = `
====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (nested-1/nested-2/screenshot_nested_file_spec.coffee)                     │
  │ Searched:   cypress/integration/nested-1/nested-2/screenshot_nested_file_spec.coffee           │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: nested-1/nested-2/screenshot_nested_file_spec.coffee...                         (1 of 1) 


  ✓ nests the file based on spec path

  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                    │
  │ Passing:      1                                                    │
  │ Failing:      0                                                    │
  │ Pending:      0                                                    │
  │ Skipped:      0                                                    │
  │ Screenshots:  1                                                    │
  │ Video:        true                                                 │
  │ Duration:     X seconds                                            │
  │ Spec Ran:     nested-1/nested-2/screenshot_nested_file_spec.coffee │
  └────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/nested-1/nested-2/screenshot_nested_file_spec.coffee/nests the file based on spec path.png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/nested-1/nested-2/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔ nested-1/nested-2/screenshot_nested_…     XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    All specs passed!                           XX:XX        1        1        -        -        -  

`

