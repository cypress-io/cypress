require('../spec_helper')

const path = require('path')
const { fs } = require(`${root}lib/util/fs`)
const settings = require(`${root}lib/util/settings`)
const { CYPRESS_CONFIG_FILES } = require(`${root}/lib/configFiles`)

const { clearCypressJsonCache } = require('../cache_helper')

const projectRoot = process.cwd()

describe('lib/settings', () => {
  context('with no configFile option', () => {
    beforeEach(function () {
      this.setup = (obj = {}, file = 'cypress.json') => {
        if (file === 'cypress.json') {
          return fs.writeJsonAsync(file, obj)
        }

        return fs.outputFileAsync(file, obj)
      }
    })

    afterEach(() => {
      return CYPRESS_CONFIG_FILES.reduce((previousPromise, currentFile) => {
        return previousPromise.then(() => fs.removeAsync(currentFile))
      }, Promise.resolve())
      .then(clearCypressJsonCache)
    })

    context('nested cypress object', () => {
      it('flattens object on read', function () {
        return this.setup({ cypress: { foo: 'bar' } })
        .then(() => {
          return settings.read(projectRoot)
        }).then((obj) => {
          expect(obj).to.deep.eq({ configFile: 'cypress.json', foo: 'bar' })

          return fs.readJsonAsync('cypress.json')
        }).then((obj) => {
          expect(obj).to.deep.eq({ foo: 'bar' })
        })
      })
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

        return fs.ensureDirAsync(this.projectRoot)
      })

      afterEach(function () {
        return fs.removeAsync(`${this.projectRoot}cypress.json`)
      })

      it('returns project id for project', function () {
        return fs.writeJsonAsync(`${this.projectRoot}cypress.json`, {
          projectId: 'id-123',
        })
        .then(() => {
          return settings.id(this.projectRoot)
        }).then((id) => {
          expect(id).to.equal('id-123')
        })
      })
    })

    context('.read', () => {
      it('fails if both a cypress.config.js and cypress.config.ts are added', function () {
        return Promise.all([
          fs.outputFileAsync('cypress.config.ts', ''),
          fs.outputFileAsync('cypress.config.js', ''),
        ]).then(() => {
          return settings.read(projectRoot)
        })
        .then(() => {
          throw Error('should throw when 2 files are created')
        })
        .catch((err) => {
          expect(err.type).to.eq('CONFIG_FILES_LANGUAGE_CONFLICT')

          expect(err.message).to.include(projectRoot)
        })
      })

      it('promises cypress.config.js', function () {
        return this.setup(`
          module.exports = {
            commmon_setting: true,
          }
          `,
        'cypress.config.js')
        .then(() => {
          return settings.read(projectRoot, { testingType: 'component' })
        }).then((obj) => {
          expect(obj).to.deep.eq({
            commmon_setting: true,
            configFile: 'cypress.config.js',
          })
        })
      })

      it('promises cypress.json', function () {
        return this.setup({ foo: 'bar' })
        .then(() => {
          return settings.read(projectRoot)
        }).then((obj) => {
          expect(obj).to.deep.eq({ foo: 'bar', configFile: 'cypress.json' })
        })
      })

      it('renames commandTimeout -> defaultCommandTimeout', function () {
        return this.setup({ commandTimeout: 30000, foo: 'bar' })
        .then(() => {
          return settings.read(projectRoot)
        }).then((obj) => {
          expect(obj).to.deep.eq({ configFile: 'cypress.json', defaultCommandTimeout: 30000, foo: 'bar' })
        })
      })

      it('renames supportFolder -> supportFile', function () {
        return this.setup({ supportFolder: 'foo', foo: 'bar' })
        .then(() => {
          return settings.read(projectRoot)
        }).then((obj) => {
          expect(obj).to.deep.eq({ configFile: 'cypress.json', supportFile: 'foo', foo: 'bar' })
        })
      })

      it('renames visitTimeout -> pageLoadTimeout', function () {
        return this.setup({ visitTimeout: 30000, foo: 'bar' })
        .then(() => {
          return settings.read(projectRoot)
        }).then((obj) => {
          expect(obj).to.deep.eq({ configFile: 'cypress.json', pageLoadTimeout: 30000, foo: 'bar' })
        })
      })

      it('renames visitTimeout -> pageLoadTimeout on nested cypress obj', function () {
        return this.setup({ cypress: { visitTimeout: 30000, foo: 'bar' } })
        .then(() => {
          return settings.read(projectRoot)
        }).then((obj) => {
          expect(obj).to.deep.eq({ configFile: 'cypress.json', pageLoadTimeout: 30000, foo: 'bar' })
        })
      })
    })

    context('.write', () => {
      it('promises cypress.json updates', function () {
        return this.setup().then(() => {
          return settings.write(projectRoot, { foo: 'bar' })
        }).then((obj) => {
          expect(obj).to.deep.eq({ foo: 'bar', configFile: 'cypress.json' })
        })
      })

      it('only writes over conflicting keys', function () {
        return this.setup({ projectId: '12345', autoOpen: true })
        .then(() => {
          return settings.write(projectRoot, { projectId: 'abc123' })
        }).then((obj) => {
          expect(obj).to.deep.eq({ projectId: 'abc123', autoOpen: true, configFile: 'cypress.json' })
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

    it('.exists passes', function () {
      return settings.exists(this.projectRoot, this.options)
      .then((exists) => {
        expect(exists).to.equal(undefined)
      })
    })

    it('.write does not create a file', function () {
      return settings.write(this.projectRoot, {}, this.options)
      .then(() => {
        return fs.exists(path.join(this.projectRoot, 'cypress.json'))
        .then((exists) => {
          expect(exists).to.equal(false)
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

  context('with a configFile set', () => {
    beforeEach(function () {
      this.projectRoot = path.join(projectRoot, '_test-output/path/to/project/')

      this.options = {
        configFile: 'my-test-config-file.json',
      }

      return fs.ensureDirAsync(this.projectRoot)
    })

    afterEach(function () {
      return fs.removeAsync(`${this.projectRoot}${this.options.configFile}`)
    })

    it('.exists fails when configFile doesn\'t exist', function () {
      return settings.exists(this.projectRoot, this.options)
      .catch((error) => {
        expect(error.type).to.equal('CONFIG_FILE_NOT_FOUND')
      })
    })

    it('.write creates configFile', function () {
      return settings.write(this.projectRoot, { foo: 'bar' }, this.options)
      .then(() => {
        return fs.readJsonAsync(path.join(this.projectRoot, this.options.configFile))
        .then((json) => {
          expect(json).to.deep.equal({ foo: 'bar', configFile: 'my-test-config-file.json' })
        })
      })
    })

    it('.read returns from configFile', function () {
      return fs.writeJsonAsync(path.join(this.projectRoot, this.options.configFile), { foo: 'bar' })
      .then(() => {
        return settings.read(this.projectRoot, this.options)
        .then((settings) => {
          expect(settings).to.deep.equal({ foo: 'bar', configFile: 'my-test-config-file.json' })
        })
      })
    })
  })
})
