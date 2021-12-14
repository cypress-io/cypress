const path = require('path')

require('../../spec_helper')
const { fs } = require('../../../lib/util/fs')
const settings = require(`../../../lib/util/settings`)
const { getCtx } = require('../../../lib/makeDataContext')

const projectRoot = process.cwd()
const defaultOptions = {
  configFile: 'cypress.config.js',
}

let ctx

describe('lib/util/settings', () => {
  beforeEach(() => {
    ctx = getCtx()
  })

  context('with default configFile option', () => {
    beforeEach(function () {
      this.setup = (obj = {}) => {
        ctx.actions.project.setActiveProjectForTestSetup(projectRoot)

        return fs.writeFileAsync('cypress.config.js', `module.exports = ${JSON.stringify(obj)}`)
      }
    })

    afterEach(() => {
      return fs.removeAsync('cypress.config.js')
    })

    context('.readEnv', () => {
      afterEach(() => {
        return fs.removeAsync('cypress.env.json')
      })

      it('parses json', () => {
        const json = { foo: 'bar', baz: 'quux' }

        fs.writeJsonSync('cypress.env.json', json)

        return settings.readEnv(projectRoot)
        .then((obj) => {
          expect(obj).to.deep.eq(json)
        })
      })

      it('throws when invalid json', () => {
        fs.writeFileSync('cypress.env.json', '{\'foo;: \'bar}')

        return settings.readEnv(projectRoot)
        .catch((err) => {
          expect(err.type).to.eq('ERROR_READING_FILE')
          expect(err.message).to.include('SyntaxError')

          expect(err.message).to.include(projectRoot)
        })
      })

      it('does not write initial file', () => {
        return settings.readEnv(projectRoot)
        .then((obj) => {
          expect(obj).to.deep.eq({})
        }).then(() => {
          return fs.pathExists('cypress.env.json')
        }).then((found) => {
          expect(found).to.be.false
        })
      })
    })

    context('.id', () => {
      beforeEach(function () {
        this.projectRoot = path.join(projectRoot, '_test-output/path/to/project/')

        ctx.actions.project.setActiveProjectForTestSetup(this.projectRoot)

        return fs.ensureDirAsync(this.projectRoot)
      })

      afterEach(function () {
        return fs.removeAsync(`${this.projectRoot}cypress.config.js`)
      })

      it('returns project id for project', function () {
        return fs.writeFileAsync(`${this.projectRoot}cypress.config.js`, `module.exports = {
          projectId: 'id-123',
        }`)
        .then(() => {
          return settings.id(this.projectRoot, defaultOptions)
        }).then((id) => {
          expect(id).to.equal('id-123')
        })
      })
    })

    context('.read', () => {
      it('promises cypress.config.js', function () {
        return this.setup({ foo: 'bar' })
        .then(() => {
          return settings.read(projectRoot, defaultOptions)
        }).then((obj) => {
          expect(obj).to.deep.eq({ foo: 'bar' })
        })
      })

      it('promises cypress.config.js and merges CT specific properties for via testingType: component', function () {
        return this.setup({ a: 'b', component: { a: 'c' } })
        .then(() => {
          return settings.read(projectRoot, { ...defaultOptions, testingType: 'component' })
        }).then((obj) => {
          expect(obj).to.deep.eq({ a: 'c', component: { a: 'c' } })
        })
      })

      it('promises cypress.config.js and merges e2e specific properties', function () {
        return this.setup({ a: 'b', e2e: { a: 'c' } })
        .then(() => {
          return settings.read(projectRoot, defaultOptions)
        }).then((obj) => {
          expect(obj).to.deep.eq({ a: 'c', e2e: { a: 'c' } })
        })
      })

      // TODO: (tim) revisit / fix this when the refactor of all state lands
      it.skip('errors if in run mode and can\'t find file', function () {
        return settings.read(projectRoot, { ...defaultOptions, args: { runProject: 'path' } })
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

    context('.write', () => {
      it('promises cypress.config.js updates', function () {
        return this.setup().then(() => {
          return settings.writeOnly(projectRoot, { foo: 'bar' }, defaultOptions)
        }).then((obj) => {
          expect(obj).to.deep.eq({ foo: 'bar' })
        })
      })

      // TODO: Figure out how / what we want to write to settings files
      it.skip('only writes over conflicting keys', function () {
        return this.setup({ projectId: '12345', autoOpen: true })
        .then(() => {
          return settings.writeOnly(projectRoot, { projectId: 'abc123' }, defaultOptions)
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

    it('.write does not create a file', function () {
      return settings.writeOnly(this.projectRoot, {}, this.options)
      .then(() => {
        return fs.access(path.join(this.projectRoot, 'cypress.config.js'))
        .then(() => {
          throw Error('file shuold not have been created here')
        }).catch((err) => {
          expect(err.code).to.equal('ENOENT')
        })
      })
    })

    it('.read returns empty object', function () {
      return settings.read(this.projectRoot, this.options)
      .then((settings) => {
        expect(settings).to.deep.equal({})
      })
    })
  })

  context('with js files', () => {
    it('.read returns from configFile when its a JavaScript file', function () {
      this.projectRoot = path.join(projectRoot, '_test-output/path/to/project/')

      ctx.actions.project.setActiveProjectForTestSetup(this.projectRoot)

      return fs.writeFile(path.join(this.projectRoot, 'cypress.custom.js'), `module.exports = { baz: 'lurman' }`)
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

  describe('.pathToConfigFile', () => {
    it('supports relative path', () => {
      const path = settings.pathToConfigFile('/users/tony/cypress', {
        configFile: 'e2e/config.json',
      })

      expect(path).to.equal('/users/tony/cypress/e2e/config.json')
    })

    it('supports absolute path', () => {
      const path = settings.pathToConfigFile('/users/tony/cypress', {
        configFile: '/users/pepper/cypress/e2e/cypress.config.json',
      })

      expect(path).to.equal('/users/pepper/cypress/e2e/cypress.config.json')
    })
  })
})
