import * as path from 'path'
import { expect } from 'chai'
import '../../spec_helper'

import { fs } from '../../../lib/util/fs'
import { insertValueInJSString, insertValuesInConfigFile } from '../../../lib/util/config-file-updater'
import { stripIndent } from '../../../lib/util/strip_indent'
const projectRoot = process.cwd()
const defaultOptions = {
  configFile: 'cypress.json',
}

describe('lib/util/config-file-updater', () => {
  context('with default configFile option', () => {
    beforeEach(function () {
      this.setup = (obj = {}) => {
        return fs.writeJson('cypress.json', obj)
      }
    })

    afterEach(() => {
      return fs.removeAsync('cypress.json')
    })

    context('.insertValuesInConfigFile', () => {
      it('promises cypress.json updates', function () {
        return this.setup().then(() => {
          return insertValuesInConfigFile(projectRoot, { foo: 'bar' }, defaultOptions)
        }).then((obj) => {
          expect(obj).to.deep.eq({ foo: 'bar' })
        })
      })

      it('only writes over conflicting keys', function () {
        return this.setup({ projectId: '12345', autoOpen: true })
        .then(() => {
          return insertValuesInConfigFile(projectRoot, { projectId: 'abc123' }, defaultOptions)
        }).then((obj) => {
          expect(obj).to.deep.eq({ projectId: 'abc123', autoOpen: true })
        })
      })
    })
  })

  context('with configFile: false', () => {
    beforeEach(function () {
      this.projectRoot = path.join(projectRoot, '_test-output/path/to/project/')

      this.options = {
        configFile: false,
      }
    })

    it('.insertValuesInConfigFile does not create a file', function () {
      return insertValuesInConfigFile(this.projectRoot, {}, this.options)
      .then(() => {
        return fs.access(path.join(this.projectRoot, 'cypress.json'))
        .then(() => {
          throw Error('file shuold not have been created here')
        }).catch((err) => {
          expect(err.code).to.equal('ENOENT')
        })
      })
    })
  })

  context('with js files', () => {
    describe('#insertValueInJSString', () => {
      describe('es6 vs es5', () => {
        it('finds the object litteral and adds the values to it es6', async () => {
          const src = stripIndent`\
              export default {
                foo: 42,
              }
            `

          const expectedOutput = stripIndent`\
            export default {
              projectId: "id1234",
              viewportWidth: 400,
              foo: 42,
            }
          `

          const output = await insertValueInJSString(src, { projectId: 'id1234', viewportWidth: 400 }, {})

          expect(output).to.equal(expectedOutput)
        })

        it('finds the object litteral and adds the values to it es5', async () => {
          const src = stripIndent`\
              module.exports = {
                foo: 42,
              }
            `

          const expectedOutput = stripIndent`\
            module.exports = {
              projectId: "id1234",
              viewportWidth: 400,
              foo: 42,
            }
          `

          const output = await insertValueInJSString(src, { projectId: 'id1234', viewportWidth: 400 }, {})

          expect(output).to.equal(expectedOutput)
        })

        it('works with and without the quotes around keys', async () => {
          const src = stripIndent`\
              export default {
                "foo": 42,
              }
            `

          const expectedOutput = stripIndent`\
              export default {
                projectId: "id1234",
                viewportWidth: 400,
                "foo": 42,
              }
            `

          const output = await insertValueInJSString(src, { projectId: 'id1234', viewportWidth: 400 }, {})

          expect(output).to.equal(expectedOutput)
        })
      })

      describe('defineConfig', () => {
        it('skips defineConfig and add to the object inside', async () => {
          const src = stripIndent`\
              import { defineConfig } from "cypress"
              export default defineConfig({
                foo: 42,
              })
            `

          const expectedOutput = stripIndent`\
              import { defineConfig } from "cypress"
              export default defineConfig({
                projectId: "id1234",
                viewportWidth: 400,
                foo: 42,
              })
            `

          const output = await insertValueInJSString(src, { projectId: 'id1234', viewportWidth: 400 }, {})

          expect(output).to.equal(expectedOutput)
        })

        it('skips defineConfig even if it renamed in an import (es6)', async () => {
          const src = stripIndent`\
              import { defineConfig as cy_defineConfig } from "cypress"
              export default cy_defineConfig({
                foo: 42,
              })
            `

          const expectedOutput = stripIndent`\
              import { defineConfig as cy_defineConfig } from "cypress"
              export default cy_defineConfig({
                projectId: "id1234",
                viewportWidth: 400,
                foo: 42,
              })
            `

          const output = await insertValueInJSString(src, { projectId: 'id1234', viewportWidth: 400 }, {})

          expect(output).to.equal(expectedOutput)
        })

        it('skips defineConfig even if it renamed in a require (es5)', async () => {
          const src = stripIndent`\
              const { defineConfig: cy_defineConfig } = require("cypress")
              module.exports = cy_defineConfig({
                foo: 42,
              })
            `

          const expectedOutput = stripIndent`\
              const { defineConfig: cy_defineConfig } = require("cypress")
              module.exports = cy_defineConfig({
                projectId: "id1234",
                viewportWidth: 400,
                foo: 42,
              })
            `

          const output = await insertValueInJSString(src, { projectId: 'id1234', viewportWidth: 400 }, {})

          expect(output).to.equal(expectedOutput)
        })
      })

      describe('updates', () => {
        it('updates a value if the same value is found in resolved config', async () => {
          const src = stripIndent`\
              export default {
                foo: 42,
              }
            `
          const expectedOutput = stripIndent`\
              export default {
                foo: 1000,
              }
            `

          const output = await insertValueInJSString(src, { foo: 1000 }, { foo: 42 })

          expect(output).to.equal(expectedOutput)
        })

        it('updates values and inserts config', async () => {
          const src = stripIndent`\
            export default {
              foo: 42,
              bar: 84,
              component: {
                devServer() {
                  return null
                }
              }
            }
          `

          const expectedOutput = stripIndent`\
            export default {
              projectId: "id1234",
              foo: 1000,
              bar: 3000,
              component: {
                devServer() {
                  return null
                }
              }
            }
          `

          const output = await insertValueInJSString(src, { foo: 1000, bar: 3000, projectId: 'id1234' }, { foo: 42, bar: 84 })

          expect(output).to.equal(expectedOutput)
        })
      })

      describe('subkeys', () => {
        it('inserts nested values', async () => {
          const src = stripIndent`\
          module.exports = {
            foo: 42
          }
        `

          const output = await insertValueInJSString(src, { component: { specFilePattern: 'src/**/*.spec.cy.js' } }, { foo: 42 })

          const expectedOutput = stripIndent`\
              module.exports = {
                component: {
                  specFilePattern: "src/**/*.spec.cy.js",
                },
                foo: 42
              }
            `

          expect(output).to.equal(expectedOutput)
        })

        it('inserts nested values into existing keys', async () => {
          const src = stripIndent`\
              module.exports = {
                component: {
                  viewportWidth: 800
                },
                foo: 42
              }
            `

          const output = await insertValueInJSString(src, { component: { specFilePattern: 'src/**/*.spec.cy.js' } }, { foo: 42, component: { viewportWidth: 800 } })

          const expectedOutput = stripIndent`\
            module.exports = {
              component: {
                specFilePattern: "src/**/*.spec.cy.js",
                viewportWidth: 800
              },
              foo: 42
            }
          `

          expect(output).to.equal(expectedOutput)
        })

        it('updates nested values', async () => {
          const src = stripIndent`\
            module.exports = {
              foo: 42,
              component: {
                specFilePattern: 'components/**/*.spec.cy.js',
                foo: 82
              }
            }`

          const output = await insertValueInJSString(src, { component: { specFilePattern: 'src/**/*.spec.cy.js' } }, { foo: 42, component: { foo: 82, specFilePattern: 'components/**/*.spec.cy.js' } })

          const expectedOutput = stripIndent`\
          module.exports = {
            foo: 42,
            component: {
              specFilePattern: "src/**/*.spec.cy.js",
              foo: 82
            }
          }`

          expect(output).to.equal(expectedOutput)
        })
      })

      describe('failures', () => {
        it('fails if not an object litteral', () => {
          const src = [
            'const foo = {}',
            'export default foo',
          ].join('\n')

          return insertValueInJSString(src, { bar: 10 }, {})
          .then(() => {
            throw Error('this should not succeed')
          })
          .catch((err) => {
            expect(err).to.have.property('type', 'COULD_NOT_UPDATE_CONFIG_FILE')
          })
        })

        it('fails if one of the values to update is not a literal', () => {
          const src = [
            'const bar = 12',
            'export default {',
            '  foo: bar',
            '}',
          ].join('\n')

          return insertValueInJSString(src, { foo: 10 }, { foo: 12 })
          .then(() => {
            throw Error('this should not succeed')
          })
          .catch((err) => {
            expect(err).to.have.property('type', 'COULD_NOT_UPDATE_CONFIG_FILE')
          })
        })

        it('fails with inlined values', () => {
          const src = stripIndent`\
            const foo = 12
            export default {
              foo
            }
            `

          return insertValueInJSString(src, { foo: 10 }, { foo: 12 })
          .then(() => {
            throw Error('this should not succeed')
          })
          .catch((err) => {
            expect(err).to.have.property('type', 'COULD_NOT_UPDATE_CONFIG_FILE')
          })
        })

        it('fails if there is a spread', () => {
          const src = stripIndent`\
            const foo = { bar: 12 }
            export default {
              bar: 8,
              ...foo
            }
            `

          return insertValueInJSString(src, { bar: 10 }, { bar: 12 })
          .then(() => {
            throw Error('this should not succeed')
          })
          .catch((err) => {
            expect(err).to.have.property('type', 'COULD_NOT_UPDATE_CONFIG_FILE')
          })
        })
      })
    })
  })
})
