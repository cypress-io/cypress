exports['e2e runnable execution / cannot navigate in before hook and test'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (beforehook-and-test-navigation.js)                                        │
  │ Searched:   cypress/e2e/beforehook-and-test-navigation.js                                      │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  beforehook-and-test-navigation.js                                               (1 of 1)


  initial domain change
    ✓ test

  suite
    ✓ test
    1) causes domain navigation

  navigation error in beforeEach
    2) "before each" hook for "never gets here"


  2 passing
  2 failing

  1) suite
       causes domain navigation:
     CypressError: \`cy.visit()\` failed because you are attempting to visit a URL that is of a different origin.

The new URL is considered a different origin because the following parts of the URL are different:

  > port

You may only \`cy.visit()\` same-origin URLs within a single test.

The previous URL you visited was:

  > 'http://localhost:4545'

You're attempting to visit this URL:

  > 'http://localhost:5656'

You may need to restructure some of your test code to avoid this problem.

https://on.cypress.io/cannot-visit-different-origin-domain
      [stack trace lines]

  2) navigation error in beforeEach
       "before each" hook for "never gets here":
     CypressError: \`cy.visit()\` failed because you are attempting to visit a URL that is of a different origin.

The new URL is considered a different origin because the following parts of the URL are different:

  > port

You may only \`cy.visit()\` same-origin URLs within a single test.

The previous URL you visited was:

  > 'http://localhost:4545'

You're attempting to visit this URL:

  > 'http://localhost:5656'

You may need to restructure some of your test code to avoid this problem.

https://on.cypress.io/cannot-visit-different-origin-domain

Because this error occurred during a \`before each\` hook we are skipping the remaining tests in the current suite: \`navigation error in beforeEach\`
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        4                                                                                │
  │ Passing:      2                                                                                │
  │ Failing:      2                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     beforehook-and-test-navigation.js                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/beforehook-and-test-navigation.     (X second)
                          js.mp4                                                                    


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  beforehook-and-test-navigation.js        XX:XX        4        2        2        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        4        2        2        -        -  


`

exports['e2e runnable execution / runnables run correct number of times with navigation'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (runnable-run-count.spec.js)                                               │
  │ Searched:   cypress/e2e/runnable-run-count.spec.js                                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  runnable-run-count.spec.js                                                      (1 of 1)


  suite 1.0
    ✓ test 1.0.1
    ✓ test 1.0.2
    ✓ test 1.0.3

  suite 1.1
    ✓ test 1.1.1
    ✓ test 1.1.2

  suite 1.2
    ✓ test 1.2.1
    ✓ test 1.2.2


  7 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        7                                                                                │
  │ Passing:      7                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     runnable-run-count.spec.js                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/runnable-run-count.spec.js.mp4      (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  runnable-run-count.spec.js               XX:XX        7        7        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        7        7        -        -        -  


`

exports['e2e runnable execution / runs correctly after top navigation with already ran suite'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (runnables_already_run_suite.js)                                           │
  │ Searched:   cypress/e2e/runnables_already_run_suite.js                                         │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  runnables_already_run_suite.js                                                  (1 of 1)


  Top level describe 
    suite 1
      ✓ should pass
    suite 2
      1) should fail


  1 passing
  1 failing

  1) Top level describe 
       suite 2
         should fail:
     AssertionError: expected true to be false
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     runnables_already_run_suite.js                                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/runnables_already_run_suite.js/Top level descri     (1280x720)
     be -- suite 2 -- should fail (failed).png                                                      


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  runnables_already_run_suite.js           XX:XX        2        1        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        2        1        1        -        -  


`
