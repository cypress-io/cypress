import { buildDependencyMap } from '@tooling/v8-snapshot'
import { DependencyMap } from '../src/dependency-map'
import type { Metadata } from '../src/types'
import { expect } from 'chai'

const NO_DEPS = 'lib/fixtures/no-deps.js'
const SYNC_DEPS = 'lib/fixtures/sync-deps.js'
const DEEP_SYNC_DEPS = 'lib/fixtures/deep-sync-deps.js'
const KEEP_JS = 'lib/keep.js'

const allIds = [NO_DEPS, SYNC_DEPS, DEEP_SYNC_DEPS, KEEP_JS]

/*
 * + KEEP_JS
 * |
 * +---- DEEP_SYNC_DEPS
 * |     |
 * |     |
 * |     + --- SYNC_DEPS
 * |           |
 * |           +--- NO_DEPS
 * |
 * +---  SYNC_DEPS
 *       |
 *       +--- NO_DEPS
 */

const inputs: Metadata['inputs'] = {
  'lib/fixtures/no-deps.js': {
    imports: [],
  },
  'lib/fixtures/sync-deps.js': {
    imports: [
      {
        path: 'lib/fixtures/no-deps.js',
        kind: 'require-call',
      },
    ],
  },
  'lib/fixtures/deep-sync-deps.js': {
    imports: [
      {
        path: 'lib/fixtures/sync-deps.js',
        kind: 'require-call',
      },
    ],
  },
  'lib/keep.js': {
    imports: [
      {
        path: 'lib/fixtures/deep-sync-deps.js',
        kind: 'require-call',
      },
      {
        path: 'lib/fixtures/sync-deps.js',
        kind: 'require-call',
      },
    ],
  },
} as unknown as Metadata['inputs']

const map = buildDependencyMap(inputs)
const dp = new DependencyMap(map)

describe('dependency map', () => {
  it('creates a map that is loaded but not cached', () => {
    const loaded: Set<string> = new Set()
    const cache: Record<string, NodeModule> = {}

    for (const id of allIds) {
      expect(dp.loadedButNotCached(id, loaded, cache), `${id} not 'loaded but not cached'`).to.be.false
    }

    for (const id of allIds) {
      cache[id] = {} as NodeModule
      loaded.add(id)
    }
    for (const id of allIds) {
      expect(dp.loadedButNotCached(id, loaded, cache), `${id} not 'loaded but not cached'`).to.be.false
    }

    delete cache[NO_DEPS]

    for (const id of allIds) {
      const res = id === NO_DEPS

      expect(dp.loadedButNotCached(id, loaded, cache)).to.equal(res, `${id} ${res ? '' : 'not '} 'loaded but not cached'`)
    }

    delete cache[SYNC_DEPS]

    for (const id of allIds) {
      const res = id === NO_DEPS || id === SYNC_DEPS

      expect(dp.loadedButNotCached(id, loaded, cache)).to.equal(res, `${id} ${res ? '' : 'not '} 'loaded but not cached'`)
    }
  })

  it('creates a map with a critical dependency loaded but not cached', () => {
    const loaded: Set<string> = new Set()
    const cache: Record<string, NodeModule> = {}

    const load = (id: string) => {
      cache[id] = {} as NodeModule
      loaded.add(id)
    }

    load(NO_DEPS)

    expect(dp.criticalDependencyLoadedButNotCached(SYNC_DEPS, loaded, cache), 'SYNC_DEPS needs no reload').to.be.false

    delete cache[NO_DEPS]

    expect(dp.criticalDependencyLoadedButNotCached(SYNC_DEPS, loaded, cache), 'SYNC_DEPS needs reload since not in cache and NO_DEPS is direct dep').to.be.true

    expect(dp.criticalDependencyLoadedButNotCached(DEEP_SYNC_DEPS, loaded, cache), 'DEEP_SYNC_DEPS needs reload since a cache free path to NO_DEPS exists').to.be.true

    expect(dp.criticalDependencyLoadedButNotCached(KEEP_JS, loaded, cache), 'KEEP_JS needs reload since a cache free path to NO_DEPS exists').to.be.true

    load(SYNC_DEPS)

    expect(dp.criticalDependencyLoadedButNotCached(DEEP_SYNC_DEPS, loaded, cache), 'DEEP_SYNC_DEPS needs no reload since no cache free path to NO_DEPS exists').to.be.false

    expect(dp.criticalDependencyLoadedButNotCached(KEEP_JS, loaded, cache), 'KEEP_JS needs no reload since no cache free path to NO_DEPS exists').to.be.false
  })
})
