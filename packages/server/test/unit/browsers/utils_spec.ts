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

    // A CI shell can export CYPRESS_INTERNAL_DISABLE_PROXY=1 ambiently (the
    // cdp-remediated jobs do). spec_helper only restores the env snapshot
    // *after* each test, so that ambient value would otherwise leak into
    // the "proxy enabled" test below and make it fail — clear it up front
    // instead of relying on a previous test's cleanup to have run first.
    beforeEach(() => {
      delete process.env.CYPRESS_INTERNAL_DISABLE_PROXY
    })

    it('includes the window navigation-preload expression in the new-document bootstrap script when the proxy is disabled', async () => {
      process.env.CYPRESS_INTERNAL_DISABLE_PROXY = '1'
      const criClient = createCriClient()

      await utils.initializeCDP(criClient as any, {} as any)

      const call = criClient.send.getCalls().find((c) => c.args[0] === 'Page.addScriptToEvaluateOnNewDocument')

      expect(call).to.exist
      expect(call!.args[1].source).to.include(DISABLE_NAVIGATION_PRELOAD_WINDOW_EXPRESSION)
      // The assembled source concatenates several independently-authored
      // blocks; confirm the result still parses as a script.
      expect(() => new Function(call!.args[1].source)).not.to.throw()
    })

    it('excludes the window navigation-preload expression from the new-document bootstrap script when the proxy is enabled', async () => {
      const criClient = createCriClient()

      await utils.initializeCDP(criClient as any, {} as any)

      const call = criClient.send.getCalls().find((c) => c.args[0] === 'Page.addScriptToEvaluateOnNewDocument')

      expect(call).to.exist
      expect(call!.args[1].source).not.to.include(DISABLE_NAVIGATION_PRELOAD_WINDOW_EXPRESSION)
      expect(() => new Function(call!.args[1].source)).not.to.throw()
    })
  })
})
