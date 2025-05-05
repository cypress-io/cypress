/* eslint-disable no-console */

import Bluebird from 'bluebird'
import fsExtra from 'fs-extra'
import sanitize from 'sanitize-filename'
import path from 'path'
import _ from 'lodash'

const RUNNABLE_SEPARATOR = ' -- '
const pathSeparatorRe = /[\\\/]/g

// many filesystems limit filename length to 255 bytes/characters, so truncate the filename to
// the smallest common denominator of safe filenames, which is 255 bytes. when ENAMETOOLONG
// errors are encountered, `maxSafeBytes` will be decremented to at most `MIN_PREFIX_BYTES`, at
// which point the latest ENAMETOOLONG error will be emitted.
// @see https://en.wikipedia.org/wiki/Comparison_of_file_systems#Limits
let maxSafeBytes = Number(process.env.CYPRESS_MAX_SAFE_FILENAME_BYTES) || 254
const MIN_PREFIX_BYTES = 64

type Promisified<T extends (...args: any) => any>
  = (...params: Parameters<T>) => Bluebird<ReturnType<T>>

interface PromisifiedFsExtra {
  statAsync: (path: string | Buffer) => Bluebird<ReturnType<typeof fsExtra.statSync>>
  removeAsync: Promisified<typeof fsExtra.removeSync>
  readFileAsync: Promisified<typeof fsExtra.readFileSync>
  writeFileAsync: Promisified<typeof fsExtra.writeFileSync>
  pathExistsAsync: Promisified<typeof fsExtra.pathExistsSync>
  outputFileAsync: Promisified<typeof fsExtra.outputFileSync>
}

interface Clip {
  x: number
  y: number
  width: number
  height: number
}

export type ScreenshotsFolder = string | false | undefined

// TODO: This is likely not representative of the entire Type and should be updated
export interface Data {
  specName: string
  name: string
  startTime: Date
  viewport: {
    width: number
    height: number
  }
  titles?: string[]
  testFailure?: boolean
  overwrite?: boolean
  simple?: boolean
  current?: number
  total?: number
  testAttemptIndex?: number
  appOnly?: boolean
  hideRunnerUi?: boolean
  clip?: Clip
  userClip?: Clip
}

export const fs = Bluebird.promisifyAll(fsExtra) as PromisifiedFsExtra & typeof fsExtra

const ensureSafePath = async function (withoutExt: string, extension: string | null, overwrite: boolean | undefined, num: number = 0): Promise<string> {
  const suffix = `${(num && !overwrite) ? ` (${num})` : ''}.${extension}`

  const maxSafePrefixBytes = maxSafeBytes - suffix.length
  const filenameBuf = Buffer.from(path.basename(withoutExt))

  if (filenameBuf.byteLength > maxSafePrefixBytes) {
    const truncated = filenameBuf.slice(0, maxSafePrefixBytes).toString()

    withoutExt = path.join(path.dirname(withoutExt), truncated)
  }

  const fullPath = [withoutExt, suffix].join('')

  return fs.pathExists(fullPath)
  .then((found) => {
    if (found && !overwrite) {
      return ensureSafePath(withoutExt, extension, overwrite, num + 1)
    }

    // path does not exist, attempt to create it to check for an ENAMETOOLONG error
    return fs.outputFileAsync(fullPath, '')
    .then(() => fullPath)
    .catch((err) => {
      if (err.code === 'ENAMETOOLONG' && maxSafePrefixBytes >= MIN_PREFIX_BYTES) {
        maxSafeBytes -= 1

        return ensureSafePath(withoutExt, extension, overwrite, num)
      }

      throw err
    })
  })
}

const sanitizeToString = (title: any, idx: number, arr: Array<string>) => {
  // test titles may be values which aren't strings like
  // null or undefined - so convert before trying to sanitize
  return sanitize(_.toString(title))
}

export const getPath = async function (data: Data, ext: string | null, screenshotsFolder: ScreenshotsFolder, overwrite: boolean | undefined): Promise<string> {
  let names
  const specNames = (data.specName || '')
  .split(pathSeparatorRe)

  if (data.name) {
    names = data.name.split(pathSeparatorRe).map(sanitizeToString)
  } else {
    // we put this in array so to match with type of the if branch above
    names = [_
    .chain(data.titles)
    .map(sanitizeToString)
    .join(RUNNABLE_SEPARATOR)
    .value()]
  }

  const index = names.length - 1

  // append '(failed)' to the last name
  if (data.testFailure) {
    names[index] = `${names[index]} (failed)`
  }

  if (data.testAttemptIndex && data.testAttemptIndex > 0) {
    names[index] = `${names[index]} (attempt ${data.testAttemptIndex + 1})`
  }

  let withoutExt

  if (screenshotsFolder) {
    withoutExt = path.join(screenshotsFolder, ...specNames, ...names)
  } else {
    withoutExt = path.join(...specNames, ...names)
  }

  return await ensureSafePath(withoutExt, ext, overwrite)
}
