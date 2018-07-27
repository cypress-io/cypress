exports['e2e issue 173 failing 1'] = `
====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (issue_173_spec.coffee)                                                    │
  │ Searched:   cypress/integration/issue_173_spec.coffee                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: issue_173_spec.coffee...                                                        (1 of 1) 


  1) fails
  ✓ should be able to log

  1 passing
  1 failing

  1)  fails:
     CypressError: Timed out retrying: Expected to find element: 'element_does_not_exist', but never found it.
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

  ┌─────────────────────────────────────┐
  │ Tests:        2                     │
  │ Passing:      1                     │
  │ Failing:      1                     │
  │ Pending:      0                     │
  │ Skipped:      0                     │
  │ Screenshots:  1                     │
  │ Video:        true                  │
  │ Duration:     X seconds             │
  │ Spec Ran:     issue_173_spec.coffee │
  └─────────────────────────────────────┘


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/issue_173_spec.coffee/fails (failed).png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖ issue_173_spec.coffee                     XX:XX        2        1        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    1 of 1 failed (100%)                        XX:XX        2        1        1        -        -  

`

