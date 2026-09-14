import '../../spec_helper'
import { formatChromeFlags, formatElectronFlags, DEFAULT_CHROME_FLAGS, DEFAULT_ELECTRON_FLAGS } from '../../../lib/util/chromium_flags'

describe('lib/util/chromium_flags', () => {
  describe('#formatChromeFlags', () => {
    it('formats flags with --', () => {
      const flags = ['one', 'two', 'three']
      const chromeFlags = formatChromeFlags(flags)

      expect(chromeFlags).to.deep.eq(['--one', '--two', '--three'])
    })
  })

  describe('#formatElectronFlags', () => {
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

  describe('DEFAULT_CHROME_FLAGS', () => {
    it('disables HttpsUpgrades', () => {
      const disableFeatures = DEFAULT_CHROME_FLAGS.find((flag) => flag.startsWith('--disable-features='))

      expect(disableFeatures).to.include('HttpsUpgrades')
    })
  })

  describe('DEFAULT_ELECTRON_FLAGS', () => {
    it('disables HttpsUpgrades', () => {
      const disableFeatures = DEFAULT_ELECTRON_FLAGS.find((flag) => flag.name === '--disable-features')

      expect(disableFeatures?.value).to.include('HttpsUpgrades')
    })
  })
})
