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
Failed to connect to Chrome, retrying in 1 second (attempt 18/32)
Failed to connect to Chrome, retrying in 1 second (attempt 19/32)
Failed to connect to Chrome, retrying in 1 second (attempt 20/32)
Failed to connect to Chrome, retrying in 1 second (attempt 21/32)
Failed to connect to Chrome, retrying in 1 second (attempt 22/32)
Failed to connect to Chrome, retrying in 1 second (attempt 23/32)
Failed to connect to Chrome, retrying in 1 second (attempt 24/32)
Failed to connect to Chrome, retrying in 1 second (attempt 25/32)
Failed to connect to Chrome, retrying in 1 second (attempt 26/32)
Failed to connect to Chrome, retrying in 1 second (attempt 27/32)
Failed to connect to Chrome, retrying in 1 second (attempt 28/32)
Failed to connect to Chrome, retrying in 1 second (attempt 29/32)
Failed to connect to Chrome, retrying in 1 second (attempt 30/32)
Failed to connect to Chrome, retrying in 1 second (attempt 31/32)
Failed to connect to Chrome, retrying in 1 second (attempt 32/32)
Cypress failed to make a connection to the Chrome DevTools Protocol after retrying for 20 seconds.

This usually indicates there was a problem opening the Chrome browser.

The CDP port requested was 7777.

Error details:

Error: connect ECONNREFUSED 127.0.0.1:7777
    at stack trace line


`
