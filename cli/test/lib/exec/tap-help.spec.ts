import { beforeEach, describe, expect, it, vi } from 'vitest'

import logger from '../../../lib/logger'
import { resolveSession } from '../../../lib/cypress-sessions'
import { buildTapProgram } from '../../../lib/tap/build-program'
import { buildTapSchema } from '@packages/cypress-sessions'
import tap from '../../../lib/exec/tap'
import { resetTapMocks, tapError } from './tap-fixtures'

// vi.mock is hoisted above these imports, so the factories cannot come from
// ./tap-fixtures — resetTapMocks resets the mocks these declare.
vi.mock('../../../lib/tap/tap-connection', async (importActual) => {
  return { ...await importActual<typeof import('../../../lib/tap/tap-connection')>(), withTapConnection: vi.fn() }
})

vi.mock('../../../lib/tap/session-gql', () => {
  return { querySessionGraphql: vi.fn() }
})

vi.mock('../../../lib/cypress-sessions', async (importActual) => {
  return {
    ...await importActual<typeof import('../../../lib/cypress-sessions')>(),
    listLiveSessions: vi.fn(),
    resolveLiveSession: vi.fn(),
    resolveSession: vi.fn(),
  }
})

vi.mock('../../../lib/tap/aut/frame', async (importActual) => {
  return { ...await importActual<typeof import('../../../lib/tap/aut/frame')>(), withResolvedAutFrame: vi.fn() }
})

// Every command the overview advertises, in the order it lists them, so a
// command added to either side of the contract brings its own snapshot with it.
const advertised = buildTapProgram(buildTapSchema('15.0.0'), () => {}).commands.map((command) => command.name())

describe('lib/exec/tap help', () => {
  beforeEach(() => {
    resetTapMocks()

    // Help is answerable without a session, and with none reachable it renders
    // from the schema the CLI ships with — the same text a session-attached
    // invocation prints, minus the banner naming that session.
    vi.mocked(resolveSession).mockRejectedValue(tapError('NO_SESSION', 'No running Cypress was found.'))
  })

  it('cypress tap --help', async () => {
    expect(await tap.start(['--help'], {})).toBe(0)
    expect(logger.print()).toMatchSnapshot()
  })

  it.each(advertised)('cypress tap %s --help', async (command) => {
    expect(await tap.start([command, '--help'], {})).toBe(0)
    expect(logger.print()).toMatchSnapshot()
  })
})
