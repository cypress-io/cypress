exports['e2e screenshot in nested spec / passes'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (nested-1/nested-2/screenshot_nested_file_spec.js)                         │
  │ Searched:   cypress/integration/nested-1/nested-2/screenshot_nested_file_spec.js               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  nested-1/nested-2/screenshot_nested_file_spec.js                                (1 of 1)


  ✓ nests the file based on spec path

  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     nested-1/nested-2/screenshot_nested_file_spec.js                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/nested-1/nested-2/screenshot_nested_file_spec.j     (1280x720)
     s/nests the file based on spec path.png                                                        


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/nested-1/nested-2/screenshot_ne     (X second)
                          sted_file_spec.js.mp4                                                     


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  nested-1/nested-2/screenshot_nested      XX:XX        1        1        -        -        - │
  │    _file_spec.js                                                                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


`
