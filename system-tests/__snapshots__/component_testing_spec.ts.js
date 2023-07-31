exports['React major versions with Webpack executes all of the tests for React v18 with Webpack 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      5 found (App.cy.jsx, Unmount.cy.jsx, UsingLegacyMount.cy.jsx, Rerendering.cy.jsx,  │
  │             mount.cy.jsx)                                                                      │
  │ Searched:   src/App.cy.jsx, src/Unmount.cy.jsx, src/UsingLegacyMount.cy.jsx, src/Rerendering.c │
  │             y.jsx, src/mount.cy.jsx                                                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  App.cy.jsx                                                                      (1 of 5)
   53 modules


  ✓ renders hello world
  ✓ renders background

  2 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      2                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     App.cy.jsx                                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/App.cy.jsx.mp4


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  Unmount.cy.jsx                                                                  (2 of 5)


  Comp with componentWillUnmount
    ✓ calls the prop

  mount cleanup
    ✓ mount 1
    ✓ mount 2


  3 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        3                                                                                │
  │ Passing:      3                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     Unmount.cy.jsx                                                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/Unmount.cy.jsx.mp4


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  UsingLegacyMount.cy.jsx                                                         (3 of 5)


  using legacy mount
    ✓ issues a warning encouraging user to update


  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     UsingLegacyMount.cy.jsx                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/UsingLegacyMount.cy.jsx.mp4


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  Rerendering.cy.jsx                                                              (4 of 5)


  re-render
    ✓ maintains component state across re-renders


  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     Rerendering.cy.jsx                                                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/Rerendering.cy.jsx.mp4


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  mount.cy.jsx                                                                    (5 of 5)


  mount
    ✓ does not error when rendering primitives
    teardown
      ✓ should mount
      ✓ should remove previous mounted component


  3 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        3                                                                                │
  │ Passing:      3                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     mount.cy.jsx                                                                     │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/mount.cy.jsx.mp4


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  App.cy.jsx                               XX:XX        2        2        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  Unmount.cy.jsx                           XX:XX        3        3        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  UsingLegacyMount.cy.jsx                  XX:XX        1        1        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  Rerendering.cy.jsx                       XX:XX        1        1        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  mount.cy.jsx                             XX:XX        3        3        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX       10       10        -        -        -  


`

exports['React major versions with Webpack executes all of the tests for React v17 with Webpack 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      5 found (App.cy.jsx, Unmount.cy.jsx, UsingLegacyMount.cy.jsx, Rerendering.cy.jsx,  │
  │             mount.cy.jsx)                                                                      │
  │ Searched:   src/App.cy.jsx, src/Unmount.cy.jsx, src/UsingLegacyMount.cy.jsx, src/Rerendering.c │
  │             y.jsx, src/mount.cy.jsx                                                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  App.cy.jsx                                                                      (1 of 5)
   50 modules


  ✓ renders hello world
  ✓ renders background

  2 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      2                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     App.cy.jsx                                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/App.cy.jsx.mp4


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  Unmount.cy.jsx                                                                  (2 of 5)


  Comp with componentWillUnmount
    ✓ calls the prop

  mount cleanup
    ✓ mount 1
    ✓ mount 2


  3 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        3                                                                                │
  │ Passing:      3                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     Unmount.cy.jsx                                                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/Unmount.cy.jsx.mp4


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  UsingLegacyMount.cy.jsx                                                         (3 of 5)


  using legacy mount
    ✓ does not warning or log


  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     UsingLegacyMount.cy.jsx                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/UsingLegacyMount.cy.jsx.mp4


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  Rerendering.cy.jsx                                                              (4 of 5)


  re-render
    ✓ maintains component state across re-renders


  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     Rerendering.cy.jsx                                                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/Rerendering.cy.jsx.mp4


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  mount.cy.jsx                                                                    (5 of 5)


  mount
    ✓ does not error when rendering primitives
    teardown
      ✓ should mount
      ✓ should remove previous mounted component


  3 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        3                                                                                │
  │ Passing:      3                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     mount.cy.jsx                                                                     │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/mount.cy.jsx.mp4


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  App.cy.jsx                               XX:XX        2        2        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  Unmount.cy.jsx                           XX:XX        3        3        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  UsingLegacyMount.cy.jsx                  XX:XX        1        1        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  Rerendering.cy.jsx                       XX:XX        1        1        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  mount.cy.jsx                             XX:XX        3        3        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX       10       10        -        -        -  


`

