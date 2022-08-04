import * as os from 'os'
import md5 from 'md5'
import Bluebird from 'bluebird'

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

function tmpdir () {
  return os.tmpdir()
}

export default {
  createDeferred,
  hash,
  tmpdir,
}
