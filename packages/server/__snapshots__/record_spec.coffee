exports['e2e record passing passes 1'] = `
Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)
Oops...we found an error preparing this test file:

  /foo/bar/.projects/e2e/cypress/integration/record_error_spec.coffee

The error was:

Error: Cannot find module '../it/does/not/exist' from '/foo/bar/.projects/e2e/cypress/integration'


This occurred while Cypress was compiling and bundling your test code. This is usually caused by:

- A missing file or dependency
- A syntax error in the file or one of its dependencies

Fix the error in your code and re-run your tests.

  (Tests Finished)

  - Tests:           0
  - Passes:          0
  - Failures:        1
  - Pending:         0
  - Duration:        10 seconds
  - Screenshots:     0
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (0 seconds)


  (Uploading Results)

  - Done Uploading (1/1) /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)


  record fails
    1) "before each" hook for "fails 1"


  0 passing
  1 failing

  1) record fails "before each" hook for "fails 1":
     Error: foo

Because this error occurred during a 'before each' hook we are skipping the remaining tests in the current suite: 'record fails'
      at stack trace line




  (Tests Finished)

  - Tests:           2
  - Passes:          0
  - Failures:        1
  - Pending:         0
  - Duration:        10 seconds
  - Screenshots:     1
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/record fails -- fails 1 -- before each hook.png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (0 seconds)


  (Uploading Results)

  - Done Uploading (1/2) /foo/bar/.projects/e2e/cypress/screenshots/record fails -- fails 1 -- before each hook.png
  - Done Uploading (2/2) /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)


  record pass
    ✓ passes
    - is pending


  1 passing
  1 pending


  (Tests Finished)

  - Tests:           2
  - Passes:          1
  - Failures:        0
  - Pending:         1
  - Duration:        10 seconds
  - Screenshots:     1
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/yay it passes.png (1280x720)


  (Uploading Results)

  - Done Uploading (1/1) /foo/bar/.projects/e2e/cypress/screenshots/yay it passes.png

Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)


  1) An uncaught error was detected outside of a test

  0 passing
  1 failing

  1)  An uncaught error was detected outside of a test:
     Uncaught Error: instantly fails

This error originated from your test code, not from Cypress.

When Cypress detects uncaught errors originating from your test code it will automatically fail the current test.

Cypress could not associate this error to any specific test.

We dynamically generated a new test to display this failure.
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line




  (Tests Finished)

  - Tests:           1
  - Passes:          0
  - Failures:        1
  - Pending:         0
  - Duration:        10 seconds
  - Screenshots:     1
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/An uncaught error was detected outside of a test.png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (0 seconds)


  (Uploading Results)

  - Done Uploading (1/2) /foo/bar/.projects/e2e/cypress/screenshots/An uncaught error was detected outside of a test.png
  - Done Uploading (2/2) /foo/bar/.projects/e2e/cypress/videos/abc123.mp4


  (All Done)

`

exports['e2e record api interaction errors recordKey and projectId errors and exits 1'] = `We failed trying to authenticate this project: pid123

Your Record Key is invalid: f858a...ee7e1

It may have been recently revoked by you or another user.

Please log into the Dashboard to see the updated token.

https://on.cypress.io/dashboard/projects/pid123
`

exports['e2e record api interaction errors project 404 errors and exits 1'] = `We could not find a project with the ID: pid123

This projectId came from your cypress.json file or an environment variable.

Please log into the Dashboard and find your project.

We will list the correct projectId in the 'Settings' tab.

Alternatively, you can create a new project using the Desktop Application.

https://on.cypress.io/dashboard
`

exports['e2e record api interaction errors create run warns and does not create or update instances 1'] = `Warning: We encountered an error talking to our servers.

This run will not be recorded.

This error will not alter the exit code.

StatusCodeError: 500 - "Internal Server Error"

Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)


  record pass
    ✓ passes
    - is pending


  1 passing
  1 pending


  (Tests Finished)

  - Tests:           2
  - Passes:          1
  - Failures:        0
  - Pending:         1
  - Duration:        10 seconds
  - Screenshots:     1
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/yay it passes.png (1280x720)


  (All Done)

`

