import path from 'path'
import os from 'os'
import { proxyquire, sinon } from '../../../spec_helper'

describe('ensureStudioBundle', () => {
  let ensureStudioBundle: typeof import('../../../../lib/cloud/studio/ensure_studio_bundle').ensureStudioBundle
  let tmpdir: string = '/tmp'
  let rmStub: sinon.SinonStub = sinon.stub()
  let ensureStub: sinon.SinonStub = sinon.stub()
  let copyStub: sinon.SinonStub = sinon.stub()
  let readFileStub: sinon.SinonStub = sinon.stub()
  let extractStub: sinon.SinonStub = sinon.stub()
  let getStudioBundleStub: sinon.SinonStub = sinon.stub()

  beforeEach(() => {
    rmStub = sinon.stub()
    ensureStub = sinon.stub()
    copyStub = sinon.stub()
    readFileStub = sinon.stub()
    extractStub = sinon.stub()
    getStudioBundleStub = sinon.stub()

    ensureStudioBundle = (proxyquire('../lib/cloud/studio/ensure_studio_bundle', {
      os: {
        tmpdir: () => tmpdir,
        platform: () => 'linux',
      },
      'fs-extra': {
        remove: rmStub.resolves(),
        ensureDir: ensureStub.resolves(),
        copy: copyStub.resolves(),
        readFile: readFileStub.resolves('console.log("studio bundle")'),
      },
      tar: {
        extract: extractStub.resolves(),
      },
      '../api/studio/get_studio_bundle': {
        getStudioBundle: getStudioBundleStub.resolves(),
      },
    })).ensureStudioBundle
  })

  it('should ensure the studio bundle', async () => {
    const studioPath = path.join(os.tmpdir(), 'cypress', 'studio', '123')
    const bundlePath = path.join(studioPath, 'bundle.tar')

    await ensureStudioBundle({
      studioPath,
      studioUrl: 'https://cypress.io/studio',
      projectId: '123',
    })

    expect(rmStub).to.be.calledWith(studioPath)
    expect(ensureStub).to.be.calledWith(studioPath)
    expect(getStudioBundleStub).to.be.calledWith({
      studioUrl: 'https://cypress.io/studio',
      projectId: '123',
      bundlePath,
    })

    expect(extractStub).to.be.calledWith({
      file: bundlePath,
      cwd: studioPath,
    })
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
