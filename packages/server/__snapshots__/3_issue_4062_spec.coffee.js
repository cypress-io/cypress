exports['e2e issue 4062 fails 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (issue_4062_spec.coffee)                                                   │
  │ Searched:   cypress/integration/issue_4062_spec.coffee                                         │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: issue_4062_spec.coffee...                                                       (1 of 1) 


  issue 4062
    1) fails with correct chaingin afterEach err when both test and afterEach fail


  0 passing
  1 failing

  1) issue 4062 fails with correct chaingin afterEach err when both test and afterEach fail:
     CypressError: Timed out retrying: expected '<h1>' to have value 'h2', but the value was ''
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

  ┌──────────────────────────────────────┐
  │ Tests:        1                      │
  │ Passing:      0                      │
  │ Failing:      1                      │
  │ Pending:      0                      │
  │ Skipped:      0                      │
  │ Screenshots:  1                      │
  │ Video:        true                   │
  │ Duration:     X seconds              │
  │ Spec Ran:     issue_4062_spec.coffee │
  └──────────────────────────────────────┘


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/issue_4062_spec.coffee/issue 4062 -- fails with correct chaingin afterEach err when both test and afterEach fail (failed).png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (X seconds)


====================================================================================================

  (Run Finished)


      Spec                                                Tests  Passing  Failing  Pending  Skipped 
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖ issue_4062_spec.coffee                    XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    1 of 1 failed (100%)                        XX:XX        1        -        1        -        -  


`
