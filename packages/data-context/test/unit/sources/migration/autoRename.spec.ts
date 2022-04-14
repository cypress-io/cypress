import {
  getSpecs,
  applyMigrationTransform,
  MigrationSpec,
} from '../../../../src/sources/migration/autoRename'
import { expect } from 'chai'
import path from 'path'
import fs from 'fs-extra'
import { MigrationFile } from '../../../../src/sources'
import { scaffoldMigrationProject } from '../../helper'

describe('getSpecs', () => {
  it('handles custom folders', async () => {
    // CASE 1: E2E + CT, custom folders, default test files
    // We want to rename specs, but keep current folders.
    const cwd = await scaffoldMigrationProject('migration-e2e-component-default-test-files')
    const json = fs.readJsonSync(path.join(cwd, 'cypress.json'))

    const actual = await getSpecs(cwd, json)

    expect(actual.integration).to.eql([
      {
        relative: 'cypress/custom-integration/foo.spec.ts',
        usesDefaultFolder: false,
        usesDefaultTestFiles: true,
        testingType: 'e2e',
      },
    ])

    expect(actual.component).to.eql([
      {
        relative: 'cypress/custom-component/button.spec.js',
        usesDefaultFolder: false,
        usesDefaultTestFiles: true,
        testingType: 'component',
      },
    ])
  })

  it('handles default folder and custom testFiles', async () => {
    // CASE 1: E2E + CT, custom folders, default test files
    // We want to rename specs, but keep current folders.
    const cwd = await scaffoldMigrationProject('migration')
    const json = fs.readJsonSync(path.join(cwd, 'cypress.json'))

    const actual = await getSpecs(cwd, json)

    expect(actual.integration).to.eql([
      {
        'relative': 'cypress/integration/app_spec.js',
        'testingType': 'e2e',
        'usesDefaultFolder': true,
        'usesDefaultTestFiles': false,
      },
      {
        relative: 'cypress/integration/bar.spec.js',
        usesDefaultFolder: true,
        usesDefaultTestFiles: false,
        testingType: 'e2e',
      },
      {
        'relative': 'cypress/integration/blog-post-spec.ts',
        'testingType': 'e2e',
        'usesDefaultFolder': true,
        'usesDefaultTestFiles': false,
      },
      {
        'relative': 'cypress/integration/company.js',
        'testingType': 'e2e',
        'usesDefaultFolder': true,
        'usesDefaultTestFiles': false,
      },
      {
        'relative': 'cypress/integration/homeSpec.js',
        'testingType': 'e2e',
        'usesDefaultFolder': true,
        'usesDefaultTestFiles': false,
      },
      {
        'relative': 'cypress/integration/sign-up.js',
        'testingType': 'e2e',
        'usesDefaultFolder': true,
        'usesDefaultTestFiles': false,
      },
      {
        'relative': 'cypress/integration/spectacleBrowser.ts',
        'testingType': 'e2e',
        'usesDefaultFolder': true,
        'usesDefaultTestFiles': false,
      },
      {
        'relative': 'cypress/integration/someDir/someFile.js',
        'testingType': 'e2e',
        'usesDefaultFolder': true,
        'usesDefaultTestFiles': false,
      },
    ])

    // expect(actual.component).to.eql([
    //   {
    //     relative: 'src/Radio.spec.js',
    //     usesDefaultFolder: false,
    //     usesDefaultTestFiles: false,
    //     testingType: 'component',
    //   },
    // ])
  })

  it('handles default folders', async () => {
    // CASE 1: E2E + CT, custom folders, default test files
    // We want to rename specs, but keep current folders.
    const cwd = await scaffoldMigrationProject('migration-e2e-component-default-everything')
    const json = fs.readJsonSync(path.join(cwd, 'cypress.json'))

    const actual = await getSpecs(cwd, json)

    expect(actual.integration).to.eql([
      {
        relative: 'cypress/integration/foo.spec.ts',
        usesDefaultFolder: true,
        usesDefaultTestFiles: true,
        testingType: 'e2e',
      },
      {
        relative: 'cypress/integration/spec.ts',
        usesDefaultFolder: true,
        usesDefaultTestFiles: true,
        testingType: 'e2e',
      },
    ])

    expect(actual.component).to.eql([
      {
        relative: 'cypress/component/button.spec.js',
        usesDefaultFolder: true,
        usesDefaultTestFiles: true,
        testingType: 'component',
      },
    ])
  })
})

