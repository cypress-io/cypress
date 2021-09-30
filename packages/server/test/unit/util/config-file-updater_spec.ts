import * as path from 'path'
import '../../spec_helper'

import { fs } from '../../../lib/util/fs'
import { insertValueInJSString, insertValuesInConfigFile } from '../../../lib/util/config-file-updater'
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
          const src = ['export default {',
            '  foo: 42',
            '}'].join('\n')
          const expectedOutput = ['export default {',
            '  projectId: "id1234",',
            '  viewportWidth: 400,',
            '  foo: 42',
            '}'].join('\n')

          const output = await insertValueInJSString(src, { projectId: 'id1234', viewportWidth: 400 }, {}, '')

          expect(output).to.equal(expectedOutput)
        })

        it('finds the object litterla and adds the values to it es5', async () => {
          const src = ['module.exports = {',
            '  foo: 42',
            '}'].join('\n')
          const expectedOutput = ['module.exports = {',
            '  projectId: "id1234",',
            '  viewportWidth: 400,',
            '  foo: 42',
            '}'].join('\n')

          const output = await insertValueInJSString(src, { projectId: 'id1234', viewportWidth: 400 }, {}, '')

          expect(output).to.equal(expectedOutput)
        })
      })

      describe('defineConfig', () => {
        it('skips defineConfig and add to the object inside', async () => {
          const src = [
            'import { defineConfig } from "cypress"',
            'export default defineConfig({',
            '  foo: 42',
            '})',
          ].join('\n')
          const expectedOutput = [
            'import { defineConfig } from "cypress"',
            'export default defineConfig({',
            '  projectId: "id1234",',
            '  viewportWidth: 400,',
            '  foo: 42',
            '})',
          ].join('\n')

          const output = await insertValueInJSString(src, { projectId: 'id1234', viewportWidth: 400 }, {}, '')

          expect(output).to.equal(expectedOutput)
        })

        it('skips defineConfig even if it renamed in an import (es6)', async () => {
          const src = [
            'import { defineConfig as cy_defineConfig } from "cypress"',
            'export default cy_defineConfig({',
            '  foo: 42',
            '})',
          ].join('\n')
          const expectedOutput = [
            'import { defineConfig as cy_defineConfig } from "cypress"',
            'export default cy_defineConfig({',
            '  projectId: "id1234",',
            '  viewportWidth: 400,',
            '  foo: 42',
            '})',
          ].join('\n')

          const output = await insertValueInJSString(src, { projectId: 'id1234', viewportWidth: 400 }, {}, '')

          expect(output).to.equal(expectedOutput)
        })

        it('skips defineConfig even if it renamed in a require (es5)', async () => {
          const src = [
            'const { defineConfig: cy_defineConfig } = require("cypress")',
            'module.exports = cy_defineConfig({',
            '  foo: 42',
            '})',
          ].join('\n')
          const expectedOutput = [
            'const { defineConfig: cy_defineConfig } = require("cypress")',
            'module.exports = cy_defineConfig({',
            '  projectId: "id1234",',
            '  viewportWidth: 400,',
            '  foo: 42',
            '})',
          ].join('\n')

          const output = await insertValueInJSString(src, { projectId: 'id1234', viewportWidth: 400 }, {}, '')

          expect(output).to.equal(expectedOutput)
        })
      })

      describe('updates', () => {
        it('updates a value if the same value is found in resolved config', async () => {
          const src = [
            'module.exports = {',
            '  foo: 42',
            '}',
          ].join('\n')
          const expectedOutput = [
            'module.exports = {',
            '  foo: 1000',
            '}',
          ].join('\n')

          const output = await insertValueInJSString(src, { foo: 1000 }, { foo: 42 }, '')

          expect(output).to.equal(expectedOutput)
        })

        it('updates values and inserts config', async () => {
          const src = [
            'export default {',
            '  foo: 42,',
            '  bar: 84,',
            '  component: {',
            '    devServer() {',
            '      return null',
            '    }',
            '  }',
            '}',
          ].join('\n')
          const expectedOutput = [
            'export default {',
            '  projectId: "id1234",',
            '  foo: 1000,',
            '  bar: 3000,',
            '  component: {',
            '    devServer() {',
            '      return null',
            '    }',
            '  }',
            '}',
          ].join('\n')

          const output = await insertValueInJSString(src, { foo: 1000, bar: 3000, projectId: 'id1234' }, { foo: 42, bar: 84 }, '')

          expect(output).to.equal(expectedOutput)
        })
      })

      describe('failures', () => {
        it('should fail if not an object litteral', () => {
          const src = [
            'const foo = {}',
            'export default foo',
          ].join('\n')

          return insertValueInJSString(src, { bar: 10 }, {}, 'path/to/config.js')
          .then(() => {
            throw Error('this should not succeed')
          })
          .catch((err) => {
            expect(err).to.have.property('type', 'COULD_NOT_INSERT_IN_CONFIG_FILE')
          })
        })

        it('should fail if one of the values to update is not a literal', () => {
          const src = [
            'const bar = 12',
            'export default {',
            '  foo: bar',
            '}',
          ].join('\n')

          return insertValueInJSString(src, { foo: 10 }, { foo: 12 }, 'path/to/config.js')
          .then(() => {
            throw Error('this should not succeed')
          })
          .catch((err) => {
            expect(err).to.have.property('type', 'COULD_NOT_UPDATE_CONFIG_FILE')
          })
        })

        it('should fail with inlined values', () => {
          const src = [
            'const foo = 12',
            'export default {',
            '  foo',
            '}',
          ].join('\n')

          return insertValueInJSString(src, { foo: 10 }, { foo: 12 }, 'path/to/config.js')
          .then(() => {
            throw Error('this should not succeed')
          })
          .catch((err) => {
            expect(err).to.have.property('type', 'COULD_NOT_UPDATE_CONFIG_FILE')
          })
        })

        it('should fail if there is a spread', () => {
          const src = [
            'const foo = { bar: 12 }',
            'export default {',
            '  bar: 8,',
            '  ...foo',
            '}',
          ].join('\n')

          return insertValueInJSString(src, { bar: 10 }, { bar: 12 }, 'path/to/config.js')
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
