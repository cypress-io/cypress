exports['e2e busted support file passes 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (app_spec.coffee)                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  app_spec.coffee                                                                 (1 of 1)

Oops...we found an error preparing this test file:

  /foo/bar/.projects/busted-support-file/cypress/support/index.js

The error was:

Error: Webpack Compilation Error
./cypress/support/index.js
Module not found: Error: Can't resolve './does/not/exist' in '/foo/bar/.projects/busted-support-file/cypress/support'
resolve './does/not/exist' in '/foo/bar/.projects/busted-support-file/cypress/support'
  using description file: /Users/chrisbreiding/Dev/cypress/cypress/packages/server/package.json (relative path: ./.projects/busted-support-file/cypress/support)
    Field 'browser' doesn't contain a valid alias configuration
    using description file: /Users/chrisbreiding/Dev/cypress/cypress/packages/server/package.json (relative path: ./.projects/busted-support-file/cypress/support/does/not/exist)
      no extension
        Field 'browser' doesn't contain a valid alias configuration
        /foo/bar/.projects/busted-support-file/cypress/support/does/not/exist doesn't exist
      .js
        Field 'browser' doesn't contain a valid alias configuration
        /foo/bar/.projects/busted-support-file/cypress/support/does/not/exist.js doesn't exist
      .json
        Field 'browser' doesn't contain a valid alias configuration
        /foo/bar/.projects/busted-support-file/cypress/support/does/not/exist.json doesn't exist
      .jsx
        Field 'browser' doesn't contain a valid alias configuration
        /foo/bar/.projects/busted-support-file/cypress/support/does/not/exist.jsx doesn't exist
      .ts
        Field 'browser' doesn't contain a valid alias configuration
        /foo/bar/.projects/busted-support-file/cypress/support/does/not/exist.ts doesn't exist
      .tsx
        Field 'browser' doesn't contain a valid alias configuration
        /foo/bar/.projects/busted-support-file/cypress/support/does/not/exist.tsx doesn't exist
      .coffee
        Field 'browser' doesn't contain a valid alias configuration
        /foo/bar/.projects/busted-support-file/cypress/support/does/not/exist.coffee doesn't exist
      as directory
        /foo/bar/.projects/busted-support-file/cypress/support/does/not/exist doesn't exist
[/foo/bar/.projects/busted-support-file/cypress/support/does/not/exist]
[/foo/bar/.projects/busted-support-file/cypress/support/does/not/exist.js]
[/foo/bar/.projects/busted-support-file/cypress/support/does/not/exist.json]
[/foo/bar/.projects/busted-support-file/cypress/support/does/not/exist.jsx]
[/foo/bar/.projects/busted-support-file/cypress/support/does/not/exist.ts]
[/foo/bar/.projects/busted-support-file/cypress/support/does/not/exist.tsx]
[/foo/bar/.projects/busted-support-file/cypress/support/does/not/exist.coffee]
 @ ./cypress/support/index.js 3:0-27
 @ multi ./cypress/support/index.js

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
  │ Spec Ran:     app_spec.coffee                                                                  │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/app_spec.coffee.mp4                 (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  app_spec.coffee                          XX:XX        -        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        -        -        1        -        -  


`
