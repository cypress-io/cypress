import Debug from 'debug'
import commander from 'commander'

import { CypressInstanceError, resolveInstance } from '../../cypress-instances'
import { withTapSession } from '../tap-session'
import { resolveAutFrame, FrameCommandError } from '../aut-frame'
import { extractDom, DEFAULT_MAX_CHARS } from './dom'
import { renderResult, renderFailure, renderKnownFailure, renderFrameHelp } from '../output'

const debug = Debug('cypress:cli:tap')

// `tap frame` is CLI-native: the extractors run CDP domains the in-page binding
// cannot reach, so they are parsed and dispatched here rather than through the
// schema-driven binding program.
interface FrameOptions {
  instance?: number
}

interface ParsedFrame {
  sub: 'dom'
  selector?: string
  maxChars?: string
}

const parseMaxChars = (raw: string | undefined): number => {
  if (raw === undefined) {
    return DEFAULT_MAX_CHARS
  }

  const value = Number(raw)

  if (!Number.isInteger(value) || value <= 0) {
    throw new FrameCommandError('INVALID_MAX_CHARS', 'max-chars must be a positive integer (the cap on returned HTML characters)')
  }

  return value
}

const buildFrameProgram = (capture: (parsed: ParsedFrame) => void): commander.Command => {
  const program = new commander.Command('cypress tap frame')

  program.exitOverride()
  program.addHelpCommand(false)
  program.description('Inspect the app-under-test frame over CDP')

  program
  .command('dom [selector]')
  .description('read the app-under-test DOM: the page HTML, or just the elements matching a selector')
  .option('--max-chars <max-chars>', 'cap on returned HTML characters (default 30000)')
  .action((selector, opts) => {
    capture({ sub: 'dom', selector, maxChars: opts.maxChars })
  })

  return program
}

export const runFrame = async (operands: string[], options: FrameOptions, wantsHelp: boolean): Promise<number> => {
  debug('tap frame %o', operands)

  let parsed: ParsedFrame | undefined
  const program = buildFrameProgram((value) => {
    parsed = value
  })

  if (wantsHelp) {
    renderFrameHelp(program)

    return 0
  }

  try {
    program.parse(operands, { from: 'user' })
  } catch (err: any) {
    if (err instanceof commander.CommanderError) {
      return 1
    }

    throw err
  }

  if (!parsed) {
    renderFrameHelp(program)

    return 1
  }

  try {
    const selection = await resolveInstance({ instance: options.instance, cwd: process.cwd() })

    return await withTapSession(selection.instance, async (session) => {
      const frame = await resolveAutFrame(session.client, session.sessionId)

      try {
        // parsed.sub is 'dom' today; the switch grows with `ax` and `inspect`.
        const result = await extractDom(session, frame, parsed!.selector, parseMaxChars(parsed!.maxChars))

        renderResult(result)

        return 0
      } catch (err: any) {
        if (err instanceof FrameCommandError) {
          renderFailure({ code: err.code, message: err.message })

          return 1
        }

        throw err
      }
    })
  } catch (err: any) {
    if (err instanceof CypressInstanceError) {
      renderFailure(err)

      return 1
    }

    if (err.known && err.details) {
      renderKnownFailure(err)

      return 1
    }

    throw err
  }
}
