import { afterAll, afterEach, beforeAll, describe, expect } from 'vitest'
import sinon from 'sinon'
import Promise from 'bluebird'

const chai = require('chai')

// The specs were written for Mocha, which exposes `context`/`before`/`after`
// aliases and (via spec-helper.js) leaks a global `sinon` plus an automatic
// `sinon.restore()` after each test. Mocha also shares a single module
// registry across spec files, so chai plugins registered in one spec applied
// to all of them. Vitest isolates files, so re-establish these globals and
// plugins here for every spec file.
chai.use(require('sinon-chai'))
chai.use(require('chai-as-promised'))

globalThis.sinon = sinon
globalThis.context = describe
globalThis.before = beforeAll
globalThis.after = afterAll

// snap-shot-it's `snapshot(value)` / `snapshot(name, value)` API mapped onto
// Vitest's native snapshotting.
globalThis.snapshot = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && args.length > 1) {
    return expect(args[1]).toMatchSnapshot(args[0] as string)
  }

  return expect(args[0]).toMatchSnapshot()
}

sinon.usingPromise(Promise)

afterEach(() => {
  sinon.restore()
})
