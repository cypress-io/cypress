import { setRemoteDebuggingPort } from '../../../lib/util/electron-app'
import { app } from 'electron'

describe('/lib/util/electron-app', () => {
  context('remote debugging port', () => {
    beforeEach(() => {
      sinon.restore()
    })

    it('should not override port if previously set', async () => {
      sinon.stub(app.commandLine, 'appendSwitch')
      sinon.stub(app.commandLine, 'getSwitchValue').callsFake((args) => {
        return '4567'
      })

      await setRemoteDebuggingPort()

      expect(app.commandLine.appendSwitch).to.not.have.been.called
    })

    it('should assign random port if not previously set', async () => {
      sinon.stub(app.commandLine, 'appendSwitch')

      sinon.stub(app.commandLine, 'getSwitchValue').callsFake((args) => {
        return undefined
      })

      await setRemoteDebuggingPort()

      expect(app.commandLine.appendSwitch).to.have.been.calledWith('remote-debugging-port', sinon.match.string)
    })
  })
})
