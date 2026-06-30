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

    let doneCallback: () => void
    const compiler = {
      hooks: {
        beforeCompile: { tapAsync: vi.fn() },
        compilation: { tap: vi.fn() },
        done: { tap: vi.fn((_name: string, cb: () => void) => {
          doneCallback = cb
        }) },
      },
    }

    plugin.apply(compiler as any)

    devServerEvents.emit('dev-server:specs:changed', { specs: [{ absolute: '/project/src/B.cy.tsx' } as Cypress.Spec] })
    devServerEvents.emit('dev-server:specs:changed', { specs: [{ absolute: '/project/src/C.cy.tsx' } as Cypress.Spec] })

    doneCallback!()

    expect(compileSuccessEvents.filter((event) => event.jitRecompile)).toEqual([
      { jitRecompile: true, jitRecompileGeneration: 1 },
      { jitRecompile: true, jitRecompileGeneration: 2 },
    ])
  })
})
