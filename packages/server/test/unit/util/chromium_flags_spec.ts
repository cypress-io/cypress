import '../../spec_helper'
import fs from 'fs'
import path from 'path'
import { DEFAULT_FLAGS, formatChromeFlags, formatElectronFlags } from '../../../lib/util/chromium_flags'

// the switch name is everything before the first `=` (drops any `=value`)
const switchName = (flag: string) => flag.split('=')[0]

describe('lib/util/chromium_flags', () => {
  describe('DEFAULT_FLAGS', () => {
    it('has no duplicate switches', () => {
      const names = DEFAULT_FLAGS.map(switchName)
      const dupes = names.filter((name, i) => names.indexOf(name) !== i)

      expect(dupes, `duplicate switches: ${dupes.join(', ')}`).to.be.empty
    })

    // Chromium silently ignores unrecognized switches, so a typo'd or removed
    // flag becomes a no-op with no error. This guards against that by checking
    // every flag against chrome-switches.json — an allowlist of switches
    // defined by Chromium source (regenerate via scripts/generate-chrome-switches.mjs).
    it('only contains switches in the Chromium allowlist', () => {
      const allowlistPath = path.join(__dirname, '../../../lib/util/chrome-switches.json')
      const { switches } = JSON.parse(fs.readFileSync(allowlistPath, 'utf8'))
      const allowed = new Set<string>(switches)
      const unknown = DEFAULT_FLAGS.map(switchName).filter((name) => !allowed.has(name))

      expect(
        unknown,
        `unknown Chrome switch(es): ${unknown.join(', ')}. If these are valid, regenerate the allowlist with \`yarn workspace @packages/server generate-chrome-switches --write\`; otherwise they are typos or removed flags and should be fixed/dropped.`,
      ).to.be.empty
    })
  })

  describe('#formatChromeFlags', () => {
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
})