exports['React major versions with Vite executes all of the tests for React v17 with Vite 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      5 found (App.cy.jsx, Unmount.cy.jsx, UsingLegacyMount.cy.jsx, Rerendering.cy.jsx,  │
  │             mount.cy.jsx)                                                                      │
  │ Searched:   src/App.cy.jsx, src/Unmount.cy.jsx, src/UsingLegacyMount.cy.jsx, src/Rerendering.c │
  │             y.jsx, src/mount.cy.jsx                                                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  App.cy.jsx                                                                      (1 of 5)


  ✓ renders hello world
  ✓ renders background

  2 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      2                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     App.cy.jsx                                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/App.cy.jsx.mp4


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  Unmount.cy.jsx                                                                  (2 of 5)


  Comp with componentWillUnmount
    ✓ calls the prop

  mount cleanup
    ✓ mount 1
    ✓ mount 2


  3 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        3                                                                                │
  │ Passing:      3                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     Unmount.cy.jsx                                                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/Unmount.cy.jsx.mp4


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  UsingLegacyMount.cy.jsx                                                         (3 of 5)


  using legacy mount
    ✓ does not warning or log


  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     UsingLegacyMount.cy.jsx                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/UsingLegacyMount.cy.jsx.mp4


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  Rerendering.cy.jsx                                                              (4 of 5)


  re-render
    ✓ maintains component state across re-renders


  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     Rerendering.cy.jsx                                                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/Rerendering.cy.jsx.mp4


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  mount.cy.jsx                                                                    (5 of 5)


  mount
    ✓ does not error when rendering primitives
    teardown
      ✓ should mount
      ✓ should remove previous mounted component


  3 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        3                                                                                │
  │ Passing:      3                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     mount.cy.jsx                                                                     │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/mount.cy.jsx.mp4


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  App.cy.jsx                               XX:XX        2        2        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  Unmount.cy.jsx                           XX:XX        3        3        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  UsingLegacyMount.cy.jsx                  XX:XX        1        1        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  Rerendering.cy.jsx                       XX:XX        1        1        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  mount.cy.jsx                             XX:XX        3        3        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX       10       10        -        -        -  


`

exports['React major versions with Vite executes all of the tests for React v18 with Vite 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      5 found (App.cy.jsx, Unmount.cy.jsx, UsingLegacyMount.cy.jsx, Rerendering.cy.jsx,  │
  │             mount.cy.jsx)                                                                      │
  │ Searched:   src/App.cy.jsx, src/Unmount.cy.jsx, src/UsingLegacyMount.cy.jsx, src/Rerendering.c │
  │             y.jsx, src/mount.cy.jsx                                                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  App.cy.jsx                                                                      (1 of 5)


  ✓ renders hello world
  ✓ renders background

  2 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      2                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     App.cy.jsx                                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/App.cy.jsx.mp4


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  Unmount.cy.jsx                                                                  (2 of 5)


  Comp with componentWillUnmount
    ✓ calls the prop

  mount cleanup
    ✓ mount 1
    ✓ mount 2


  3 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        3                                                                                │
  │ Passing:      3                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     Unmount.cy.jsx                                                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/Unmount.cy.jsx.mp4


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  UsingLegacyMount.cy.jsx                                                         (3 of 5)


  using legacy mount
    ✓ issues a warning encouraging user to update


  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     UsingLegacyMount.cy.jsx                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/UsingLegacyMount.cy.jsx.mp4


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  Rerendering.cy.jsx                                                              (4 of 5)


  re-render
    ✓ maintains component state across re-renders


  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     Rerendering.cy.jsx                                                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/Rerendering.cy.jsx.mp4


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  mount.cy.jsx                                                                    (5 of 5)


  mount
    ✓ does not error when rendering primitives
    teardown
      ✓ should mount
      ✓ should remove previous mounted component


  3 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        3                                                                                │
  │ Passing:      3                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     mount.cy.jsx                                                                     │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/mount.cy.jsx.mp4


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  App.cy.jsx                               XX:XX        2        2        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  Unmount.cy.jsx                           XX:XX        3        3        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  UsingLegacyMount.cy.jsx                  XX:XX        1        1        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  Rerendering.cy.jsx                       XX:XX        1        1        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  mount.cy.jsx                             XX:XX        3        3        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX       10       10        -        -        -  


`

exports['experimentalSingleTabRunMode / executes all specs in a single tab'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:      1.2.3                                                                            │
  │ Browser:      FooBrowser 88                                                                    │
  │ Specs:        4 found (1_fails.cy.js, 2_foo.cy.js, 3_retries.cy.js, 999_final.cy.js)           │
  │ Searched:     **/*.cy.js                                                                       │
  │ Experiments:  experimentalSingleTabRunMode=true                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  1_fails.cy.js                                                                   (1 of 4)
webpack compiled successfully


  simple failing spec
    1) fails
    2) fails again


  0 passing
  2 failing

  1) simple failing spec
       fails:

      AssertionError: expected 1 to equal 2
      + expected - actual

      -1
      +2
      
      [stack trace lines]

  2) simple failing spec
       fails again:

      AssertionError: expected 1 to equal 3
      + expected - actual

      -1
      +3
      
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      2                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  2                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     1_fails.cy.js                                                                    │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/1_fails.cy.js/simple failing spec -- fails (fai     (1280x720)
     led).png                                                                                       
  -  /XXX/XXX/XXX/cypress/screenshots/1_fails.cy.js/simple failing spec -- fails agai     (1280x720)
     n (failed).png                                                                                 


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/1_fails.cy.js.mp4


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  2_foo.cy.js                                                                     (2 of 4)


  component
    ✓ passes


  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     2_foo.cy.js                                                                      │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/2_foo.cy.js.mp4


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  3_retries.cy.js                                                                 (3 of 4)


  retries
    (Attempt 1 of 2) passes after 1 failure
    ✓ passes after 1 failure


  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     3_retries.cy.js                                                                  │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/3_retries.cy.js.mp4


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  999_final.cy.js                                                                 (4 of 4)


  ✓ verifies AUT is destroyed after each spec

  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     999_final.cy.js                                                                  │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/999_final.cy.js.mp4


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  1_fails.cy.js                            XX:XX        2        -        2        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  2_foo.cy.js                              XX:XX        1        1        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  3_retries.cy.js                          XX:XX        1        1        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  999_final.cy.js                          XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 4 failed (25%)                      XX:XX        5        3        2        -        -  


`
