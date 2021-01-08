/* eslint-disable no-console */

import fs from 'fs-extra'
import Promise from 'bluebird'

type Promisified<T extends (...args: any) => any>
  = (...params: Parameters<T>) => Promise<ReturnType<T>>

interface PromisifiedFsExtra {
  statAsync: (path: string | Buffer) => Promise<ReturnType<typeof fs.statSync>>
  removeAsync: Promisified<typeof fs.removeSync>
  writeFileAsync: Promisified<typeof fs.writeFileSync>
}

// warn users if somehow synchronous file methods are invoked
// these methods due to "too many files" errors are a huge pain
const warnOnSyncFileSystem = () => {
  console.error('WARNING: fs sync methods can fail due to EMFILE errors')
  console.error('Cypress only works reliably when ALL fs calls are async')

  return console.error('You should modify these sync calls to be async')
}

const topLines = (from, n, text) => {
  return text.split('\n').slice(from, n).join('\n')
}

// just hide this function itself
// stripping top few lines of the stack
const getStack = () => {
  const err = new Error()

  return topLines(3, 10, err.stack)
}

const addSyncFileSystemWarnings = (fs) => {
  const oldExistsSync = fs.existsSync

  fs.existsSync = (filename) => {
    warnOnSyncFileSystem()
    console.error(getStack())

    return oldExistsSync(filename)
  }
}

addSyncFileSystemWarnings(fs)

const promisifiedFs = Promise.promisifyAll(fs) as PromisifiedFsExtra & typeof fs

export = {
  fs: promisifiedFs,
}
