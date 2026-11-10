import type { DataContext } from '@packages/data-context'
import type { Cfg } from '../../../lib/project-base'

import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearCtx, setCtx } from '@packages/data-context'
import { isSpecFrameScript, NotSpecFrameScriptError } from '../../../lib/util/spec_frame_scripts'

describe('lib/util/spec_frame_scripts', () => {
  const projectRoot = path.resolve('/project')
  const specPath = path.join(projectRoot, 'cypress/e2e/app.cy.js')
  const supportPath = path.join(projectRoot, 'cypress/support/e2e.js')

  let config: Cfg

  beforeEach(async () => {
    await clearCtx()
    setCtx({
      project: {
        specs: [{ absolute: specPath, relative: 'cypress/e2e/app.cy.js' }],
      },
      lifecycleManager: {
        mainProcessWillDisconnect: vi.fn().mockResolvedValue(undefined),
      },
      destroy: vi.fn().mockResolvedValue(undefined),
    } as unknown as DataContext)

    config = { projectRoot, supportFile: supportPath } as Cfg
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    await clearCtx()
  })

  describe('isSpecFrameScript', () => {
    it('accepts a spec by its path relative to the project', () => {
      expect(isSpecFrameScript(config, 'cypress/e2e/app.cy.js')).toBe(true)
    })

    it('accepts the support file', () => {
      expect(isSpecFrameScript(config, 'cypress/support/e2e.js')).toBe(true)
    })

    it('rejects a file in the project that is not a spec', () => {
      expect(isSpecFrameScript(config, 'cypress.config.js')).toBe(false)
    })

    it('rejects a path that climbs out of the project', () => {
      expect(isSpecFrameScript(config, '../secret.json')).toBe(false)
      expect(isSpecFrameScript(config, 'cypress/e2e/../../../secret.json')).toBe(false)
    })

    it('rejects everything but specs when there is no support file', () => {
      config.supportFile = false

      expect(isSpecFrameScript(config, 'cypress/support/e2e.js')).toBe(false)
      expect(isSpecFrameScript(config, 'cypress/e2e/app.cy.js')).toBe(true)
    })

    describe('path case', () => {
      const platform = process.platform

      afterEach(() => {
        Object.defineProperty(process, 'platform', { value: platform })
      })

      it('ignores case on windows', () => {
        Object.defineProperty(process, 'platform', { value: 'win32' })
        config.supportFile = supportPath.toUpperCase()

        expect(isSpecFrameScript(config, 'cypress/support/e2e.js')).toBe(true)
        expect(isSpecFrameScript(config, 'CYPRESS/E2E/APP.CY.JS')).toBe(true)
      })

      it('respects case elsewhere', () => {
        Object.defineProperty(process, 'platform', { value: 'linux' })

        expect(isSpecFrameScript(config, 'CYPRESS/E2E/APP.CY.JS')).toBe(false)
      })
    })
  })

  describe('NotSpecFrameScriptError', () => {
    it('names the file in a message and keeps Cypress internals out of the stack', () => {
      const err = new NotSpecFrameScriptError('../secret.json')

      expect(err).toBeInstanceOf(Error)
      expect(err.message).toBe('../secret.json is not a spec file or the support file of this project.')
      expect(err.stack).toBe(err.message)
    })
  })
})
