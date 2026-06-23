import { describe, expect, it, vi } from 'vitest'
import { EventEmitter } from 'events'
import { waitForDevServerSpecUpdate } from '../../../packages/app/src/runner/wait-for-dev-server-spec-update'

const tick = () => new Promise<void>((resolve) => setImmediate(resolve))

describe('waitForDevServerSpecUpdate', () => {
  it('waits for webpack compile success after the dev server acknowledges a spec update', async () => {
    const events = new EventEmitter()
    const spec = { absolute: '/project/src/App.cy.jsx' }

    let resolved = false
    const promise = waitForDevServerSpecUpdate(spec, events as any, { bundler: 'webpack' }).then(() => {
      resolved = true
    })

    events.emit('dev-server:on-spec-updated')
    await tick()

    expect(resolved).toBe(false)

    events.emit('dev-server:compile:success')
    await promise

    expect(resolved).toBe(true)
  })

  it('ignores compile success events for other specs when webpack provides a spec file', async () => {
    const events = new EventEmitter()
    const spec = { absolute: '/project/src/App.cy.jsx' }

    let resolved = false
    const promise = waitForDevServerSpecUpdate(spec, events as any, { bundler: 'webpack' }).then(() => {
      resolved = true
    })

    events.emit('dev-server:on-spec-updated')
    events.emit('dev-server:compile:success', { specFile: '/project/src/Other.cy.jsx' })
    await tick()

    expect(resolved).toBe(false)

    events.emit('dev-server:compile:success', { specFile: spec.absolute })
    await promise

    expect(resolved).toBe(true)
  })

  it('resolves when webpack reports the spec list is already up to date', async () => {
    const events = new EventEmitter()
    const spec = { absolute: '/project/src/App.cy.jsx' }

    let resolved = false
    const promise = waitForDevServerSpecUpdate(spec, events as any, { bundler: 'webpack' }).then(() => {
      resolved = true
    })

    events.emit('dev-server:specs:unchanged')
    await promise

    expect(resolved).toBe(true)
  })

  it('does not register a compile listener when specs are unchanged before on-spec-updated', async () => {
    const events = new EventEmitter()
    const spec = { absolute: '/project/src/App.cy.jsx' }
    const onSpy = vi.spyOn(events, 'on')

    const promise = waitForDevServerSpecUpdate(spec, events as any, { bundler: 'webpack' })

    events.emit('dev-server:specs:unchanged')
    events.emit('dev-server:on-spec-updated')
    await promise

    expect(onSpy).not.toHaveBeenCalledWith('dev-server:compile:success', expect.any(Function))
  })

  it('resolves after spec update for non-webpack bundlers without waiting for compile success', async () => {
    const events = new EventEmitter()
    const spec = { absolute: '/project/src/App.cy.jsx' }

    let resolved = false
    const promise = waitForDevServerSpecUpdate(spec, events as any, { bundler: 'vite' }).then(() => {
      resolved = true
    })

    await tick()
    expect(resolved).toBe(false)

    events.emit('dev-server:on-spec-updated')
    await promise

    expect(resolved).toBe(true)
  })
})
