import { describe, it, expect } from 'vitest'
import { buildDependencyMap } from '@tooling/v8-snapshot'
import { DependencyMap } from '../src/dependency-map'
import type { Metadata } from '../src/types'

const ROOT = 'lib/root.js'
const FOO = 'lib/foo.js'
const BAR = 'lib/bar.js'
const BAZ = 'lib/baz.js'
const FOZ = 'lib/foz.js'

/*
 * + ROOT
 * |
 * +---- FOO
 *       |
 *       + --- BAR
 *             |
 *             +--- BAZ
 *                  |
 *                  + --- FOZ
 *                  |
 *                  |
 *                  + --- FOO (circular ref)
 *
 */

const ALL_ROOT = [FOO, BAR, BAZ, FOZ]
const ALL_FOO = [BAR, BAZ, FOZ]
const ALL_BAR = [BAZ, FOZ, FOO]
const ALL_BAZ = [FOZ, FOO, BAR]
const ALL_FOZ: string[] = []

const DIRECT_ROOT = [FOO]
const DIRECT_FOO = [BAR]
const DIRECT_BAR = [BAZ]
const DIRECT_BAZ = [FOZ, FOO]
const DIRECT_FOZ: string[] = []

const inputs: Metadata['inputs'] = {
  [ROOT]: {
    imports: [
      {
        path: FOO,
        kind: 'require-call',
      },
    ],
  },
  [FOO]: {
    imports: [
      {
        path: BAR,
        kind: 'require-call',
      },
    ],
  },
  [BAR]: {
    imports: [
      {
        path: BAZ,
        kind: 'require-call',
      },
    ],
  },
  [BAZ]: {
    imports: [
      {
        path: FOZ,
        kind: 'require-call',
      },
      {
        path: FOO,
        kind: 'require-call',
      },
    ],
  },
  [FOZ]: {
    imports: [],
  },
} as unknown as Metadata['inputs']

const map = buildDependencyMap(inputs)
const dp = new DependencyMap(map)

describe('dependency map: circular', () => {
  it('creates a map with circular dep - all deps ', () => {
    expect(dp.allDepsOf(ROOT)).toEqual(ALL_ROOT)
    expect(dp.allDepsOf(FOO)).toEqual(ALL_FOO)
    expect(dp.allDepsOf(BAR)).toEqual(ALL_BAR)
    expect(dp.allDepsOf(BAZ)).toEqual(ALL_BAZ)
    expect(dp.allDepsOf(FOZ)).toEqual(ALL_FOZ)
  })

  it('creates a map with circular dep - direct deps ', () => {
    expect(dp.directDepsOf(ROOT)).toEqual(DIRECT_ROOT)
    expect(dp.directDepsOf(FOO)).toEqual(DIRECT_FOO)
    expect(dp.directDepsOf(BAR)).toEqual(DIRECT_BAR)
    expect(dp.directDepsOf(BAZ)).toEqual(DIRECT_BAZ)
    expect(dp.directDepsOf(FOZ)).toEqual(DIRECT_FOZ)
  })
})
