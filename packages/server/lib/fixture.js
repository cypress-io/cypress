const path = require('path')
const check = require('syntax-error')
const debug = require('debug')('cypress:server:fixture')
const coffee = require('coffeescript')
const Promise = require('bluebird')
const jsonlint = require('jsonlint')
const errors = require('./errors')
const { fs } = require('./util/fs')
const glob = require('./util/glob')

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
  jsonlint.parse(s) // might throw good error

  return JSON.parse(s) // actually parses correctly all the edge cases
}

module.exports = {
  get (fixturesFolder, filePath, options = {}) {
    const p = path.join(fixturesFolder, filePath)
    const fixture = path.basename(p)

    // if the file exists, go ahead and parse it
    // otherwise, glob for potential extensions
    return this.fileExists(p)
    .then(function () {
      debug('fixture exact name exists', p)

      return this.parseFile(p, fixture, options)
    }).catch(function (e) {
      if (e.code !== 'ENOENT') {
        throw e
      }

      const pattern = `${p}{${extensions.join(',')}}`

      return glob(pattern, {
        nosort: true,
        nodir: true,
      }).bind(this)
      .then(function (matches) {
        if (matches.length === 0) {
          const relativePath = path.relative('.', p)

          errors.throw('FIXTURE_NOT_FOUND', relativePath, extensions)
        }

        debug('fixture matches found, using the first', matches)

        const ext = path.extname(matches[0])

        return this.parseFile(p + ext, fixture, options)
      })
    })
  },

  fileExists (p) {
    return fs.statAsync(p).bind(this)
    .then((stat) => {
      // check for files, not directories
      // https://github.com/cypress-io/cypress/issues/3739
      if (stat.isDirectory()) {
        const err = new Error()

        err.code = 'ENOENT'
        throw err
      }
    })
  },

  parseFile (p, fixture, options) {
    if (queue[p]) {
      return Promise.delay(1).then(() => {
        return this.parseFile(p, fixture, options)
      })
    }

    queue[p] = true

    const cleanup = () => {
      return delete queue[p]
    }

    return this.fileExists(p)
    .then(function () {
      const ext = path.extname(p)

      return this.parseFileByExtension(p, fixture, ext, options)
    }).then((ret) => {
      cleanup()

      return ret
    }).catch((err) => {
      cleanup()

      throw err
    })
  },

  parseFileByExtension (p, fixture, ext, options = {}) {
    // https://github.com/cypress-io/cypress/issues/1558
    // If the user explicitly specifies `null` as the encoding, we treat the
    // file as binary regardless of extension. We base64 encode them for
    // transmission over the websocket. There is a matching Buffer.from()
    // in packages/driver/src/cy/commands/fixtures.ts
    if (options.encoding === null) {
      return this.parse(p, fixture)
    }

    switch (ext) {
      case '.json': return this.parseJson(p, fixture)
      case '.js': return this.parseJs(p, fixture)
      case '.coffee': return this.parseCoffee(p, fixture)
      case '.html': return this.parseHtml(p, fixture)
      case '.png': case '.jpg': case '.jpeg': case '.gif': case '.tif': case '.tiff': case '.zip':
        return this.parse(p, fixture, options.encoding)
      default:
        return this.parse(p, fixture, options.encoding || 'utf8')
    }
  },

  parseJson (p, fixture) {
    return fs.readFileAsync(p, 'utf8')
    .bind(this)
    .then(friendlyJsonParse)
    .catch((err) => {
      throw new Error(`'${fixture}' is not valid JSON.\n${err.message}`)
    })
  },

  parseJs (p, fixture) {
    return fs.readFileAsync(p, 'utf8')
    .bind(this)
    .then((str) => {
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
    }).catch((err) => {
      throw new Error(`'${fixture}' is not a valid JavaScript object.\n${err.toString()}`)
    })
  },

  parseCoffee (p, fixture) {
    const dc = process.env.NODE_DISABLE_COLORS

    process.env.NODE_DISABLE_COLORS = '0'

    return fs.readFileAsync(p, 'utf8')
    .bind(this)
    .then((str) => {
      str = coffee.compile(str, { bare: true })

      return eval(str)
    }).catch((err) => {
      throw new Error(`'${fixture} is not a valid CoffeeScript object.\n${err.toString()}`)
    }).finally(() => {
      return process.env.NODE_DISABLE_COLORS = dc
    })
  },

  parseHtml (p, fixture) {
    return fs.readFileAsync(p, 'utf8')
    .bind(this)
    .catch((err) => {
      throw new Error(`Unable to parse '${fixture}'.\n${err.toString()}`)
    })
  },

  parse (p, fixture, encoding) {
    return fs.readFileAsync(p, encoding)
    .bind(this)
    .catch((err) => {
      throw new Error(`Unable to parse '${fixture}'.\n${err.toString()}`)
    })
  },
}
