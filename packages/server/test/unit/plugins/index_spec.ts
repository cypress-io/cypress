import '../../spec_helper'
import { getCtx } from '../../../lib/makeDataContext'
import * as plugins from '../../../lib/plugins'

describe('lib/plugins', () => {
  context('#execute', () => {
    it('passes the event args to the lifecycle manager as an array', () => {
      const lifecycleManager = getCtx().lifecycleManager

      sinon.stub(lifecycleManager, 'executeNodeEvent').returns('the result')

      expect(plugins.execute('before:spec', 'arg1', 'arg2')).to.equal('the result')
      expect(lifecycleManager.executeNodeEvent).to.be.calledWith('before:spec', ['arg1', 'arg2'])
    })
  })
})
