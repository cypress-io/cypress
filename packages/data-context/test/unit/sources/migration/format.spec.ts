import { expect } from 'chai'
import {
  formatMigrationFile,
} from '../../../../src/sources/migration/format'
import { regexps, supportFileRegexps } from '../../../../src/sources/migration/regexps'

describe('formatMigrationFile', () => {
  describe('e2e - defaultFolderDefaultTestFiles', () => {
    it('breaks pre-migration spec into parts', () => {
      const spec = 'cypress/integration/app.spec.js'
      const re = new RegExp(regexps.e2e.before.defaultFolderDefaultTestFiles)
      const actual = formatMigrationFile(spec, re, { shouldMigratePreExtension: true })

      expect(actual).to.eql([
        { text: 'cypress/', highlight: false },
        { text: 'integration', highlight: true, group: 'folder' },
        { text: '/app', highlight: false, group: 'fileName' },
        { text: '.spec.', highlight: true, group: 'preExtension' },
        { text: 'js', highlight: false },
      ])
    })

    it('do not highlight the preExtension when migratePreExtension is false', () => {
      const spec = 'cypress/integration/app.spec.js'
      const re = new RegExp(regexps.e2e.before.defaultFolderDefaultTestFiles)
      const actual = formatMigrationFile(spec, re, { shouldMigratePreExtension: false })

      expect(actual).to.eql([
        { text: 'cypress/', highlight: false },
        { text: 'integration', highlight: true, group: 'folder' },
        { text: '/app', highlight: false, group: 'fileName' },
        { text: '.spec.', highlight: false, group: 'preExtension' },
        { text: 'js', highlight: false },
      ])
    })
  })

  ;['js', 'ts'].forEach((ext) => {
    it(`handles e2e support pre file migration [${ext}]`, () => {
      const file = `cypress/support/index.${ext}`
      const re = new RegExp(supportFileRegexps.e2e.beforeRegexp)
      const actual = formatMigrationFile(file, re, { shouldMigratePreExtension: true })

      expect(actual).to.eql([
        { text: 'cypress/support/', highlight: false },
        { text: 'index', highlight: true, group: 'supportFileName' },
        { text: `.${ext}`, highlight: false },
      ])
    })

    it(`handles e2e support post file migration [${ext}]`, () => {
      const file = `cypress/support/e2e.${ext}`
      const re = new RegExp(supportFileRegexps.e2e.afterRegexp)
      const actual = formatMigrationFile(file, re, { shouldMigratePreExtension: true })

      expect(actual).to.eql([
        { text: 'cypress/support/', highlight: false },
        { text: 'e2e', highlight: true, group: 'supportFileName' },
        { text: `.${ext}`, highlight: false },
      ])
    })
  })
})
