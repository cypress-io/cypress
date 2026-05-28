import path from 'path'
import check from 'syntax-error'
import debugModule from 'debug'
import coffee from 'coffeescript'
import jsonParseBetterErrors from 'json-parse-even-better-errors'
import stripAnsi from 'strip-ansi'
import * as errors from './errors'
import { fs } from './util/fs'
import { globAsync as glob } from './util/glob'
import type { ObjectEncodingOptions } from 'fs-extra'

const debug = debugModule('cypress:server:fixture')

const extensions = [
  '.json',
  '.js',
  '.coffee',
  '.html',
  '.txt',
  '.csv',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.tif',
  '.tiff',
  '.zip',
]

const queue = {}

const friendlyJsonParse = function (s) {
  jsonParseBetterErrors(s) // should throw an error with better formatting

  return JSON.parse(s) // actually parses correctly all the edge cases
}

export async function get (fixturesFolder: string, filePath: string, options: { encoding?: (ObjectEncodingOptions & { flag?: string | undefined }) | BufferEncoding | null | undefined } = {}) {
  const p = path.join(fixturesFolder, filePath)
  const fixture = path.basename(p)

  // if the file exists, go ahead and parse it
  // otherwise, glob for potential extensions

  try {
    await fileExists(p)
    debug('fixture exact name exists', p)

    return parseFile(p, fixture, options)
  } catch (e) {
    if (e.code !== 'ENOENT') {
      throw e
    }

    const pattern = `${p}{${extensions.join(',')}}`

    // @ts-ignore as v8-snapshot package is typechecking this incorrectly
    const matches = await glob(pattern, {
      nosort: true,
      nodir: true,
    })

    if (matches.length === 0) {
      const relativePath = path.relative('.', p)

      // TODO: there's no reason this error should be in
      // the @packages/error list, it should be written in
      // the driver since this error can only occur within
      // driver commands and not outside of the test runner
      const err = errors.get('FIXTURE_NOT_FOUND', relativePath, extensions)

      err.message = stripAnsi(err.message)
      throw err
    }

    debug('fixture matches found, using the first', matches)

    const ext = path.extname(matches[0])

    return parseFile(p + ext, fixture, options)
  }
}

async function fileExists (p: string) {
  const stat = await fs.statAsync(p)

  // check for files, not directories
  // https://github.com/cypress-io/cypress/issues/3739
  if (stat?.isDirectory()) {
    const err = new Error()

    // @ts-expect-error - code isn't typed on Error
    err.code = 'ENOENT'
    throw err
  }
}

async function parseFile (p: string, fixture: string, options: { encoding?: (ObjectEncodingOptions & { flag?: string | undefined }) | BufferEncoding | null } = {}) {
  if (queue[p]) {
    await new Promise<void>((resolve) => setTimeout(resolve, 1))

    return parseFile(p, fixture, options)
  }

  queue[p] = true

  const cleanup = () => {
    return delete queue[p]
  }

  try {
    await fileExists(p)
    const ext = path.extname(p)

    const ret = await parseFileByExtension(p, fixture, ext, options)

    cleanup()

    return ret
  } catch (err) {
    cleanup()
    throw err
  }
}

async function parseFileByExtension (p: string, fixture: string, ext: string, options: { encoding?: (ObjectEncodingOptions & { flag?: string | undefined }) | BufferEncoding | null } = {}) {
  // If an encoding is specified, return the raw file content instead of
  // parsing.
  if (typeof options.encoding !== 'undefined') {
    return parse(p, fixture, options.encoding)
  }

  switch (ext) {
    case '.json': return parseJson(p, fixture)
    case '.js': return parseJs(p, fixture)
    case '.coffee': return parseCoffee(p, fixture)
    case '.html': return parseHtml(p, fixture)
    case '.png': case '.jpg': case '.jpeg': case '.gif': case '.tif': case '.tiff': case '.zip':
      return parse(p, fixture, options.encoding)
    default:
      return parse(p, fixture, options.encoding || 'utf8')
  }
}

async function parseJson (p: string, fixture: string) {
  try {
    const content = await fs.readFileAsync(p, 'utf8')

    return friendlyJsonParse(content)
  } catch (err) {
    throw new Error(`'${fixture}' is not valid JSON.\n${err.message}`)
  }
}

async function parseJs (p: string, fixture: string) {
  try {
    const str = await fs.readFileAsync(p, 'utf8')

    let obj

    try {
      obj = eval(`(${str})`)
    } catch (e) {
      const err = check(str, fixture)

      if (err) {
        throw err
      }

      throw e
    }

    return obj
  } catch (err) {
    throw new Error(`'${fixture}' is not a valid JavaScript object.\n${err.toString()}`)
  }
}

async function parseCoffee (p: string, fixture: string) {
  const dc = process.env.NODE_DISABLE_COLORS

  process.env.NODE_DISABLE_COLORS = '0'

  try {
    const content = await fs.readFileAsync(p, 'utf8')

    const str = coffee.compile(content, { bare: true })

    return eval(str as string)
  } catch (err) {
    throw new Error(`'${fixture} is not a valid CoffeeScript object.\n${err.toString()}`)
  } finally {
    process.env.NODE_DISABLE_COLORS = dc
  }
}

async function parseHtml (p: string, fixture: string) {
  try {
    const content = await fs.readFileAsync(p, 'utf8')

    return content
  } catch (err) {
    throw new Error(`Unable to parse '${fixture}'.\n${err.toString()}`)
  }
}

async function parse (p: string, fixture: string, encoding: (ObjectEncodingOptions & { flag?: string | undefined }) | BufferEncoding | null | undefined) {
  try {
    const content = await fs.readFileAsync(p, encoding)

    return content
  } catch (err) {
    throw new Error(`Unable to parse '${fixture}'.\n${err.toString()}`)
  }
}
