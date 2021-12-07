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
    (Attempt 1 of 3) screenshots in a retried test
    (Attempt 2 of 3) screenshots in a retried test
    2) screenshots in a retried test
    ✓ ensures unique paths for non-named screenshots
    3) ensures unique paths when there's a non-named screenshot and a failure
    ✓ properly resizes the AUT iframe
    - does not take a screenshot for a pending test
    ✓ adds padding to element screenshot when specified
    ✓ does not add padding to non-element screenshot
    ✓ can pass overwrite option to replace existing filename
    ✓ can set overwrite default option to replace existing filename
    clipping
      ✓ can clip app screenshots
      ✓ can clip runner screenshots
      ✓ can clip fullPage screenshots
      ✓ can clip element screenshots
    before hooks
      4) "before all" hook for "empty test 1"
    each hooks
      5) "before each" hook for "empty test 2"
      6) "after each" hook for "empty test 2"
    really long test title aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
      ✓ takes a screenshot
      ✓ takes another screenshot


  22 passing
  1 pending
  6 failing

  1) taking screenshots
       generates pngs on failure:
     Error: fail whale
      [stack trace lines]

  2) taking screenshots
       screenshots in a retried test:
     Error: fail
      [stack trace lines]

  3) taking screenshots
       ensures unique paths when there's a non-named screenshot and a failure:
     Error: failing on purpose
      [stack trace lines]

  4) taking screenshots
       before hooks
         "before all" hook for "empty test 1":
     Error: before hook failing

