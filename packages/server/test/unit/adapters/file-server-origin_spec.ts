const { expect, sinon } = require('../../spec_helper')

import { createFileServerOriginMiddleware } from '../../../lib/adapters/file-server-origin'

const fileRemoteState = {
  origin: 'http://localhost:2020',
  strategy: 'file' as const,
  fileServer: 'http://localhost:2021',
  domainName: 'localhost',
  props: null,
}

const httpRemoteState = {
  origin: 'https://example.test',
  strategy: 'http' as const,
  fileServer: null,
  domainName: 'example.test',
  props: {},
}

describe('lib/adapters/file-server-origin', () => {
  function createMiddleware (options: {
    response?: any
    remoteState?: typeof fileRemoteState | typeof httpRemoteState
    token?: string
  } = {}) {
    const serverRequest = {
      create: sinon.stub().resolves(options.response ?? {
        statusCode: 200,
        headers: { 'content-type': 'text/csv' },
        body: Buffer.from('"Joe","Smith"'),
      }),
    }
    const remoteStates = {
      current: sinon.stub().returns(options.remoteState ?? fileRemoteState),
    }

    return {
      middleware: createFileServerOriginMiddleware({
        remoteStates: remoteStates as any,
        getFileServerToken: () => options.token ?? 'file-token',
        request: serverRequest as any,
      }),
      serverRequest,
      remoteStates,
    }
  }

  it('delegates non-file-strategy requests to the next middleware', async () => {
    const { middleware, serverRequest } = createMiddleware({ remoteState: httpRemoteState })
    const next = sinon.stub().resolves({ id: 'req-1', url: 'https://example.test/app' })

    const response = await middleware({
      id: 'req-1',
      url: 'https://example.test/app',
    }, next)

    expect(response).to.deep.equal({ id: 'req-1', url: 'https://example.test/app' })
    expect(next).to.have.been.calledOnce
    expect(serverRequest.create).not.to.have.been.called
  })

  it('delegates file-strategy requests that do not match the current origin', async () => {
    const { middleware, serverRequest } = createMiddleware()
    const next = sinon.stub().resolves({ id: 'req-1', url: 'http://other.localhost:2020/file.csv' })

    const response = await middleware({
      id: 'req-1',
      url: 'http://other.localhost:2020/file.csv',
    }, next)

    expect(response.url).to.equal('http://other.localhost:2020/file.csv')
    expect(next).to.have.been.calledOnce
    expect(serverRequest.create).not.to.have.been.called
  })

  it('fetches matching file-strategy URLs from the file server with auth', async () => {
    const { middleware, serverRequest } = createMiddleware({
      response: {
        statusCode: 200,
        headers: {
          'content-type': 'text/csv',
          'x-cypress-file-path': '/cypress/fixtures/records.csv',
        },
        body: Buffer.from('"Joe","Smith"'),
      },
    })
    const next = sinon.stub()

    const response = await middleware({
      id: 'req-1',
      url: 'http://localhost:2020/cypress/fixtures/records.csv',
      method: 'GET',
      headers: {
        host: 'localhost:2020',
        accept: 'text/csv',
        connection: 'keep-alive',
      },
    }, next)

    expect(next).not.to.have.been.called
    expect(serverRequest.create).to.have.been.calledOnce
    expect(serverRequest.create).to.have.been.calledWithMatch({
      url: 'http://localhost:2021/cypress/fixtures/records.csv',
      method: 'GET',
      headers: {
        accept: 'text/csv',
        'x-cypress-authorization': 'file-token',
      },
      encoding: null,
      followRedirect: false,
      gzip: false,
      resolveWithFullResponse: true,
      simple: false,
    }, true)

    expect(response).to.deep.equal({
      id: 'req-1',
      url: 'http://localhost:2020/cypress/fixtures/records.csv',
      statusCode: 200,
      headers: {
        'content-type': 'text/csv',
        'x-cypress-file-path': '/cypress/fixtures/records.csv',
      },
      body: Buffer.from('"Joe","Smith"'),
    })
  })

  it('passes through non-200 file-server responses and error headers', async () => {
    const { middleware, serverRequest } = createMiddleware({
      response: {
        statusCode: 404,
        headers: {
          'content-type': 'text/html',
          'x-cypress-file-server-error': 'true',
        },
        body: Buffer.from('Not Found'),
      },
    })
    const next = sinon.stub()

    const response = await middleware({
      id: 'req-1',
      url: 'http://localhost:2020/missing.csv',
      method: 'GET',
    }, next)

    expect(next).not.to.have.been.called
    expect(serverRequest.create).to.have.been.calledOnce
    expect(response).to.deep.equal({
      id: 'req-1',
      url: 'http://localhost:2020/missing.csv',
      statusCode: 404,
      headers: {
        'content-type': 'text/html',
        'x-cypress-file-server-error': 'true',
      },
      body: Buffer.from('Not Found'),
    })
  })

  it('forwards request bodies for non-GET methods', async () => {
    const { middleware, serverRequest } = createMiddleware()
    const next = sinon.stub()

    await middleware({
      id: 'req-1',
      url: 'http://localhost:2020/upload',
      method: 'POST',
      body: 'payload',
    }, next)

    expect(serverRequest.create).to.have.been.calledWithMatch({
      url: 'http://localhost:2021/upload',
      method: 'POST',
      body: 'payload',
    }, true)
  })
})
