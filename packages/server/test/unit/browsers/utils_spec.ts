import utils from '../../../lib/browsers/utils'
import { DISABLE_NAVIGATION_PRELOAD_WINDOW_EXPRESSION } from '@packages/proxy/lib/http/util/disable-navigation-preload'
const { expect, sinon } = require('../../spec_helper')

describe('lib/browsers/utils', () => {
  describe('#initializeCDP', () => {
    function createCriClient () {
      return {
        send: sinon.stub().resolves(),
        on: sinon.stub(),
      }
    }

    it('includes the window navigation-preload expression in the new-document bootstrap script when useBrowserNetworkInterception is true', async () => {
      const criClient = createCriClient()

      await utils.initializeCDP(criClient as any, {} as any, true)

      const call = criClient.send.getCalls().find((c) => c.args[0] === 'Page.addScriptToEvaluateOnNewDocument')

      expect(call).to.exist
      expect(call!.args[1].source).to.include(DISABLE_NAVIGATION_PRELOAD_WINDOW_EXPRESSION)
      // The assembled source concatenates several independently-authored
      // blocks; confirm the result still parses as a script.
      expect(() => new Function(call!.args[1].source)).not.to.throw()
    })

    it('excludes the window navigation-preload expression from the new-document bootstrap script when useBrowserNetworkInterception is false', async () => {
      const criClient = createCriClient()

      await utils.initializeCDP(criClient as any, {} as any, false)

      const call = criClient.send.getCalls().find((c) => c.args[0] === 'Page.addScriptToEvaluateOnNewDocument')

      expect(call).to.exist
      expect(call!.args[1].source).not.to.include(DISABLE_NAVIGATION_PRELOAD_WINDOW_EXPRESSION)
      expect(() => new Function(call!.args[1].source)).not.to.throw()
    })
  })
})
