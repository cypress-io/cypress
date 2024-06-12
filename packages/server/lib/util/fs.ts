/* eslint-disable no-console */

import Bluebird from 'bluebird'
import fsExtra from 'fs-extra'

type Promisified<T extends (...args: any) => any>
  = (...params: Parameters<T>) => Bluebird<ReturnType<T>>

interface PromisifiedFsExtra {
  statAsync: (path: string | Buffer) => Bluebird<ReturnType<typeof fsExtra.statSync>>
  removeAsync: Promisified<typeof fsExtra.removeSync>
  readFileAsync: Promisified<typeof fsExtra.readFileSync>
  writeFileAsync: Promisified<typeof fsExtra.writeFileSync>
  pathExistsAsync: Promisified<typeof fsExtra.pathExistsSync>
}

export const fs = Bluebird.promisifyAll(fsExtra) as PromisifiedFsExtra & typeof fsExtra
