import { describe, expect, it } from 'vitest'

import { errors } from '../../../lib/errors'

// Catalog of every user-facing `cypress tap` error. The command boundary prints
// an error's description + solution only — no platform footer and no `----`
// dividers (the runtime diagnostic stays on the Error for logs/--debug). Adding
// or rewording a tap error should land here as a snapshot diff. Which failure
// maps to which entry is covered by tap-session.spec.ts.

// eslint-disable-next-line no-control-regex
const ANSI = /\[[0-9;]*m/g

// Mirror of what the command boundary shows the user. ANSI is stripped so the
// snapshot is the plain copy (a real terminal would color the links/keywords).
const render = (entry: { description: string, solution: string }): string => {
  return `${entry.description}\n\n${entry.solution}`.replace(ANSI, '')
}

describe('lib/tap public error catalog', () => {
  it('exposes exactly these public tap errors (add a case below for any new entry)', () => {
    expect(Object.keys(errors).filter((key) => key.startsWith('tap')).sort()).toMatchInlineSnapshot(`
      [
        "tapBindingNotFound",
        "tapBindingThrew",
        "tapCdpUnreachable",
        "tapStaleHandle",
      ]
    `)
  })

  it('tapCdpUnreachable — the debugging connection to the browser was lost', () => {
    expect(render(errors.tapCdpUnreachable)).toMatchInlineSnapshot(`
      "Lost the debugging connection to the browser Cypress is running.

      The browser may have just closed. Make sure Cypress is running with a browser open, then try again."
    `)
  })

  it('tapBindingNotFound — the instance page could not be reached', () => {
    expect(render(errors.tapBindingNotFound)).toMatchInlineSnapshot(`
      "Could not connect to the Cypress instance.

      The instance may still be loading — try again in a moment.

      If the problem persists, the browser tab running Cypress may have been closed. Open a browser in Cypress and try again."
    `)
  })

  it('tapBindingThrew — the binding method threw inside the instance', () => {
    expect(render(errors.tapBindingThrew)).toMatchInlineSnapshot(`
      "The Cypress instance failed while running the tap command.

      Search for an existing issue or open a GitHub issue at

        https://github.com/cypress-io/cypress/issues"
    `)
  })

  it('tapStaleHandle — the instance navigated mid-command', () => {
    expect(render(errors.tapStaleHandle)).toMatchInlineSnapshot(`
      "The Cypress instance navigated while running the command.

      Try running the command again."
    `)
  })
})
