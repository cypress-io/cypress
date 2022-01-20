import Chai from 'chai'
import path from 'path'
import { getSpecUrl, checkSupportFile } from '../../lib/project_utils'
import Fixtures from '@tooling/system-tests/lib/fixtures'

const todosPath = Fixtures.projectPath('todos')

const defaultProps: Parameters<typeof getSpecUrl>[0] = {
  browserUrl: 'http://localhost:8888/__/',
  projectRoot: todosPath,
  spec: {
    name: 'cypress/integration/foo/bar.js',
    relative: 'cypress/integration/foo/bar.js',
    absolute: '/bin/cypress/integration/foo/bar.js',
  },
}

const expect = Chai.expect

describe('lib/project_utils', () => {
  describe('getSpecUrl', () => {
    it('returns fully qualified url when spec exists', function () {
      const str = getSpecUrl({
        ...defaultProps,
        spec: {
          ...defaultProps.spec,
        },
      })

      expect(str).to.eq('http://localhost:8888/__/#/specs/runner?file=cypress/integration/foo/bar.js')
    })

    it('returns fully qualified url on absolute path to spec', function () {
      const todosSpec = path.join(todosPath, 'tests/sub/sub_test.coffee')
      const str = getSpecUrl({
        ...defaultProps,
        spec: {
          ...defaultProps.spec,
          relative: 'tests/sub/sub_test.coffee',
          name: 'tests/sub/sub_test.coffee',
          absolute: todosSpec,
        },
      })

      expect(str).to.eq('http://localhost:8888/__/#/specs/runner?file=tests/sub/sub_test.coffee')
    })

    it('escapses %, &', function () {
      const rel = 'tests/sub/a&b%c.js'
      const todosSpec = path.join(todosPath, rel)
      const str = getSpecUrl({
        ...defaultProps,
        spec: {
          name: rel,
          relative: rel,
          absolute: todosSpec,
        },
      })

      expect(str).to.eq('http://localhost:8888/__/#/specs/runner?file=tests/sub/a%26b%25c.js')
    })

    // ? is invalid in Windows, but it can be tested here
    // because it's a unit test and doesn't check the existence of files
    it('escapes ?', function () {
      const rel = 'tests/sub/a?.spec.js'
      const todosSpec = path.join(todosPath, rel)
      const str = getSpecUrl({
        ...defaultProps,
        spec: {
          name: rel,
          relative: rel,
          absolute: todosSpec,
        },
      })

      expect(str).to.eq('http://localhost:8888/__/#/specs/runner?file=tests/sub/a%3F.spec.js')
    })

    it('escapes %, &, ? in the url dir', function () {
      const rel = 'tests/s%&?ub/a.spec.js'
      const todosSpec = path.join(todosPath, rel)
      const str = getSpecUrl({
        ...defaultProps,
        spec: {
          absolute: todosSpec,
          relative: rel,
          name: rel,
        },
      })

      expect(str).to.eq('http://localhost:8888/__/#/specs/runner?file=tests/s%25%26%3Fub/a.spec.js')
    })
  })

  describe('checkSupportFile', () => {
    it('does nothing when {supportFile: false}', async () => {
      const ret = await checkSupportFile({
        configFile: 'cypress.config.ts',
        supportFile: false,
      })

      expect(ret).to.be.undefined
    })

    it('throws when support file does not exist', async () => {
      try {
        await checkSupportFile({
          configFile: 'cypress.config.ts',
          supportFile: '/this/file/does/not/exist/foo/bar/cypress/support/e2e.js',
        })
      } catch (e) {
        expect(e.message).to.include('The support file is missing or invalid.')
      }
    })
  })
})
