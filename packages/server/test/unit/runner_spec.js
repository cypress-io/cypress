require('../spec_helper')

const { serveRunner } = require(`${root}/lib/controllers/runner`)

describe('controllers/runner', () => {
  describe('serveRunner', () => {
    it('sets Origin-Agent-Cluster response header to false', () => {
      const mockRes = {
        setHeader: sinon.stub(),
        render: sinon.stub(),
      }

      serveRunner('runner', {}, mockRes)

      expect(mockRes.setHeader).to.have.been.calledWith('Origin-Agent-Cluster', '?0')
      expect(mockRes.render).to.have.been.called
    })
  })
})
