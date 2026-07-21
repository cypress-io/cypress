import { defineCommand, TapCommandError } from './definition'
import { attemptSelectionError, selectTestAttempt, serializeTestCommands } from './test-state'
import { tapPinSource } from './snapshot-pin'
import type { PinSnapshotEntry, PinSnapshotProps } from './snapshot-pin'

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

// The pin outlives a single tap call: `pin` mutates the live AUT, later `frame`
// commands read it, `pin --clear` restores. This module state (held in the
// running app between calls) remembers the pre-pin DOM so clear can put it back.
interface PinnedState {
  test: string
  command: string
  at: SnapshotRef
  original: unknown
  // The exact snapshot object we pinned. A new run (spec switch or re-run)
  // re-captures fresh snapshot objects — even when the command id is reused —
  // so object identity is what reliably tells a live pin from a stale one.
  snapshot: PinSnapshotEntry
}

let pinned: PinnedState | undefined

// Detaches the external-unpin listener wired while a pin is live. The runner's
// native pin exposes a ✕ that unpins through the app; that path can't restore
// our cold pin's DOM or clear our state, so we listen and do it ourselves.
let stopListeningForUnpin: (() => void) | undefined

const releasePin = (): void => {
  stopListeningForUnpin?.()
  stopListeningForUnpin = undefined
  pinned = undefined
}

// Test-only: reset the module-level pin between component tests.
export const resetPinState = (): void => {
  releasePin()
}

// The runner's ✕ (or any app-side unpin) fired while we hold a pin: the store
// has already reset itself, so we only restore the DOM we captured and drop our
// state — never call unpinSnapshot here, or it would re-enter this handler.
const onExternalUnpin = (): void => {
  if (!pinned) {
    return
  }

  const { original } = pinned

  releasePin()
  tapPinSource.getAutIframe()?.restoreDom(original)
}

// The current pin, for the run-state command to surface (so `status` can report
// a pin and a stranded one is always visible and recoverable).
export const getPinnedRef = (): { command: string, at: SnapshotRef } | undefined => {
  return pinned ? { command: pinned.command, at: pinned.at } : undefined
}

export interface PinReconcileRunner {
  getSnapshotPropsForLog (testId: string, logId: string): PinSnapshotProps | undefined
}

/**
 * Drops a pin left over from a previous run — a spec switch or re-run — WITHOUT
 * restoring its now-stale DOM (that run's page is gone). A pin is only valid
 * while its command still resolves to a snapshot in the current run; a new run
 * regenerates test and log ids, so the lookup misses and we release the pin.
 * Safe to call anytime; a no-op when nothing is pinned.
 */
