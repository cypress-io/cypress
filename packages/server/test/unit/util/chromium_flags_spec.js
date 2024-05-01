require('../../spec_helper')

const { formatChromeFlags, formatElectronFlags } = require(`../../../lib/util/chromium_flags`)

describe('lib/util/chromium_flags', () => {
  context('#formatChromeFlags', () => {
    it('formats flags with --', () => {
      const flags = ['one', 'two', 'three']
      const chromeFlags = formatChromeFlags(flags)

      expect(chromeFlags).to.deep.eq(['--one', '--two', '--three'])
    })
  })

  context('#formatElectronFlags', () => {
    it('formats flags as objects with name', () => {
      const flags = ['one', 'two', 'three']
      const electronFlags = formatElectronFlags(flags)

      expect(electronFlags).to.deep.eq([{ name: 'one' }, { name: 'two' }, { name: 'three' }])
    })

    it('formats flags as objects with name/value pairs', () => {
      const flags = ['one=1', 'two=2', 'three']
      const electronFlags = formatElectronFlags(flags)

      expect(electronFlags).to.deep.eq([{ name: 'one', value: '1' }, { name: 'two', value: '2' }, { name: 'three' }])
    })
  })
})
