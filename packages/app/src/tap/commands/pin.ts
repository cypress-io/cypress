import { defineCommand, TapCommandError } from './definition'
import { serializeTestCommands } from './test-state'
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
  command: string
  at: SnapshotRef
  original: unknown
}

let pinned: PinnedState | undefined

// Test-only: reset the module-level pin between component tests.
export const resetPinState = (): void => {
  pinned = undefined
}

// The current pin, for the run-state command to surface (so `status` can report
// a pin and a stranded one is always visible and recoverable).
export const getPinnedRef = (): { command: string, at: SnapshotRef } | undefined => {
  return pinned ? { command: pinned.command, at: pinned.at } : undefined
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

const clearPin = (): ClearResult => {
  if (!pinned) {
    return { cleared: false }
  }

  tapPinSource.getAutIframe()?.restoreDom(pinned.original)
  tapPinSource.setPinned(false)
  pinned = undefined

  return { cleared: true }
}

export const pinCommand = defineCommand({
  description: 'pin a command’s DOM snapshot into the live app-under-test frame so the frame commands can read it; pass --clear to release',
  params: [
    { name: 'test', type: 'string', required: false, description: 'test id, as listed by the tests command' },
    { name: 'command', type: 'string', required: false, description: 'command id, as listed by the commands command' },
  ],
  options: [
    { name: 'at', type: 'string', required: false, description: 'which snapshot to pin: a name like "before"/"after" or a 1-based index; defaults to the last (the command’s final state)' },
    { name: 'clear', type: 'boolean', required: false, description: 'release the current pin and restore the app to its pre-pin state' },
  ],
  handler: async ({ test, command }, { at, clear }): Promise<PinResult | ClearResult> => {
    if (clear) {
      return clearPin()
    }

    if (test === undefined || command === undefined) {
      throw new TapCommandError('PIN_TARGET_REQUIRED', 'provide a test id and command id to pin (as listed by the tests and commands commands), or pass --clear to release the current pin')
    }

    const runner = tapPinSource.getRunner()

    if (!runner) {
      throw new TapCommandError('NO_RUN', 'no spec has been run yet — use the run command to run a spec first')
    }

    if (tapPinSource.isRunning()) {
      throw new TapCommandError('RUN_IN_PROGRESS', 'a spec is currently running — wait for it to finish before pinning a snapshot')
    }

    if (pinned) {
      throw new TapCommandError('ALREADY_PINNED', `command "${pinned.command}" is already pinned — release it with pin --clear before pinning another`)
    }

    const commands = serializeTestCommands(runner, test)

    if (commands === undefined) {
      throw new TapCommandError('TEST_NOT_FOUND', `no test of this run matches the id "${test}" — use the tests command to list this run’s tests`)
    }

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

    // Capture the current DOM so --clear can restore it, then render the
    // chosen snapshot into the live frame (synchronous for a same-origin AUT).
    const original = autIframe.detachDom()

    autIframe.restoreDom(snapshots[index])
    tapPinSource.setPinned(true)

    const at_ = toRef(snapshots[index], index)

    pinned = { command, at: at_, original }

    return {
      pinned: { test, command, at: at_ },
      ...(props?.url !== undefined ? { url: props.url } : {}),
    }
  },
})