export const reconcilePin = (runner: PinReconcileRunner): void => {
  if (!pinned) {
    return
  }

  // The pin is live only while the exact snapshot object we rendered is still
  // the command's current snapshot. A re-run replaces it (same id, new object),
  // and a spec switch drops the command entirely — both fail this identity check.
  const stillLive = liveSnapshots(runner.getSnapshotPropsForLog(pinned.test, pinned.command)).includes(pinned.snapshot)

  if (!stillLive) {
    // A new run already reset the snapshot store (run:start clears it) and its
    // DOM is gone, so there is nothing to unpin or restore — just drop our own
    // tracking and stop listening for that run's unpins.
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

  const available = snapshots.map((entry, index) => (entry.name !== undefined ? `"${entry.name}" (${index + 1})` : `${index + 1}`)).join(', ')

  throw new TapCommandError('SNAPSHOT_NOT_FOUND', `no snapshot of this command matches "${at}" — available snapshots: ${available}`)
}

// Re-select which snapshot of the already-pinned command the runner shows,
// without a clear/re-pin round trip. Reached only when the target matches the
// live pin, so the DOM captured on the first pin and the unpin listener stay
// put and clear still restores correctly. Resolving `at` before switching means
// a bad `--at` leaves the current pin untouched.
const movePin = (runner: PinReconcileRunner, at: string | undefined): PinResult => {
  const current = pinned!
  const props = runner.getSnapshotPropsForLog(current.test, current.command)
  const snapshots = liveSnapshots(props)
  const index = resolveAt(snapshots, at)

  tapPinSource.changeSnapshotState(index)

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

  // Stop listening before unpinning, or our own unpin would re-enter the
  // external-unpin handler and restore twice.
  releasePin()
  tapPinSource.getAutIframe()?.restoreDom(original)
  tapPinSource.unpinSnapshot()

  return { cleared: true }
}

export const pinCommand = defineCommand({
  description: 'pin a command’s DOM snapshot into the live app-under-test frame so the dom/aria/inspect commands can read it; pass --clear to release',
  params: [
    { name: 'test', type: 'string', required: false, description: 'test id, as listed by the tests command' },
    { name: 'command', type: 'string', required: false, description: 'command id, as listed by the commands command' },
  ],
  options: [
    { name: 'at', type: 'string', required: false, description: 'which snapshot to pin: a name like "before"/"after" or a 1-based index; defaults to the last (the command’s final state). Re-run on the pinned command to switch snapshots without releasing the pin' },
    { name: 'clear', type: 'boolean', required: false, description: 'release the current pin and restore the app to its pre-pin state' },
  ],
  handler: async ({ test, command }, { at, clear }): Promise<PinResult | ClearResult> => {
    const runner = tapPinSource.getRunner()

    // Release a pin left over from a previous run before anything else, so stale
    // state never blocks a new pin, is never reported by status, and is never
    // restored over the current run's DOM.
    if (runner) {
      reconcilePin(runner)
    }

    if (clear) {
      return clearPin()
    }

    if (test === undefined || command === undefined) {
      throw new TapCommandError('PIN_TARGET_REQUIRED', 'provide a test id and command id to pin (as listed by the tests and commands commands), or pass --clear to release the current pin')
    }

    if (!runner) {
      throw new TapCommandError('NO_RUN', 'no spec has been run yet — use the run command to run a spec first')
    }

    if (tapPinSource.isRunning()) {
      throw new TapCommandError('RUN_IN_PROGRESS', 'a spec is currently running — wait for it to finish before pinning a snapshot')
    }

    if (pinned) {
      // Re-pinning the same command moves the pin to the requested snapshot in
      // place; a different command must be released first so the single-pin
      // invariant (one live pin, one captured DOM) holds.
      if (pinned.test === test && pinned.command === command) {
        return movePin(runner, at)
      }

      throw new TapCommandError('ALREADY_PINNED', `command "${pinned.command}" is already pinned — release it with pin --clear before pinning another`)
    }

    const selection = selectTestAttempt(runner, test)

    if ('error' in selection) {
      throw attemptSelectionError(selection, test)
    }

    const commands = serializeTestCommands(selection.attempt)

    if (!commands.some((entry) => entry.id === command)) {
      throw new TapCommandError('COMMAND_NOT_FOUND', `no command of this test matches the id "${command}" — use the commands command to list this test’s commands`)
    }

    const props = runner.getSnapshotPropsForLog(test, command)
    const snapshots = liveSnapshots(props)

    if (snapshots.length === 0) {
      throw new TapCommandError('SNAPSHOT_UNAVAILABLE', 'this command has no DOM snapshot to pin — snapshots are captured in open mode and kept only for the most recent tests (numTestsKeptInMemory)')
    }

    const index = resolveAt(snapshots, at)

    const autIframe = tapPinSource.getAutIframe()

    if (!autIframe) {
      throw new TapCommandError('NO_AUT', 'the app under test is not available to pin a snapshot into')
    }

    // Capture the current DOM so we can restore it on release, then hand the
    // chosen snapshot to the app's own pin so the runner renders it and shows
    // the native banner/controls (synchronous for a same-origin AUT). Pass the
    // filtered snapshots so the state toggle and our `index` stay aligned.
    const original = autIframe.detachDom()

    tapPinSource.pinSnapshot({ ...props, snapshots }, index, test, command)

    // The native pin can be released from the runner's ✕; restore our captured
    // DOM and drop our state when it is, so status never reports a phantom pin.
    stopListeningForUnpin = tapPinSource.onUnpinned(onExternalUnpin)

    const at_ = toRef(snapshots[index], index)

    pinned = { test, command, at: at_, original, snapshot: snapshots[index] }

    return {
      pinned: { test, command, at: at_ },
      ...(props?.url !== undefined ? { url: props.url } : {}),
    }
  },
})
