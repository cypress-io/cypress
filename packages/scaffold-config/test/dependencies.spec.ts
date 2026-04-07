import { describe, it, expect } from 'vitest'
import semver from 'semver'
import { WIZARD_DEPENDENCY_TYPESCRIPT } from '../src/dependencies'

describe('WIZARD_DEPENDENCY_TYPESCRIPT', () => {
  const satisfies = (version: string) => {
    return semver.satisfies(version, WIZARD_DEPENDENCY_TYPESCRIPT.minVersion, {
      includePrerelease: true,
    })
  }

  it('accepts TypeScript 5.x per minVersion', () => {
    expect(satisfies('5.0.0')).toBe(true)
    expect(satisfies('5.9.9')).toBe(true)
  })

  it('accepts TypeScript 6.x per minVersion', () => {
    expect(satisfies('6.0.0')).toBe(true)
    expect(satisfies('6.0.2')).toBe(true)
  })

  it('rejects TypeScript below 5', () => {
    expect(satisfies('4.9.5')).toBe(false)
  })
})
