/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, afterEach } from 'vitest'
import { shouldOmitSnapshotBody } from '../../../src/cy/snapshots'

interface CypressStub {
  isInteractive: boolean
  isProtocolEnabled: boolean
  numTestsKeptInMemory: number
}

const stubCypress = ({ isInteractive, isProtocolEnabled, numTestsKeptInMemory }: CypressStub) => {
  (globalThis as any).Cypress = {
    config: (key: string) => {
      if (key === 'isInteractive') return isInteractive

      if (key === 'numTestsKeptInMemory') return numTestsKeptInMemory

      return undefined
    },
    state: (key: string) => {
      if (key === 'isProtocolEnabled') return isProtocolEnabled

      return undefined
    },
  }
}

describe('shouldOmitSnapshotBody', () => {
  afterEach(() => {
    delete (globalThis as any).Cypress
  })

  it('omits the body in a headless protocol run with no in-memory retention', () => {
    // the real Test Replay run scenario: run mode forces numTestsKeptInMemory to 0
    stubCypress({ isInteractive: false, isProtocolEnabled: true, numTestsKeptInMemory: 0 })

    expect(shouldOmitSnapshotBody()).toBe(true)
  })

  it('keeps the body in Open Mode even when the protocol is enabled (e.g. Studio AI)', () => {
    // a user could set numTestsKeptInMemory to 0 in open mode; the body is still
    // needed there for reporter time-travel, so it must not be omitted
    stubCypress({ isInteractive: true, isProtocolEnabled: true, numTestsKeptInMemory: 0 })

    expect(shouldOmitSnapshotBody()).toBe(false)
  })

  it('keeps the body when the protocol is not enabled', () => {
    stubCypress({ isInteractive: false, isProtocolEnabled: false, numTestsKeptInMemory: 0 })

    expect(shouldOmitSnapshotBody()).toBe(false)
  })

  it('keeps the body when tests are retained in memory (e.g. driver snapshot tests)', () => {
    // driver tests set numTestsKeptInMemory to 1 in run mode to verify snapshots
    stubCypress({ isInteractive: false, isProtocolEnabled: true, numTestsKeptInMemory: 1 })

    expect(shouldOmitSnapshotBody()).toBe(false)
  })
})