Because this error occurred during a \`before all\` hook we are skipping the remaining tests in the current suite: \`before hooks\`
      [stack trace lines]

  5) taking screenshots
       each hooks
         "before each" hook for "empty test 2":
     Error: before each hook failed

Because this error occurred during a \`before each\` hook we are skipping the remaining tests in the current suite: \`each hooks\`
      [stack trace lines]

  6) taking screenshots
       each hooks
         "after each" hook for "empty test 2":
     Error: after each hook failed

Because this error occurred during a \`after each\` hook we are skipping the remaining tests in the current suite: \`each hooks\`
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        28                                                                               │
  │ Passing:      22                                                                               │
  │ Failing:      5                                                                                │
  │ Pending:      1                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  34                                                                               │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     screenshots_spec.js                                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/cypress/integration/screenshots_spec.js/black.p     (1280x720)
     ng                                                                                             
  -  /XXX/XXX/XXX/cypress/screenshots/cypress/integration/screenshots_spec.js/red.png     (1280x720)
  -  /XXX/XXX/XXX/cypress/screenshots/cypress/integration/screenshots_spec.js/foo/bar     (1280x720)
     /baz.png                                                                                       
  -  /XXX/XXX/XXX/cypress/screenshots/cypress/integration/screenshots_spec.js/taking      (1280x720)
     screenshots -- generates pngs on failure (failed).png                                          
  -  /XXX/XXX/XXX/cypress/screenshots/cypress/integration/screenshots_spec.js/color-c     (1280x720)
     heck.png                                                                                       
  -  /XXX/XXX/XXX/cypress/screenshots/cypress/integration/screenshots_spec.js/crop-ch      (600x400)
     eck.png                                                                                        
  -  /XXX/XXX/XXX/cypress/screenshots/cypress/integration/screenshots_spec.js/fullPag      (600x500)
     e.png                                                                                          
  -  /XXX/XXX/XXX/cypress/screenshots/cypress/integration/screenshots_spec.js/fullPag      (600x500)
     e-same.png                                                                                     
  -  /XXX/XXX/XXX/cypress/screenshots/cypress/integration/screenshots_spec.js/patholo     (1280x720)
     gical.png                                                                                      
  -  /XXX/XXX/XXX/cypress/screenshots/cypress/integration/screenshots_spec.js/element      (400x300)
     .png                                                                                           
  -  /XXX/XXX/XXX/cypress/screenshots/cypress/integration/screenshots_spec.js/taking      (200x1300)
     screenshots -- retries each screenshot for up to  XX:XX.png                                    
  -  /XXX/XXX/XXX/cypress/screenshots/cypress/integration/screenshots_spec.js/retryin    (1000x1316)
     g-test.png                                                                                     
  -  /XXX/XXX/XXX/cypress/screenshots/cypress/integration/screenshots_spec.js/taking      (1280x720)
     screenshots -- screenshots in a retried test (failed).png                                      
  -  /XXX/XXX/XXX/cypress/screenshots/cypress/integration/screenshots_spec.js/retryin    (1000x1316)
     g-test (attempt 2).png                                                                         
  -  /XXX/XXX/XXX/cypress/screenshots/cypress/integration/screenshots_spec.js/taking      (1280x720)
     screenshots -- screenshots in a retried test (failed) (attempt 2).png                          
  -  /XXX/XXX/XXX/cypress/screenshots/cypress/integration/screenshots_spec.js/retryin    (1000x1316)
     g-test (attempt 3).png                                                                         
  -  /XXX/XXX/XXX/cypress/screenshots/cypress/integration/screenshots_spec.js/taking      (1280x720)
     screenshots -- screenshots in a retried test (failed) (attempt 3).png                          
  -  /XXX/XXX/XXX/cypress/screenshots/cypress/integration/screenshots_spec.js/taking      (1280x720)
     screenshots -- ensures unique paths for non-named screenshots.png                              
  -  /XXX/XXX/XXX/cypress/screenshots/cypress/integration/screenshots_spec.js/taking      (1280x720)
     screenshots -- ensures unique paths for non-named screenshots (1).png                          
  -  /XXX/XXX/XXX/cypress/screenshots/cypress/integration/screenshots_spec.js/taking      (1280x720)
     screenshots -- ensures unique paths for non-named screenshots (2).png                          
  -  /XXX/XXX/XXX/cypress/screenshots/cypress/integration/screenshots_spec.js/taking      (1000x660)
     screenshots -- ensures unique paths when there's a non-named screenshot and a fa               
     ilure.png                                                                                      
  -  /XXX/XXX/XXX/cypress/screenshots/cypress/integration/screenshots_spec.js/taking      (1280x720)
     screenshots -- ensures unique paths when there's a non-named screenshot and a fa               
     ilure (failed).png                                                                             
  -  /XXX/XXX/XXX/cypress/screenshots/cypress/integration/screenshots_spec.js/aut-res    (1000x2000)
     ize.png                                                                                        
  -  /XXX/XXX/XXX/cypress/screenshots/cypress/integration/screenshots_spec.js/element      (420x320)
     -padding.png                                                                                   
  -  /XXX/XXX/XXX/cypress/screenshots/cypress/integration/screenshots_spec.js/non-ele      (600x200)
     ment-padding.png                                                                               
  -  /XXX/XXX/XXX/cypress/screenshots/cypress/integration/screenshots_spec.js/overwri       (100x50)
     te-test.png                                                                                    
  -  /XXX/XXX/XXX/cypress/screenshots/cypress/integration/screenshots_spec.js/app-cli       (100x50)
     p.png                                                                                          
  -  /XXX/XXX/XXX/cypress/screenshots/cypress/integration/screenshots_spec.js/runner-       (120x60)
     clip.png                                                                                       
  -  /XXX/XXX/XXX/cypress/screenshots/cypress/integration/screenshots_spec.js/fullPag       (140x70)
     e-clip.png                                                                                     
  -  /XXX/XXX/XXX/cypress/screenshots/cypress/integration/screenshots_spec.js/element       (160x80)
     -clip.png                                                                                      
  -  /XXX/XXX/XXX/cypress/screenshots/cypress/integration/screenshots_spec.js/taking      (1280x720)
     screenshots -- before hooks -- empty test 1 -- before all hook (failed).png                    
  -  /XXX/XXX/XXX/cypress/screenshots/cypress/integration/screenshots_spec.js/taking      (1280x720)
     screenshots -- each hooks -- empty test 2 -- before each hook (failed).png                     
  -  /XXX/XXX/XXX/cypress/screenshots/cypress/integration/screenshots_spec.js/taking      (1280x720)
     screenshots -- each hooks -- empty test 2 -- after each hook (failed).png                      
  -  /XXX/XXX/XXX/cypress/screenshots/cypress/integration/screenshots_spec.js/taking      (1000x660)
     screenshots -- really long test title aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa               
     aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa               
     aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.png                    


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/cypress/integration/screenshots     (X second)
                          _spec.js.mp4                                                              


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  screenshots_spec.js                      XX:XX       28       22        5        1        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX       28       22        5        1        -  


`
