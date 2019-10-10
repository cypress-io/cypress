exports['e2e screenshots passes 1'] = `

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


  18 passing
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
  │ Tests:        23                                                                               │
  │ Passing:      18                                                                               │
  │ Failing:      4                                                                                │
  │ Pending:      1                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  26                                                                               │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     screenshots_spec.js                                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/e2e/cypress/screenshots/s      (1280x720) 
     creenshots_spec.js/black.png                                                                   
  -  XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/e2e/cypress/screenshots/s      (1280x720) 
     creenshots_spec.js/red.png                                                                     
  -  XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/e2e/cypress/screenshots/s      (1280x720) 
     creenshots_spec.js/foo/bar/baz.png                                                             
  -  XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/e2e/cypress/screenshots/s      (1280x720) 
     creenshots_spec.js/taking screenshots -- generates pngs on failure (failed).png                
  -  XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/e2e/cypress/screenshots/s      (1280x720) 
     creenshots_spec.js/color-check.png                                                             
  -  XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/e2e/cypress/screenshots/s       (600x400) 
     creenshots_spec.js/crop-check.png                                                              
  -  XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/e2e/cypress/screenshots/s       (600x500) 
     creenshots_spec.js/fullPage.png                                                                
  -  XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/e2e/cypress/screenshots/s       (600x500) 
     creenshots_spec.js/fullPage-same.png                                                           
  -  XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/e2e/cypress/screenshots/s      (1280x720) 
     creenshots_spec.js/pathological.png                                                            
  -  XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/e2e/cypress/screenshots/s       (400x300) 
     creenshots_spec.js/element.png                                                                 
  -  XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/e2e/cypress/screenshots/s      (200x1300) 
     creenshots_spec.js/taking screenshots -- retries each screenshot for up to 1500                
     ms.png                                                                                         
  -  XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/e2e/cypress/screenshots/s      (1280x720) 
     creenshots_spec.js/taking screenshots -- ensures unique paths for non-named scr                
     eenshots.png                                                                                   
  -  XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/e2e/cypress/screenshots/s      (1280x720) 
     creenshots_spec.js/taking screenshots -- ensures unique paths for non-named scr                
     eenshots (1).png                                                                               
  -  XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/e2e/cypress/screenshots/s      (1280x720) 
     creenshots_spec.js/taking screenshots -- ensures unique paths for non-named scr                
     eenshots (2).png                                                                               
  -  XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/e2e/cypress/screenshots/s      (1000x660) 
     creenshots_spec.js/taking screenshots -- ensures unique paths when there's a no                
     n-named screenshot and a failure.png                                                           
  -  XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/e2e/cypress/screenshots/s      (1280x720) 
     creenshots_spec.js/taking screenshots -- ensures unique paths when there's a no                
     n-named screenshot and a failure (failed).png                                                  
  -  XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/e2e/cypress/screenshots/s     (1000x2000) 
     creenshots_spec.js/aut-resize.png                                                              
  -  XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/e2e/cypress/screenshots/s        (100x50) 
     creenshots_spec.js/app-clip.png                                                                
  -  XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/e2e/cypress/screenshots/s        (120x60) 
     creenshots_spec.js/runner-clip.png                                                             
  -  XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/e2e/cypress/screenshots/s        (140x70) 
     creenshots_spec.js/fullPage-clip.png                                                           
  -  XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/e2e/cypress/screenshots/s        (160x80) 
     creenshots_spec.js/element-clip.png                                                            
  -  XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/e2e/cypress/screenshots/s      (1280x720) 
     creenshots_spec.js/taking screenshots -- before hooks -- empty test 1 -- before                
      all hook (failed).png                                                                         
  -  XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/e2e/cypress/screenshots/s      (1280x720) 
     creenshots_spec.js/taking screenshots -- each hooks -- empty test 2 -- before e                
     ach hook (failed).png                                                                          
  -  XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/e2e/cypress/screenshots/s      (1280x720) 
     creenshots_spec.js/taking screenshots -- each hooks -- empty test 2 -- after ea                
     ch hook (failed).png                                                                           
  -  XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/e2e/cypress/screenshots/s      (1000x660) 
     creenshots_spec.js/taking screenshots -- really long test title aaaaaaaaaaaaaaa                
     aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa                
     aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa                
     aa.png                                                                                         
  -  XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/e2e/cypress/screenshots/s      (1000x660) 
     creenshots_spec.js/taking screenshots -- really long test title aaaaaaaaaaaaaaa                
     aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa                
     aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa                
     aa (1).png                                                                                     


  (Video)

  - Started processing:  Compressing to 32 CRF
  - Finished processing: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/e2e/c      (X seconds) 
                         ypress/videos/abc123.mp4                                      


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  screenshots_spec.js                      XX:XX       23       18        4        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX       23       18        4        1        -  


`
