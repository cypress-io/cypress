import { describe, it, expect, vi, beforeEach } from 'vitest'
import vm from 'vm'
import type { RemoteStubSpec } from '@packages/types'
import { RESTORE_STUBS_SOURCE, RemoteStubs, installStubsSource } from '../../../../lib/automation/commands/remote_stubs'

const createWindow = () => {
  const sent: string[] = []
  const win = vm.createContext({ send: (payload: string) => sent.push(payload) })

  vm.runInContext(`
    globalThis.window = globalThis
    window.app = { greet: (name) => 'hello ' + name, calls: 0 }
  `, win)

  return {
    win,
    calls: () => sent.map((payload) => JSON.parse(payload)),
    install: (specs: RemoteStubSpec[]) => vm.runInContext(`(${installStubsSource(specs)})(send)`, win),
    run: (code: string) => vm.runInContext(code, win),
  }
}

const spec = (overrides: Partial<RemoteStubSpec> = {}): RemoteStubSpec => {
  return { id: 'stub-1', type: 'stub', path: ['app', 'greet'], behaviors: [], ...overrides }
}

describe('remote stubs', () => {
  describe('installStubsSource', () => {
    it('stubs a method and reports each call', () => {
      const page = createWindow()

      page.install([spec({ behaviors: [{ kind: 'returns', value: 'stubbed' }] })])

      expect(page.run('app.greet(\'ada\')')).toEqual('stubbed')
      expect(page.calls()).toEqual([{ id: 'stub-1', args: ['ada'], returned: 'stubbed' }])
    })

    it('calls through for a spy', () => {
      const page = createWindow()

      page.install([spec({ type: 'spy' })])

      expect(page.run('app.greet(\'ada\')')).toEqual('hello ada')
      expect(page.calls()).toEqual([{ id: 'stub-1', args: ['ada'], returned: 'hello ada' }])
    })

    it('prefers a behavior for matching arguments and runs a fake in the page', () => {
      const page = createWindow()

      page.install([spec({
        behaviors: [
          { kind: 'callsFake', source: '(name) => name.toUpperCase()' },
          { kind: 'returns', value: 'just for bob', args: ['bob'] },
        ],
      })])

      expect(page.run('[app.greet(\'ada\'), app.greet(\'bob\')]')).toEqual(['ADA', 'just for bob'])
    })

    it('throws, resolves and tags values JSON can\'t carry', async () => {
      const page = createWindow()

      page.install([spec({ behaviors: [{ kind: 'throws', error: { name: 'TypeError', message: 'nope' } }] })])

      expect(() => page.run('app.greet(undefined, () => {})')).toThrow('nope')
      expect(page.calls()[0].args).toEqual([{ __cypressRemote: 'undefined' }, { __cypressRemote: 'function', name: '' }])

      page.install([spec({ behaviors: [{ kind: 'resolves', value: 3 }] })])

      await expect(page.run('app.greet()')).resolves.toEqual(3)
    })

    it('updates the behaviors of a stub it already installed, and restores the original', () => {
      const page = createWindow()

      page.install([spec({ behaviors: [{ kind: 'returns', value: 'first' }] })])
      page.install([spec({ behaviors: [{ kind: 'returns', value: 'second' }] })])

      expect(page.run('app.greet(\'ada\')')).toEqual('second')

      page.run(`(${RESTORE_STUBS_SOURCE})()`)

      expect(page.run('app.greet(\'ada\')')).toEqual('hello ada')
    })

    it('skips a path that doesn\'t exist yet', () => {
      const page = createWindow()

      page.install([spec({ path: ['missing', 'method'] })])

      expect(page.run('window.missing')).toBeUndefined()
    })
  })

  describe('RemoteStubs', () => {
    let transport: { remove: ReturnType<typeof vi.fn>, addPreloadScript: ReturnType<typeof vi.fn>, callInAut: ReturnType<typeof vi.fn> }
    let stubs: RemoteStubs

    beforeEach(() => {
      const remove = vi.fn().mockResolvedValue(undefined)

      transport = { remove, addPreloadScript: vi.fn().mockResolvedValue(remove), callInAut: vi.fn().mockResolvedValue(undefined) }
      stubs = new RemoteStubs(transport)
    })

    it('keeps every stub in one preload script and applies the change to the current document', async () => {
      const first = spec()
      const second = spec({ id: 'stub-2', path: ['open'] })

      await stubs.add(first)
      await stubs.add(second)

      expect(transport.remove).toHaveBeenCalledOnce()
      expect(transport.addPreloadScript).toHaveBeenLastCalledWith(installStubsSource([first, second]))
      expect(transport.callInAut).toHaveBeenLastCalledWith(installStubsSource([second]))
    })

    it('applies updates in the order they arrive, even when there is no document', async () => {
      transport.callInAut.mockRejectedValue(new Error('no AUT'))

      const added = stubs.add(spec())
      const updated = stubs.update({ id: 'stub-1', behaviors: [{ kind: 'returns', value: 1 }] })

      await Promise.all([added, updated])

      expect(transport.addPreloadScript).toHaveBeenLastCalledWith(installStubsSource([spec({ behaviors: [{ kind: 'returns', value: 1 }] })]))
    })

    it('removes the preload script and restores the document on reset', async () => {
      await stubs.add(spec())
      await stubs.reset()

      expect(transport.remove).toHaveBeenCalledOnce()
      expect(transport.callInAut).toHaveBeenLastCalledWith(RESTORE_STUBS_SOURCE)
    })
  })
})
