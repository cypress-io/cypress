import path from 'path'
import os from 'os'
import { proxyquire, sinon } from '../../../spec_helper'

describe('ensureStudioBundle', () => {
  let ensureStudioBundle: typeof import('../../../../lib/cloud/studio/ensure_studio_bundle').ensureStudioBundle
  let tmpdir: string = '/tmp'
  let rmStub: sinon.SinonStub = sinon.stub()
  let ensureStub: sinon.SinonStub = sinon.stub()
  let copyStub: sinon.SinonStub = sinon.stub()
  let extractStub: sinon.SinonStub = sinon.stub()
  let getStudioBundleStub: sinon.SinonStub = sinon.stub()
  let readFileStub: sinon.SinonStub = sinon.stub()
  let verifySignatureStub: sinon.SinonStub = sinon.stub()
  let pathExistsStub: sinon.SinonStub = sinon.stub()
  const mockResponseSignature = '159'
  const mockManifest = {
    'server/index.js': 'abcdefg',
  }

  beforeEach(() => {
    rmStub = sinon.stub()
    ensureStub = sinon.stub()
    copyStub = sinon.stub()
    readFileStub = sinon.stub()
    extractStub = sinon.stub()
    getStudioBundleStub = sinon.stub()
    verifySignatureStub = sinon.stub()
    pathExistsStub = sinon.stub()

    ensureStudioBundle = (proxyquire('../lib/cloud/studio/ensure_studio_bundle', {
      os: {
        tmpdir: () => tmpdir,
        platform: () => 'linux',
      },
      'fs-extra': {
        remove: rmStub.resolves(),
        ensureDir: ensureStub.resolves(),
        copy: copyStub.resolves(),
        readFile: readFileStub.resolves(JSON.stringify(mockManifest)),
        pathExists: pathExistsStub.resolves(true),
      },
      tar: {
        extract: extractStub.resolves(),
      },
      '../api/studio/get_studio_bundle': {
        getStudioBundle: getStudioBundleStub.resolves(mockResponseSignature),
      },
      '../encryption': {
        verifySignature: verifySignatureStub.resolves(true),
      },
    })).ensureStudioBundle
  })

  it('should ensure the studio bundle', async () => {
    const studioPath = path.join(os.tmpdir(), 'cypress', 'studio', '123')
    const bundlePath = path.join(studioPath, 'bundle.tar')

    const manifest = await ensureStudioBundle({
      studioPath,
      studioUrl: 'https://cypress.io/studio',
      projectId: '123',
    })

    expect(rmStub).to.be.calledWith(studioPath)
    expect(ensureStub).to.be.calledWith(studioPath)
    expect(readFileStub).to.be.calledWith(path.join(studioPath, 'manifest.json'), 'utf8')
    expect(getStudioBundleStub).to.be.calledWith({
      studioUrl: 'https://cypress.io/studio',
      bundlePath,
    })

    expect(extractStub).to.be.calledWith({
      file: bundlePath,
      cwd: studioPath,
    })

    expect(verifySignatureStub).to.be.calledWith(JSON.stringify(mockManifest), mockResponseSignature)

    expect(manifest).to.deep.eq(mockManifest)
  })

  it('should throw an error if the studio bundle signature is invalid', async () => {
    verifySignatureStub.resolves(false)

    const ensureStudioBundlePromise = ensureStudioBundle({
      studioPath: '/tmp/cypress/studio/123',
      studioUrl: 'https://cypress.io/studio',
      projectId: '123',
    })

    await expect(ensureStudioBundlePromise).to.be.rejectedWith('Unable to verify studio signature')
  })

  it('should throw an error if the studio bundle manifest is not found', async () => {
    pathExistsStub.resolves(false)

    const ensureStudioBundlePromise = ensureStudioBundle({
      studioPath: '/tmp/cypress/studio/123',
      studioUrl: 'https://cypress.io/studio',
      projectId: '123',
    })

    await expect(ensureStudioBundlePromise).to.be.rejectedWith('Unable to find studio manifest')
  })

  it('should throw an error if the studio bundle download times out', async () => {
    getStudioBundleStub.callsFake(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(new Error('Studio bundle download timed out'))
        }, 3000)
      })
    })

    const ensureStudioBundlePromise = ensureStudioBundle({
      studioPath: '/tmp/cypress/studio/123',
      studioUrl: 'https://cypress.io/studio',
      projectId: '123',
      downloadTimeoutMs: 500,
    })

    await expect(ensureStudioBundlePromise).to.be.rejectedWith('Studio bundle download timed out')
  })
})
