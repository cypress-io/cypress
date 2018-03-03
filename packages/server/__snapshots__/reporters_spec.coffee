exports['e2e reporters reports error if cannot load reporter 1'] = `Could not load reporter by name: module-does-not-exist

We searched for the reporter in these paths:

- /foo/bar/.projects/e2e/module-does-not-exist
- /foo/bar/.projects/e2e/node_modules/module-does-not-exist

Learn more at stack trace line
`

exports['e2e reporters supports junit reporter and reporter options 1'] = `
Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)

  (Tests Finished)

  - Tests:           1
  - Passes:          1
  - Failures:        0
  - Pending:         0
  - Duration:        10 seconds
  - Screenshots:     0
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (0 seconds)


  (All Done)

`

exports['e2e reporters supports local custom reporter 1'] = `
Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)
passes
finished!

  (Tests Finished)

  - Tests:           undefined
  - Passes:          undefined
  - Failures:        undefined
  - Pending:         undefined
  - Duration:        10 seconds
  - Screenshots:     0
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (0 seconds)


  (All Done)

`

exports['e2e reporters mochawesome passes with mochawesome@1.5.2 npm custom reporter 1'] = `
Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)
[mochawesome] Generating report files...



  simple passing spec
    ✓ passes


  1 passing


[mochawesome] Report saved to mochawesome-reports/mochawesome.html



  (Tests Finished)

  - Tests:           1
  - Passes:          1
  - Failures:        0
  - Pending:         0
  - Duration:        10 seconds
  - Screenshots:     0
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (0 seconds)


  (All Done)

`

exports['e2e reporters mochawesome fails with mochawesome@1.5.2 npm custom reporter 1'] = `
Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)
[mochawesome] Generating report files...



  simple failing hook spec
    1) "before each" hook for "never gets here"


  0 passing
  1 failing

  1) simple failing hook spec
       "before each" hook for "never gets here":
     Error: fail

Because this error occurred during a 'before each' hook we are skipping the remaining tests in the current suite: 'simple failing hook spec'
      at stack trace line




[mochawesome] Report saved to mochawesome-reports/mochawesome.html



  (Tests Finished)

  - Tests:           0
  - Passes:          0
  - Failures:        1
  - Pending:         0
  - Duration:        10 seconds
  - Screenshots:     1
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/simple failing hook spec -- never gets here -- before each hook.png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (0 seconds)


  (All Done)

`

exports['e2e reporters mochawesome passes with mochawesome@2.3.1 npm custom reporter 1'] = `
Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)


  simple passing spec
    ✓ passes


  1 passing

[mochawesome] Report JSON saved to /foo/bar/.projects/e2e/mochawesome-report/mochawesome.json

[mochawesome] Report HTML saved to /foo/bar/.projects/e2e/mochawesome-report/mochawesome.html


  (Tests Finished)

  - Tests:           1
  - Passes:          1
  - Failures:        0
  - Pending:         0
  - Duration:        10 seconds
  - Screenshots:     0
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (0 seconds)


  (All Done)

`

exports['e2e reporters mochawesome fails with mochawesome@2.3.1 npm custom reporter 1'] = `
Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)


  simple failing hook spec
    1) "before each" hook for "never gets here"


  0 passing
  1 failing

  1) simple failing hook spec
       "before each" hook for "never gets here":
     Error: fail

Because this error occurred during a 'before each' hook we are skipping the remaining tests in the current suite: 'simple failing hook spec'
      at stack trace line



[mochawesome] Report JSON saved to /foo/bar/.projects/e2e/mochawesome-report/mochawesome.json

[mochawesome] Report HTML saved to /foo/bar/.projects/e2e/mochawesome-report/mochawesome.html


  (Tests Finished)

  - Tests:           0
  - Passes:          0
  - Failures:        1
  - Pending:         0
  - Duration:        10 seconds
  - Screenshots:     1
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/simple failing hook spec -- never gets here -- before each hook.png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (0 seconds)


  (All Done)

`

exports['e2e reporters mochawesome passes with mochawesome@3.0.1 npm custom reporter 1'] = `
Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)


  simple passing spec
    ✓ passes


  1 passing

[mochawesome] Report JSON saved to /foo/bar/.projects/e2e/mochawesome-report/mochawesome.json

[mochawesome] Report HTML saved to /foo/bar/.projects/e2e/mochawesome-report/mochawesome.html


  (Tests Finished)

  - Tests:           1
  - Passes:          1
  - Failures:        0
  - Pending:         0
  - Duration:        10 seconds
  - Screenshots:     0
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (0 seconds)


  (All Done)

`

exports['e2e reporters mochawesome fails with mochawesome@3.0.1 npm custom reporter 1'] = `
Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)


  simple failing hook spec
    1) "before each" hook for "never gets here"


  0 passing
  1 failing

  1) simple failing hook spec
       "before each" hook for "never gets here":
     Error: fail

Because this error occurred during a 'before each' hook we are skipping the remaining tests in the current suite: 'simple failing hook spec'
      at stack trace line



[mochawesome] Report JSON saved to /foo/bar/.projects/e2e/mochawesome-report/mochawesome.json

[mochawesome] Report HTML saved to /foo/bar/.projects/e2e/mochawesome-report/mochawesome.html


  (Tests Finished)

  - Tests:           0
  - Passes:          0
  - Failures:        1
  - Pending:         0
  - Duration:        10 seconds
  - Screenshots:     1
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/simple failing hook spec -- never gets here -- before each hook.png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (0 seconds)


  (All Done)

`

