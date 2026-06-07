import '../../spec_helper'
import fs from 'fs'
import path from 'path'
import { DEFAULT_FLAGS, formatChromeFlags, formatElectronFlags } from '../../../lib/util/chromium_flags'

// the switch name is everything before the first `=` (drops any `=value`)
const switchName = (flag: string) => flag.split('=')[0]

const allowlistPath = path.join(__dirname, '../../../lib/util/chrome-switches.json')
const pipelineConfigPath = path.join(__dirname, '../../../../../.circleci/src/pipeline/@pipeline.yml')

const readAllowlist = () => JSON.parse(fs.readFileSync(allowlistPath, 'utf8'))

// derive the set of Chromium release-branch refs the pinned Chrome versions map
// to. Chrome `MAJOR.MINOR.BUILD.PATCH` -> `refs/branch-heads/BUILD`. Mirrors
// resolveTestedChromes() in scripts/generate-chrome-switches.mjs.
const pinnedChromeRefs = () => {
  const config = fs.readFileSync(pipelineConfigPath, 'utf8')
  const keys = ['chrome-stable-version', 'chrome-for-testing-stable-version', 'chrome-beta-version']

  const refs = keys.map((key) => {
    const match = config.match(new RegExp(`${key}:\\s*&\\S+\\s*["']\\d+\\.\\d+\\.(\\d+)\\.\\d+["']`))

    if (!match) {
      throw new Error(`could not find ${key} in ${pipelineConfigPath}`)
    }

    return `refs/branch-heads/${match[1]}`
  })

  return [...new Set(refs)].sort()
}

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
      const allowed = new Set<string>(readAllowlist().switches)
      const unknown = DEFAULT_FLAGS.map(switchName).filter((name) => !allowed.has(name))

      expect(
        unknown,
        `unknown Chrome switch(es): ${unknown.join(', ')}. If these are valid, regenerate the allowlist with \`yarn workspace @packages/server generate-chrome-switches --write\`; otherwise they are typos or removed flags and should be fixed/dropped.`,
      ).to.be.empty
    })

    // The allowlist is only meaningful if it was generated from the Chrome
    // versions Cypress actually tests against. If those versions are bumped
    // (e.g. in .circleci) without regenerating the allowlist, this catches the
    // drift — offline, so it never depends on network access to Chromium.
    it('was generated from the currently-pinned Chrome versions', function () {
      const recorded = readAllowlist().versions as Array<{ ref: string }>

      // NOTE: the committed allowlist ships as a seed (empty `versions`) until
      // its first real regeneration; nothing to compare against until then.
      if (!recorded || recorded.length === 0) {
        return this.skip()
      }

      const recordedRefs = [...new Set(recorded.map((v) => v.ref))].sort()

      expect(
        recordedRefs,
        'the committed chrome-switches.json was generated from different Chrome versions than are pinned in .circleci. Regenerate it with `yarn workspace @packages/server generate-chrome-switches --write`.',
      ).to.deep.eq(pinnedChromeRefs())
    })
  })

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
