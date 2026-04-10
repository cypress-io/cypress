require('../spec_helper')

const filesController = require('../../lib/controllers/files')
const files = require('../../lib/files')
const errors = require('../../lib/errors')
const { privilegedCommandsManager } = require('../../lib/privileged-commands/privileged-commands-manager')
const { DocumentDomainInjection } = require('@packages/network-tools')

const createResponse = () => {
  const res = {
    destroy: sinon.stub(),
    headersSent: false,
    json: sinon.stub(),
    setHeader: sinon.stub(),
    status: sinon.stub(),
    type: sinon.stub(),
  }

  res.status.callsFake(() => res)
  res.type.callsFake(() => res)

  return res
}

const createStream = () => {
  const handlers = {}
  const stream = {
    on: sinon.stub().callsFake((event, handler) => {
      handlers[event] = handler

      return stream
    }),
    pipe: sinon.stub(),
  }

  return { handlers, stream }
}

describe('controllers/files', () => {
  it('should render the iframe when the primary remote state has not been established', async () => {
    const req = {
      params: { 0: 'app.cy.ts' },
      proxiedUrl: 'http://localhost:3500/__cypress/iframes/app.cy.ts',
      query: {
        browserFamily: 'firefox',
      },
    }
    const res = {
      render: sinon.stub(),
    }
    const config = {
      namespace: '__cypress',
      projectRoot: '/project/root',
      supportFile: false,
    }
    const remoteStates = {
      hasPrimary: sinon.stub().returns(false),
      getPrimary: sinon.stub().throws(new Error('getPrimary should not be called without a primary remote state')),
    }
    const spec = {
      absolute: '/project/root/cypress/e2e/app.cy.ts',
      relative: 'cypress/e2e/app.cy.ts',
      relativeUrl: '/__cypress/tests?p=cypress/e2e/app.cy.ts',
    }
    const injection = {
      getHostname: sinon.stub(),
      shouldInjectDocumentDomain: sinon.stub().returns(false),
    }

    sinon.stub(filesController, 'getSpecs').resolves([spec])
    sinon.stub(filesController, 'getSupportFile').returns(undefined)
    sinon.stub(DocumentDomainInjection, 'InjectionBehavior').returns(injection)
    sinon.stub(privilegedCommandsManager, 'getPrivilegedChannel').resolves('privileged-channel')

    await filesController.handleIframe(req, res, config, remoteStates, {})

    expect(remoteStates.hasPrimary).to.have.been.called
    expect(remoteStates.getPrimary).not.to.have.been.called
    expect(privilegedCommandsManager.getPrivilegedChannel).to.have.been.calledWith({
      browserFamily: 'firefox',
      isSpecBridge: false,
      namespace: '__cypress',
      scripts: [spec],
      url: 'http://localhost:3500/__cypress/iframes/app.cy.ts',
      documentDomainContext: false,
    })

    expect(res.render).to.have.been.calledWith(
      sinon.match(/lib\/html\/iframe\.html$/),
      {
        superDomain: '',
        title: 'app.cy.ts',
        scripts: JSON.stringify([spec]),
        privilegedChannel: 'privileged-channel',
      },
    )
  })

  it('should stream a privileged file read response', async () => {
    const res = createResponse()
    const { stream } = createStream()

    sinon.stub(privilegedCommandsManager, 'consumePrivilegedFileRead').returns({
      filePath: '/project/root/foo.txt',
      originalFilePath: 'foo.txt',
    })

    sinon.stub(files, 'createReadFileStreamFromPath').resolves({ stream })
    sinon.stub(errors, 'cloneErr').callsFake((error) => {
      return {
        message: error.message,
        name: error.name,
      }
    })

    await filesController.handlePrivilegedFileRead({ body: { token: 'token-123' } }, res)

    expect(privilegedCommandsManager.consumePrivilegedFileRead).to.have.been.calledWith('token-123')
    expect(files.createReadFileStreamFromPath).to.have.been.calledWith({
      filePath: '/project/root/foo.txt',
      originalFilePath: 'foo.txt',
    })

    expect(res.type).to.have.been.calledWith('application/octet-stream')
    expect(res.setHeader).to.have.been.calledWith('Cache-Control', 'no-store')
    expect(res.setHeader).to.have.been.calledWith(
      'x-cypress-file-path',
      encodeURIComponent('/project/root/foo.txt'),
    )

    expect(stream.on).to.have.been.calledWith('error', sinon.match.func)
    expect(stream.pipe).to.have.been.calledWith(res)
    expect(res.status).not.to.have.been.called
    expect(res.json).not.to.have.been.called
  })

  it('should return a 500 response when the privileged file read token is missing', async () => {
    const res = createResponse()

    sinon.stub(privilegedCommandsManager, 'consumePrivilegedFileRead')
    sinon.stub(files, 'createReadFileStreamFromPath')
    sinon.stub(errors, 'cloneErr').callsFake((error) => {
      return {
        message: error.message,
        name: error.name,
      }
    })

    await filesController.handlePrivilegedFileRead({ body: {} }, res)

    expect(privilegedCommandsManager.consumePrivilegedFileRead).not.to.have.been.called
    expect(files.createReadFileStreamFromPath).not.to.have.been.called
    expect(res.status).to.have.been.calledWith(500)
    expect(res.json).to.have.been.calledWith({
      error: {
        message: 'You requested a privileged file read without a valid token',
        name: 'Error',
      },
    })
  })

  it('should return a 500 response when the privileged file stream errors before headers are sent', async () => {
    const res = createResponse()
    const { handlers, stream } = createStream()
    const streamError = Object.assign(new Error('stream failed'), { code: 'EISDIR' })

    sinon.stub(privilegedCommandsManager, 'consumePrivilegedFileRead').returns({
      filePath: '/project/root/foo.txt',
      originalFilePath: 'foo.txt',
    })

    sinon.stub(files, 'createReadFileStreamFromPath').resolves({ stream })
    sinon.stub(errors, 'cloneErr').callsFake((error) => {
      return {
        code: error.code,
        message: error.message,
        name: error.name,
      }
    })

    await filesController.handlePrivilegedFileRead({ body: { token: 'token-123' } }, res)
    handlers.error(streamError)

    expect(res.status).to.have.been.calledWith(500)
    expect(res.json).to.have.been.calledWith({
      error: {
        code: 'EISDIR',
        message: 'stream failed',
        name: 'Error',
      },
    })

    expect(res.destroy).not.to.have.been.called
  })

  it('should destroy the response when the privileged file stream errors after headers are sent', async () => {
    const res = createResponse()
    const { handlers, stream } = createStream()
    const streamError = new Error('stream failed')

    sinon.stub(privilegedCommandsManager, 'consumePrivilegedFileRead').returns({
      filePath: '/project/root/foo.txt',
      originalFilePath: 'foo.txt',
    })

    sinon.stub(files, 'createReadFileStreamFromPath').resolves({ stream })
    sinon.stub(errors, 'cloneErr')

    await filesController.handlePrivilegedFileRead({ body: { token: 'token-123' } }, res)
    res.headersSent = true
    handlers.error(streamError)

    expect(res.destroy).to.have.been.calledWith(streamError)
    expect(res.status).not.to.have.been.called
    expect(res.json).not.to.have.been.called
    expect(errors.cloneErr).not.to.have.been.called
  })
})
