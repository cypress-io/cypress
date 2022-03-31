const path = require('path')

require('../../spec_helper')
const { fs } = require('../../../lib/util/fs')
const settings = require(`../../../lib/util/settings`)
const { getCtx } = require('../../../lib/makeDataContext')

const projectRoot = process.cwd()

let ctx

// NOTE: tested by cypress open mode tests now
describe.skip('lib/util/settings', () => {
  beforeEach(() => {
    ctx = getCtx()
  })

  context('with default configFile option', () => {
    beforeEach(function () {
      this.setup = async (obj = {}) => {
        await ctx.actions.project.setCurrentProjectAndTestingTypeForTestSetup(projectRoot)

        return fs.writeFileAsync('cypress.config.js', `module.exports = ${JSON.stringify(obj)}`)
      }
    })

    afterEach(() => {
      return fs.removeAsync('cypress.config.js')
    })

    context('.read', () => {
      it('promises cypress.config.js', function () {
        return this.setup({ foo: 'bar' })
        .then(() => {
          return settings.read(projectRoot)
        }).then((obj) => {
          expect(obj).to.deep.eq({ foo: 'bar' })
        })
      })

      // TODO: (tim) this is done once we select the testingType
      it.skip('promises cypress.config.js and merges CT specific properties for via testingType: component', function () {
        return this.setup({ a: 'b', component: { a: 'c' } })
        .then(() => {
          return settings.read(projectRoot, { testingType: 'component' })
        }).then((obj) => {
          expect(obj).to.deep.eq({ a: 'c', component: { a: 'c' } })
        })
      })

      // TODO: (tim) this is done once we select the testingType
      it.skip('promises cypress.config.js and merges e2e specific properties', function () {
        return this.setup({ a: 'b', e2e: { a: 'c' } })
        .then(() => {
          return settings.read(projectRoot)
        }).then((obj) => {
          expect(obj).to.deep.eq({ a: 'c', e2e: { a: 'c' } })
        })
      })

      // TODO: (tim) revisit / fix this when the refactor of all state lands
      it.skip('errors if in run mode and can\'t find file', function () {
        return settings.read(projectRoot, { args: { runProject: 'path' } })
        .then(() => {
          throw Error('read should have failed with no config file in run mode')
        }).catch((err) => {
          expect(err.type).to.equal('CONFIG_FILE_NOT_FOUND')

          return fs.access(path.join(projectRoot, 'cypress.config.js'))
          .then(() => {
            throw Error('file should not have been created here')
          }).catch((err) => {
            expect(err.code).to.equal('ENOENT')
          })
        })
      })
    })
  })

  context('with js files', () => {
    it('.read returns from configFile when its a JavaScript file', async function () {
      this.projectRoot = path.join(projectRoot, '_test-output/path/to/project/')

      await ctx.actions.project.setCurrentProjectAndTestingTypeForTestSetup(this.projectRoot)

      return fs.ensureDirAsync(this.projectRoot)
      .then(() => {
        return fs.writeFile(path.join(this.projectRoot, 'cypress.custom.js'), `module.exports = { baz: 'lurman' }`)
      })
      .then(() => {
        return settings.read(this.projectRoot, { configFile: 'cypress.custom.js' })
        .then((settings) => {
          expect(settings).to.deep.equal({ baz: 'lurman' })
        }).then(() => {
          return fs.remove(path.join(this.projectRoot, 'cypress.custom.js'))
        })
      })
    })
  })
})
