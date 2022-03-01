require('../spec_helper')

const { iframesController } = require(`${root}/lib/controllers/iframes`)
const files = require(`${root}/lib/controllers/files`)

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
        getRemoteState: sinon.stub(),
        config: {},
      }

      iframesController.e2e(controllerOptions, mockReq, mockRes)

      expect(mockRes.setHeader).to.have.been.calledWith('Origin-Agent-Cluster', '?0')
      expect(files.handleIframe).to.have.been.calledWith(
        mockReq, mockRes, controllerOptions.config, controllerOptions.getRemoteState, sinon.match({
          specFilter: undefined, specType: 'integration',
        }),
      )
    })
  })
})
