import _ from 'lodash'
import * as os from 'os'
import path from 'path'
import md5 from 'md5'
import Bluebird from 'bluebird'
import fs from 'fs-extra'

function createDeferred<T> () {
  let resolve: (thenableOrResult?: T | PromiseLike<T> | undefined) => void
  let reject: any
  const promise = new Bluebird<T>(function (_resolve, _reject) {
    resolve = _resolve
    reject = _reject
  })

  return {
    //@ts-ignore
    resolve,
    reject,
    promise,
  }
}

function hash (contents: string) {
  return md5(contents)
}

function rmdir (dirPath: string) {
  return fs.emptyDir(dirPath)
}

function tmpdir (dirname?: string) {
  const pathParts = _.compact([os.tmpdir(), 'cypress', 'webpack-preprocessor', dirname])

  return path.join(...pathParts)
}

export default {
  createDeferred,
  hash,
  rmdir,
  tmpdir,
}
