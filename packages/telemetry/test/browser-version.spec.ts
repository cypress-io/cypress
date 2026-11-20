// @ts-expect-error - stub window, which does not exist in the Node test environment
global.window = {}

import { describe, it, expect } from 'vitest'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'
import { telemetry } from '../src/client'

describe('init without a config', () => {
  it('reports the version of the server that served the page', () => {
    global.window.__CYPRESS_TELEMETRY__ = {
      context: { context: { traceparent: '00-a14c8519972996a2a0748f2c8db5a775-4ad8bd26672a01b0-01' } },
      resources: { [SemanticResourceAttributes.SERVICE_VERSION]: '15.0.0' },
      isVerbose: false,
    }

    telemetry.init({ namespace: 'cypress:launchpad' })

    expect(window.cypressTelemetrySingleton?.getResources()).toEqual(expect.objectContaining({
      [SemanticResourceAttributes.SERVICE_NAMESPACE]: 'cypress:launchpad',
      [SemanticResourceAttributes.SERVICE_VERSION]: '15.0.0',
    }))
  })
})
