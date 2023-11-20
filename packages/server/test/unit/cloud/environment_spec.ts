import '../../spec_helper'
import getEnvInformationForProjectRoot from '../../../lib/cloud/environment'
import path from 'path'
import base64url from 'base64url'
import { exec } from 'child_process'
import originalResolvePackagePath from 'resolve-package-path'
import proxyquire from 'proxyquire'

describe('lib/cloud/environment', () => {
  beforeEach(() => {
    delete process.env.CYPRESS_API_URL
    process.env.CYPRESS_ENV_DEPENDENCIES = base64url.encode(JSON.stringify({
      maybeCheckProcessTreeIfPresent: ['foo'],
      neverCheckProcessTreeIfPresent: ['bar'],
    }))
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
  })

  it('should be able to get the environment for: present CYPRESS_API_URL and all tracked dependencies', async () => {
    process.env.CYPRESS_API_URL = 'https://example.com'

    const information = await getEnvInformationForProjectRoot(path.join(__dirname, '..', '..', 'support', 'fixtures', 'cloud', 'environment', 'all-tracked-dependencies'), process.pid.toString())

    expect(information).to.deep.eq({
      envUrl: 'https://example.com',
      dependencies: { bar: { version: '2.0.0' }, foo: { version: '1.0.0' } },
      errors: [],
    })
  })

  it('should be able to get the environment for: present CYPRESS_API_URL and a thrown error when tracking dependencies', async () => {
    process.env.CYPRESS_API_URL = 'https://example.com'

    const resolvePackagePath = sinon.stub()

    resolvePackagePath.withArgs('foo', sinon.match.any).throws(new Error('some error'))
    resolvePackagePath.withArgs('bar', sinon.match.any).callsFake(originalResolvePackagePath)
    const { default: getEnvInfo } = proxyquire('../../../lib/cloud/environment', {
      'resolve-package-path': resolvePackagePath,
    })

    const { errors, ...information } = await getEnvInfo(path.join(__dirname, '..', '..', 'support', 'fixtures', 'cloud', 'environment', 'all-tracked-dependencies'), process.pid.toString())

    expect(information).to.deep.eq({
      envUrl: 'https://example.com',
      dependencies: { bar: { version: '2.0.0' } },
    })

    expect(errors).to.have.length(1)
    expect(errors[0].dependency).to.equal('foo')
    expect(errors[0].message).to.equal('some error')
    expect(errors[0].name).to.equal('Error')
    expect(errors[0].stack).to.include('Error: some error')
  })

  it('should be able to get the environment for: absent CYPRESS_API_URL and all tracked dependencies', async () => {
    const information = await getEnvInformationForProjectRoot(path.join(__dirname, '..', '..', 'support', 'fixtures', 'cloud', 'environment', 'all-tracked-dependencies'), process.pid.toString())

    expect(information).to.deep.eq({
      envUrl: undefined,
      dependencies: { bar: { version: '2.0.0' }, foo: { version: '1.0.0' } },
      errors: [],
    })
  })

  it('should be able to get the environment for: absent CYPRESS_API_URL and partial dependencies not matching criteria', async () => {
    const information = await getEnvInformationForProjectRoot(path.join(__dirname, '..', '..', 'support', 'fixtures', 'cloud', 'environment', 'partial-dependencies-not-matching'), process.pid.toString())

    expect(information).to.deep.eq({
      envUrl: undefined,
      dependencies: { bar: { version: '2.0.0' } },
      errors: [],
    })
  })

  context('absent CYPRESS_API_URL and partial dependencies matching criteria', () => {
    it('should be able to get the environment for CYPRESS_API_URL defined in grandparent process', async () => {
      const pid = await spawnProcessTree({
        grandParentUrl: 'https://grandparent.com',
      })

      const information = await getEnvInformationForProjectRoot(path.join(__dirname, '..', '..', 'support', 'fixtures', 'cloud', 'environment', 'partial-dependencies-matching'), pid.toString())

      expect(information).to.deep.eq({
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

      expect(information).to.deep.eq({
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

      expect(information).to.deep.eq({
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

      expect(information).to.deep.eq({
        envUrl: process.platform !== 'win32' ? 'https://parent.com' : undefined,
        dependencies: { foo: { version: '1.0.0' } },
        errors: [],
      })
    })

    it('should return no envUrl when CYPRESS_API_URL is not defined in any parent process', async () => {
      const pid = await spawnProcessTree({})

      const information = await getEnvInformationForProjectRoot(path.join(__dirname, '..', '..', 'support', 'fixtures', 'cloud', 'environment', 'partial-dependencies-matching'), pid.toString())

      expect(information).to.deep.eq({
        envUrl: undefined,
        dependencies: { foo: { version: '1.0.0' } },
        errors: [],
      })
    })
  })
})
