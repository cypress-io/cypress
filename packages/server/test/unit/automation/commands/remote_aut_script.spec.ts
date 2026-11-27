import { describe, expect, it, vi } from 'vitest'
import { getRemoteAutScript, callRemoteAut } from '../../../../lib/automation/commands/remote_aut_script'

vi.mock('@packages/resolve-dist', () => {
  return { getRunnerRemoteAutInjectionContents: vi.fn(async () => 'window.seen = cypressRemoteAutConfig') }
})

describe('lib/automation/commands/remote_aut_script', () => {
  it('gives the bundle its config and whether to report errors', async () => {
    const window: Record<string, unknown> = {}
    const config = { primaryOrigin: 'http://localhost:3500', namespace: '__cypress' }

    new Function('window', await getRemoteAutScript(config, { reportErrors: true }))(window)

    expect(window.seen).toEqual({ ...config, reportErrors: true })
  })

  describe('callRemoteAut', () => {
    it('calls the AUT script\'s control with its arguments', async () => {
      const evaluateInAut = vi.fn(async () => {})

      await callRemoteAut(evaluateInAut, { method: 'cookies', args: ['clear:cookie', 'foo'] })
      await callRemoteAut(evaluateInAut, { method: 'timers', args: ['pause', true] })

      expect(evaluateInAut.mock.calls).toEqual([
        ['window["__cypressRemoteAut"]?.cookies(...["clear:cookie","foo"])'],
        ['window["__cypressRemoteAut"]?.timers(...["pause",true])'],
      ])
    })

    it('ignores an AUT it cannot reach', async () => {
      await expect(callRemoteAut(vi.fn(async () => {
        throw new Error('navigating')
      }), { method: 'timers', args: ['reset'] })).resolves.toBeUndefined()
    })
  })
})
