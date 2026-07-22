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
        "tapGraphqlFailed",
        "tapGraphqlUnreachable",
        "tapInvalidExecResult",
        "tapInvalidSchema",
        "tapOutdatedProtocol",
        "tapStaleHandle",
        "tapUnsupportedProtocol",
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

  it('tapInvalidSchema — the instance returned an unrecognizable schema', () => {
    expect(render(errors.tapInvalidSchema)).toMatchInlineSnapshot(`
      "The running Cypress returned a tap schema this CLI does not recognize.

      The running version of Cypress may not support cypress tap."
    `)
  })

  it('tapUnsupportedProtocol — the instance is newer than this CLI', () => {
    expect(render(errors.tapUnsupportedProtocol)).toMatchInlineSnapshot(`
      "The running Cypress is newer than this CLI and uses a tap protocol it does not understand.

      Update the CLI (npm install --save-dev cypress@latest) and try again."
    `)
  })

  it('tapOutdatedProtocol — the instance is older than this CLI', () => {
    expect(render(errors.tapOutdatedProtocol)).toMatchInlineSnapshot(`
      "The running Cypress is older than this CLI and speaks an earlier tap protocol.

      Update Cypress in the running project to match this CLI (npm install --save-dev cypress@latest), then try again."
    `)
  })

  it('tapGraphqlUnreachable — the instance data layer could not be reached', () => {
    expect(render(errors.tapGraphqlUnreachable)).toMatchInlineSnapshot(`
      "Could not reach the Cypress instance to read its data.

      The instance may have just closed. Make sure Cypress is running in open mode, then try again."
    `)
  })

  it('tapGraphqlFailed — the instance failed while answering a data query', () => {
    expect(render(errors.tapGraphqlFailed)).toMatchInlineSnapshot(`
      "The Cypress instance failed while answering a data query.

      Search for an existing issue or open a GitHub issue at

        https://github.com/cypress-io/cypress/issues"
    `)
  })

  it('tapInvalidExecResult — the instance returned an unrecognizable exec result', () => {
    expect(render(errors.tapInvalidExecResult)).toMatchInlineSnapshot(`
      "The running Cypress returned a result this CLI does not recognize.

      The running version of Cypress may not support cypress tap."
    `)
  })
})
