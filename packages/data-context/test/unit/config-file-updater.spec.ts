import { expect } from 'chai'
import { stripIndent } from 'common-tags'
import { insertValueInJSString } from '../../src/util/config-file-updater'

const errors = {
  get (type: string) {
    const err = new Error(type) as any

    err.type = type

    return err
  },
}

describe('lib/util/config-file-updater', () => {
  context('with js files', () => {
    describe('#insertValueInJSString', () => {
      describe('es6 vs es5', () => {
        it('finds the object literal and adds the values to it es6', async () => {
          const src = stripIndent`\
              export default {
                foo: 42,
              }
            `

          const expectedOutput = stripIndent`\
            export default {
              projectId: 'id1234',
              viewportWidth: 400,
              foo: 42,
            }
          `

          const output = await insertValueInJSString(src, { projectId: 'id1234', viewportWidth: 400 }, errors)

          expect(output).to.equal(expectedOutput)
        })

        it('finds the object literal and adds the values to it es5', async () => {
          const src = stripIndent`\
              module.exports = {
                foo: 42,
              }
            `

          const expectedOutput = stripIndent`\
            module.exports = {
              projectId: 'id1234',
              viewportWidth: 400,
              foo: 42,
            }
          `

          const output = await insertValueInJSString(src, { projectId: 'id1234', viewportWidth: 400 }, errors)

          expect(output).to.equal(expectedOutput)
        })

        it('finds the object literal by string literal and updates the values (es5)', async () => {
          const src = stripIndent`\
              module.exports = { 'projectId': '2'}
            `

          const expectedOutput = stripIndent`\
            module.exports = { 'projectId': 'id1234'}
          `

          const output = await insertValueInJSString(src, { projectId: 'id1234' }, errors)

          expect(output).to.equal(expectedOutput)
        })

        it('works with and without the quotes around keys', async () => {
          const src = stripIndent`\
              export default {
                'foo': 42,
              }
            `

          const expectedOutput = stripIndent`\
              export default {
                projectId: 'id1234',
                viewportWidth: 400,
                'foo': 42,
              }
            `

          const output = await insertValueInJSString(src, { projectId: 'id1234', viewportWidth: 400 }, errors)

          expect(output).to.equal(expectedOutput)
        })
      })

      describe('defineConfig', () => {
        it('skips defineConfig and add to the object inside', async () => {
          const src = stripIndent`\
              import { defineConfig } from 'cypress'
              export default defineConfig({
                foo: 42,
              })
            `

          const expectedOutput = stripIndent`\
              import { defineConfig } from 'cypress'
              export default defineConfig({
                projectId: 'id1234',
                viewportWidth: 400,
                foo: 42,
              })
            `

          const output = await insertValueInJSString(src, { projectId: 'id1234', viewportWidth: 400 }, errors)

          expect(output).to.equal(expectedOutput)
        })

        it('skips defineConfig even if it renamed in an import (es6)', async () => {
          const src = stripIndent`\
              import { defineConfig as cy_defineConfig } from 'cypress'
              export default cy_defineConfig({
                foo: 42,
              })
            `

          const expectedOutput = stripIndent`\
              import { defineConfig as cy_defineConfig } from 'cypress'
              export default cy_defineConfig({
                projectId: 'id1234',
                viewportWidth: 400,
                foo: 42,
              })
            `

          const output = await insertValueInJSString(src, { projectId: 'id1234', viewportWidth: 400 }, errors)

          expect(output).to.equal(expectedOutput)
        })

        it('skips defineConfig even if it renamed in a require (es5)', async () => {
          const src = stripIndent`\
              const { defineConfig: cy_defineConfig } = require('cypress')
              module.exports = cy_defineConfig({
                foo: 42,
              })
            `

          const expectedOutput = stripIndent`\
              const { defineConfig: cy_defineConfig } = require('cypress')
              module.exports = cy_defineConfig({
                projectId: 'id1234',
                viewportWidth: 400,
                foo: 42,
              })
            `

          const output = await insertValueInJSString(src, { projectId: 'id1234', viewportWidth: 400 }, errors)

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

          const output = await insertValueInJSString(src, { foo: 1000 }, errors)

          expect(output).to.equal(expectedOutput)
        })

        it('accepts inline comments', async () => {
          const src = stripIndent`\
              export default {
                foo: 12, // will do this later
                viewportWidth: 800,
              }
            `
          const expectedOutput = stripIndent`\
              export default {
                foo: 1000, // will do this later
                viewportWidth: 800,
              }
            `

          const output = await insertValueInJSString(src, { foo: 1000 }, errors)

          expect(output).to.equal(expectedOutput)
        })

        it('updates a value even when this value is explicitely undefined', async () => {
          const src = stripIndent`\
              export default {
                foo: undefined, // will do this later
                viewportWidth: 800,
              }
            `
          const expectedOutput = stripIndent`\
              export default {
                foo: 1000, // will do this later
                viewportWidth: 800,
              }
            `

          const output = await insertValueInJSString(src, { foo: 1000 }, errors)

          expect(output).to.equal(expectedOutput)
        })

        it('updates values and inserts config', async () => {
          const src = stripIndent`\
            export default {
              foo: 42,
              bar: 84,
              'component': {
                devServer() {
                  return null
                }
              }
            }
          `

          const expectedOutput = stripIndent`\
            export default {
              projectId: 'id1234',
              foo: 1000,
              bar: 3000,
              'component': {
                devServer() {
                  return null
                }
              }
            }
          `

          const output = await insertValueInJSString(src, { foo: 1000, bar: 3000, projectId: 'id1234' }, errors)

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

          const output = await insertValueInJSString(src, { component: { specPattern: 'src/**/*.spec.cy.js' } }, errors)

          const expectedOutput = stripIndent`\
              module.exports = {
                component: {
                  specPattern: 'src/**/*.spec.cy.js',
                },
                foo: 42
              }
            `

          expect(output).to.equal(expectedOutput)
        })

        it('inserts nested values into existing keys', async () => {
          const src = stripIndent`\
              module.exports = {
                'component': {
                  viewportWidth: 800
                },
                foo: 42
              }
            `

          const output = await insertValueInJSString(src, { component: { specPattern: 'src/**/*.spec.cy.js' } }, errors)

          const expectedOutput = stripIndent`\
            module.exports = {
              'component': {
                specPattern: 'src/**/*.spec.cy.js',
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
                specPattern: 'components/**/*.spec.cy.js',
                foo: 82
              }
            }`

          const output = await insertValueInJSString(src, { component: { specPattern: 'src/**/*.spec.cy.js' } }, errors)

          const expectedOutput = stripIndent`\
          module.exports = {
            foo: 42,
            component: {
              specPattern: 'src/**/*.spec.cy.js',
              foo: 82
            }
          }`

          expect(output).to.equal(expectedOutput)
        })
      })

      describe('failures', () => {
        it('fails if not an object literal', () => {
          const src = [
            'const foo = {}',
            'export default foo',
          ].join('\n')

          return insertValueInJSString(src, { bar: 10 }, errors)
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

          return insertValueInJSString(src, { foo: 10 }, errors)
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

          return insertValueInJSString(src, { foo: 10 }, errors)
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

          return insertValueInJSString(src, { bar: 10 }, errors)
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
