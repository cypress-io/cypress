import _ from 'lodash'
import * as path from 'path'
import keys from './util/keys'
import { fs } from './util/fs'
import Debug from 'debug'

import { options } from './config_options'

const debug = Debug('cypress:server:config_utils')

const folders = _(options).filter({ isFolder: true }).map('name').value()

export const CYPRESS_SPECIAL_ENV_VARS = [
  'RECORD_KEY',
]

/**
 * takes an array and creates an index object of [keyKey]: [valueKey]
 */
export const createIndex = (arr, keyKey, valueKey) => {
  return _.reduce(arr, (memo, item) => {
    if (item[valueKey] !== undefined) {
      memo[item[keyKey]] = item[valueKey]
    }

    return memo
  }, {})
}

export function resolveModule (name) {
  return require.resolve(name)
}

// tries to find support or plugins file
// returns:
//   false - if the file should not be set
//   string - found filename
//   null - if there is an error finding the file
export function discoverModuleFile (options) {
  debug('discover module file %o', options)
  const { filename, isDefault } = options

  if (!isDefault) {
    // they have it explicitly set, so it should be there
    return fs.pathExists(filename)
    .then((found) => {
      if (found) {
        debug('file exists, assuming it will load')

        return filename
      }

      debug('could not find %o', { filename })

      return null
    })
  }

  // support or plugins file doesn't exist on disk?
  debug(`support file is default, check if ${path.dirname(filename)} exists`)

  return fs.pathExists(filename)
  .then((found) => {
    if (found) {
      debug('is there index.ts in the support or plugins folder %s?', filename)
      const tsFilename = path.join(filename, 'index.ts')

      return fs.pathExists(tsFilename)
      .then((foundTsFile) => {
        if (foundTsFile) {
          debug('found index TS file %s', tsFilename)

          return tsFilename
        }

        // if the directory exists, set it to false so it's ignored
        debug('setting support or plugins file to false')

        return false
      })
    }

    debug('folder does not exist, set to default index.js')

    // otherwise, set it up to be scaffolded later
    return path.join(filename, 'index.js')
  })
}

export const convertRelativeToAbsolutePaths = (projectRoot, obj, defaults = {}) => {
  return _.reduce(folders, (memo, folder) => {
    const val = obj[folder]

    if ((val != null) && (val !== false)) {
      memo[folder] = path.resolve(projectRoot, val)
    }

    return memo
  }
  , {})
}

export const hideSpecialVals = function (val, key) {
  if (_.includes(CYPRESS_SPECIAL_ENV_VARS, key)) {
    return keys.hide(val)
  }

  return val
}
