exports['e2e busted support file passes 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (app_spec.js)                                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  app_spec.js                                                                     (1 of 1)

Oops...we found an error preparing this test file:

  cypress/support/index.js

The error was:

Error: Webpack Compilation Error
./cypress/support/index.js
Module not found: Error: Can't resolve './does/not/exist' in '/foo/bar/.projects/busted-support-file/cypress/support'
Looked for and couldn't find the file at the following paths:
[/foo/bar/.projects/busted-support-file/cypress/support/does/not/exist]
[/foo/bar/.projects/busted-support-file/cypress/support/does/not/exist.js]
[/foo/bar/.projects/busted-support-file/cypress/support/does/not/exist.json]
[/foo/bar/.projects/busted-support-file/cypress/support/does/not/exist.jsx]
[/foo/bar/.projects/busted-support-file/cypress/support/does/not/exist.mjs]
[/foo/bar/.projects/busted-support-file/cypress/support/does/not/exist.coffee]
[/foo/bar/.projects/busted-support-file/cypress/support/does/not/exist.ts]
[/foo/bar/.projects/busted-support-file/cypress/support/does/not/exist.tsx]
 @ ./cypress/support/index.js 3:0-27

This occurred while Cypress was compiling and bundling your test code. This is usually caused by:

- A missing file or dependency
- A syntax error in the file or one of its dependencies

Fix the error in your code and re-run your tests.

  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        0                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     app_spec.js                                                                      │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/app_spec.js.mp4                     (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  app_spec.js                              XX:XX        -        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        -        -        1        -        -  


`
