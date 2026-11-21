import { EventEmitter } from 'events'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SpecWithRelativeRoot } from '@packages/types'

const handlers: ((ipc: any) => void)[] = []

vi.mock('../../../lib/plugins', () => {
  return { registerHandler: (handler) => handlers.push(handler) }
})

vi.mock('../../../lib/plugins/util', () => {
  return { wrapChildPromise: vi.fn() }
})

const spec = (relative: string) => ({ relative, absolute: `/project/${relative}`, name: relative }) as SpecWithRelativeRoot

const fakeIpc = () => Object.assign(new EventEmitter(), { send: vi.fn() })

describe('lib/plugins/dev-server', () => {
  beforeEach(() => {
    handlers.length = 0
    vi.resetModules()
  })

  it('resolves a spec update once the plugins child has handed it to the dev server', async () => {
    const { emitSpecsChanged } = await import('../../../lib/plugins/dev-server')
    const ipc = fakeIpc()

    handlers.forEach((handler) => handler(ipc))

    let resolved = false
    const update = Promise.resolve(emitSpecsChanged([spec('a.cy.tsx')], { neededForJustInTimeCompile: true })).then(() => resolved = true)

    expect(ipc.send).toHaveBeenCalledWith('dev-server:specs:changed', { id: 0, specs: [spec('a.cy.tsx')], options: { neededForJustInTimeCompile: true } })

    ipc.emit('dev-server:specs:delivered', { id: 1 })
    await Promise.resolve()
    expect(resolved).toBe(false)

    ipc.emit('dev-server:specs:delivered', { id: 0 })
    await update
    expect(resolved).toBe(true)
  })

  it('resolves right away when no plugins child is running', async () => {
    const { emitSpecsChanged } = await import('../../../lib/plugins/dev-server')

    await expect(emitSpecsChanged([spec('a.cy.tsx')])).resolves.toBeUndefined()
  })

  it('confirms delivery from the plugins child after the dev server has seen the specs', async () => {
    const { wrap } = await import('../../../lib/plugins/child/dev-server')
    const ipc = fakeIpc()
    const options: { devServerEvents?: EventEmitter } = {}
    const order: string[] = []

    wrap(ipc as any, vi.fn(), {} as any, [options])

    options.devServerEvents!.on('dev-server:specs:changed', ({ specs }) => order.push(`dev server got ${specs[0].relative}`))
    ipc.send.mockImplementation((event, { id }) => order.push(`${event} ${id}`))

    ipc.emit('dev-server:specs:changed', { id: 4, specs: [spec('a.cy.tsx')], options: { neededForJustInTimeCompile: true } })

    expect(order).toEqual(['dev server got a.cy.tsx', 'dev-server:specs:delivered 4'])
  })
})
