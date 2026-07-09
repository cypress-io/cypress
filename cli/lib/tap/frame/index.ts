import Debug from 'debug'
import commander from 'commander'

import { CypressInstanceError, resolveInstance } from '../../cypress-instances'
import { withTapSession } from '../tap-session'
import { resolveAutFrame, FrameCommandError } from '../aut-frame'
import { extractDom, DEFAULT_MAX_CHARS } from './dom'
import { extractAx, DEFAULT_MAX_NODES } from './ax'
import { extractInspect } from './inspect'
import { renderResult, renderFailure, renderKnownFailure, renderFrameHelp } from '../output'

const debug = Debug('cypress:cli:tap')

// `tap frame` is CLI-native: the extractors run CDP domains the in-page binding
// cannot reach, so they are parsed and dispatched here rather than through the
// schema-driven binding program.
interface FrameOptions {
  instance?: number
}

interface ParsedFrame {
  sub: 'dom' | 'ax' | 'inspect'
  selector?: string
  maxChars?: string
  maxNodes?: string
}

const parsePositiveInt = (raw: string | undefined, fallback: number, label: string): number => {
  if (raw === undefined) {
    return fallback
  }

  const value = Number(raw)

  if (!Number.isInteger(value) || value <= 0) {
    throw new FrameCommandError('INVALID_LIMIT', `${label} must be a positive integer`)
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

  program
  .command('ax [selector]')
  .description('read the accessibility tree of the app-under-test frame, or the subtree at a selector')
  .option('--max-nodes <max-nodes>', 'cap on the number of accessibility nodes returned (default 200)')
  .action((selector, opts) => {
    capture({ sub: 'ax', selector, maxNodes: opts.maxNodes })
  })

  program
  .command('inspect <selector>')
  .description('inspect one element: its tag, attributes, computed styles, box model, and accessibility node')
  .action((selector) => {
    capture({ sub: 'inspect', selector })
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
        let result: unknown

        if (parsed!.sub === 'ax') {
          result = await extractAx(session, frame, parsed!.selector, parsePositiveInt(parsed!.maxNodes, DEFAULT_MAX_NODES, 'max-nodes'))
        } else if (parsed!.sub === 'inspect') {
          result = await extractInspect(session, frame, parsed!.selector!)
        } else {
          result = await extractDom(session, frame, parsed!.selector, parsePositiveInt(parsed!.maxChars, DEFAULT_MAX_CHARS, 'max-chars'))
        }

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
