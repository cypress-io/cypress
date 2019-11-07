exports['e2e screenshots / passes'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (screenshots_spec.js)                                                      │
  │ Searched:   cypress/integration/screenshots_spec.js                                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  screenshots_spec.js                                                             (1 of 1)


  taking screenshots
    ✓ manually generates pngs
    ✓ can nest screenshots in folders
    1) generates pngs on failure
    ✓ calls onAfterScreenshot with results of failed tests
    ✓ handles devicePixelRatio correctly on headless electron
    ✓ crops app captures to just app size
    ✓ can capture fullPage screenshots
    ✓ accepts subsequent same captures after multiple tries
    ✓ accepts screenshot after multiple tries if somehow app has pixels that match helper pixels
    ✓ can capture element screenshots
    ✓ retries each screenshot for up to  XX:XX
    ✓ ensures unique paths for non-named screenshots
    2) ensures unique paths when there's a non-named screenshot and a failure
    ✓ properly resizes the AUT iframe
    - does not take a screenshot for a pending test
    ✓ adds padding to element screenshot when specified
    ✓ does not add padding to non-element screenshot
    clipping
      ✓ can clip app screenshots
      ✓ can clip runner screenshots
      ✓ can clip fullPage screenshots
      ✓ can clip element screenshots
    before hooks
      3) "before all" hook for "empty test 1"
    each hooks
      4) "before each" hook for "empty test 2"
      5) "after each" hook for "empty test 2"
    really long test title aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
      ✓ takes a screenshot
      ✓ takes another screenshot


  20 passing
  1 pending
  5 failing

  1) taking screenshots generates pngs on failure:
     Error: fail whale
      at stack trace line

  2) taking screenshots ensures unique paths when there's a non-named screenshot and a failure:
     Error: failing on purpose
      at stack trace line

  3) taking screenshots before hooks "before all" hook for "empty test 1":
     Error: before hook failing

Because this error occurred during a 'before all' hook we are skipping the remaining tests in the current suite: 'before hooks'
      at stack trace line

  4) taking screenshots each hooks "before each" hook for "empty test 2":
     Error: before each hook failed

Because this error occurred during a 'before each' hook we are skipping the remaining tests in the current suite: 'each hooks'
      at stack trace line

  5) taking screenshots each hooks "after each" hook for "empty test 2":
     Error: after each hook failed

Because this error occurred during a 'after each' hook we are skipping the remaining tests in the current suite: 'each hooks'
      at stack trace line




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        25                                                                               │
  │ Passing:      20                                                                               │
  │ Failing:      4                                                                                │
  │ Pending:      1                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  28                                                                               │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     screenshots_spec.js                                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/screenshots_spec.js/black.png                       (1280x720)
  -  /XXX/XXX/XXX/cypress/screenshots/screenshots_spec.js/red.png                         (1280x720)
  -  /XXX/XXX/XXX/cypress/screenshots/screenshots_spec.js/foo/bar/baz.png                 (1280x720)
  -  /XXX/XXX/XXX/cypress/screenshots/screenshots_spec.js/taking screenshots -- gener     (1280x720)
     ates pngs on failure (failed).png                                                              
  -  /XXX/XXX/XXX/cypress/screenshots/screenshots_spec.js/color-check.png                 (1280x720)
  -  /XXX/XXX/XXX/cypress/screenshots/screenshots_spec.js/crop-check.png                   (600x400)
  -  /XXX/XXX/XXX/cypress/screenshots/screenshots_spec.js/fullPage.png                     (600x500)
  -  /XXX/XXX/XXX/cypress/screenshots/screenshots_spec.js/fullPage-same.png                (600x500)
  -  /XXX/XXX/XXX/cypress/screenshots/screenshots_spec.js/pathological.png                (1280x720)
  -  /XXX/XXX/XXX/cypress/screenshots/screenshots_spec.js/element.png                      (400x300)
  -  /XXX/XXX/XXX/cypress/screenshots/screenshots_spec.js/taking screenshots -- retri     (200x1300)
     es each screenshot for up to  XX:XX.png                                                        
  -  /XXX/XXX/XXX/cypress/screenshots/screenshots_spec.js/taking screenshots -- ensur     (1280x720)
     es unique paths for non-named screenshots.png                                                  
  -  /XXX/XXX/XXX/cypress/screenshots/screenshots_spec.js/taking screenshots -- ensur     (1280x720)
     es unique paths for non-named screenshots (1).png                                              
  -  /XXX/XXX/XXX/cypress/screenshots/screenshots_spec.js/taking screenshots -- ensur     (1280x720)
     es unique paths for non-named screenshots (2).png                                              
  -  /XXX/XXX/XXX/cypress/screenshots/screenshots_spec.js/taking screenshots -- ensur     (1000x660)
     es unique paths when there's a non-named screenshot and a failure.png                          
  -  /XXX/XXX/XXX/cypress/screenshots/screenshots_spec.js/taking screenshots -- ensur     (1280x720)
     es unique paths when there's a non-named screenshot and a failure (failed).png                 
  -  /XXX/XXX/XXX/cypress/screenshots/screenshots_spec.js/aut-resize.png                 (1000x2000)
  -  /XXX/XXX/XXX/cypress/screenshots/screenshots_spec.js/element-padding.png              (420x320)
  -  /XXX/XXX/XXX/cypress/screenshots/screenshots_spec.js/non-element-padding.png          (600x200)
  -  /XXX/XXX/XXX/cypress/screenshots/screenshots_spec.js/app-clip.png                      (100x50)
  -  /XXX/XXX/XXX/cypress/screenshots/screenshots_spec.js/runner-clip.png                   (120x60)
  -  /XXX/XXX/XXX/cypress/screenshots/screenshots_spec.js/fullPage-clip.png                 (140x70)
  -  /XXX/XXX/XXX/cypress/screenshots/screenshots_spec.js/element-clip.png                  (160x80)
  -  /XXX/XXX/XXX/cypress/screenshots/screenshots_spec.js/taking screenshots -- befor     (1280x720)
     e hooks -- empty test 1 -- before all hook (failed).png                                        
  -  /XXX/XXX/XXX/cypress/screenshots/screenshots_spec.js/taking screenshots -- each      (1280x720)
     hooks -- empty test 2 -- before each hook (failed).png                                         
  -  /XXX/XXX/XXX/cypress/screenshots/screenshots_spec.js/taking screenshots -- each      (1280x720)
     hooks -- empty test 2 -- after each hook (failed).png                                          
  -  /XXX/XXX/XXX/cypress/screenshots/screenshots_spec.js/taking screenshots -- reall     (1000x660)
     y long test title aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa               
     aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa               
     aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.png                                                          
  -  /XXX/XXX/XXX/cypress/screenshots/screenshots_spec.js/taking screenshots -- reall     (1000x660)
     y long test title aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa               
     aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa               
     aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa (1).png                                                      


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/screenshots_spec.js.mp4             (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  screenshots_spec.js                      XX:XX       25       20        4        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX       25       20        4        1        -  


`
