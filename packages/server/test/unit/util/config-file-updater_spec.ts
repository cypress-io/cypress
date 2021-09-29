import * as path from 'path'
import '../../spec_helper'

import { fs } from '../../../lib/util/fs'
import { insertValuesInConfigFile } from '../../../lib/util/config-file-updater'
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
  })
})