exports['e2e record api interaction errors create instance does not update instance 1'] = `Warning: We encountered an error talking to our servers.

This run will not be recorded.

This error will not alter the exit code.

StatusCodeError: 500 - "Internal Server Error"

Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)


  record pass
    ✓ passes
    - is pending


  1 passing
  1 pending


  (Tests Finished)

  - Tests:           2
  - Passes:          1
  - Failures:        0
  - Pending:         1
  - Duration:        10 seconds
  - Screenshots:     1
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/yay it passes.png (1280x720)


  (All Done)

`

exports['e2e record api interaction errors update instance does not update instance stdout 1'] = `
Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)


  record pass
    ✓ passes
    - is pending


  1 passing
  1 pending


  (Tests Finished)

  - Tests:           2
  - Passes:          1
  - Failures:        0
  - Pending:         1
  - Duration:        10 seconds
  - Screenshots:     1
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/yay it passes.png (1280x720)


  (Uploading Results)

Warning: We encountered an error talking to our servers.

This run will not be recorded.

This error will not alter the exit code.

StatusCodeError: 500 - "Internal Server Error"


  (All Done)

`

exports['e2e record api interaction errors update instance stdout warns but proceeds 1'] = `
Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)


  record pass
    ✓ passes
    - is pending


  1 passing
  1 pending


  (Tests Finished)

  - Tests:           2
  - Passes:          1
  - Failures:        0
  - Pending:         1
  - Duration:        10 seconds
  - Screenshots:     1
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/yay it passes.png (1280x720)


  (Uploading Results)

  - Done Uploading (1/1) /foo/bar/.projects/e2e/cypress/screenshots/yay it passes.png
Warning: We encountered an error talking to our servers.

This run will not be recorded.

This error will not alter the exit code.

StatusCodeError: 500 - "Internal Server Error"


  (All Done)

`

exports['e2e record failing errors and exits without projectId 1'] = `You passed the --record flag but this project has not been setup to record.

This project is missing the 'projectId' inside of 'cypress.json'.

We cannot uniquely identify this project without this id.

You need to setup this project to record. This will generate a unique 'projectId'.

Alternatively if you omit the --record flag this project will run without recording.

https://on.cypress.io/recording-project-runs
`

exports['e2e record recordKey errors and exits without recordKey 1'] = `You passed the --record flag but did not provide us your Record Key.

You can pass us your Record Key like this:

  cypress run --record --key <record_key>

You can also set the key as an environment variable with the name CYPRESS_RECORD_KEY.

https://on.cypress.io/how-do-i-record-runs
`

exports['e2e record projectId errors and exits without projectId 1'] = `You passed the --record flag but this project has not been setup to record.

This project is missing the 'projectId' inside of 'cypress.json'.

We cannot uniquely identify this project without this id.

You need to setup this project to record. This will generate a unique 'projectId'.

Alternatively if you omit the --record flag this project will run without recording.

https://on.cypress.io/recording-project-runs
`

exports['e2e record api interaction errors recordKey and projectId errors and exits on 401 1'] = `We failed trying to authenticate this project: pid123

Your Record Key is invalid: f858a...ee7e1

It may have been recently revoked by you or another user.

Please log into the Dashboard to see the updated token.

https://on.cypress.io/dashboard/projects/pid123
`

exports['e2e record video recording does not upload when not enabled 1'] = `  (Tests Starting)


  record pass
    ✓ passes
    - is pending


  1 passing
  1 pending


  (Tests Finished)

  - Tests:           2
  - Passes:          1
  - Failures:        0
  - Pending:         1
  - Duration:        10 seconds
  - Screenshots:     1
  - Video Recorded:  false
  - Cypress Version: 1.2.3


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/yay it passes.png (1280x720)


  (Uploading Results)

  - Done Uploading (1/1) /foo/bar/.projects/e2e/cypress/screenshots/yay it passes.png


  (All Done)

`

exports['e2e record api interaction errors uploading assets warns but proceeds 1'] = `
Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)


  record pass
    ✓ passes
    - is pending


  1 passing
  1 pending


  (Tests Finished)

  - Tests:           2
  - Passes:          1
  - Failures:        0
  - Pending:         1
  - Duration:        10 seconds
  - Screenshots:     1
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/yay it passes.png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (0 seconds)


  (Uploading Results)

  - Failed Uploading (1/2) /foo/bar/.projects/e2e/cypress/screenshots/yay it passes.png
  - Failed Uploading (2/2) /foo/bar/.projects/e2e/cypress/videos/abc123.mp4


  (All Done)

`

