import { describe, expect, it, vi } from 'vitest'
import { EventEmitter } from 'events'
import { CypressCTWebpackPlugin } from '../src/CypressCTWebpackPlugin'

describe('CypressCTWebpackPlugin', () => {
  it('emits compile success for every batched JIT generation when webpack done fires once', () => {
    const devServerEvents = new EventEmitter()
    const compileSuccessEvents: Array<{ jitRecompile?: boolean, jitRecompileGeneration?: number }> = []

    devServerEvents.on('dev-server:compile:success', (data) => {
      compileSuccessEvents.push(data)
    })

    const plugin = new CypressCTWebpackPlugin({
      files: [{ absolute: '/project/src/A.cy.tsx' } as Cypress.Spec],
      projectRoot: '/project',
      supportFile: false,
      devServerEvents,
      webpack: {},
      indexHtmlFile: 'index.html',
    })

    let beforeCompileCallback: (_params: object, cb: () => void) => void
    let doneCallback: () => void
    const compiler = {
      hooks: {
        beforeCompile: { tapAsync: vi.fn((_name: string, cb: (_params: object, done: () => void) => void) => {
          beforeCompileCallback = cb
        }) },
        compilation: { tap: vi.fn() },
        done: { tap: vi.fn((_name: string, cb: () => void) => {
          doneCallback = cb
        }) },
      },
    }

    plugin.apply(compiler as any)

    devServerEvents.emit('dev-server:specs:changed', { specs: [{ absolute: '/project/src/B.cy.tsx' } as Cypress.Spec] })
    devServerEvents.emit('dev-server:specs:changed', { specs: [{ absolute: '/project/src/C.cy.tsx' } as Cypress.Spec] })

    beforeCompileCallback!({}, () => {})
    doneCallback!()

    expect(compileSuccessEvents.filter((event) => event.jitRecompile)).toEqual([
      { jitRecompile: true, jitRecompileGeneration: 1 },
      { jitRecompile: true, jitRecompileGeneration: 2 },
    ])
  })

  it('does not emit JIT compile success for queued generations until the next compile starts', () => {
    const devServerEvents = new EventEmitter()
    const compileSuccessEvents: Array<{ jitRecompile?: boolean, jitRecompileGeneration?: number }> = []

    devServerEvents.on('dev-server:compile:success', (data) => {
      compileSuccessEvents.push(data)
    })

    const plugin = new CypressCTWebpackPlugin({
      files: [{ absolute: '/project/src/A.cy.tsx' } as Cypress.Spec],
      projectRoot: '/project',
      supportFile: false,
      devServerEvents,
      webpack: { NormalModule: { getCompilationHooks: vi.fn(() => ({ loader: { tap: vi.fn() } })) } },
      indexHtmlFile: 'index.html',
    })

    let beforeCompileCallback: (_params: object, cb: () => void) => void
    let compilationCallback: (compilation: object) => void
    let doneCallback: () => void
    const compiler = {
      hooks: {
        beforeCompile: { tapAsync: vi.fn((_name: string, cb: (_params: object, done: () => void) => void) => {
          beforeCompileCallback = cb
        }) },
        compilation: { tap: vi.fn((_name: string, cb: (compilation: object) => void) => {
          compilationCallback = cb
        }) },
        done: { tap: vi.fn((_name: string, cb: () => void) => {
          doneCallback = cb
        }) },
      },
    }

    plugin.apply(compiler as any)

    compilationCallback!({
      inputFileSystem: { utimesSync: vi.fn() },
    })

    devServerEvents.emit('dev-server:specs:changed', {
      specs: [{ absolute: '/project/src/B.cy.tsx' } as Cypress.Spec],
      options: { neededForJustInTimeCompile: true },
    })

    doneCallback!()

    expect(compileSuccessEvents.filter((event) => event.jitRecompile)).toEqual([])

    beforeCompileCallback!({}, () => {})
    doneCallback!()

    expect(compileSuccessEvents.filter((event) => event.jitRecompile)).toEqual([
      { jitRecompile: true, jitRecompileGeneration: 1 },
    ])
  })
})
