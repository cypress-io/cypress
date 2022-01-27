import { expect } from 'chai'
import {
  formatMigrationFile,
  regexps,
  supportFileRegexps,
} from '../../../src/util/migrationFormat'

describe('formatMigrationFile', () => {
  it('breaks pre-migration spec into parts', () => {
    const spec = 'cypress/integration/app.spec.js'
    const re = new RegExp(regexps.e2e.usingDefaultIntegrationFolder.beforeRegexp)
    const actual = formatMigrationFile(spec, re)

    expect(actual).to.eql([
      { text: 'cypress/', highlight: false },
      { text: 'integration', highlight: true },
      { text: '/app', highlight: false },
      { text: '.spec.', highlight: true },
      { text: 'js', highlight: false },
    ])
  })

  it('breaks post-migration spec into parts', () => {
    const spec = 'cypress/e2e/app.cy.js'
    const re = new RegExp(regexps.e2e.usingDefaultIntegrationFolder.afterRegexp)
    const actual = formatMigrationFile(spec, re)

    expect(actual).to.eql([
      { text: 'cypress/', highlight: false },
      { text: 'e2e', highlight: true },
      { text: '/app', highlight: false },
      { text: '.cy.', highlight: true },
      { text: 'js', highlight: false },
    ])
  })

  ;['js', 'ts'].forEach((ext) => {
    it(`handles e2e support pre file migration [${ext}]`, () => {
      const file = `cypress/support/index.${ext}`
      const re = new RegExp(supportFileRegexps.e2e.beforeRegexp)
      const actual = formatMigrationFile(file, re)

      expect(actual).to.eql([
        { text: 'cypress/support/', highlight: false },
        { text: 'index', highlight: true },
        { text: `.${ext}`, highlight: false },
      ])
    })

    it(`handles e2e support post file migration [${ext}]`, () => {
      const file = `cypress/support/e2e.${ext}`
      const re = new RegExp(supportFileRegexps.e2e.afterRegexp)
      const actual = formatMigrationFile(file, re)

      expect(actual).to.eql([
        { text: 'cypress/support/', highlight: false },
        { text: 'e2e', highlight: true },
        { text: `.${ext}`, highlight: false },
      ])
    })
  })
})
