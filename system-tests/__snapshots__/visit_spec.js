exports['e2e visit / source rewriting / passes with the default source rewriter'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (source_rewriting.cy.js)                                                   │
  │ Searched:   cypress/e2e/source_rewriting.cy.js                                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  source_rewriting.cy.js                                                          (1 of 1)


  source rewriting spec
    ✓ obstructive code is replaced
    issue 3975
      ✓ can relative redirect in a xhr onload
      ✓ can relative redirect in a onclick handler
      ✓ can relative redirect in a settimeout with a base tag
      - Login demo
      it can relative redirect in a settimeout
        ✓ with location.href
        ✓ with window.location.href
        ✓ with document.location.href
        ✓ with window.document.location.href
        ✓ with location.href = #hash
        ✓ with location.replace()
        ✓ with location.assign()
        ✓ with location = ...
        ✓ with window.location = ...
        ✓ with document.location = ...
        ✓ with window.document.location = ...
        ✓ with document.location = #hash
        ✓ with location.search
        ✓ with location.pathname
    can load some well-known sites in a timely manner
      - http://google.com
      - http://facebook.com
      - http://cypress.io
      - http://docs.cypress.io
      - http://github.com


  18 passing
  6 pending


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        24                                                                               │
  │ Passing:      18                                                                               │
  │ Failing:      0                                                                                │
  │ Pending:      6                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     source_rewriting.cy.js                                                           │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  source_rewriting.cy.js                   XX:XX       24       18        -        6        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX       24       18        -        6        -  


`
