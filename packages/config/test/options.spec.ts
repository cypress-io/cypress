import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { driverConfigOptions, runtimeOptions } from '../src/options'

const typeDefsPath = path.join(__dirname, '../../../cli/types/cypress.d.ts')

/**
 * Options the runtime allows as test-time overrides but which `cypress.d.ts` deliberately does
 * not expose, with the reason. Anything not listed here must appear in both `Pick` unions.
 */
const OVERRIDE_TYPE_EXCEPTIONS: Record<string, string> = {
  // Omitted from `UserConfigOptions`, so it cannot be picked from `ConfigOptions` at all.
  excludeSpecPattern: 'not a member of ConfigOptions',
  // Declared on `EndToEndConfigOptions` rather than `ResolvedConfigOptions`, so it is likewise
  // not reachable through `ConfigOptions`.
  experimentalOriginDependencies: 'e2e-only, not a member of ConfigOptions',
  // The reporter is constructed once per run, so a per-test value cannot take effect.
  reporter: 'resolved once per run',
  reporterOptions: 'resolved once per run',
}

// Declaration order is observable: `getPublicConfigKeys` and the resolved config sent to
// Cypress Cloud both preserve it, so an unsorted insert shows up as unrelated snapshot churn.
describe('config/src/options', () => {
  describe('option ordering', () => {
    const cases = [
      ['driverConfigOptions', driverConfigOptions],
      ['runtimeOptions', runtimeOptions],
    ] as const

    cases.forEach(([arrayName, options]) => {
      it(`${arrayName} is sorted by name`, () => {
        const names = options.map((option) => option.name)
        const sorted = [...names].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))

        const misplaced = names
        .map((name, index) => ({ name, expected: sorted[index] }))
        .filter(({ name, expected }) => name !== expected)
        .map(({ name, expected }) => `${name} (expected ${expected})`)

        expect(misplaced, `${arrayName} must stay alphabetical — move: ${misplaced.join(', ')}`).toEqual([])
      })
    })
  })

  describe('option names', () => {
    it('are unique across both arrays', () => {
      const names = [...driverConfigOptions, ...runtimeOptions].map((option) => option.name)
      const duplicates = names.filter((name, index) => names.indexOf(name) !== index)

      expect(duplicates).toEqual([])
    })
  })

  // `SuiteConfigOverrides` and `TestConfigOverrides` in cypress.d.ts are maintained by hand.
  // When they fall behind `overrideLevel`, `it('...', { someOption: x })` is a type error even
  // though the runtime accepts it — a mismatch no other test notices.
  describe('test-time override types', () => {
    const typeDefs = fs.readFileSync(typeDefsPath, 'utf8')

    // An option can be declared either inside a `Pick<...>` union or as an explicit member of
    // the interface body, so collect both.
    const declaredBy = (interfaceName: string) => {
      const start = typeDefs.indexOf(`interface ${interfaceName} extends`)
      const declaration = typeDefs.slice(start, typeDefs.indexOf('\n  }\n', start))
      const picked = [...declaration.matchAll(/'([A-Za-z0-9]+)'/g)].map((match) => match[1])
      const members = [...declaration.matchAll(/^ {4}([A-Za-z0-9]+)\??:/gm)].map((match) => match[1])

      return new Set([...picked, ...members])
    }

    const overridable = [...driverConfigOptions, ...runtimeOptions]
    .filter((option) => option.overrideLevel && option.overrideLevel !== 'never')

    it('SuiteConfigOverrides covers every option overridable at suite level', () => {
      const declared = declaredBy('SuiteConfigOverrides')
      const missing = overridable
      .map((option) => option.name)
      .filter((name) => !declared.has(name) && !OVERRIDE_TYPE_EXCEPTIONS[name])

      expect(missing, 'add to the Pick union in cli/types/cypress.d.ts').toEqual([])
    })

    it('TestConfigOverrides covers every option overridable at test level', () => {
      const declared = declaredBy('TestConfigOverrides')
      const missing = overridable
      .filter((option) => option.overrideLevel !== 'suite')
      .map((option) => option.name)
      .filter((name) => !declared.has(name) && !OVERRIDE_TYPE_EXCEPTIONS[name])

      expect(missing, 'add to the Pick union in cli/types/cypress.d.ts').toEqual([])
    })

    it('does not keep exceptions for options that are no longer overridable', () => {
      const overridableNames = overridable.map((option) => option.name)
      const stale = Object.keys(OVERRIDE_TYPE_EXCEPTIONS).filter((name) => !overridableNames.includes(name))

      expect(stale, 'remove from OVERRIDE_TYPE_EXCEPTIONS').toEqual([])
    })
  })
})
