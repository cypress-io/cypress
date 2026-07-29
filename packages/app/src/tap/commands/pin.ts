import { defineCommand, TapCommandError } from './definition'
import { attemptSelectionError, resolveCommandLogId, selectTestAttempt } from '../test-state'
import { tapManagerDataSource } from '../tap-manager-data-source'
import type { PinSnapshotEntry, PinSnapshotProps, PinSnapshotRunner } from '../types'

export interface SnapshotRef {
  index: number
  name?: string
}

export interface PinResult {
  pinned: { test: string, command: string, at: SnapshotRef }
  url?: string
}

export interface ClearResult {
  cleared: boolean
}

interface PinnedState {
  test: string
  command: string
  // The driver's log id behind the tap command id — what the runner's
  // snapshot APIs key on.
  logId: string
  at: SnapshotRef
  original: unknown
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
  tapManagerDataSource.getAutIframe()?.restoreDom(original)
}

export const getPinnedRef = (): { command: string, at: SnapshotRef } | undefined => {
  return pinned ? { command: pinned.command, at: pinned.at } : undefined
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

const liveSnapshots = (props: PinSnapshotProps | undefined): PinSnapshotEntry[] => {
  return (props?.snapshots ?? []).filter((entry): entry is PinSnapshotEntry => Boolean(entry))
}

const toRef = (entry: PinSnapshotEntry, index: number): SnapshotRef => {
  return { index: index + 1, ...(entry.name !== undefined ? { name: entry.name } : {}) }
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

  const at_ = toRef(snapshots[index], index)

  pinned = { ...current, at: at_, snapshot: snapshots[index] }

  return {
    pinned: { test: current.test, command: current.command, at: at_ },
    ...(props?.url !== undefined ? { url: props.url } : {}),
  }
}

const clearPin = (): ClearResult => {
  if (!pinned) {
    return { cleared: false }
  }

  const { original } = pinned

  releasePin()
  tapManagerDataSource.getAutIframe()?.restoreDom(original)
  tapManagerDataSource.unpinSnapshot()

  return { cleared: true }
}

export const pinCommand = defineCommand('pin', async ({ test, command }, { at, clear }): Promise<PinResult | ClearResult> => {
  const runner = tapManagerDataSource.getSnapshotRunner()

  if (runner) {
    reconcilePin(runner)
  }

  if (clear) {
    if (!runner || tapManagerDataSource.isRunning()) {
      releasePin()

      return { cleared: false }
    }

    return clearPin()
  }

  if (test === undefined || command === undefined) {
    throw new TapCommandError('PIN_TARGET_REQUIRED', 'provide a test id and command id to pin (as listed by the tests and commands commands), or pass --clear to release the current pin')
  }

  if (!runner) {
    throw new TapCommandError('NO_RUN', 'no spec has been run yet — use the run command to run a spec first')
  }

  if (tapManagerDataSource.isRunning()) {
    throw new TapCommandError('RUN_IN_PROGRESS', 'a spec is currently running — wait for it to finish before pinning a snapshot')
  }

  if (pinned && pinned.test === test && pinned.command === command) {
    return movePin(runner, at)
  }

  const selection = selectTestAttempt(runner, test)

  if ('error' in selection) {
    throw attemptSelectionError(selection, test)
  }

  const logId = resolveCommandLogId(selection.attempt, command, test)

  if (logId === undefined) {
    throw new TapCommandError('COMMAND_NOT_FOUND', `no command of this test matches the id "${command}" — use the commands command to list this test’s commands`)
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

  const original = pinned ? pinned.original : autIframe.detachDom()

  tapManagerDataSource.pinSnapshot({ ...props, snapshots }, index, test, logId)

  if (!pinned) {
    stopListeningForUnpin = tapManagerDataSource.onSnapshotUnpinned(onExternalUnpin)
  }

  const at_ = toRef(snapshots[index], index)

  pinned = { test, command, logId, at: at_, original, snapshot: snapshots[index] }

  return {
    pinned: { test, command, at: at_ },
    ...(props?.url !== undefined ? { url: props.url } : {}),
  }
})
