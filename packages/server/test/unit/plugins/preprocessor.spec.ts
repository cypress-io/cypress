import * as Fixtures from '@tooling/system-tests'
import path from 'path'
import * as appData from '../../../lib/util/app_data'
import * as plugins from '../../../lib/plugins'
import preprocessor from '../../../lib/plugins/preprocessor'
import { clearCtx, getCtx, makeDataContext, setCtx } from '../../../lib/makeDataContext'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'

// Building the real schemas in this worker loads a second `graphql` realm, which `graphql` rejects.
vi.mock('@packages/data-context/graphql/schema', () => {
  return { graphqlSchema: {} }
})

vi.mock('@packages/data-context/graphql', () => {
  return { remoteSchemaWrapped: {} }
})

describe('lib/plugins/preprocessor', () => {
  let todosPath: string
  let filePath: string
  let fullFilePath: string
  let plugin: Mock
  let config

  const lastPluginFile = () => plugin.mock.lastCall[0]

  beforeEach(async () => {
    await clearCtx()
    setCtx(makeDataContext({} as Parameters<typeof makeDataContext>[0]))

    Fixtures.scaffold()
    todosPath = Fixtures.projectPath('todos')

    filePath = 'path/to/test.tsx'
    fullFilePath = path.join(todosPath, filePath)

    const output = new Promise((resolve) => resolve('/path/to/output.js'))

    plugin = vi.fn(() => output)
    plugins.registerEvent('file:preprocessor', plugin)

    preprocessor.close()

    config = {
      preprocessor: 'custom',
      projectRoot: todosPath,
    }
  })

  afterEach(async () => {
    await getCtx()._reset()
    await clearCtx()
    vi.restoreAllMocks()
  })

  describe('#getFile', () => {
    it('executes the plugin with file path', () => {
      preprocessor.getFile(filePath, config)
      expect(plugin).toHaveBeenCalled()

      expect(lastPluginFile().filePath).toBe(fullFilePath)
    })

    it('executes the plugin with output path', () => {
      preprocessor.getFile(filePath, config)
      const expectedPath = appData.projectsPath(appData.toHashName(todosPath), 'bundles', filePath)

      expect(lastPluginFile().outputPath).toBe(expectedPath)
    })

    it('returns a promise resolved with the plugin\'s outputPath', () => {
      return preprocessor.getFile(filePath, config).then((filePath) => {
        expect(filePath).toBe('/path/to/output.js')
      })
    })

    it('emits \'file:updated\' with filePath when \'rerun\' is emitted', () => {
      const fileUpdated = vi.fn()

      preprocessor.emitter.on('file:updated', fileUpdated)
      preprocessor.getFile(filePath, config)
      lastPluginFile().emit('rerun')

      expect(fileUpdated).toHaveBeenCalledWith(fullFilePath)
    })

    it('invokes plugin again when isTextTerminal: false', () => {
      config.isTextTerminal = false
      preprocessor.getFile(filePath, config)
      preprocessor.getFile(filePath, config)

      expect(plugin).toHaveBeenCalledTimes(2)
    })

    it('does not invoke plugin again when isTextTerminal: true', () => {
      config.isTextTerminal = true
      preprocessor.getFile(filePath, config)
      preprocessor.getFile(filePath, config)

      expect(plugin).toHaveBeenCalledTimes(1)
    })
  })

  describe('#removeFile', () => {
    it('emits \'close\'', () => {
      preprocessor.getFile(filePath, config)
      const onClose = vi.fn()

      lastPluginFile().on('close', onClose)
      preprocessor.removeFile(filePath, config)

      expect(onClose).toHaveBeenCalled()
    })

    it('emits \'close\' with file path on base emitter', () => {
      const onClose = vi.fn()

      preprocessor.emitter.on('close', onClose)
      preprocessor.getFile(filePath, config)
      preprocessor.removeFile(filePath, config)

      expect(onClose).toHaveBeenCalledWith(fullFilePath)
    })
  })

  describe('#close', () => {
    it('emits \'close\' on config emitter', () => {
      preprocessor.getFile(filePath, config)
      const onClose = vi.fn()

      lastPluginFile().on('close', onClose)
      preprocessor.close()

      expect(onClose).toHaveBeenCalled()
    })

    it('emits \'close\' on base emitter', () => {
      const onClose = vi.fn()

      preprocessor.emitter.on('close', onClose)
      preprocessor.getFile(filePath, config)
      preprocessor.close()

      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('#clientSideError', () => {
    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
    }) // keep noise out of console

    it('send javascript string with the error', () => {
      expect(preprocessor.clientSideError('an error')).toBe(`\
(function () {
  Cypress.action("spec:script:error", {
    type: "BUNDLE_ERROR",
    error: "an error"
  })
}())\
`)
    })

    it('does not replace new lines with {newline} placeholder', () => {
      expect(preprocessor.clientSideError('with\nnew\nlines')).toContain('error: "with\\nnew\\nlines"')
    })

    it('does not remove command line syntax highlighting characters', () => {
      expect(preprocessor.clientSideError('[30mfoo[100mbar[7mbaz')).toContain('error: "[30mfoo[100mbar[7mbaz"')
    })
  })

  describe('#errorMessage', () => {
    it('handles error strings', () => {
      expect(preprocessor.errorMessage('error string')).toContain('error string')
    })

    it('handles standard error objects and sends the stack', () => {
      const err = new Error()

      err.stack = 'error object stack'

      expect(preprocessor.errorMessage(err)).toBe('error object stack')
    })

    it('sends err.annotated if stack is not present', () => {
      const err = {
        stack: undefined,
        annotated: 'annotation',
      }

      expect(preprocessor.errorMessage(err)).toBe('annotation')
    })

    it('sends err.message if stack and annotated are not present', () => {
      const err = {
        stack: undefined,
        message: 'message',
      }

      expect(preprocessor.errorMessage(err)).toBe('message')
    })

    it('does not remove stack lines', () => {
      expect(preprocessor.errorMessage('foo\n  at what.ever (foo 23:30)\n baz\n    at where.ever (bar 1:5)'))
      .toBe('foo\n  at what.ever (foo 23:30)\n baz\n    at where.ever (bar 1:5)')
    })
  })
})
