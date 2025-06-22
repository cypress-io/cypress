import { sinon, proxyquire } from '../../../../spec_helper'
import { Readable, Writable } from 'stream'
import { HttpError } from '../../../../../lib/cloud/network/http_error'

describe('getCyPromptBundle', () => {
  let writeResult: string
  let readStream: Readable
  let createWriteStreamStub: sinon.SinonStub
  let crossFetchStub: sinon.SinonStub
  let getCyPromptBundle: typeof import('../../../../../lib/cloud/api/cy-prompt/get_cy_prompt_bundle').getCyPromptBundle

  beforeEach(() => {
    createWriteStreamStub = sinon.stub()
    crossFetchStub = sinon.stub()
    readStream = Readable.from('console.log("cy-prompt script")')

    writeResult = ''
    const writeStream = new Writable({
      write: (chunk, encoding, callback) => {
        writeResult += chunk.toString()
        callback()
      },
    })

    createWriteStreamStub.returns(writeStream)

    getCyPromptBundle = proxyquire('../lib/cloud/api/cy-prompt/get_cy_prompt_bundle', {
      'fs': {
        createWriteStream: createWriteStreamStub,
      },
      'cross-fetch': crossFetchStub,
      'os': {
        platform: () => 'linux',
      },
      '@packages/root': {
        version: '1.2.3',
      },
    }).getCyPromptBundle
  })

  it('downloads the cy-prompt bundle and extracts it', async () => {
    crossFetchStub.resolves({
      ok: true,
      statusText: 'OK',
      body: readStream,
      headers: {
        get: (header) => {
          if (header === 'x-cypress-signature') {
            return '159'
          }
        },
      },
    })

    const projectId = '12345'

    const responseSignature = await getCyPromptBundle({ cyPromptUrl: 'http://localhost:1234/cy-prompt/bundle/abc.tgz', projectId, bundlePath: '/tmp/cypress/cy-prompt/abc/bundle.tar' })

    expect(crossFetchStub).to.be.calledWith('http://localhost:1234/cy-prompt/bundle/abc.tgz', {
      agent: sinon.match.any,
      method: 'GET',
      headers: {
        'x-route-version': '1',
        'x-cypress-signature': '1',
        'x-cypress-project-slug': '12345',
        'x-cypress-cy-prompt-mount-version': '1',
        'x-os-name': 'linux',
        'x-cypress-version': '1.2.3',
      },
      encrypt: 'signed',
    })

    expect(writeResult).to.eq('console.log("cy-prompt script")')

    expect(responseSignature).to.eq('159')
  })

  it('downloads the cy-prompt bundle and extracts it after 1 fetch failure', async () => {
    crossFetchStub.onFirstCall().rejects(new HttpError('Failed to fetch', 'url', 502, 'Bad Gateway', 'Bad Gateway', sinon.stub()))
    crossFetchStub.onSecondCall().resolves({
      ok: true,
      statusText: 'OK',
      body: readStream,
      headers: {
        get: (header) => {
          if (header === 'x-cypress-signature') {
            return '159'
          }
        },
      },
    })

    const projectId = '12345'

    const responseSignature = await getCyPromptBundle({ cyPromptUrl: 'http://localhost:1234/cy-prompt/bundle/abc.tgz', projectId, bundlePath: '/tmp/cypress/cy-prompt/abc/bundle.tar' })

    expect(crossFetchStub).to.be.calledWith('http://localhost:1234/cy-prompt/bundle/abc.tgz', {
      agent: sinon.match.any,
      method: 'GET',
      headers: {
        'x-route-version': '1',
        'x-cypress-signature': '1',
        'x-cypress-project-slug': '12345',
        'x-cypress-cy-prompt-mount-version': '1',
        'x-os-name': 'linux',
        'x-cypress-version': '1.2.3',
      },
      encrypt: 'signed',
    })

    expect(writeResult).to.eq('console.log("cy-prompt script")')

    expect(responseSignature).to.eq('159')
  })

  it('throws an error and returns a cy-prompt manager in error state if the fetch fails more than twice', async () => {
    const error = new HttpError('Failed to fetch', 'url', 502, 'Bad Gateway', 'Bad Gateway', sinon.stub())

    crossFetchStub.rejects(error)

    const projectId = '12345'

    await expect(getCyPromptBundle({ cyPromptUrl: 'http://localhost:1234/cy-prompt/bundle/abc.tgz', projectId, bundlePath: '/tmp/cypress/cy-prompt/abc/bundle.tar' })).to.be.rejected

    expect(crossFetchStub).to.be.calledThrice
    expect(crossFetchStub).to.be.calledWith('http://localhost:1234/cy-prompt/bundle/abc.tgz', {
      agent: sinon.match.any,
      method: 'GET',
      headers: {
        'x-route-version': '1',
        'x-cypress-signature': '1',
        'x-cypress-project-slug': '12345',
        'x-cypress-cy-prompt-mount-version': '1',
        'x-os-name': 'linux',
        'x-cypress-version': '1.2.3',
      },
      encrypt: 'signed',
    })
  })

  it('throws an error and returns a cy-prompt manager in error state if the response status is not ok', async () => {
    crossFetchStub.resolves({
      ok: false,
      statusText: 'Some failure',
    })

    const projectId = '12345'

    await expect(getCyPromptBundle({ cyPromptUrl: 'http://localhost:1234/cy-prompt/bundle/abc.tgz', projectId, bundlePath: '/tmp/cypress/cy-prompt/abc/bundle.tar' })).to.be.rejected

    expect(crossFetchStub).to.be.calledWith('http://localhost:1234/cy-prompt/bundle/abc.tgz', {
      agent: sinon.match.any,
      method: 'GET',
      headers: {
        'x-route-version': '1',
        'x-cypress-signature': '1',
        'x-cypress-project-slug': '12345',
        'x-cypress-cy-prompt-mount-version': '1',
        'x-os-name': 'linux',
        'x-cypress-version': '1.2.3',
      },
      encrypt: 'signed',
    })
  })

  it('throws an error if there is no signature in the response headers', async () => {
    crossFetchStub.resolves({
      ok: true,
      statusText: 'OK',
      body: readStream,
      headers: {
        get: () => null,
      },
    })

    const projectId = '12345'

    await expect(getCyPromptBundle({ cyPromptUrl: 'http://localhost:1234/cy-prompt/bundle/abc.tgz', projectId, bundlePath: '/tmp/cypress/cy-prompt/abc/bundle.tar' })).to.be.rejected

    expect(crossFetchStub).to.be.calledWith('http://localhost:1234/cy-prompt/bundle/abc.tgz', {
      agent: sinon.match.any,
      method: 'GET',
      headers: {
        'x-route-version': '1',
        'x-cypress-signature': '1',
        'x-cypress-project-slug': '12345',
        'x-cypress-cy-prompt-mount-version': '1',
        'x-os-name': 'linux',
        'x-cypress-version': '1.2.3',
      },
      encrypt: 'signed',
    })
  })
})
