import { defineCommand, TapCommandError } from './definition'
import { resolveMaxChars, serializeElements, serializeMatches } from './dom-serialize'
import type { MatchesResult } from './dom-serialize'
import { readSnapshots, tapSnapshotSource, tapSnapshotStyles, toSnapshotRef } from './snapshot-state'
import type { SnapshotEntry, SnapshotRef, SnapshotStyle } from './snapshot-state'
import { serializeTestCommands } from './test-state'
import type { CommandEntry } from './test-state'

export interface SnapshotResult {
  /** The command-log entry the snapshot belongs to, for orientation. */
  command: CommandEntry
  /** AUT url at snapshot time. */
  url?: string
  viewport?: { width: number, height: number }
  /** Every snapshot this command captured; `at` names the one returned. */
  snapshots: SnapshotRef[]
  at: SnapshotRef
  /** The element(s) the command acted on, marked in the snapshot at capture. */
  subject?: { count: number, html: string[] }
  /** The snapshot body HTML — absent when a selector scopes the read. */
  html?: string
  /** The elements the selector matched; count 0 is a result, not a failure. */
  matches?: MatchesResult
  styles?: { head: SnapshotStyle[], body: SnapshotStyle[] }
  /** Present when any HTML was cut by the max-chars budget. */
  truncated?: true
}

const describeAvailable = (refs: SnapshotRef[]): string => {
  return refs.map((ref) => (ref.name !== undefined ? `"${ref.name}" (${ref.index})` : `${ref.index}`)).join(', ')
}

const resolveAt = (snapshots: SnapshotEntry[], at: string | undefined): number => {
  if (at === undefined) {
    return snapshots.length - 1
  }

  if (/^[0-9]+$/.test(at)) {
    const index = Number(at)

    if (index >= 1 && index <= snapshots.length) {
      return index - 1
    }
  } else {
    const index = snapshots.findIndex((entry) => entry.name === at)

    if (index !== -1) {
      return index
    }
  }

  const available = describeAvailable(snapshots.map(toSnapshotRef))

  throw new TapCommandError('SNAPSHOT_NOT_FOUND', `no snapshot of this command matches "${at}" — available snapshots: ${available}`)
}

const readBodyElement = (entry: SnapshotEntry): Element => {
  let body: Element | undefined

  try {
    // get() adopts the stored clone into a live document — required before
    // serializing or querying it (until then it lives in an XML document).
    body = entry.body?.get()[0]
  } catch {
    body = undefined
  }

  if (!body) {
    throw new TapCommandError('SNAPSHOT_UNAVAILABLE', 'the snapshot body could not be read — rerun the spec and read it again')
  }

  return body
}

export const snapshotCommand = defineCommand({
  description: 'read the DOM snapshot a command captured: page HTML, the elements a selector matches, and the elements the command acted on',
  params: [
    { name: 'test', type: 'string', required: true, description: 'test id, as listed by the tests command' },
    { name: 'command', type: 'string', required: true, description: 'command id, as listed by the commands command' },
  ],
  options: [
    { name: 'at', type: 'string', required: false, description: 'which snapshot of the command to read: a name like "before" or "after", or its 1-based index; defaults to the last (the command’s final state)' },
    { name: 'selector', type: 'string', required: false, description: 'CSS selector: return only the matching elements instead of the page HTML' },
    { name: 'styles', type: 'boolean', required: false, description: 'include the page stylesheets in the result' },
    { name: 'max-chars', type: 'number', required: false, description: 'cap on returned HTML characters (default 30000); the result carries truncated: true when cut' },
  ],
  handler: async ({ test, command }, { at, selector, styles, 'max-chars': maxCharsRaw }): Promise<SnapshotResult> => {
    const maxChars = resolveMaxChars(maxCharsRaw)
    const runner = tapSnapshotSource.getRunner()

    if (!runner) {
      throw new TapCommandError('NO_RUN', 'no spec has been run yet — use the run command to run a spec first')
    }

    const commands = serializeTestCommands(runner, test)

    if (commands === undefined) {
      throw new TapCommandError('TEST_NOT_FOUND', `no test of this run matches the id "${test}" — use the tests command to list this run’s tests`)
    }

    const commandEntry = commands.find((entry) => entry.id === command)

    if (!commandEntry) {
      throw new TapCommandError('COMMAND_NOT_FOUND', `no command of this test matches the id "${command}" — use the commands command to list this test’s commands`)
    }

    const props = runner.getSnapshotPropsForLog(test, command)
    const snapshots = readSnapshots(props)

    if (snapshots.length === 0) {
      throw new TapCommandError('SNAPSHOT_UNAVAILABLE', 'this command has no DOM snapshot — snapshots are captured in open mode and kept only for the most recent tests (numTestsKeptInMemory)')
    }

    const atIndex = resolveAt(snapshots, at)
    const chosen = snapshots[atIndex]
    const body = readBodyElement(chosen)

    const { url, highlightAttr, viewportWidth, viewportHeight } = props ?? {}

    const result: SnapshotResult = {
      command: commandEntry,
      ...(url !== undefined ? { url } : {}),
      ...(viewportWidth !== undefined && viewportHeight !== undefined
        ? { viewport: { width: viewportWidth, height: viewportHeight } }
        : {}),
      snapshots: snapshots.map(toSnapshotRef),
      at: toSnapshotRef(chosen, atIndex),
    }

    let truncated = false

    if (selector !== undefined) {
      const scoped = serializeMatches(body, selector, maxChars)

      result.matches = scoped.matches
      truncated = scoped.truncated
    } else {
      if (highlightAttr !== undefined) {
        const subjects = body.querySelectorAll(`[${highlightAttr}]`)

        if (subjects.length > 0) {
          const serialized = serializeElements(subjects, maxChars)

          result.subject = { count: subjects.length, html: serialized.html }
          truncated = serialized.truncated
        }
      }

      const page = serializeElements([body], maxChars)

      result.html = page.html[0] ?? ''
      truncated = truncated || page.truncated
    }

    if (styles) {
      const { headStyles, bodyStyles } = tapSnapshotStyles.getStyles(chosen)

      result.styles = { head: headStyles ?? [], body: bodyStyles ?? [] }
    }

    if (truncated) {
      result.truncated = true
    }

    return result
  },
})
