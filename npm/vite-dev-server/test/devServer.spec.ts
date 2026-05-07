import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EventEmitter } from 'events'
import { devServer } from '../src/devServer'
import * as getViteModule from '../src/getVite'

const baseCypressConfig = {
  projectRoot: '/users/proj',
  supportFile: '/users/proj/cypress/support/component.ts',
  devServerPublicPathRoute: '/__cypress/src',
  platform: 'darwin',
  // Default test cases to run mode (`cypress run`); open-mode behaviour is
  // covered by the dedicated tests below.
  isTextTerminal: true,
} as Cypress.PluginConfigOptions

interface MockServer {
  listen: ReturnType<typeof vi.fn>
  warmupRequest: ReturnType<typeof vi.fn>
  waitForRequestsIdle: ReturnType<typeof vi.fn>
  close: ReturnType<typeof vi.fn>
  config: { server: { port: number } }
}

function buildMockServer (): MockServer {
  return {
    listen: vi.fn().mockResolvedValue(undefined),
    warmupRequest: vi.fn().mockResolvedValue(undefined),
    waitForRequestsIdle: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    config: { server: { port: 5173 } },
  }
}

function buildDevServerConfig (overrides: Partial<{
  specs: Cypress.Spec[]
  cypressConfig: Cypress.PluginConfigOptions
}> = {}): any {
  return {
    specs: overrides.specs ?? [],
    cypressConfig: overrides.cypressConfig ?? baseCypressConfig,
    devServerEvents: new EventEmitter(),
  }
}

describe('devServer warmup', () => {
  let mockServer: MockServer

  beforeEach(() => {
    vi.spyOn(getViteModule, 'getVite').mockResolvedValue({ version: '8.0.0' } as any)
    mockServer = buildMockServer()
    vi.spyOn(devServer, 'create').mockResolvedValue(mockServer as any)
  })

  it('warms up the support file and every spec, then awaits requests-idle', async () => {
    await devServer(buildDevServerConfig({
      specs: [
        { absolute: '/users/proj/src/Foo.cy.tsx', relative: 'src/Foo.cy.tsx' } as Cypress.Spec,
        { absolute: '/users/proj/src/Bar.cy.tsx', relative: 'src/Bar.cy.tsx' } as Cypress.Spec,
      ],
    }))

    expect(mockServer.listen).toHaveBeenCalledOnce()
    expect(mockServer.warmupRequest).toHaveBeenCalledTimes(3)
    expect(mockServer.warmupRequest).toHaveBeenCalledWith('/cypress/support/component.ts')
    expect(mockServer.warmupRequest).toHaveBeenCalledWith('/@fs/users/proj/src/Foo.cy.tsx')
    expect(mockServer.warmupRequest).toHaveBeenCalledWith('/@fs/users/proj/src/Bar.cy.tsx')
    expect(mockServer.waitForRequestsIdle).toHaveBeenCalledOnce()

    // Every warmupRequest must be invoked before waitForRequestsIdle.
    const lastWarmupOrder = Math.max(...mockServer.warmupRequest.mock.invocationCallOrder)
    const idleOrder = mockServer.waitForRequestsIdle.mock.invocationCallOrder[0]

    expect(lastWarmupOrder).toBeLessThan(idleOrder)
  })

  it('warms up only specs when supportFile is unset', async () => {
    await devServer(buildDevServerConfig({
      specs: [
        { absolute: '/users/proj/src/Foo.cy.tsx', relative: 'src/Foo.cy.tsx' } as Cypress.Spec,
      ],
      cypressConfig: { ...baseCypressConfig, supportFile: undefined as any },
    }))

    expect(mockServer.warmupRequest).toHaveBeenCalledOnce()
    expect(mockServer.warmupRequest).toHaveBeenCalledWith('/@fs/users/proj/src/Foo.cy.tsx')
    expect(mockServer.waitForRequestsIdle).toHaveBeenCalledOnce()
  })

  it('warms up only the support file when no specs are provided', async () => {
    await devServer(buildDevServerConfig({ specs: [] }))

    expect(mockServer.warmupRequest).toHaveBeenCalledOnce()
    expect(mockServer.warmupRequest).toHaveBeenCalledWith('/cypress/support/component.ts')
    expect(mockServer.waitForRequestsIdle).toHaveBeenCalledOnce()
  })

  it('skips warmup and waitForRequestsIdle when there is nothing to warm up', async () => {
    await devServer(buildDevServerConfig({
      specs: [],
      cypressConfig: { ...baseCypressConfig, supportFile: undefined as any },
    }))

    expect(mockServer.warmupRequest).not.toHaveBeenCalled()
    expect(mockServer.waitForRequestsIdle).not.toHaveBeenCalled()
  })

  it('throws if the Vite server fails to bind a port', async () => {
    mockServer.config.server.port = undefined as any

    await expect(devServer(buildDevServerConfig())).rejects.toThrow(/Missing vite dev server port/)
    expect(mockServer.warmupRequest).not.toHaveBeenCalled()
    expect(mockServer.waitForRequestsIdle).not.toHaveBeenCalled()
  })

  it('open mode: warms up only the support file, not specs', async () => {
    await devServer(buildDevServerConfig({
      specs: [
        { absolute: '/users/proj/src/Foo.cy.tsx', relative: 'src/Foo.cy.tsx' } as Cypress.Spec,
        { absolute: '/users/proj/src/Bar.cy.tsx', relative: 'src/Bar.cy.tsx' } as Cypress.Spec,
      ],
      cypressConfig: { ...baseCypressConfig, isTextTerminal: false },
    }))

    expect(mockServer.warmupRequest).toHaveBeenCalledOnce()
    expect(mockServer.warmupRequest).toHaveBeenCalledWith('/cypress/support/component.ts')
    expect(mockServer.waitForRequestsIdle).toHaveBeenCalledOnce()
  })

  it('open mode: skips warmup entirely when supportFile is unset', async () => {
    await devServer(buildDevServerConfig({
      specs: [
        { absolute: '/users/proj/src/Foo.cy.tsx', relative: 'src/Foo.cy.tsx' } as Cypress.Spec,
      ],
      cypressConfig: { ...baseCypressConfig, supportFile: undefined as any, isTextTerminal: false },
    }))

    expect(mockServer.warmupRequest).not.toHaveBeenCalled()
    expect(mockServer.waitForRequestsIdle).not.toHaveBeenCalled()
  })
})
