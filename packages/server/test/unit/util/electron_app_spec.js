require('../../spec_helper')
const { parseElectronLaunchArguments } = require('../../../lib/util/electron_app')

describe('electron app', () => {
  context('#parseElectronLaunchArguments', () => {
    it('parses string into an object', () => {
      const text = 'foo bar=baz disable-renderer-backgrounding=true'
      const parsed = parseElectronLaunchArguments(text)

      expect(parsed).to.deep.equal({
        foo: undefined,
        bar: 'baz',
        'disable-renderer-backgrounding': true,
      })
    })
  })
})
