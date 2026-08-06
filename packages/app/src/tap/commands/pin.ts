import { defineCommand, noRunError, TapCommandError } from './definition'
import { attemptOfLog, attemptSelectionError, liveSnapshots, resolveCommandLogId, selectTestAttempt, serializeReporterRow } from '../test-state'
import { tapManagerDataSource } from '../tap-manager-data-source'
import type { PinSnapshotEntry, PinSnapshotProps, PinSnapshotRunner, TapTestsRunner } from '../types'
import { TAP_RUN_IN_PROGRESS_MESSAGE } from '../contract'
import type { ClearResult, PinnedView, PinResult, SnapshotRef } from '../contract'

// A pin as the commands read it, whoever made it: tap's own, or one made by hand
// in the reporter.
interface CurrentPin {
  test: string
  // The attempt the command id was resolved against — part of the pin's
  // identity, since per-attempt ids restart from 1 and the same number names
  // a different command on another attempt.
  attempt: number | undefined
  // The driver's log id behind the tap command id — what the runner's
  // snapshot APIs key on.
  logId: string
  at: SnapshotRef
  /**
   * The live DOM this pin replaced, put back on release. Held only for a pin made
   * over an app showing the live page: with a snapshot already pinned, detaching
   * would capture that snapshot instead, and the live DOM is the app's own to
   * restore through its unpin.
   */
  original?: unknown
}

interface PinnedState extends CurrentPin {
  command: string
  snapshot: PinSnapshotEntry
}

let pinned: PinnedState | undefined

let stopListeningForUnpin: (() => void) | undefined

const releasePin = (): void => {
  stopListeningForUnpin?.()
  stopListeningForUnpin = undefined
  pinned = undefined
}

export const resetPinState = (): void => {
  releasePin()
}

const restoreOriginal = (original: unknown): void => {
  if (original == null) {
    return
  }

  tapManagerDataSource.getAutIframe()?.restoreDom(original)
}

const onExternalUnpin = (): void => {
  if (!pinned) {
    return
  }

  const runner = tapManagerDataSource.getSnapshotRunner()

  if (!runner || tapManagerDataSource.isRunning()) {
    releasePin()

    return
  }

  reconcilePin(runner)

  if (!pinned) {
    return
  }

  const { original } = pinned

  releasePin()
  restoreOriginal(original)
}

// The pin the app is showing that tap did not make — a command pinned by hand in
// the reporter, which reaches no tap state at all. Derived on every read rather
// than tracked, so a pin (or an unpin) made in the UI between two tap commands is
// accounted for by construction. The reporter names only the log it pinned, so
// the attempt behind it is resolved here.
const uiPin = (): CurrentPin | undefined => {
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

  // The snapshot showing must still be one the runner holds — a memory-evicted
  // command is no longer a pin any command can report or release.
  if (!snapshots[showing.index]) {
    return undefined
  }

  return { test: showing.testId, attempt, logId: showing.logId, at: toRef(snapshots, showing.index) }
}

