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

  beforeEach(() => {
    rmStub = sinon.stub()
    ensureStub = sinon.stub()
    extractStub = sinon.stub()
    getCyPromptBundleStub = sinon.stub()

    ensureCyPromptBundle = (proxyquire('../lib/cloud/cy-prompt/ensure_cy_prompt_bundle', {
      os: {
        tmpdir: () => tmpdir,
        platform: () => 'linux',
      },
      'fs-extra': {
        remove: rmStub.resolves(),
        ensureDir: ensureStub.resolves(),
      },
      tar: {
        extract: extractStub.resolves(),
      },
      '../api/cy-prompt/get_cy_prompt_bundle': {
        getCyPromptBundle: getCyPromptBundleStub.resolves(),
      },
    })).ensureCyPromptBundle
  })

  it('should ensure the cy prompt bundle', async () => {
    const cyPromptPath = path.join(os.tmpdir(), 'cypress', 'cy-prompt', '123')
    const bundlePath = path.join(cyPromptPath, 'bundle.tar')

    await ensureCyPromptBundle({
      cyPromptPath,
      cyPromptUrl: 'https://cypress.io/cy-prompt',
      projectId: '123',
    })

    expect(rmStub).to.be.calledWith(cyPromptPath)
    expect(ensureStub).to.be.calledWith(cyPromptPath)
    expect(getCyPromptBundleStub).to.be.calledWith({
      cyPromptUrl: 'https://cypress.io/cy-prompt',
      projectId: '123',
      bundlePath,
    })

    expect(extractStub).to.be.calledWith({
      file: bundlePath,
      cwd: cyPromptPath,
    })
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
