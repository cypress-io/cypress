import { sinon, proxyquire } from '../../../../spec_helper'
import { Readable, Writable } from 'stream'
import { HttpError } from '../../../../../lib/cloud/network/http_error'

describe('getStudioBundle', () => {
  let writeResult: string
  let readStream: Readable
  let createWriteStreamStub: sinon.SinonStub
  let crossFetchStub: sinon.SinonStub
  let verifySignatureFromFileStub: sinon.SinonStub
  let getStudioBundle: typeof import('../../../../../lib/cloud/api/studio/get_studio_bundle').getStudioBundle

  beforeEach(() => {
    createWriteStreamStub = sinon.stub()
    crossFetchStub = sinon.stub()
    verifySignatureFromFileStub = sinon.stub()
    readStream = Readable.from('console.log("studio bundle")')

    writeResult = ''
    const writeStream = new Writable({
      write: (chunk, encoding, callback) => {
        writeResult += chunk.toString()
        callback()
      },
    })

    createWriteStreamStub.returns(writeStream)

    getStudioBundle = proxyquire('../lib/cloud/api/studio/get_studio_bundle', {
      'fs': {
        createWriteStream: createWriteStreamStub,
      },
      'cross-fetch': crossFetchStub,
      '../../encryption': {
        verifySignatureFromFile: verifySignatureFromFileStub,
      },
      'os': {
        platform: () => 'linux',
      },
      '@packages/root': {
        version: '1.2.3',
      },
    }).getStudioBundle
  })

  it('downloads the studio bundle and extracts it', async () => {
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

    verifySignatureFromFileStub.resolves(true)

    const projectId = '12345'

    await getStudioBundle({ studioUrl: 'http://localhost:1234/studio/bundle/abc.tgz', projectId, bundlePath: '/tmp/cypress/studio/abc/bundle.tar' })

    expect(crossFetchStub).to.be.calledWith('http://localhost:1234/studio/bundle/abc.tgz', {
      agent: sinon.match.any,
      method: 'GET',
      headers: {
        'x-route-version': '1',
        'x-cypress-signature': '1',
        'x-os-name': 'linux',
        'x-cypress-version': '1.2.3',
      },
      encrypt: 'signed',
    })

    expect(writeResult).to.eq('console.log("studio bundle")')

    expect(verifySignatureFromFileStub).to.be.calledWith('/tmp/cypress/studio/abc/bundle.tar', '159')
  })

  it('downloads the studio bundle and extracts it after 1 fetch failure', async () => {
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

    verifySignatureFromFileStub.resolves(true)

    const projectId = '12345'

    await getStudioBundle({ studioUrl: 'http://localhost:1234/studio/bundle/abc.tgz', projectId, bundlePath: '/tmp/cypress/studio/abc/bundle.tar' })

    expect(crossFetchStub).to.be.calledWith('http://localhost:1234/studio/bundle/abc.tgz', {
      agent: sinon.match.any,
      method: 'GET',
      headers: {
        'x-route-version': '1',
        'x-cypress-signature': '1',
        'x-os-name': 'linux',
        'x-cypress-version': '1.2.3',
      },
      encrypt: 'signed',
    })

    expect(writeResult).to.eq('console.log("studio bundle")')

    expect(verifySignatureFromFileStub).to.be.calledWith('/tmp/cypress/studio/abc/bundle.tar', '159')
  })

  it('throws an error and returns a studio manager in error state if the fetch fails more than twice', async () => {
    const error = new HttpError('Failed to fetch', 'url', 502, 'Bad Gateway', 'Bad Gateway', sinon.stub())

    crossFetchStub.rejects(error)

    const projectId = '12345'

    await expect(getStudioBundle({ studioUrl: 'http://localhost:1234/studio/bundle/abc.tgz', projectId, bundlePath: '/tmp/cypress/studio/abc/bundle.tar' })).to.be.rejected

    expect(crossFetchStub).to.be.calledThrice
    expect(crossFetchStub).to.be.calledWith('http://localhost:1234/studio/bundle/abc.tgz', {
      agent: sinon.match.any,
      method: 'GET',
      headers: {
        'x-route-version': '1',
        'x-cypress-signature': '1',
        'x-os-name': 'linux',
        'x-cypress-version': '1.2.3',
      },
      encrypt: 'signed',
    })
  })

  it('throws an error and returns a studio manager in error state if the response status is not ok', async () => {
    crossFetchStub.resolves({
      ok: false,
      statusText: 'Some failure',
    })

    const projectId = '12345'

    await expect(getStudioBundle({ studioUrl: 'http://localhost:1234/studio/bundle/abc.tgz', projectId, bundlePath: '/tmp/cypress/studio/abc/bundle.tar' })).to.be.rejected

    expect(crossFetchStub).to.be.calledWith('http://localhost:1234/studio/bundle/abc.tgz', {
      agent: sinon.match.any,
      method: 'GET',
      headers: {
        'x-route-version': '1',
        'x-cypress-signature': '1',
        'x-os-name': 'linux',
        'x-cypress-version': '1.2.3',
      },
      encrypt: 'signed',
    })
  })

  it('throws an error and returns a studio manager in error state if the signature verification fails', async () => {
    verifySignatureFromFileStub.resolves(false)

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

    verifySignatureFromFileStub.resolves(false)

    const projectId = '12345'

    await expect(getStudioBundle({ studioUrl: 'http://localhost:1234/studio/bundle/abc.tgz', projectId, bundlePath: '/tmp/cypress/studio/abc/bundle.tar' })).to.be.rejected

    expect(writeResult).to.eq('console.log("studio bundle")')

    expect(crossFetchStub).to.be.calledWith('http://localhost:1234/studio/bundle/abc.tgz', {
      agent: sinon.match.any,
      method: 'GET',
      headers: {
        'x-route-version': '1',
        'x-cypress-signature': '1',
        'x-os-name': 'linux',
        'x-cypress-version': '1.2.3',
      },
      encrypt: 'signed',
    })

    expect(verifySignatureFromFileStub).to.be.calledWith('/tmp/cypress/studio/abc/bundle.tar', '159')
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

    await expect(getStudioBundle({ studioUrl: 'http://localhost:1234/studio/bundle/abc.tgz', projectId, bundlePath: '/tmp/cypress/studio/abc/bundle.tar' })).to.be.rejected

    expect(crossFetchStub).to.be.calledWith('http://localhost:1234/studio/bundle/abc.tgz', {
      agent: sinon.match.any,
      method: 'GET',
      headers: {
        'x-route-version': '1',
        'x-cypress-signature': '1',
        'x-os-name': 'linux',
        'x-cypress-version': '1.2.3',
      },
      encrypt: 'signed',
    })
  })
})
