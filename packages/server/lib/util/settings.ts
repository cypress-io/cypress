import _ from 'lodash'
import path from 'path'
import errors from '../errors'
import { fs } from '../util/fs'
import Debug from 'debug'
import type { SettingsOptions } from '@packages/types'
import { getCtx } from '@packages/data-context'

const debug = Debug('cypress:server:settings')

function configCode (obj, isTS?: boolean) {
  const objJSON = obj && !_.isEmpty(obj)
    ? JSON.stringify(_.omit(obj, 'configFile'), null, 2)
    : `{

}`

  if (isTS) {
    return `export default ${objJSON}`
  }

  return `module.exports = ${objJSON}
`
}

function _err (type, file, err) {
  const e = errors.get(type, file, err)

  e.code = err.code
  e.errno = err.errno

  return e
}

function _logWriteErr (file, err) {
  throw _err('ERROR_WRITING_FILE', file, err)
}

function _write (file, obj: any = {}) {
  if (/\.json$/.test(file)) {
    debug('writing json file')

    return fs.outputJson(file, obj, { spaces: 2 })
    .then(() => obj)
    .catch((err) => {
      return _logWriteErr(file, err)
    })
  }

  debug('writing javascript file')

  const fileExtension = file?.split('.').pop()

  const isTSFile = fileExtension === 'ts'

  return fs.writeFileAsync(file, configCode(obj, isTSFile))
  .return(obj)
  .catch((err) => {
    return _logWriteErr(file, err)
  })
}

export function isComponentTesting (options: SettingsOptions = {}) {
  return options.testingType === 'component'
}

export async function read (projectRoot: string) {
  const ctx = getCtx()

  // For testing purposes, no-op if the projectRoot is already the same
  // as the one set in the DataContext, as it would be in normal execution
  ctx.lifecycleManager.setCurrentProject(projectRoot)

  return ctx.lifecycleManager.getConfigFileContents()
}

export async function readEnv (projectRoot: string) {
  const ctx = getCtx()

  // For testing purposes, no-op if the projectRoot is already the same
  // as the one set in the DataContext, as it would be in normal execution
  ctx.lifecycleManager.setCurrentProject(projectRoot)

  return ctx.lifecycleManager.loadCypressEnvFile()
}

export function writeForTesting (projectRoot, objToWrite = {}) {
  const file = path.join(projectRoot, 'cypress.config.js')

  return _write(file, objToWrite)
}

export function pathToConfigFile (projectRoot) {
  const ctx = getCtx()

  ctx.lifecycleManager.setCurrentProject(projectRoot)

  return ctx.lifecycleManager.configFilePath
}
