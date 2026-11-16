import Debug from 'debug'
import _ from 'lodash'
import path from 'path'
import { fs } from '../util/fs'
import * as errors from '../errors'

const debug = Debug('cypress:server:settings')

function configCode (obj) {
  const objJSON = obj && !_.isEmpty(obj)
    ? JSON.stringify(_.omit(obj, 'configFile'), null, 2)
    : `{

}`

  return `module.exports = ${objJSON}
`
}

export function writeForTesting (projectRoot: string, objToWrite = {}) {
  const file = path.join(projectRoot, 'cypress.config.js')

  debug('writing config file %s', file)

  return fs.writeFileAsync(file, configCode(objToWrite))
  .then(() => objToWrite)
  .catch((err) => {
    const e = errors.get('ERROR_WRITING_FILE', file, err)

    e.code = err.code
    e.errno = err.errno

    throw e
  })
}
