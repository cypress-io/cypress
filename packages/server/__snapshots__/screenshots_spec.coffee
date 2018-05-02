exports['e2e screenshots passes 1'] = `
Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)


  taking screenshots
    ✓ manually generates pngs
    ✓ can nest screenshots in folders
    1) generates pngs on failure
    ✓ crops app captures to just app size
    ✓ can capture fullpage screenshots
    ✓ accepts subsequent same captures after multiple tries
    ✓ accepts screenshot after multiple tries if somehow app has pixels that match helper pixels
    ✓ can capture element screenshots
    before hooks
      2) "before all" hook for "empty test 1"
    each hooks
      3) "before each" hook for "empty test 2"
      4) "after each" hook for "empty test 2"


  7 passing
  4 failing

  1) taking screenshots generates pngs on failure:
     Error: fail whale
      at stack trace line

  2) taking screenshots before hooks "before all" hook for "empty test 1":
     Error: before hook failing

Because this error occurred during a 'before all' hook we are skipping the remaining tests in the current suite: 'before hooks'
      at stack trace line

  3) taking screenshots each hooks "before each" hook for "empty test 2":
     Error: before each hook failed

Because this error occurred during a 'before each' hook we are skipping the remaining tests in the current suite: 'each hooks'
      at stack trace line

  4) taking screenshots each hooks "after each" hook for "empty test 2":
     Error: after each hook failed

Because this error occurred during a 'after each' hook we are skipping the remaining tests in the current suite: 'each hooks'
      at stack trace line




  (Tests Finished)

  - Tests:           10
  - Passes:          7
  - Failures:        3
  - Pending:         0
  - Duration:        10 seconds
  - Screenshots:     12
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/black.png (1280x720)
  - /foo/bar/.projects/e2e/cypress/screenshots/red.png (1280x720)
  - /foo/bar/.projects/e2e/cypress/screenshots/foobarbaz.png (1280x720)
  - /foo/bar/.projects/e2e/cypress/screenshots/taking screenshots -- generates pngs on failure.png (1280x720)
  - /foo/bar/.projects/e2e/cypress/screenshots/crop-check.png (600x400)
  - /foo/bar/.projects/e2e/cypress/screenshots/fullpage.png (600x500)
  - /foo/bar/.projects/e2e/cypress/screenshots/fullpage-same.png (600x500)
  - /foo/bar/.projects/e2e/cypress/screenshots/pathological.png (1280x720)
  - /foo/bar/.projects/e2e/cypress/screenshots/element.png (400x300)
  - /foo/bar/.projects/e2e/cypress/screenshots/taking screenshots -- before hooks -- empty test 1 -- before all hook.png (1280x720)
  - /foo/bar/.projects/e2e/cypress/screenshots/taking screenshots -- each hooks -- empty test 2 -- before each hook.png (1280x720)
  - /foo/bar/.projects/e2e/cypress/screenshots/taking screenshots -- each hooks -- empty test 2 -- after each hook.png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (0 seconds)


  (All Done)

`

