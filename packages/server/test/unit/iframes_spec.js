require('../spec_helper')

const { iframesController } = require('../../lib/controllers/iframes')
const files = require('../../lib/controllers/files').default

describe('controllers/iframes', () => {
  describe('e2e', () => {
    it('sets Origin-Agent-Cluster response header to false', () => {
      sinon.stub(files, 'handleIframe')

      const mockReq = {}
      const mockRes = {
        setHeader: sinon.stub(),
      }

      const controllerOptions = {
        getSpec: sinon.stub(),
        remoteStates: sinon.stub(),
        config: {},
      }

      iframesController.e2e(controllerOptions, mockReq, mockRes)

      expect(mockRes.setHeader).to.have.been.calledWith('Origin-Agent-Cluster', '?0')
      expect(files.handleIframe).to.have.been.calledWith(
        mockReq, mockRes, controllerOptions.config, controllerOptions.remoteStates, sinon.match({
          specFilter: undefined, specType: 'integration',
        }),
      )
    })
  })

  describe('component', () => {
    let nodeProxy
    let proxyCallback

    beforeEach(() => {
      proxyCallback = null
      nodeProxy = {
        web: sinon.stub().callsFake((req, res, _options, cb) => {
          proxyCallback = cb
        }),
      }
    })

    it('throws when in run mode (isTextTerminal) and dev server connection is refused (ECONNREFUSED)', () => {
      const config = { isTextTerminal: true, devServerPublicPathRoute: '/__cypress/' }
      const req = { query: {}, params: { 0: 'foo.js' }, url: '', headers: {} }
      const res = {}

      iframesController.component({ config, nodeProxy }, req, res)

      expect(nodeProxy.web).to.have.been.calledOnce
      const err = new Error('connect ECONNREFUSED 127.0.0.1:8080')

      err.code = 'ECONNREFUSED'

      expect(() => proxyCallback(err)).to.throw(err)
    })

    it('throws when in run mode (isTextTerminal) and dev server connection is reset (ECONNRESET)', () => {
      const config = { isTextTerminal: true, devServerPublicPathRoute: '/__cypress/' }
      const req = { query: {}, params: { 0: 'foo.js' }, url: '', headers: {} }
      const res = {}

      iframesController.component({ config, nodeProxy }, req, res)

      expect(nodeProxy.web).to.have.been.calledOnce
      const err = new Error('connect ECONNRESET 127.0.0.1:8080')

      err.code = 'ECONNRESET'

      expect(() => proxyCallback(err)).to.throw(err)
    })

    it('does not throw when in open mode and dev server connection is refused (ECONNREFUSED)', () => {
      const config = { isTextTerminal: false, devServerPublicPathRoute: '/__cypress/' }
      const req = { query: {}, params: { 0: 'foo.js' }, url: '', headers: {} }
      const res = {}

      iframesController.component({ config, nodeProxy }, req, res)

      expect(nodeProxy.web).to.have.been.calledOnce
      const err = new Error('connect ECONNREFUSED 127.0.0.1:8080')

      err.code = 'ECONNREFUSED'

      expect(() => proxyCallback(err)).not.to.throw()
    })
  })
})
