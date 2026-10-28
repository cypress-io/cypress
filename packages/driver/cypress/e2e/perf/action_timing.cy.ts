/**
 * Action timing benchmark
 *
 * Times `click`, `type` and `check` from `command:start` to `command:end` and
 * prints per-action totals and medians through the `log` task, so a headless
 * run shows the fixed per-action wait that actions add on top of the work.
 * It asserts nothing about speed; compare its output between runs:
 *
 *   yarn workspace @packages/driver cypress:run --browser electron \
 *     --spec cypress/e2e/perf/action_timing.cy.ts \
 *     [--config alwaysDelayActions=true]
 */

const ITERATIONS = {
  click: 100,
  type: 50,
  check: 20,
}

type Measured = keyof typeof ITERATIONS

// Read before any hook runs, while these still hold the values for this mode.
const actualConfig = {
  isInteractive: Cypress.config('isInteractive'),
  numTestsKeptInMemory: Cypress.config('numTestsKeptInMemory'),
}

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)

  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

describe('action timing', () => {
  const durations: Record<Measured, number[]> = { click: [], type: [], check: [] }
  const startedAt = new Map<string, number>()

  const isMeasured = (name: string): name is Measured => name in ITERATIONS

  const onStart = (command) => {
    if (isMeasured(command.get('name'))) {
      startedAt.set(command.get('id'), performance.now())
    }
  }

  const onEnd = (command) => {
    const name = command.get('name')
    const start = startedAt.get(command.get('id'))

    if (isMeasured(name) && start !== undefined) {
      durations[name].push(performance.now() - start)
    }
  }

  before(() => {
    Cypress.on('command:start', onStart)
    Cypress.on('command:end', onEnd)
  })

  after(() => {
    Cypress.off('command:start', onStart)
    Cypress.off('command:end', onEnd)

    const lines = (Object.keys(ITERATIONS) as Measured[]).map((name) => {
      const values = durations[name]
      const total = values.reduce((sum, value) => sum + value, 0)

      return `${name}: n=${values.length} total=${total.toFixed(0)}ms median=${median(values).toFixed(1)}ms`
    })

    cy.task('log', `[action-timing] ${lines.join(' | ')}`)
  })

  beforeEach(() => {
    // The support file makes every driver spec look interactive and keep a
    // test in memory so it can assert on snapshots. Undo that so this spec
    // times actions the way the mode it runs in really does.
    // @ts-expect-error - isInteractive is read-only to users, but the driver tests need it
    Cypress.config('isInteractive', actualConfig.isInteractive)
    Cypress.config('numTestsKeptInMemory', actualConfig.numTestsKeptInMemory)

    cy.visit('/fixtures/dom.html')
  })

  it(`clicks ${ITERATIONS.click} times`, () => {
    for (let i = 0; i < ITERATIONS.click; i++) {
      cy.get('#button').click()
    }
  })

  it(`types into an unfocused input ${ITERATIONS.type} times`, () => {
    // Alternate inputs so each `type` starts on an unfocused field and
    // has to click it first.
    for (let i = 0; i < ITERATIONS.type; i++) {
      cy.get(i % 2 ? '#name' : '#input').type('ab')
    }
  })

  it(`checks ${ITERATIONS.check} times`, () => {
    for (let i = 0; i < ITERATIONS.check; i++) {
      cy.get(':checkbox[name="colors"][value="blue"]')
      .invoke('prop', 'checked', false)
      .check()
    }
  })
})
