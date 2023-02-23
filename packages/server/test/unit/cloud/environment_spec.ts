import '../../spec_helper'
import getEnvInformationForProjectRoot from '../../../lib/cloud/environment'
import path from 'path'
import base64url from 'base64url'
import { exec } from 'child_process'

describe('lib/cloud/api', () => {
  beforeEach(() => {
    delete process.env.CYPRESS_API_URL
    process.env.CYPRESS_ENV_DEPENDENCIES = base64url.encode(JSON.stringify({
      'foo': {
        processTreeRequirement: 'presence required',
      },
      'bar': {
        processTreeRequirement: 'absence required',
      },
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
    })
  })

  it('should be able to get the environment for: absent CYPRESS_API_URL and all tracked dependencies', async () => {
    const information = await getEnvInformationForProjectRoot(path.join(__dirname, '..', '..', 'support', 'fixtures', 'cloud', 'environment', 'all-tracked-dependencies'), process.pid.toString())

    expect(information).to.deep.eq({
      dependencies: { bar: { version: '2.0.0' }, foo: { version: '1.0.0' } },
    })
  })

  it('should be able to get the environment for: absent CYPRESS_API_URL and partial dependencies not matching criteria', async () => {
    const information = await getEnvInformationForProjectRoot(path.join(__dirname, '..', '..', 'support', 'fixtures', 'cloud', 'environment', 'partial-dependencies-not-matching'), process.pid.toString())

    expect(information).to.deep.eq({
      dependencies: { bar: { version: '2.0.0' } },
    })
  })

  context('absent CYPRESS_API_URL and partial dependencies matching criteria', () => {
    it('should be able to get the environment for CYPRESS_API_URL defined in grandparent process', async () => {
      const pid = await spawnProcessTree({
        grandParentUrl: 'https://grandparent.com',
      })

      const information = await getEnvInformationForProjectRoot(path.join(__dirname, '..', '..', 'support', 'fixtures', 'cloud', 'environment', 'partial-dependencies-matching'), pid.toString())

      expect(information).to.deep.eq({
        ...(process.platform === 'win32' ? { envUrl: 'https://grandparent.com' } : {}),
        dependencies: { foo: { version: '1.0.0' } },
      })
    })

    it('should be able to get the environment for CYPRESS_API_URL defined in parent process', async () => {
      const pid = await spawnProcessTree({
        parentUrl: 'https://parent.com',
      })

      const information = await getEnvInformationForProjectRoot(path.join(__dirname, '..', '..', 'support', 'fixtures', 'cloud', 'environment', 'partial-dependencies-matching'), pid.toString())

      expect(information).to.deep.eq({
        ...(process.platform === 'win32' ? { envUrl: 'https://parent.com' } : {}),
        dependencies: { foo: { version: '1.0.0' } },
      })
    })

    it('should be able to get the environment for CYPRESS_API_URL defined in current process', async () => {
      const pid = await spawnProcessTree({
        url: 'https://url.com',
      })

      const information = await getEnvInformationForProjectRoot(path.join(__dirname, '..', '..', 'support', 'fixtures', 'cloud', 'environment', 'partial-dependencies-matching'), pid.toString())

      expect(information).to.deep.eq({
        ...(process.platform === 'win32' ? { envUrl: 'https://url.com' } : {}),
        dependencies: { foo: { version: '1.0.0' } },
      })
    })

    it('should be able to get the environment for CYPRESS_API_URL defined in parent process overriding grandparent process', async () => {
      const pid = await spawnProcessTree({
        grandParentUrl: 'https://grandparent.com',
        parentUrl: 'https://parent.com',
      })

      const information = await getEnvInformationForProjectRoot(path.join(__dirname, '..', '..', 'support', 'fixtures', 'cloud', 'environment', 'partial-dependencies-matching'), pid.toString())

      expect(information).to.deep.eq({
        ...(process.platform === 'win32' ? { envUrl: 'https://parent.com' } : {}),
        dependencies: { foo: { version: '1.0.0' } },
      })
    })

    it('should return no envUrl when CYPRESS_API_URL is not defined in any parent process', async () => {
      const pid = await spawnProcessTree({})

      const information = await getEnvInformationForProjectRoot(path.join(__dirname, '..', '..', 'support', 'fixtures', 'cloud', 'environment', 'partial-dependencies-matching'), pid.toString())

      expect(information).to.deep.eq({
        dependencies: { foo: { version: '1.0.0' } },
      })
    })
  })
})
