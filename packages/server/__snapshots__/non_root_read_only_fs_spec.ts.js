exports['e2e readonly fs / warns when unable to write to disk'] = `
Folder /foo/bar/.projects/read-only-project-root is not writable.

Writing to this directory is required by Cypress in order to store screenshots and videos.

Enable write permissions to this directory to ensure screenshots and videos are stored.

If you don't require screenshots or videos to be stored you can safely ignore this warning.
✅ not running as root
✅ /foo/bar/.projects/read-only-project-root is not writable

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (spec.js)                                                                  │
  │ Searched:   cypress/integration/spec.js                                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  spec.js                                                                         (1 of 1)
Warning: We failed to record the video.

This error will not alter the exit code.

Error: EACCES: permission denied, mkdir '/foo/bar/.projects/read-only-project-root/cypress/videos'


  1) fails

  0 passing
  1 failing

  1) fails:
     Error: EACCES: permission denied, mkdir '/foo/bar/.projects/read-only-project-root/cypress/screenshots'
  
  




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     spec.js                                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘

Warning: We failed processing this video.

This error will not alter the exit code.

Error: ffmpeg exited with code 1: /foo/bar/.projects/read-only-project-root/cypress/videos/spec.js.mp4: No such file or directory

      [stack trace lines]


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  spec.js                                  XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1        -        1        -        -  


`
