exports['e2e issue 674 / fails'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (issue_674_spec.coffee)                                                    │
  │ Searched:   cypress/integration/issue_674_spec.coffee                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  issue_674_spec.coffee                                                           (1 of 1)


  issue 674
    1) "before each" hook for "doesn't hang when both beforeEach and afterEach fail"
    2) "after each" hook for "doesn't hang when both beforeEach and afterEach fail"


  0 passing
  2 failing

  1) issue 674
       "before each" hook for "doesn't hang when both beforeEach and afterEach fail":
     Error: Because this error occurred during a \`before each\` hook we are skipping the remaining tests in the current suite: \`issue 674\`
      [stack trace lines]

  2) issue 674
       "after each" hook for "doesn't hang when both beforeEach and afterEach fail":
     Error: Because this error occurred during a \`after each\` hook we are skipping the remaining tests in the current suite: \`issue 674\`
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  2                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     issue_674_spec.coffee                                                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/issue_674_spec.coffee/issue 674 -- doesn't hang     (1280x720)
      when both beforeEach and afterEach fail -- before each hook (failed).png                      
  -  /XXX/XXX/XXX/cypress/screenshots/issue_674_spec.coffee/issue 674 -- doesn't hang     (1280x720)
      when both beforeEach and afterEach fail -- after each hook (failed).png                       


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/issue_674_spec.coffee.mp4           (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  issue_674_spec.coffee                    XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1        -        1        -        -  


`
