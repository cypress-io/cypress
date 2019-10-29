exports['e2e cdp / fails when remote debugging port cannot be connected to'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (spec.ts)                                                                  │
  │ Searched:   cypress/integration/spec.ts                                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  spec.ts                                                                         (1 of 1)
Cypress failed to make a connection to the Chrome DevTools Protocol after retrying for 5 seconds.

This usually indicates there was a problem opening the Chrome browser.

The CDP port requested was 7777.

Error details:

Error: connect ECONNREFUSED 127.0.0.1:7777
    at stack trace line


`
