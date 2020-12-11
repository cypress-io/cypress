require('../spec_helper')

const path = require('path')
const Promise = require('bluebird')
const cypressEx = require('@packages/example')
const snapshot = require('snap-shot-it')
const config = require(`${root}lib/config`)
const Project = require(`${root}lib/project`)
const scaffold = require(`${root}lib/scaffold`)
const fs = require(`${root}lib/util/fs`)
const glob = require(`${root}lib/util/glob`)
const Fixtures = require(`${root}/test/support/helpers/fixtures`)

describe('lib/scaffold', () => {
  beforeEach(() => {
    return Fixtures.scaffold()
  })

  afterEach(() => {
    return Fixtures.remove()
  })

  context('.integrationExampleName', () => {
    it('returns examples', () => {
      expect(scaffold.integrationExampleName()).to.eq('examples')
    })
  })

  // TODO: fix it later
  context.skip('.isNewProject', () => {
    beforeEach(function () {
      const todosPath = Fixtures.projectPath('todos')

      return config.get(todosPath)
      .then((cfg) => {
        this.cfg = cfg;
        ({ integrationFolder: this.integrationFolder } = this.cfg)
      })
    })

    it('is false when files.length isnt 1', function () {
      const id = () => {
        this.ids = new Project(this.idsPath)

        return this.ids.getConfig()
        .then((cfg) => {
          return this.ids.scaffold(cfg).return(cfg)
        }).then((cfg) => {
          return this.ids.determineIsNewProject(cfg.integrationFolder)
        }).then((ret) => {
          expect(ret).to.be.false
        })
      }

      const todo = () => {
        this.todos = new Project(this.todosPath)

        return this.todos.getConfig()
        .then((cfg) => {
          return this.todos.scaffold(cfg).return(cfg)
        }).then((cfg) => {
          return this.todos.determineIsNewProject(cfg.integrationFolder)
        }).then((ret) => {
          expect(ret).to.be.false
        })
      }

      return Promise.join(id, todo)
    })

    it('is true when files, name + bytes match to scaffold', function () {
      // TODO this test really can move to scaffold
      const pristine = new Project(this.pristinePath)

      return pristine.getConfig()
      .then((cfg) => {
        return pristine.scaffold(cfg).return(cfg)
      }).then((cfg) => {
        return pristine.determineIsNewProject(cfg.integrationFolder)
      }).then((ret) => {
        expect(ret).to.be.true
      })
    })

    it('is false when bytes dont match scaffold', function () {
      // TODO this test really can move to scaffold
      const pristine = new Project(this.pristinePath)

      return pristine.getConfig()
      .then((cfg) => {
        return pristine.scaffold(cfg).return(cfg)
      }).then((cfg) => {
        const example = scaffold.integrationExampleName()
        const file = path.join(cfg.integrationFolder, example)

        // write some data to the file so it is now
        // different in file size
        return fs.readFileAsync(file, 'utf8')
        .then((str) => {
          str += 'foo bar baz'

          return fs.writeFileAsync(file, str).return(cfg)
        })
      }).then((cfg) => {
        return pristine.determineIsNewProject(cfg.integrationFolder)
      }).then((ret) => {
        expect(ret).to.be.false
      })
    })
  })

  context('.integration', () => {
    beforeEach(function () {
      const pristinePath = Fixtures.projectPath('pristine')

      return config.get(pristinePath).then((cfg) => {
        this.cfg = cfg;
        ({ integrationFolder: this.integrationFolder } = this.cfg)
      })
    })

    it('creates both integrationFolder and example specs when integrationFolder does not exist', function () {
      return Promise.join(
        cypressEx.getPathToExamples(),
        scaffold.integration(this.integrationFolder, this.cfg),
      )
      .spread((exampleSpecs) => {
        return Promise.join(
          fs.statAsync(`${this.integrationFolder}/examples/actions.spec.js`).get('size'),
          fs.statAsync(exampleSpecs[0]).get('size'),
          fs.statAsync(`${this.integrationFolder}/examples/location.spec.js`).get('size'),
          fs.statAsync(exampleSpecs[8]).get('size'),
        ).spread((size1, size2, size3, size4) => {
          expect(size1).to.eq(size2)

          expect(size3).to.eq(size4)
        })
      })
    })

    it('does not create any files if integrationFolder is not default', function () {
      this.cfg.resolved.integrationFolder.from = 'config'

      return scaffold.integration(this.integrationFolder, this.cfg)
      .then(() => {
        return glob('**/*', { cwd: this.integrationFolder })
      }).then((files) => {
        expect(files.length).to.eq(0)
      })
    })

    it('does not create any files if using component testing', function () {
      this.cfg.resolved.experimentalComponentTesting.value = true
      this.cfg.resolved.componentFolder.from = 'config'

      return scaffold.integration(this.integrationFolder, this.cfg)
      .then(() => {
        return glob('**/*', { cwd: this.integrationFolder })
      }).then((files) => {
        expect(files.length).to.eq(0)
      })
    })

    it('does not create example specs if integrationFolder already exists', function () {
      // create the integrationFolder ourselves manually
      return fs.ensureDirAsync(this.integrationFolder)
      .then(() => {
        // now scaffold
        return scaffold.integration(this.integrationFolder, this.cfg)
      }).then(() => {
        return glob('**/*', { cwd: this.integrationFolder })
      }).then((files) => {
        // ensure no files exist
        expect(files.length).to.eq(0)
      })
    })

    it('throws if trying to scaffold a file not present in file tree', function () {
      const integrationPath = path.join(this.integrationFolder, 'foo')

      return fs.removeAsync(integrationPath)
      .then(() => {
        return scaffold.integration(integrationPath, this.cfg)
      }).then(() => {
        throw new Error('Should throw the right error')
      }).catch((err = {}) => {
        expect(err.stack).to.contain('not in the scaffolded file tree')
      })
    })
  })

  context('.support', () => {
    beforeEach(function () {
      const pristinePath = Fixtures.projectPath('pristine')

      return config.get(pristinePath).then((cfg) => {
        this.cfg = cfg;
        ({ supportFolder: this.supportFolder } = this.cfg)
      })
    })

    it('does not create any files if supportFolder directory already exists', function () {
      // first remove it
      return fs.removeAsync(this.supportFolder)
      .then(() => {
        // create the supportFolder ourselves manually
        return fs.ensureDirAsync(this.supportFolder)
      }).then(() => {
        // now scaffold
        return scaffold.support(this.supportFolder, this.cfg)
      }).then(() => {
        return glob('**/*', { cwd: this.supportFolder })
      }).then((files) => {
        // ensure no files exist
        expect(files.length).to.eq(0)
      })
    })

    it('does not create any files if supportFile is not default', function () {
      this.cfg.resolved.supportFile.from = 'config'

      return scaffold.support(this.supportFolder, this.cfg)
      .then(() => {
        return glob('**/*', { cwd: this.supportFolder })
      }).then((files) => {
        expect(files.length).to.eq(0)
      })
    })

    it('does not create any files if supportFile is false', function () {
      this.cfg.supportFile = false

      return scaffold.support(this.supportFolder, this.cfg)
      .then(() => {
        return glob('**/*', { cwd: this.supportFolder })
      }).then((files) => {
        expect(files.length).to.eq(0)
      })
    })

    it('throws if trying to scaffold a file not present in file tree', function () {
      const supportPath = path.join(this.supportFolder, 'foo')

      return fs.removeAsync(supportPath)
      .then(() => {
        return scaffold.support(supportPath, this.cfg)
      }).then(() => {
        throw new Error('Should throw the right error')
      }).catch((err = {}) => {
        expect(err.stack).to.contain('not in the scaffolded file tree')
      })
    })

    it('creates supportFolder and commands.js and index.js when supportFolder does not exist', function () {
      return scaffold.support(this.supportFolder, this.cfg)
      .then(() => {
        return Promise.join(
          fs.readFileAsync(`${this.supportFolder}/commands.js`, 'utf8'),
          fs.readFileAsync(`${this.supportFolder}/index.js`, 'utf8'),
        ).spread((commandsContents, indexContents) => {
          snapshot(commandsContents)

          return snapshot(indexContents)
        })
      })
    })
  })

  context('.plugins', () => {
    beforeEach(function () {
      const pristinePath = Fixtures.projectPath('pristine')

      return config.get(pristinePath).then((cfg) => {
        this.cfg = cfg;
        ({ pluginsFile: this.pluginsFile } = this.cfg)
        this.pluginsFolder = path.dirname(this.pluginsFile)
      })
    })

    it('creates pluginsFile when pluginsFolder does not exist', function () {
      // first remove it
      return fs.removeAsync(this.pluginsFolder)
      .then(() => {
        return scaffold.plugins(this.pluginsFolder, this.cfg)
      }).then(() => {
        return fs.readFileAsync(`${this.pluginsFolder}/index.js`, 'utf8')
      }).then((str) => {
        return snapshot(str.split('`').join('<backtick>'))
      })
    })

    it('does not create any files if pluginsFile directory already exists', function () {
      // first remove it
      return fs.removeAsync(this.pluginsFolder)
      .then(() => {
        // create the pluginsFolder ourselves manually
        return fs.ensureDirAsync(this.pluginsFolder)
      }).then(() => {
        // now scaffold
        return scaffold.plugins(this.pluginsFolder, this.cfg)
      }).then(() => {
        return glob('**/*', { cwd: this.pluginsFolder })
      }).then((files) => {
        // ensure no files exist
        expect(files.length).to.eq(0)
      })
    })

    it('does not create any files if pluginsFile is not default', function () {
      this.cfg.resolved.pluginsFile.from = 'config'
    })

    it('does not create any files if pluginsFile is false', function () {
      this.cfg.pluginsFile = false

      return scaffold.plugins(this.pluginsFile, this.cfg)
      .then(() => {
        return glob('**/*', { cwd: this.pluginsFile })
      }).then((files) => {
        expect(files.length).to.eq(0)
      })
    })
  })

  context('.fixture', () => {
    beforeEach(function () {
      const pristinePath = Fixtures.projectPath('pristine')

      return config.get(pristinePath).then((cfg) => {
        this.cfg = cfg;
        ({ fixturesFolder: this.fixturesFolder } = this.cfg)
      })
    })

    it('creates both fixturesFolder and example.json when fixturesFolder does not exist', function () {
      return scaffold.fixture(this.fixturesFolder, this.cfg)
      .then(() => {
        return fs.readFileAsync(`${this.fixturesFolder}/example.json`, 'utf8')
      }).then((str) => {
        expect(str).to.eq(`\
{
  "name": "Using fixtures to represent data",
  "email": "hello@cypress.io",
  "body": "Fixtures are a great way to mock data for responses to routes"
}\
`)
      })
    })

    it('does not create any files if fixturesFolder is not default', function () {
      this.cfg.resolved.fixturesFolder.from = 'config'

      return scaffold.fixture(this.fixturesFolder, this.cfg)
      .then(() => {
        return glob('**/*', { cwd: this.fixturesFolder })
      }).then((files) => {
        expect(files.length).to.eq(0)
      })
    })

    it('does not create any files if fixturesFolder is false', function () {
      this.cfg.fixturesFolder = false

      return scaffold.fixture(this.fixturesFolder, this.cfg)
      .then(() => {
        return glob('**/*', { cwd: this.fixturesFolder })
      }).then((files) => {
        expect(files.length).to.eq(0)
      })
    })

    it('does not create example.json if fixturesFolder already exists', function () {
      // create the fixturesFolder ourselves manually
      return fs.ensureDirAsync(this.fixturesFolder)
      .then(() => {
        // now scaffold
        return scaffold.fixture(this.fixturesFolder, this.cfg)
      }).then(() => {
        return glob('**/*', { cwd: this.fixturesFolder })
      }).then((files) => {
        // ensure no files exist
        expect(files.length).to.eq(0)
      })
    })

    it('throws if trying to scaffold a file not present in file tree', function () {
      const fixturesPath = path.join(this.fixturesFolder, 'foo')

      return fs.removeAsync(fixturesPath)
      .then(() => {
        return scaffold.fixture(fixturesPath, this.cfg)
      }).then(() => {
        throw new Error('Should throw the right error')
      }).catch((err = {}) => {
        expect(err.stack).to.contain('not in the scaffolded file tree')
      })
    })
  })

  context('.fileTree', () => {
    beforeEach(function () {
      const todosPath = Fixtures.projectPath('todos')

      return config.get(todosPath).then((cfg) => {
        this.cfg = cfg
        this.cfg.pluginsFile = path.join(this.cfg.projectRoot, 'cypress/plugins/index.js')
      })
    })

    it('returns tree-like structure of scaffolded', function () {
      return scaffold.fileTree(this.cfg).then(snapshot)
    })

    it('leaves out integration tests if using component testing', function () {
      this.cfg.resolved.experimentalComponentTesting.value = true
      this.cfg.resolved.componentFolder.from = 'config'

      return scaffold.fileTree(this.cfg).then(snapshot)
    })

    it('leaves out fixtures if configured to false', function () {
      this.cfg.fixturesFolder = false

      return scaffold.fileTree(this.cfg).then(snapshot)
    })

    it('leaves out support if configured to false', function () {
      this.cfg.supportFile = false

      return scaffold.fileTree(this.cfg).then(snapshot)
    })

    it('leaves out plugins if configured to false', function () {
      this.cfg.pluginsFile = false

      return scaffold.fileTree(this.cfg).then(snapshot)
    })
  })
})
