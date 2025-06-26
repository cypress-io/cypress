import path from 'path'
import os from 'os'
import { proxyquire, sinon } from '../../../spec_helper'

describe('ensureCyPromptBundle', () => {
  let ensureCyPromptBundle: typeof import('../../../../lib/cloud/cy-prompt/ensure_cy_prompt_bundle').ensureCyPromptBundle
  let tmpdir: string = '/tmp'
  let rmStub: sinon.SinonStub = sinon.stub()
  let ensureStub: sinon.SinonStub = sinon.stub()
  let extractStub: sinon.SinonStub = sinon.stub()
  let getCyPromptBundleStub: sinon.SinonStub = sinon.stub()
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
    extractStub = sinon.stub()
    getCyPromptBundleStub = sinon.stub()
    readFileStub = sinon.stub()
    verifySignatureStub = sinon.stub()
    pathExistsStub = sinon.stub()

    ensureCyPromptBundle = (proxyquire('../lib/cloud/cy-prompt/ensure_cy_prompt_bundle', {
      os: {
        tmpdir: () => tmpdir,
        platform: () => 'linux',
      },
      'fs-extra': {
        remove: rmStub.resolves(),
        ensureDir: ensureStub.resolves(),
        readFile: readFileStub.resolves(JSON.stringify(mockManifest)),
        pathExists: pathExistsStub.resolves(true),
      },
      tar: {
        extract: extractStub.resolves(),
      },
      '../api/cy-prompt/get_cy_prompt_bundle': {
        getCyPromptBundle: getCyPromptBundleStub.resolves(mockResponseSignature),
      },
      '../encryption': {
        verifySignature: verifySignatureStub.resolves(true),
      },
    })).ensureCyPromptBundle
  })

  it('should ensure the cy prompt bundle', async () => {
    const cyPromptPath = path.join(os.tmpdir(), 'cypress', 'cy-prompt', '123')
    const bundlePath = path.join(cyPromptPath, 'bundle.tar')

    const manifest = await ensureCyPromptBundle({
      cyPromptPath,
      cyPromptUrl: 'https://cypress.io/cy-prompt',
      projectId: '123',
    })

    expect(rmStub).to.be.calledWith(cyPromptPath)
    expect(ensureStub).to.be.calledWith(cyPromptPath)
    expect(readFileStub).to.be.calledWith(path.join(cyPromptPath, 'manifest.json'), 'utf8')
    expect(getCyPromptBundleStub).to.be.calledWith({
      cyPromptUrl: 'https://cypress.io/cy-prompt',
      projectId: '123',
      bundlePath,
    })

    expect(extractStub).to.be.calledWith({
      file: bundlePath,
      cwd: cyPromptPath,
    })

    expect(verifySignatureStub).to.be.calledWith(JSON.stringify(mockManifest), mockResponseSignature)

    expect(manifest).to.deep.eq(mockManifest)
  })

  it('should throw an error if the cy prompt bundle signature is invalid', async () => {
    verifySignatureStub.resolves(false)

    const ensureCyPromptBundlePromise = ensureCyPromptBundle({
      cyPromptPath: '/tmp/cypress/cy-prompt/123',
      cyPromptUrl: 'https://cypress.io/cy-prompt',
      projectId: '123',
    })

    await expect(ensureCyPromptBundlePromise).to.be.rejectedWith('Unable to verify cy-prompt signature')
  })

  it('should throw an error if the cy prompt bundle manifest is not found', async () => {
    pathExistsStub.resolves(false)

    const ensureCyPromptBundlePromise = ensureCyPromptBundle({
      cyPromptPath: '/tmp/cypress/cy-prompt/123',
      cyPromptUrl: 'https://cypress.io/cy-prompt',
      projectId: '123',
    })

    await expect(ensureCyPromptBundlePromise).to.be.rejectedWith('Unable to find cy-prompt manifest')
  })

  it('should throw an error if the cy prompt bundle download times out', async () => {
    getCyPromptBundleStub.callsFake(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(new Error('Cy prompt bundle download timed out'))
        }, 3000)
      })
    })

    const ensureCyPromptBundlePromise = ensureCyPromptBundle({
      cyPromptPath: '/tmp/cypress/cy-prompt/123',
      cyPromptUrl: 'https://cypress.io/cy-prompt',
      projectId: '123',
      downloadTimeoutMs: 500,
    })

    await expect(ensureCyPromptBundlePromise).to.be.rejectedWith('Cy prompt bundle download timed out')
  })
})
