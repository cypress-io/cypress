import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import getEnvInformationForProjectRoot from '../../../lib/cloud/environment'
import path from 'path'
import base64url from 'base64url'
import { exec } from 'child_process'

const resolvePackagePath = vi.hoisted(() => vi.fn())

vi.mock('resolve-package-path', () => ({ default: resolvePackagePath }))

const originalResolvePackagePath = (await vi.importActual<typeof import('resolve-package-path')>('resolve-package-path')).default

describe('lib/cloud/environment', () => {
  beforeEach(() => {
    resolvePackagePath.mockImplementation(originalResolvePackagePath)
    vi.stubEnv('CYPRESS_API_URL', undefined)
    vi.stubEnv('CYPRESS_ENV_DEPENDENCIES', base64url.encode(JSON.stringify({
      maybeCheckProcessTreeIfPresent: ['foo'],
      neverCheckProcessTreeIfPresent: ['bar'],
    })))
  })

  let proc
  const spawnProcessTree = async ({
    grandParentUrl,
    parentUrl,
    url,
  }: {
    grandParentUrl?: string
    parentUrl?: string
    url?: string
  }) => {
    return new Promise((resolve) => {
      proc = exec(`node ${path.join(__dirname, '..', '..', 'support', 'fixtures', 'cloud', 'environment', 'test-project', 'index.js')}`, {
        cwd: path.join(__dirname, '..', '..', 'support', 'fixtures', 'cloud', 'environment', 'test-project'),
        env: {
          ...process.env,
          CYPRESS_API_URL: grandParentUrl,
          CHILD_CYPRESS_API_URL: parentUrl,
          GRANDCHILD_CYPRESS_API_URL: url,
        },
      })

      proc.stdout.on('data', (data) => {
        const match = data.toString().match(/grandchild (\d+)/)

        if (match) {
          resolve(match[1])
        }
      })
    })
  }

  afterEach(() => {
    if (proc) {
      proc.kill()
    }

    vi.unstubAllEnvs()
  })

  it('should be able to get the environment for: present CYPRESS_API_URL and all tracked dependencies', async () => {
    vi.stubEnv('CYPRESS_API_URL', 'https://example.com')

    const information = await getEnvInformationForProjectRoot(path.join(__dirname, '..', '..', 'support', 'fixtures', 'cloud', 'environment', 'all-tracked-dependencies'), process.pid.toString())

    expect(information).toStrictEqual({
      envUrl: 'https://example.com',
      dependencies: { bar: { version: '2.0.0' }, foo: { version: '1.0.0' } },
      errors: [],
    })
  })

  it('should be able to get the environment for: present CYPRESS_API_URL and a thrown error when tracking dependencies', async () => {
    vi.stubEnv('CYPRESS_API_URL', 'https://example.com')

    resolvePackagePath.mockImplementation((name: string, root: string) => {
      if (name === 'foo') {
        throw new Error('some error')
      }

      if (name === 'bar') {
        return originalResolvePackagePath(name, root)
      }

      return undefined
    })

    const { errors, ...information } = await getEnvInformationForProjectRoot(path.join(__dirname, '..', '..', 'support', 'fixtures', 'cloud', 'environment', 'all-tracked-dependencies'), process.pid.toString())

    expect(information).toStrictEqual({
      envUrl: 'https://example.com',
      dependencies: { bar: { version: '2.0.0' } },
    })

    expect(errors).toHaveLength(1)
    expect(errors[0].dependency).toBe('foo')
    expect(errors[0].message).toBe('some error')
    expect(errors[0].name).toBe('Error')
    expect(errors[0].stack).toContain('Error: some error')
  })

  it('should be able to get the environment for: absent CYPRESS_API_URL and all tracked dependencies', async () => {
    const information = await getEnvInformationForProjectRoot(path.join(__dirname, '..', '..', 'support', 'fixtures', 'cloud', 'environment', 'all-tracked-dependencies'), process.pid.toString())

    expect(information).toStrictEqual({
      envUrl: undefined,
      dependencies: { bar: { version: '2.0.0' }, foo: { version: '1.0.0' } },
      errors: [],
    })
  })

  it('should be able to get the environment for: absent CYPRESS_API_URL and partial dependencies not matching criteria', async () => {
    const information = await getEnvInformationForProjectRoot(path.join(__dirname, '..', '..', 'support', 'fixtures', 'cloud', 'environment', 'partial-dependencies-not-matching'), process.pid.toString())

    expect(information).toStrictEqual({
      envUrl: undefined,
      dependencies: { bar: { version: '2.0.0' } },
      errors: [],
    })
  })

  describe('absent CYPRESS_API_URL and partial dependencies matching criteria', () => {
    it('should be able to get the environment for CYPRESS_API_URL defined in grandparent process', async () => {
      const pid = await spawnProcessTree({
        grandParentUrl: 'https://grandparent.com',
      })

      const information = await getEnvInformationForProjectRoot(path.join(__dirname, '..', '..', 'support', 'fixtures', 'cloud', 'environment', 'partial-dependencies-matching'), pid.toString())

      expect(information).toStrictEqual({
        envUrl: process.platform !== 'win32' ? 'https://grandparent.com' : undefined,
        dependencies: { foo: { version: '1.0.0' } },
        errors: [],
      })
    })

    it('should be able to get the environment for CYPRESS_API_URL defined in parent process', async () => {
      const pid = await spawnProcessTree({
        parentUrl: 'https://parent.com',
      })

      const information = await getEnvInformationForProjectRoot(path.join(__dirname, '..', '..', 'support', 'fixtures', 'cloud', 'environment', 'partial-dependencies-matching'), pid.toString())

      expect(information).toStrictEqual({
        envUrl: process.platform !== 'win32' ? 'https://parent.com' : undefined,
        dependencies: { foo: { version: '1.0.0' } },
        errors: [],
      })
    })

    it('should be able to get the environment for CYPRESS_API_URL defined in current process', async () => {
      const pid = await spawnProcessTree({
        url: 'https://url.com',
      })

      const information = await getEnvInformationForProjectRoot(path.join(__dirname, '..', '..', 'support', 'fixtures', 'cloud', 'environment', 'partial-dependencies-matching'), pid.toString())

      expect(information).toStrictEqual({
        envUrl: process.platform !== 'win32' ? 'https://url.com' : undefined,
        dependencies: { foo: { version: '1.0.0' } },
        errors: [],
      })
    })

    it('should be able to get the environment for CYPRESS_API_URL defined in parent process overriding grandparent process', async () => {
      const pid = await spawnProcessTree({
        grandParentUrl: 'https://grandparent.com',
        parentUrl: 'https://parent.com',
      })

      const information = await getEnvInformationForProjectRoot(path.join(__dirname, '..', '..', 'support', 'fixtures', 'cloud', 'environment', 'partial-dependencies-matching'), pid.toString())

      expect(information).toStrictEqual({
        envUrl: process.platform !== 'win32' ? 'https://parent.com' : undefined,
        dependencies: { foo: { version: '1.0.0' } },
        errors: [],
      })
    })

    it('should return no envUrl when CYPRESS_API_URL is not defined in any parent process', async () => {
      const pid = await spawnProcessTree({})

      const information = await getEnvInformationForProjectRoot(path.join(__dirname, '..', '..', 'support', 'fixtures', 'cloud', 'environment', 'partial-dependencies-matching'), pid.toString())

      expect(information).toStrictEqual({
        envUrl: undefined,
        dependencies: { foo: { version: '1.0.0' } },
        errors: [],
      })
    })
  })
})
