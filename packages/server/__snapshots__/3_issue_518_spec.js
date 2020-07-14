exports['e2e issue 518 / bails'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      2 found (issue_518_a_spec.js, issue_518_b_spec.js)                                 │
  │ Searched:   cypress/integration/issue_518_*                                                    │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  issue_518_a_spec.js                                                             (1 of 2)


  issue #518 A
    1) fails

  0 passing
  1 failing

  1) issue #518 A
       fails:
     CypressError: \`cy.visit()\` failed trying to load:

/does-not-exist.html

We failed looking for this file at the path:

/foo/bar/.projects/e2e/does-not-exist.html

The internal Cypress web server responded with:

  > 404: Not Found
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      1                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     issue_518_a_spec.js                                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/issue_518_a_spec.js/issue #518 A -- fails (fail     (1280x720)
     ed).png                                                                                        


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/issue_518_a_spec.js.mp4             (X second)

Bailing due to failing test and "--bail" flag on CLI.

`
