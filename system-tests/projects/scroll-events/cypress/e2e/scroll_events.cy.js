// Reproduction for issue #29385.
//
// Probes how long a single requestAnimationFrame takes to fire from an idle
// page, repeatedly, waiting in between so the page returns to idle before each
// probe. On a healthy 60fps page this stays near one frame (~16ms). The issue
// reports stalls of 500-600ms in Electron/Linux when the runner UI is hidden
// (--no-runner-ui), because the idle compositor stops producing frames.
const PROBES = 25
const IDLE_BETWEEN_MS = 250
const MAX_ACCEPTABLE_LATENCY_MS = 100

describe('idle frame / scroll cadence', () => {
  it('fires animation frames without large gaps when idle', () => {
    cy.visit('/scroll.html')

    const latencies = []

    Cypress._.times(PROBES, () => {
      // let the page sit idle so the compositor would throttle if it's going to
      cy.wait(IDLE_BETWEEN_MS)
      cy.window().then((win) => {
        return win.__probeFrame().then((r) => {
          latencies.push(r.rafLatency)
        })
      })
    })

    cy.then(() => {
      const max = Math.max(...latencies)
      const avg = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)

      cy.task('log', `idle-frame latencies (ms): max=${max} avg=${avg} all=${JSON.stringify(latencies)}`)

      expect(max, 'max idle rAF latency (ms)').to.be.lessThan(MAX_ACCEPTABLE_LATENCY_MS)
    })
  })
})
