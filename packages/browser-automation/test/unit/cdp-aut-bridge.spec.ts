import { describe, it, expect, vi } from 'vitest'
import { CdpAutBridgeAdapter } from '../../lib/adapters/cdp-aut-bridge'

describe('CdpAutBridgeAdapter', () => {
  it('registers the bridge once and stores the script identifier', async () => {
    const send = vi.fn(async (command: string) => {
      if (command === 'Page.addScriptToEvaluateOnNewDocument') {
        return { identifier: 'script-1' }
      }

      return {}
    })

    const adapter = new CdpAutBridgeAdapter(send as any)

    await adapter.installAutBridge()
    await adapter.installAutBridge()

    const addCalls = send.mock.calls.filter(([command]) => command === 'Page.addScriptToEvaluateOnNewDocument')

    expect(addCalls).toHaveLength(1)
  })

  it('gates the injected source on top / AUT frame id / origin-matches-top', async () => {
    let registeredSource = ''

    const send = vi.fn(async (command: string, params: any) => {
      if (command === 'Page.addScriptToEvaluateOnNewDocument') {
        registeredSource = params.source

        return { identifier: 'script-1' }
      }

      return {}
    })

    const adapter = new CdpAutBridgeAdapter(send as any)

    await adapter.installAutBridge()

    expect(registeredSource).toContain('window === window.top')
    expect(registeredSource).toContain('window.name')
    expect(registeredSource).toContain('window.frameElement')
    expect(registeredSource).toContain('Your project:')
    expect(registeredSource).toContain('window.top.location.origin')
    // pre-navigation about:blank origin ("null") is treated as full
    expect(registeredSource).toContain(`'null'`)
  })

  it('removes the registration on teardown', async () => {
    const send = vi.fn(async (command: string) => {
      if (command === 'Page.addScriptToEvaluateOnNewDocument') {
        return { identifier: 'script-1' }
      }

      return {}
    })

    const adapter = new CdpAutBridgeAdapter(send as any)

    await adapter.installAutBridge()
    await adapter.removeAutBridge()

    const removeCalls = send.mock.calls.filter(([command]) => command === 'Page.removeScriptToEvaluateOnNewDocument')

    expect(removeCalls).toHaveLength(1)
  })
})
