exports['e2e project dir access / warns when unable to write to disk'] = `
Folder /foo/bar/.projects/e2e is not writable.

Writing to this directory is required by Cypress in order to store screenshots and videos.

Enable write permissions to this directory to ensure screenshots and videos are stored. 

If you don't require screenshots or videos to be stored you can safely ignore this warning.

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (simple_failing_spec.coffee)                                               │
  │ Searched:   cypress/integration/simple_failing_spec.coffee                                     │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  simple_failing_spec.coffee                                                      (1 of 1)
Warning: We failed to record the video.

This error will not alter the exit code.

Error: EACCES: permission denied, mkdir '/foo/bar/.projects/e2e/cypress/videos'


  simple failing spec
    1) fails1
    2) fails2


  0 passing
  2 failing

  1) simple failing spec
       fails1:
     Error: EACCES: permission denied, mkdir '/foo/bar/.projects/e2e/cypress/screenshots'
  
  

  2) simple failing spec
       fails2:
     Error: EACCES: permission denied, mkdir '/foo/bar/.projects/e2e/cypress/screenshots'
  
  




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      2                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     simple_failing_spec.coffee                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘

Warning: We failed processing this video.

This error will not alter the exit code.

Error: ffmpeg exited with code 1: /foo/bar/.projects/e2e/cypress/videos/simple_failing_spec.coffee.mp4: No such file or directory

      [stack trace lines]


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  simple_failing_spec.coffee               XX:XX        2        -        2        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        2        -        2        -        -  


`
