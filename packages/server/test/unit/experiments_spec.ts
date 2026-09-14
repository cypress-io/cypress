import '../spec_helper'
import fs from 'fs-extra'
import path from 'path'
import { expect } from 'chai'
import { getExperimentalOptionNames } from '@packages/config'
import { getExperiments, formatExperiments, _names, _summaries } from '../../lib/experiments'

const enUsPath = path.join(__dirname, '../../../frontend-shared/src/locales/en-US.json')

/**
 * Experiments deliberately absent from `experiments.ts`, with the reason. Adding one here is a
 * user-visible change to the `cypress run` header, so it needs its own change and its own
 * snapshot regeneration rather than riding along with unrelated work.
 */
const OMITTED_FROM_RUN_HEADER: Record<string, string> = {
  experimentalCspAllowList: 'would add an Experiments: row to system-tests/__snapshots__/experimental_csp_allow_list_spec.ts.js, and formatExperiments renders its array value ambiguously',
}

// The Settings screen looks an experiment's copy up by key, so a missing entry is invisible
// until a user turns that experiment on.
describe('experiment copy', () => {
  const settingsCopy = fs.readJsonSync(enUsPath).settingsPage.experiments
  const experimentalOptions = getExperimentalOptionNames()
  const reportedInRunHeader = experimentalOptions.filter((name) => !OMITTED_FROM_RUN_HEADER[name])

  it('covers every experimental config option', () => {
    expect(experimentalOptions).not.to.be.empty

    const missingFromSettings = experimentalOptions.filter((name) => !settingsCopy[name])
    const missingFromRunHeader = reportedInRunHeader.filter((name) => !_names[name] || !_summaries[name])

    expect(missingFromSettings, 'add copy to packages/frontend-shared/src/locales/en-US.json').to.deep.eq([])
    expect(missingFromRunHeader, 'add copy to packages/server/lib/experiments.ts').to.deep.eq([])
  })

  it('does not carry copy for options that no longer exist', () => {
    const known = (names: string[]) => names.filter((name) => !experimentalOptions.includes(name))

    expect(known(Object.keys(_names)), 'remove from _names').to.deep.eq([])
    expect(known(Object.keys(_summaries)), 'remove from _summaries').to.deep.eq([])
    expect(known(Object.keys(OMITTED_FROM_RUN_HEADER)), 'remove from OMITTED_FROM_RUN_HEADER').to.deep.eq([])
  })

  it('says the same thing in the Settings screen and the run header', () => {
    // The Settings screen renders markdown; experiments.ts is plain text. Links are the only
    // permitted difference, so compare against the link labels.
    const toPlainText = (markdown: string) => markdown.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')

    reportedInRunHeader.forEach((name) => {
      expect(_names[name], `${name} display name`).to.eq(settingsCopy[name].name)
      expect(_summaries[name], `${name} summary`).to.eq(toPlainText(settingsCopy[name].description))
    })
  })
})

describe('experiments', () => {
  describe('#formatExperiments', () => {
    it('forms single string with all values', () => {
      const exp = {
        featureA: { value: true },
        featureB: { value: false },
        featureC: { value: true },
      }
      const result = formatExperiments(exp)

      expect(result).to.equal('featureA=true,featureB=false,featureC=true')
    })
  })

  describe('#getExperiments', () => {
    it('returns enabled experiments', () => {
      const names = {
        experimentalFoo: 'experiment foo',
        experimentalBar: 'experiment bar',
        experimentalBaz: 'experiment baz',
      }
      const summaries = {
        experimentalFoo: 'feature foo summary',
        experimentalBar: 'feature bar summary',
        // let the system use the default summary for other features
      }

      const project = {
        resolvedConfig: {
          // nope, experiment is not enabled
          experimentalFoo: {
            value: true,
            from: 'default',
          },
          // enabled
          experimentalBar: {
            value: true,
            from: 'config',
          },
          // enabled
          experimentalBaz: {
            value: 5,
            from: 'plugins',
          },
        },
      }
      const result = getExperiments(project, names, summaries)
      const expected = {
        experimentalFoo: {
          value: true,
          enabled: false,
          key: 'experimentalFoo',
          name: 'experiment foo',
          summary: 'feature foo summary',
        },
        experimentalBar: {
          value: true,
          enabled: true,
          key: 'experimentalBar',
          name: 'experiment bar',
          summary: 'feature bar summary',
        },
        experimentalBaz: {
          value: 5,
          enabled: true,
          key: 'experimentalBaz',
          name: 'experiment baz',
          summary: 'top secret',
        },
      }

      expect(result).to.deep.equal(expected)
    })

    // Cypress accepts unknown keys in a user's config, so the prefix alone cannot identify one.
    it('ignores experimental-looking keys that are not Cypress experiments', () => {
      const project = {
        resolvedConfig: {
          experimentalSomethingTheUserInvented: {
            value: true,
            from: 'config',
          },
        },
      }

      expect(getExperiments(project)).to.deep.equal({})
    })
  })
})
