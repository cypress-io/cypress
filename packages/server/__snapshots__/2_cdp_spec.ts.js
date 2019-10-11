exports['e2e cdp fails when remote debugging port cannot be connected to 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (spec.ts)                                                                  │
  │ Searched:   cypress/integration/spec.ts                                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: spec.ts...                                                                      (1 of 1) 
Cypress could not make a connection to the Chrome DevTools Protocol after 5 seconds.

Without this, your tests can not run. Please check your Chrome installation and try again.

The CDP port requested was 777.

Error details:

Error: connect ECONNREFUSED 127.0.0.1:777
    at stack trace line


`