describe('applyMigrationTransform', () => {
  describe('e2e spec', () => {
    it('handles default folders and extensions', async () => {
      const input: MigrationSpec = {
        relative: 'cypress/integration/button.spec.js',
        usesDefaultFolder: true,
        usesDefaultTestFiles: true,
        testingType: 'e2e',
      }

      const expected: MigrationFile = {
        testingType: 'e2e',
        before: {
          relative: 'cypress/integration/button.spec.js',
          parts: [
            {
              'highlight': false,
              'text': 'cypress/',
            },
            {
              group: 'folder',
              'highlight': true,
              'text': 'integration',
            },
            {
              'highlight': false,
              'text': '/button',
              'group': 'fileName',
            },
            {
              'highlight': true,
              group: 'preExtension',
              'text': '.spec.',
            },
            {
              'highlight': false,
              'text': 'js',
            },
          ],
        },
        after: {
          relative: 'cypress/e2e/button.cy.js',
          parts: [
            {
              'highlight': false,
              'text': 'cypress/',
            },
            {
              'highlight': true,
              group: 'folder',
              'text': 'e2e',
            },
            {
              'highlight': false,
              'text': '/button',
              'group': 'fileName',
            },
            {
              'highlight': true,
              group: 'preExtension',
              'text': '.cy.',
            },
            {
              'highlight': false,
              'text': 'js',
            },
          ],
        },
      }

      const result = applyMigrationTransform(input)

      expect(result.before).to.eql(expected.before)
      expect(result.after).to.eql(expected.after)
    })

    it('handles custom folder, default extension', async () => {
      const input: MigrationSpec = {
        relative: 'custom-folder/button.spec.js',
        usesDefaultFolder: false,
        usesDefaultTestFiles: true,
        testingType: 'e2e',
      }

      const expected: MigrationFile = {
        testingType: 'e2e',
        before: {
          relative: 'custom-folder/button.spec.js',
          parts: [
            {
              'highlight': false,
              'text': 'custom-folder/button',
              'group': 'fileName',
            },
            {
              'highlight': true,
              group: 'preExtension',
              'text': '.spec.',
            },
            {
              'highlight': false,
              'text': 'js',
            },
          ],
        },
        after: {
          relative: 'custom-folder/button.cy.js',
          parts: [
            {
              'highlight': false,
              'text': 'custom-folder/button',
              'group': 'fileName',
            },
            {
              'highlight': true,
              group: 'preExtension',
              'text': '.cy.',
            },
            {
              'highlight': false,
              'text': 'js',
            },
          ],
        },
      }

      const result = applyMigrationTransform(input)

      expect(result.before).to.eql(expected.before)
      expect(result.after).to.eql(expected.after)
    })

    it('handles default folder, custom extension', async () => {
      const input: MigrationSpec = {
        relative: 'cypress/integration/foo.bar',
        usesDefaultFolder: true,
        usesDefaultTestFiles: false,
        testingType: 'e2e',
      }

      const expected: MigrationFile = {
        testingType: 'e2e',
        before: {
          relative: 'cypress/integration/foo.bar',
          parts: [
            {
              'highlight': false,
              'text': 'cypress/',
            },
            {
              'highlight': true,
              group: 'folder',
              'text': 'integration',
            },
            {
              'highlight': false,
              'text': '/foo.bar',
              'group': 'fileName',
            },
          ],
        },
        after: {
          relative: 'cypress/e2e/foo.bar',
          parts: [
            {
              'highlight': false,
              'text': 'cypress/',
            },
            {
              'highlight': true,
              group: 'folder',
              'text': 'e2e',
            },
            {
              'highlight': false,
              'text': '/foo.bar',
              'group': 'fileName',
            },
          ],
        },
      }

      const result = applyMigrationTransform(input)

      expect(result.before).to.eql(expected.before)
      expect(result.after).to.eql(expected.after)
    })

    it('handles a spec named spec', () => {
      const input: MigrationSpec = {
        relative: 'cypress/integration/spec.js',
        usesDefaultFolder: true,
        usesDefaultTestFiles: true,
        testingType: 'e2e',
      }

      const expected: MigrationFile = {
        testingType: 'e2e',
        before: {
          relative: 'cypress/integration/spec.js',
          parts: [
            {
              'highlight': false,
              'text': 'cypress/',
            },
            {
              'highlight': true,
              group: 'folder',
              'text': 'integration',
            },
            {
              'highlight': false,
              'text': '/spec',
              'group': 'fileName',
            },
            {
              'highlight': true,
              group: 'preExtension',
              'text': '.',
            },
            {
              'highlight': false,
              'text': 'js',
            },
          ],
        },
        after: {
          relative: 'cypress/e2e/spec.cy.js',
          parts: [
            {
              'highlight': false,
              'text': 'cypress/',
            },
            {
              'highlight': true,
              group: 'folder',
              'text': 'e2e',
            },
            {
              'highlight': false,
              'text': '/spec',
              'group': 'fileName',
            },
            {
              'highlight': true,
              group: 'preExtension',
              'text': '.cy.',
            },
            {
              'highlight': false,
              'text': 'js',
            },
          ],
        },
      }

      const result = applyMigrationTransform(input)

      expect(result.before).to.eql(expected.before)
      expect(result.after).to.eql(expected.after)
    })

    it('handles .test files', () => {
      const result = applyMigrationTransform(
        {
          relative: 'cypress/tests/api-bankaccounts.test.js',
          usesDefaultFolder: false,
          usesDefaultTestFiles: true,
          testingType: 'e2e',
        },
      )

      const expected: MigrationFile = {
        testingType: 'e2e',
        before: {
          relative: 'cypress/tests/api-bankaccounts.test.js',
          parts: [
            {
              'highlight': false,
              'text': 'cypress/tests/api-bankaccounts',
              'group': 'fileName',
            },
            {
              'highlight': true,
              group: 'preExtension',
              'text': '.test.',
            },
            {
              'highlight': false,
              'text': 'js',
            },
          ],
        },
        after: {
          relative: 'cypress/tests/api-bankaccounts.cy.js',
          parts: [
            {
              'highlight': false,
              'text': 'cypress/tests/api-bankaccounts',
              'group': 'fileName',
            },
            {
              'highlight': true,
              group: 'preExtension',
              'text': '.cy.',
            },
            {
              'highlight': false,
              'text': 'js',
            },
          ],
        },
      }

      expect(result.before).to.eql(expected.before)
      expect(result.after).to.eql(expected.after)
    })
  })

  describe('component spec', () => {
    it('handles default folders and extensions', async () => {
      const input: MigrationSpec = {
        relative: 'cypress/component/button.spec.tsx',
        usesDefaultFolder: true,
        usesDefaultTestFiles: true,
        testingType: 'component',
      }

      const expected: MigrationFile = {
        testingType: 'component',
        before: {
          relative: 'cypress/component/button.spec.tsx',
          parts: [
            {
              'highlight': false,
              'text': 'cypress/component/button',
              'group': 'fileName',
            },
            {
              'highlight': true,
              group: 'preExtension',
              'text': '.spec.',
            },
            {
              'highlight': false,
              'text': 'tsx',
            },
          ],
        },
        after: {
          relative: 'cypress/component/button.cy.tsx',
          parts: [
            {
              'highlight': false,
              'text': 'cypress/component/button',
              'group': 'fileName',
            },
            {
              'highlight': true,
              group: 'preExtension',
              'text': '.cy.',
            },
            {
              'highlight': false,
              'text': 'tsx',
            },
          ],
        },
      }

      const result = applyMigrationTransform(input)

      expect(result.before).to.eql(expected.before)
      expect(result.after).to.eql(expected.after)
    })
  })

  describe('component with custom folder, default testFiles', () => {
    it('handles custom folders and default extensions', async () => {
      const input: MigrationSpec = {
        relative: 'cypress/custom-component/button.spec.js',
        usesDefaultFolder: false,
        usesDefaultTestFiles: true,
        testingType: 'component',
      }

      const expected: MigrationFile = {
        'testingType': 'component',
        'before': {
          'relative': 'cypress/custom-component/button.spec.js',
          'parts': [
            {
              'text': 'cypress/custom-component/button',
              'highlight': false,
              'group': 'fileName',
            },
            {
              'text': '.spec.',
              'highlight': true,
              'group': 'preExtension',
            },
            {
              'text': 'js',
              'highlight': false,
            },
          ],
        },
        'after': {
          'relative': 'cypress/custom-component/button.cy.js',
          'parts': [
            {
              'text': 'cypress/custom-component/button',
              'highlight': false,
              'group': 'fileName',
            },
            {
              'text': '.cy.',
              'highlight': true,
              'group': 'preExtension',
            },
            {
              'text': 'js',
              'highlight': false,
            },
          ],
        },
      }

      const actual = applyMigrationTransform(input)

      expect(actual.before).to.eql(expected.before)
      expect(actual.after).to.eql(expected.after)
    })
  })
})
