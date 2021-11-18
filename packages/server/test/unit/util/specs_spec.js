require('../../spec_helper')

const _ = require('lodash')
const path = require('path')
const config = require(`${root}../lib/config`)
const specsUtil = require(`${root}../lib/util/specs`).default
const FixturesHelper = require('@tooling/system-tests/lib/fixtures')
const debug = require('debug')('test')

describe('lib/util/specs', () => {
  beforeEach(function () {
    FixturesHelper.scaffold()

    this.todosPath = FixturesHelper.projectPath('todos')

    return config.get(this.todosPath)
    .then((cfg) => {
      this.config = cfg
    })
  })

  afterEach(() => {
    return FixturesHelper.remove()
  })

  context('.findSpecs', () => {
    const checkFoundSpec = function (foundSpec) {
      if (!path.isAbsolute(foundSpec.absolute)) {
        throw new Error(`path to found spec should be absolute ${JSON.stringify(foundSpec)}`)
      }
    }

    it('returns absolute filenames', function () {
      return specsUtil
      .findSpecs(this.config)
      .then(((specs) => specs.forEach(checkFoundSpec)))
    })

    it('handles fixturesFolder being false', function () {
      this.config.fixturesFolder = false

      const fn = () => {
        return specsUtil.findSpecs(this.config)
      }

      expect(fn).not.to.throw()
    })

    it('by default, returns all files as long as they have a name and extension', () => {
      return config.get(FixturesHelper.projectPath('various-file-types'))
      .then((cfg) => {
        return specsUtil.findSpecs(cfg)
      }).then((files) => {
        expect(files.length).to.equal(3)
        expect(files[0].name).to.equal('coffee_spec.coffee')
        expect(files[1].name).to.equal('js_spec.js')

        expect(files[2].name).to.equal('ts_spec.ts')
      })
    })

    it('finds integration and component tests and assigns correct specType', () => {
      return config.get(FixturesHelper.projectPath('component-tests'))
      .then((cfg) => {
        cfg.resolved.testingType = { value: 'component' }

        return specsUtil.findSpecs(cfg)
      }).then((val) => val.map((spec) => _.pick(spec, ['relative', 'specType'])))
      .then((files) => {
        expect(files).to.deep.equal([
          {
            relative: 'cypress/component-tests/fails.spec.js',
            specType: 'component',
          },
          {
            relative: 'cypress/component-tests/foo.spec.js',
            specType: 'component',
          },
          {
            relative: 'cypress/integration/integration-spec.js',
            specType: 'integration',
          },
        ])
      })
    })

    it('returns files matching config.testFiles', () => {
      return config.get(FixturesHelper.projectPath('various-file-types'))
      .then((cfg) => {
        cfg.testFiles = '**/*.coffee'

        return specsUtil.findSpecs(cfg)
      }).then((files) => {
        expect(files.length).to.equal(1)

        expect(files[0].name).to.equal('coffee_spec.coffee')
      })
    })

    it('uses glob to process config.testFiles', () => {
      return config.get(FixturesHelper.projectPath('various-file-types'))
      .then((cfg) => {
        cfg.testFiles = '{coffee_*.coffee,js_spec.js}'

        return specsUtil.findSpecs(cfg)
      }).then((files) => {
        debug('found spec files %o', files)
        expect(files.length).to.equal(2)
        expect(files[0].name).to.equal('coffee_spec.coffee')

        expect(files[1].name).to.equal('js_spec.js')
      })
    })

    it('allows array in config.testFiles', () => {
      return config.get(FixturesHelper.projectPath('various-file-types'))
      .then((cfg) => {
        cfg.testFiles = ['coffee_*.coffee', 'js_spec.js']

        return specsUtil.findSpecs(cfg)
      }).then((files) => {
        debug('found spec files %o', files)
        expect(files.length).to.equal(2)
        expect(files[0].name).to.equal('coffee_spec.coffee')

        expect(files[1].name).to.equal('js_spec.js')
      })
    })

    it('filters using specPattern', () => {
      return config.get(FixturesHelper.projectPath('various-file-types'))
      .then((cfg) => {
        const specPattern = [
          path.join(cfg.projectRoot, 'cypress', 'integration', 'js_spec.js'),
        ]

        return specsUtil.findSpecs(cfg, specPattern)
      }).then((files) => {
        expect(files.length).to.equal(1)

        expect(files[0].name).to.equal('js_spec.js')
      })
    })

    it('filters using specPattern as array of glob patterns', () => {
      return config.get(FixturesHelper.projectPath('various-file-types'))
      .then((cfg) => {
        debug('test config testFiles is %o', cfg.testFiles)
        const specPattern = [
          path.join(cfg.projectRoot, 'cypress', 'integration', 'js_spec.js'),
          path.join(cfg.projectRoot, 'cypress', 'integration', 'ts*'),
        ]

        return specsUtil.findSpecs(cfg, specPattern)
      }).then((files) => {
        expect(files.length).to.equal(2)
        expect(files[0].name).to.equal('js_spec.js')

        expect(files[1].name).to.equal('ts_spec.ts')
      })
    })

    it('properly handles directories with names including \'.\'', () => {
      return config.get(FixturesHelper.projectPath('odd-directory-name'))
      .then((cfg) => {
        return specsUtil.findSpecs(cfg)
      }).then((files) => {
        expect(files.length).to.equal(1)

        expect(files[0].name).to.equal('1.0/sample_spec.js')
      })
    })
  })
})
