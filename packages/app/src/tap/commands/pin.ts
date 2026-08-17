import { defineCommand } from './definition'
import { attemptOfLog, attemptSelectionError, liveSnapshots, resolveCommandLogId, selectTestAttempt, serializeReporterRow } from '../test-state'
import { tapManagerDataSource } from '../tap-manager-data-source'
import type { PinSnapshotEntry, TapTestsRunner } from '../types'
import { CommandNotFoundTapError, SnapshotNotFoundTapError, SpecInProgressTapError, TapError } from '../contract'
import type { ClearResult, PinnedView, PinResult, SnapshotRef } from '../contract'

// A pin as the commands read it, whoever made it: tap's own, or one made by hand
// in the reporter.
interface CurrentPin {
  test: string
  // The attempt the pinned log belongs to — part of the pin's identity, since
  // per-attempt ids restart from 1 and the same number names a different command
  // on another attempt.
  attempt: number
  // The driver's log id behind the tap command id — what the runner's
  // snapshot APIs key on.
  logId: string
  at: SnapshotRef
}

// The pin the app is showing, read off its snapshot store — the one place tap's
// pin and a command pinned by hand in the reporter both land. Derived on every
// read rather than tracked, so a pin (or an unpin) made in the UI between two tap
// commands is accounted for by construction.
const currentPin = (): CurrentPin | undefined => {
  const showing = tapManagerDataSource.getPinnedSnapshot()
  const runner = tapManagerDataSource.getSnapshotRunner()

  if (!showing || !runner) {
    return undefined
  }

  const test = runner.getTestState(showing.testId)
  const attempt = test && attemptOfLog(test, showing.logId)

  if (attempt === undefined) {
    return undefined
  }

  const snapshots = liveSnapshots(runner.getSnapshotPropsForLog(showing.testId, showing.logId))

  // A memory-evicted command is no longer a pin any command can report or release.
  if (!snapshots[showing.index]) {
    return undefined
  }

  return { test: showing.testId, attempt, logId: showing.logId, at: toRef(snapshots, showing.index) }
}

// The pin as both `pin` and `status` report it. The reporter row is rebuilt from
// the attempt each time rather than captured at pin time, so a row whose state
// or message moved on (a retried attempt, a settled assertion) reads current.
export const getPinnedView = (runner: Pick<TapTestsRunner, 'getTestState'>): PinnedView | undefined => {
  const current = currentPin()

  if (!current) {
    return undefined
  }

  const selection = selectTestAttempt(runner, current.test, current.attempt)

  if ('error' in selection) {
    return undefined
  }

  const row = serializeReporterRow(selection.test, selection.attempt, current.logId)

  return row && { test: current.test, at: current.at, ...row }
}

const toRef = (snapshots: PinSnapshotEntry[], index: number): SnapshotRef => {
  const { name } = snapshots[index]

  return { index: index + 1, total: snapshots.length, ...(name !== undefined ? { name } : {}) }
}

const resolveAt = (snapshots: PinSnapshotEntry[], at: string | undefined): number => {
  if (at === undefined) {
    return snapshots.length - 1
  }

  const index = Number(at)

  if (Number.isInteger(index) && index >= 1 && index <= snapshots.length) {
    return index - 1
  }

  const named = snapshots.findIndex((entry) => entry.name === at)

  if (named !== -1) {
    return named
  }

  // Names are quoted, since one can carry spaces and an unquoted list of them reads
  // as more snapshots than there are. An unnamed snapshot is reachable only by its
  // index, so that is what it is listed as.
  const available = snapshots.map((entry, index) => (entry.name === undefined ? `${index + 1}` : `"${entry.name}"`)).join(', ')

  throw new SnapshotNotFoundTapError(at, `This command has these snapshots: [${available}]`)
}

export const pinCommand = defineCommand('pin', async (_params, { 'test-id': test, 'command-id': command, at, clear, attempt }): Promise<PinResult | ClearResult> => {
  const runner = tapManagerDataSource.getSnapshotRunner()

  if (clear) {
    if (!runner || tapManagerDataSource.isRunning() || !currentPin()) {
      return { cleared: false }
    }

    // The app's own unpin is the whole release: it restores the page the pin
    // detached, whether tap pinned it or the reporter did.
    tapManagerDataSource.unpinSnapshot()

    return { cleared: true }
  }

  // Either the pair that names a command or `--clear`, which no one option can be
  // marked required to express.
  if (test === undefined || command === undefined) {
    throw new TapError('INVALID_OPTIONS', { detail: 'Pass `--test-id` and `--command-id`, as listed by `cypress tap reporter`, or `--clear` to release the current pin.' })
  }

  if (!runner) {
    throw new TapError('SPEC_NOT_STARTED')
  }

  if (tapManagerDataSource.isRunning()) {
    throw new SpecInProgressTapError(tapManagerDataSource.getActiveSpecRelative() ?? null)
  }

  const selection = selectTestAttempt(runner, test, attempt)

  if ('error' in selection) {
    throw attemptSelectionError(selection, test)
  }

  const logId = resolveCommandLogId(selection.attempt, command, test)

  if (logId === undefined) {
    throw new CommandNotFoundTapError(command, test)
  }

  const props = runner.getSnapshotPropsForLog(test, logId)
  const snapshots = liveSnapshots(props)

  if (snapshots.length === 0) {
    throw new TapError('SNAPSHOT_UNAVAILABLE')
  }

  const index = resolveAt(snapshots, at)

  const showing = currentPin()

  // Landing on the command already pinned switches which of its snapshots is
  // showing; anything else replaces the pin. A log id names a row only within
  // its test, so both halves identify the command.
  if (showing?.test === test && showing.logId === logId) {
    tapManagerDataSource.changeSnapshotState(index)
  } else {
    tapManagerDataSource.pinSnapshot({ ...props, snapshots }, index, test, logId)
  }

  const pinned = getPinnedView(runner)

  // The app is the record of the pin, so a pin it did not take is not a result.
  if (!pinned) {
    throw new TapError('SNAPSHOT_UNAVAILABLE')
  }

  return { pinned, ...(props?.url !== undefined ? { url: props.url } : {}) }
})
