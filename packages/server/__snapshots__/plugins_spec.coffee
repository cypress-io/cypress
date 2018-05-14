exports['e2e plugins fails 1'] = `
Started video recording: /foo/bar/.projects/plugins-async-error/cypress/videos/abc123.mp4

  (Tests Starting)

Error: The following error was thrown by a plugin. We've stopped running your tests because a plugin crashed.

Error: Async error from plugins file
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
    at stack trace line


  (Tests Finished)

  - Tests:           0
  - Passes:          0
  - Failures:        1
  - Pending:         0
  - Skipped:         0
  - Duration:        10 seconds
  - Screenshots:     0
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/plugins-async-error/cypress/videos/abc123.mp4 (0 seconds)


  (All Done)

`

exports['e2e plugins passes 1'] = `
Started video recording: /foo/bar/.projects/working-preprocessor/cypress/videos/abc123.mp4

  (Tests Starting)


  ✓ is another spec
  ✓ is another spec

  2 passing


  (Tests Finished)

  - Tests:           2
  - Passes:          2
  - Failures:        0
  - Pending:         0
  - Skipped:         0
  - Duration:        10 seconds
  - Screenshots:     0
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/working-preprocessor/cypress/videos/abc123.mp4 (0 seconds)


  (All Done)

`

exports['e2e plugins can modify config from plugins 1'] = `
Started video recording: /foo/bar/.projects/plugin-config/cypress/videos/abc123.mp4

  (Tests Starting)


  ✓ overrides config
  ✓ overrides env

  2 passing


  (Tests Finished)

  - Tests:           2
  - Passes:          2
  - Failures:        0
  - Pending:         0
  - Skipped:         0
  - Duration:        10 seconds
  - Screenshots:     0
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Video)

  - Started processing:   Compressing to 20 CRF
  - Finished processing:  /foo/bar/.projects/plugin-config/cypress/videos/abc123.mp4 (0 seconds)


  (All Done)

`

exports['e2e plugins works with user extensions 1'] = `Warning: Cypress can only record videos when using the built in 'electron' browser.

You have set the browser to: 'chrome'

A video will not be recorded when using this browser.
  (Tests Starting)


  ✓ can inject text from an extension

  1 passing


  (Tests Finished)

  - Tests:           1
  - Passes:          1
  - Failures:        0
  - Pending:         0
  - Skipped:         0
  - Duration:        10 seconds
  - Screenshots:     0
  - Video Recorded:  false
  - Cypress Version: 1.2.3


  (All Done)

`

