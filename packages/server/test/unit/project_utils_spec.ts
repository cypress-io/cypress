import Chai from 'chai'
import path from 'path'
const { sinon } = require('../spec_helper')
import { getSpecUrl, checkSupportFile } from '../../lib/project_utils'
import Fixtures from '../support/helpers/fixtures'
import settings from '../../lib/util/settings'

const todosPath = Fixtures.projectPath('todos')

const defaultProps = {
  browserUrl: 'http://localhost:8888/__/',
  componentFolder: path.join(todosPath, 'component'),
  integrationFolder: path.join(todosPath, 'tests'),
  projectRoot: todosPath,
  specType: 'integration',
} as const

const expect = Chai.expect

describe('lib/project_utils', () => {
  describe('getSpecUrl', () => {
    it('normalizes to __all when absoluteSpecUrl is undefined', () => {
      const str = getSpecUrl({
        ...defaultProps,
        absoluteSpecPath: undefined,
      })

      expect(str).to.eq('http://localhost:8888/__/#/tests/__all')
    })

    it('normalizes to __all when absoluteSpecUrl is __all', () => {
      const str = getSpecUrl({
        ...defaultProps,
        absoluteSpecPath: '__all',
      })

      expect(str).to.eq('http://localhost:8888/__/#/tests/__all')
    })

    it('normalizes to __all when absoluteSpecUrl is __all', () => {
      const str = getSpecUrl({
        ...defaultProps,
        absoluteSpecPath: '__all',
      })

      expect(str).to.eq('http://localhost:8888/__/#/tests/__all')
    })

    it('returns fully qualified url when spec exists', function () {
      const str = getSpecUrl({
        ...defaultProps,
        absoluteSpecPath: 'cypress/integration/bar.js',
      })

      expect(str).to.eq('http://localhost:8888/__/#/tests/cypress/integration/bar.js')
    })

    it('returns fully qualified url on absolute path to spec', function () {
      const todosSpec = path.join(todosPath, 'tests/sub/sub_test.coffee')
      const str = getSpecUrl({
        ...defaultProps,
        absoluteSpecPath: todosSpec,
      })

      expect(str).to.eq('http://localhost:8888/__/#/tests/integration/sub/sub_test.coffee')
    })

    it('escapses %, &', function () {
      const todosSpec = path.join(todosPath, 'tests/sub/a&b%c.js')
      const str = getSpecUrl({
        ...defaultProps,
        absoluteSpecPath: todosSpec,
      })

      expect(str).to.eq('http://localhost:8888/__/#/tests/integration/sub/a%26b%25c.js')
    })

    // ? is invalid in Windows, but it can be tested here
    // because it's a unit test and doesn't check the existence of files
    it('escapes ?', function () {
      const todosSpec = path.join(todosPath, 'tests/sub/a?.spec.js')
      const str = getSpecUrl({
        ...defaultProps,
        absoluteSpecPath: todosSpec,
      })

      expect(str).to.eq('http://localhost:8888/__/#/tests/integration/sub/a%3F.spec.js')
    })

    it('escapes %, &, ? in the url dir', function () {
      const todosSpec = path.join(todosPath, 'tests/s%&?ub/a.spec.js')
      const str = getSpecUrl({
        ...defaultProps,
        absoluteSpecPath: todosSpec,
      })

      expect(str).to.eq('http://localhost:8888/__/#/tests/integration/s%25%26%3Fub/a.spec.js')
    })
  })

  describe('checkSupportFile', () => {
    beforeEach(() => {
      sinon.stub(settings, 'configFile').returns({})
    })

    it('does nothing when {supportFile: false}', async () => {
      const ret = await checkSupportFile({
        configFile: 'cypress.json',
        supportFile: false,
      })

      expect(ret).to.be.undefined
    })

    it('throws when support file does not exist', async () => {
      try {
        await checkSupportFile({
          configFile: 'cypress.json',
          supportFile: '/this/file/does/not/exist/foo/bar/cypress/support/index.js',
        })
      } catch (e) {
        expect(e.message).to.include('The support file is missing or invalid.')
      }
    })
  })
})
