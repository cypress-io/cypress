exports['e2e test muting / correct exitCode w/ muted tests'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (test_muting_spec.js)                                                      │
  │ Searched:   cypress/integration/test_muting_spec.js                                            │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  test_muting_spec.js                                                             (1 of 1)
  Estimated: 8 seconds


  test muting
    ✓ pass


  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  2                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Estimated:    8 seconds                                                                        │
  │ Spec Ran:     test_muting_spec.js                                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/test_muting_spec.js/test muting -- muted fail 1     (1280x720)
      (failed).png                                                                                  
  -  /XXX/XXX/XXX/cypress/screenshots/test_muting_spec.js/test muting -- muted fail 2     (1280x720)
      (failed).png                                                                                  


  (Uploading Results)

  - Done Uploading (*/2) /foo/bar/.projects/e2e/cypress/screenshots/test_muting_spec.js/test muting -- muted fail 1 (failed).png
  - Done Uploading (*/2) /foo/bar/.projects/e2e/cypress/screenshots/test_muting_spec.js/test muting -- muted fail 2 (failed).png

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  test_muting_spec.js                      XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12                                   


`

exports['e2e test muting / failing and passing muted tests do not affect exit code or stats'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (test_muting_spec.js)                                                      │
  │ Searched:   cypress/integration/test_muting_spec.js                                            │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  test_muting_spec.js                                                             (1 of 1)
  Estimated: 8 seconds


  test muting
    ✓ pass


  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  2                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Estimated:    8 seconds                                                                        │
  │ Spec Ran:     test_muting_spec.js                                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/test_muting_spec.js/test muting -- muted fail 1     (1280x720)
      (failed).png                                                                                  
  -  /XXX/XXX/XXX/cypress/screenshots/test_muting_spec.js/test muting -- muted fail 2     (1280x720)
      (failed).png                                                                                  


  (Uploading Results)

  - Done Uploading (*/2) /foo/bar/.projects/e2e/cypress/screenshots/test_muting_spec.js/test muting -- muted fail 1 (failed).png
  - Done Uploading (*/2) /foo/bar/.projects/e2e/cypress/screenshots/test_muting_spec.js/test muting -- muted fail 2 (failed).png

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  test_muting_spec.js                      XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12                                   


`

exports['test muting in hooks / cannot mute failures in hooks'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (test_muting_hook_spec.js)                                                 │
  │ Searched:   cypress/integration/test_muting_hook_spec.js                                       │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  test_muting_hook_spec.js                                                        (1 of 1)
  Estimated: 8 seconds


  test muting
    1) "after each" hook for "fails in afterEach, is muted"


  0 passing
  1 failing

  1) test muting
       "after each" hook for "fails in afterEach, is muted":
     AssertionError: Unspecified AssertionError

Because this error occurred during a \`after each\` hook we are skipping the remaining tests in the current suite: \`test muting\`
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      1                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Estimated:    8 seconds                                                                        │
  │ Spec Ran:     test_muting_hook_spec.js                                                         │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/test_muting_hook_spec.js/test muting -- fails i     (1280x720)
     n afterEach, is muted -- after each hook (failed).png                                          


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/test_muting_hook_spec.js.mp4        (X second)


  (Uploading Results)

  - Done Uploading (*/2) /foo/bar/.projects/e2e/cypress/screenshots/test_muting_hook_spec.js/test muting -- fails in afterEach, is muted -- after each hook (failed).png
  - Done Uploading (*/2) /foo/bar/.projects/e2e/cypress/videos/test_muting_hook_spec.js.mp4

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  test_muting_hook_spec.js                 XX:XX        2        -        1        -        1 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        2        -        1        -        1  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12                                   


`
