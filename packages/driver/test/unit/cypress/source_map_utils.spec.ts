/**
 * @vitest-environment jsdom
 */
import { vi, describe, it, expect, beforeEach } from 'vitest'
import source_map_utils from '../../../src/cypress/source_map_utils'

vi.mock('source-map', () => {
  const SourceMapConsumer = function (rawSourceMap) {
    return {
      sources: rawSourceMap.sources || ['src/components/Button.tsx'],
      _sources: rawSourceMap.sources || ['src/components/Button.tsx'],
      _absoluteSources: (rawSourceMap.sources || ['src/components/Button.tsx']).map((source) => `/project/${source}`),
      destroy: vi.fn(),
      originalPositionFor: vi.fn().mockReturnValue({
        source: rawSourceMap.sources?.[0] || 'src/components/Button.tsx',
        line: 10,
        column: 5,
      }),
      sourceContentFor: vi.fn().mockReturnValue('// mock source content'),
    }
  }

  SourceMapConsumer.initialize = vi.fn()

  return {
    SourceMapConsumer,
  }
})

describe('source_map_utils', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  // Helper function to set up source map consumers for testing
  const setupSourceMapConsumer = async (sourceMapUtils: typeof source_map_utils, scriptUrl: string, sources: string[] = ['src/components/Button.tsx']) => {
    // Call the actual function to set up the consumer (SourceMapConsumer constructor is mocked)
    const consumer = await sourceMapUtils.initializeSourceMapConsumer({ fullyQualifiedUrl: scriptUrl }, { sources })

    return consumer
  }

  // Helper function to run tests with Windows path behavior
  const withWindowsPaths = async (testFn: (sourceMapUtils: typeof source_map_utils) => Promise<void> | void) => {
    global.Cypress = {
      config: vi.fn().mockReturnValue('win32'),
    }

    const pathMock = await vi.importActual<typeof import('path')>('path')

    vi.doMock('path', () => {
      return {
        default: { ...pathMock.win32, win32: pathMock.win32, posix: pathMock.posix },
        ...pathMock.win32,
        win32: pathMock.win32,
        posix: pathMock.posix,
      }
    })

    // Re-import the module to get the mocked path
    const { default: sourceMapUtils } = await import('../../../src/cypress/source_map_utils')

    try {
      await testFn(sourceMapUtils)
    } finally {
      // Clean up the mock
      vi.doUnmock('path')
    }
  }

  const withLinuxPaths = async (testFn: (sourceMapUtils: typeof source_map_utils) => Promise<void> | void) => {
    global.Cypress = {
      config: vi.fn().mockReturnValue('linux'),
    }

    const pathMock = await vi.importActual<typeof import('path')>('path')

    vi.doMock('path', () => {
      return {
        default: { ...pathMock.posix, posix: pathMock.posix, win32: pathMock.win32 },
        ...pathMock.posix,
        posix: pathMock.posix,
        win32: pathMock.win32,
      }
    })

    // Re-import the module to get the mocked path
    const { default: sourceMapUtils } = await import('../../../src/cypress/source_map_utils')

    try {
      await testFn(sourceMapUtils)
    } finally {
      // Clean up the mock
      vi.doUnmock('path')
    }
  }

  describe('areSourceMapsAvailable', () => {
    it('should return false when no source map consumers exist', async () => {
      await withLinuxPaths(async (sourceMapUtils) => {
        const result = sourceMapUtils.areSourceMapsAvailable()

        expect(result).toBe(false)
      })
    })

    it('should return true when source map consumers exist', async () => {
      await withLinuxPaths(async (sourceMapUtils) => {
        await setupSourceMapConsumer(sourceMapUtils, '/project/test.spec.js')

        const result = sourceMapUtils.areSourceMapsAvailable()

        expect(result).toBe(true)
      })
    })

    it('should return true when multiple source map consumers exist', async () => {
      await withLinuxPaths(async (sourceMapUtils) => {
        await setupSourceMapConsumer(sourceMapUtils, '/project1/test1.spec.js', ['src/components/Button.tsx'])
        await setupSourceMapConsumer(sourceMapUtils, '/project2/test2.spec.js', ['src/utils/helper.js'])

        const result = sourceMapUtils.areSourceMapsAvailable()

        expect(result).toBe(true)
      })
    })
  })

  describe('getBaseDirectory', () => {
    it('should return the base directory when relative path matches absolute path', async () => {
      await withLinuxPaths(async (sourceMapUtils) => {
        const absolutePath = '/project/src/components/Button.tsx'
        const relativePath = 'src/components/Button.tsx'

        const result = sourceMapUtils.getBaseDirectory(absolutePath, relativePath)

        expect(result).toBe('/project')
      })
    })

    it('should return the base directory for nested paths', async () => {
      await withLinuxPaths(async (sourceMapUtils) => {
        const absolutePath = '/home/user/project/lib/utils/helper.js'
        const relativePath = 'lib/utils/helper.js'

        const result = sourceMapUtils.getBaseDirectory(absolutePath, relativePath)

        expect(result).toBe('/home/user/project')
      })
    })

    it('should handle Windows paths correctly', async () => {
      await withWindowsPaths(async (sourceMapUtils) => {
        const absolutePath = 'C:\\project\\src\\components\\Button.tsx'
        const relativePath = 'src\\components\\Button.tsx'

        const result = sourceMapUtils.getBaseDirectory(absolutePath, relativePath)

        expect(result).toBe('C:\\project')
      })
    })

    it('should return null when relative path does not match absolute path', async () => {
      await withLinuxPaths(async (sourceMapUtils) => {
        const absolutePath = '/project/src/components/Button.tsx'
        const relativePath = 'different/path/Button.tsx'

        const result = sourceMapUtils.getBaseDirectory(absolutePath, relativePath)

        expect(result).toBeNull()
      })
    })

    it('should return null when absolute path is shorter than relative path', async () => {
      await withLinuxPaths(async (sourceMapUtils) => {
        const absolutePath = '/project/Button.tsx'
        const relativePath = 'src/components/Button.tsx'

        const result = sourceMapUtils.getBaseDirectory(absolutePath, relativePath)

        expect(result).toBeNull()
      })
    })

    it('should handle root directory paths', async () => {
      await withLinuxPaths(async (sourceMapUtils) => {
        const absolutePath = '/Button.tsx'
        const relativePath = 'Button.tsx'

        const result = sourceMapUtils.getBaseDirectory(absolutePath, relativePath)

        expect(result).toBe('/')
      })
    })

    it('should handle empty relative path', async () => {
      await withLinuxPaths(async (sourceMapUtils) => {
        const absolutePath = '/project/src/components/Button.tsx'
        const relativePath = ''

        const result = sourceMapUtils.getBaseDirectory(absolutePath, relativePath)

        expect(result).toBeNull()
      })
    })

    it('should handle identical absolute and relative paths', async () => {
      await withLinuxPaths(async (sourceMapUtils) => {
        const absolutePath = '/project/src/components/Button.tsx'
        const relativePath = '/project/src/components/Button.tsx'

        const result = sourceMapUtils.getBaseDirectory(absolutePath, relativePath)

        expect(result).toBe('/')
      })
    })
  })

  describe('setSourceMapProjectRoot', () => {
    it('should return the base directory when source map consumer exists and path matches', async () => {
      await withLinuxPaths(async (sourceMapUtils) => {
        await setupSourceMapConsumer(sourceMapUtils, '/project/cypress/integration/test.spec.js', ['src/components/Button.tsx'])

        const relativePath = 'cypress/integration/test.spec.js'
        const absolutePath = '/project/src/components/Button.tsx'

        sourceMapUtils.setSourceMapProjectRoot(relativePath, absolutePath, 'project-root')

        const result = sourceMapUtils.getSourceMapProjectRoot()

        expect(result).toBe('/project')
      })
    })

    it('should return project root when no source map consumer exists for the relative path', async () => {
      await withLinuxPaths(async (sourceMapUtils) => {
        await setupSourceMapConsumer(sourceMapUtils, '/project/cypress/integration/test.spec.js', ['src/components/Button.tsx'])

        const relativePath = 'cypress/integration/nonexistent.spec.js'
        const absolutePath = '/project/src/components/Button.tsx'

        sourceMapUtils.setSourceMapProjectRoot(relativePath, absolutePath, '/project-root')

        const result = sourceMapUtils.getSourceMapProjectRoot()

        expect(result).toBe('/project-root')
      })
    })

    it('should return project root when absolute path does not match any source in the consumer', async () => {
      await withLinuxPaths(async (sourceMapUtils) => {
        await setupSourceMapConsumer(sourceMapUtils, '/project/cypress/integration/test.spec.js', ['src/components/Button.tsx'])

        const relativePath = 'cypress/integration/test.spec.js'
        const absolutePath = '/different/project/src/components/Input.tsx'

        sourceMapUtils.setSourceMapProjectRoot(relativePath, absolutePath, '/project-root')

        const result = sourceMapUtils.getSourceMapProjectRoot()

        expect(result).toBe('/project-root')
      })
    })

    it('should handle multiple source map consumers and find the correct one', async () => {
      await withLinuxPaths(async (sourceMapUtils) => {
        await setupSourceMapConsumer(sourceMapUtils, '/project1/cypress/integration/test1.spec.js', ['src/components/Button.tsx'])
        await setupSourceMapConsumer(sourceMapUtils, '/project2/cypress/integration/test2.spec.js', ['src/utils/helper.js'])

        const relativePath = 'cypress/integration/test2.spec.js'
        const absolutePath = '/project2/src/utils/helper.js'

        sourceMapUtils.setSourceMapProjectRoot(relativePath, absolutePath, '/project-root')

        const result = sourceMapUtils.getSourceMapProjectRoot()

        expect(result).toBe('/project2')
      })
    })

    it('should handle empty source map consumers', async () => {
      await withLinuxPaths(async (sourceMapUtils) => {
        const relativePath = 'cypress/integration/test.spec.js'
        const absolutePath = '/project/src/components/Button.tsx'

        sourceMapUtils.setSourceMapProjectRoot(relativePath, absolutePath, '/project-root')

        const result = sourceMapUtils.getSourceMapProjectRoot()

        expect(result).toBe('/project-root')
      })
    })

    it('should handle consumer with no matching sources', async () => {
      await withLinuxPaths(async (sourceMapUtils) => {
        await setupSourceMapConsumer(sourceMapUtils, '/project/cypress/integration/test.spec.js', ['src/other/file.js'])

        const relativePath = 'cypress/integration/test.spec.js'
        const absolutePath = '/project/src/components/Button.tsx'

        sourceMapUtils.setSourceMapProjectRoot(relativePath, absolutePath, '/project-root')

        const result = sourceMapUtils.getSourceMapProjectRoot()

        expect(result).toBe('/project-root')
      })
    })

    it('should handle Windows and return the base directory when source map consumer exists and path matches', async () => {
      await withWindowsPaths(async (sourceMapUtils) => {
        await setupSourceMapConsumer(sourceMapUtils, 'C:\\project\\cypress\\integration\\test.spec.js', ['src\\components\\Button.tsx'])

        const relativePath = 'cypress\\integration\\test.spec.js'
        const absolutePath = 'C:\\project\\src\\components\\Button.tsx'

        sourceMapUtils.setSourceMapProjectRoot(relativePath, absolutePath, 'C:\\project-root')

        const result = sourceMapUtils.getSourceMapProjectRoot()

        expect(result).toBe('C:\\project')
      })
    })
  })
})
