/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import $actionability from '../../../src/cy/actionability'

describe('actionability.shouldDelay', () => {
  const shouldDelay = ({
    alwaysDelayActions = false,
    isInteractive,
    numTestsKeptInMemory,
    isProtocolEnabled,
  }: {
    alwaysDelayActions?: boolean
    isInteractive: boolean
    numTestsKeptInMemory: number
    isProtocolEnabled: boolean
  }) => {
    const config = (key: string) => {
      return { alwaysDelayActions, isInteractive, numTestsKeptInMemory }[key]
    }
    const state = (key: string) => {
      return key === 'isProtocolEnabled' ? isProtocolEnabled : undefined
    }

    return $actionability.shouldDelay(config, state as any)
  }

  it('skips the delay in a headless run without Test Replay', () => {
    expect(shouldDelay({ isInteractive: false, numTestsKeptInMemory: 0, isProtocolEnabled: false })).toBe(false)
  })

  it('skips the delay in Open Mode when no tests are retained', () => {
    expect(shouldDelay({ isInteractive: true, numTestsKeptInMemory: 0, isProtocolEnabled: false })).toBe(false)
  })

  it('keeps the delay when Test Replay will snapshot', () => {
    expect(shouldDelay({ isInteractive: false, numTestsKeptInMemory: 0, isProtocolEnabled: true })).toBe(true)
  })

  it('keeps the delay in Open Mode while tests are retained for time-travel', () => {
    expect(shouldDelay({ isInteractive: true, numTestsKeptInMemory: 50, isProtocolEnabled: false })).toBe(true)
  })

  it('keeps the delay in every mode when alwaysDelayActions is true', () => {
    expect(shouldDelay({ alwaysDelayActions: true, isInteractive: false, numTestsKeptInMemory: 0, isProtocolEnabled: false })).toBe(true)
    expect(shouldDelay({ alwaysDelayActions: true, isInteractive: true, numTestsKeptInMemory: 0, isProtocolEnabled: false })).toBe(true)
  })
})
