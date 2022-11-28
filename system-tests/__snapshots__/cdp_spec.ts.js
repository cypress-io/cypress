exports['e2e cdp / handles disconnections as expected'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (spec.cy.ts)                                                               │
  │ Searched:   cypress/e2e/spec.cy.ts                                                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  spec.cy.ts                                                                      (1 of 1)


  e2e remote debugging disconnect
    ✓ reconnects as expected
There was an error reconnecting to the Chrome DevTools protocol. Please restart the browser.

Error: connect ECONNREFUSED 127.0.0.1:7777
      [stack trace lines]
`