// What the AUT is showing, whoever pinned it. Tap's own record wins while it is
// the pin showing, since it alone carries the DOM to restore; a reporter click on
// another command replaces that pin with no unpin event to hear, so the command
// showing then comes from the app while the captured DOM — tap's to put back —
// stays with it.
const currentPin = (): CurrentPin | undefined => {
  const showing = uiPin()

  if (!pinned) {
    return showing
  }

  if (showing && showing.logId !== pinned.logId) {
    return { ...showing, original: pinned.original }
  }

  return pinned
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

export const reconcilePin = (runner: PinSnapshotRunner): void => {
  if (!pinned) {
    return
  }

  const stillLive = liveSnapshots(runner.getSnapshotPropsForLog(pinned.test, pinned.logId)).includes(pinned.snapshot)

  if (!stillLive) {
    releasePin()
  }
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

  const available = snapshots.map((entry, index) => (entry.name !== undefined ? `"${entry.name}" (${index + 1})` : `${index + 1}`)).join(', ')

  throw new TapCommandError('SNAPSHOT_NOT_FOUND', `no snapshot of this command matches "${at}" — available snapshots: ${available}`)
}

const movePin = (runner: PinSnapshotRunner, at: string | undefined): PinResult => {
  const current = pinned!
  const props = runner.getSnapshotPropsForLog(current.test, current.logId)
  const snapshots = liveSnapshots(props)
  const index = resolveAt(snapshots, at)

  tapManagerDataSource.changeSnapshotState(index)

  const at_ = toRef(snapshots, index)

  pinned = { ...current, at: at_, snapshot: snapshots[index] }

  return pinResult(runner, props)
}

// What both `pin` and `status` report about the pin, so a fresh pin, a snapshot
// move, and a later status all read the same. The row resolves — the pin was
// just verified against this attempt.
const pinResult = (runner: PinSnapshotRunner, props: PinSnapshotProps | undefined): PinResult => {
  return {
    pinned: getPinnedView(runner) as PinnedView,
    ...(props?.url !== undefined ? { url: props.url } : {}),
  }
}

const clearPin = (current: CurrentPin | undefined): ClearResult => {
  if (!current) {
    return { cleared: false }
  }

  const { original } = current

  releasePin()
  restoreOriginal(original)
  // Also the restore for a pin tap did not capture the DOM of: the app's unpin
  // puts back the live page it detached when the reporter row was hovered.
  tapManagerDataSource.unpinSnapshot()

  return { cleared: true }
}

export const pinCommand = defineCommand('pin', async (_params, { testId: test, commandId: command, at, clear, attempt }): Promise<PinResult | ClearResult> => {
  const runner = tapManagerDataSource.getSnapshotRunner()

  if (runner) {
    reconcilePin(runner)
  }

  const current = currentPin()

  if (clear) {
    if (!runner || tapManagerDataSource.isRunning()) {
      releasePin()

      return { cleared: false }
    }

    return clearPin(current)
  }

  if (test === undefined || command === undefined) {
    throw new TapCommandError('PIN_TARGET_REQUIRED', 'provide a test id and command id to pin (as listed by the reporter command), or pass --clear to release the current pin')
  }

  if (!runner) {
    throw noRunError()
  }

  if (tapManagerDataSource.isRunning()) {
    throw new TapCommandError('RUN_IN_PROGRESS', TAP_RUN_IN_PROGRESS_MESSAGE)
  }

  // A move switches the snapshot of the pin the app holds, so it needs tap's own
  // record to still be that pin — `current === pinned` is what says so.
  if (pinned && current === pinned && pinned.test === test && pinned.command === command && pinned.attempt === attempt) {
    return movePin(runner, at)
  }

  const selection = selectTestAttempt(runner, test, attempt)

  if ('error' in selection) {
    throw attemptSelectionError(selection, test)
  }

  const logId = resolveCommandLogId(selection.attempt, command, test)

  if (logId === undefined) {
    throw new TapCommandError('COMMAND_NOT_FOUND', `no command of this test matches the id "${command}" — use the reporter command (with --testId) to list this test’s commands`)
  }

  const props = runner.getSnapshotPropsForLog(test, logId)
  const snapshots = liveSnapshots(props)

  if (snapshots.length === 0) {
    throw new TapCommandError('SNAPSHOT_UNAVAILABLE', 'this command has no DOM snapshot to pin — snapshots are captured in open mode and kept only for the most recent tests (numTestsKeptInMemory)')
  }

  const index = resolveAt(snapshots, at)

  const autIframe = tapManagerDataSource.getAutIframe()

  if (!autIframe) {
    throw new TapCommandError('NO_AUT', 'the app under test is not available to pin a snapshot into')
  }

  const original = current ? current.original : autIframe.detachDom()

  tapManagerDataSource.pinSnapshot({ ...props, snapshots }, index, test, logId)

  if (!pinned) {
    stopListeningForUnpin = tapManagerDataSource.onSnapshotUnpinned(onExternalUnpin)
  }

  const at_ = toRef(snapshots, index)

  pinned = { test, command, attempt, logId, at: at_, original, snapshot: snapshots[index] }

  return pinResult(runner, props)
})
