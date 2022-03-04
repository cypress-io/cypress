import { relative, resolve } from 'pathe'
import { promises as fsp } from 'fs'
import { decode, isSamePath } from 'ufo'
import { parse, join } from 'path'
import debugFn from 'debug'
import type { Connect, ViteDevServer } from 'vite'
import { normalizePath } from 'vite'
// import { commonSpecExtensions } from '../constants'
import { IncomingMessage, ServerResponse } from 'http'
import { pathToFileURL } from 'url'

const debug = debugFn('cypress:vite-dev-server:server')

export type RequestType = 'index' | '404' | 'current-spec' | 'module'

// TODO: pass this into each dev server in the options
const specHeader = '__cypress_spec_path'
const iframeRoute = '/__cypress/iframes/'

const matchRequest = (req, specs): RequestType => {
  // const url = req.originalUrl
  // const normalizedUrl = normalizePath(decode(url))

  debug('from original url', req.originalUrl)
  debug('with headers', req.headers)

  // Cypress proxies all requests through index.html using different headers
  // If the route matches index.html it can mean two things:
  // 1. Cypress is trying to load a spec (spec header will not be present)
  // 2. The user is requesting the server from their browser (header is present)

  if (isCypressSpecRequest(req)) {
    if (getCurrentSpecFile(req, specs)) {
      debug('is current spec')

      return 'current-spec'
    }
  }

  // const isIndex = isSamePath(normalizedUrl, '/index.html') || isSamePath(normalizedUrl, '/')

  // if (isIndex) return 'index'
  debug('is module')

  return 'module'
}

const cleanSpecFileName = (file) => {
  if (typeof file === 'string') file = parse(file)

  let cleanPath

  // commonSpecExtensions.some((extension) => {
  //   if (file.name.endsWith(extension)) {
  //     cleanPath = join(`/${ file.dir}`, file.name.slice(0, -extension.length))

  //     return true
  //   }
  // })

  return cleanPath
}

const isRequestFromWithinCyIframe = (req) => {
  return req.headers.referer.includes(iframeRoute)
}

const isCypressSpecRequest = (req) => {
  if (req.headers[specHeader]) return true

  return false
}

const getSpecPathFromHeader = (req): string | null => {
  const specPaths = req.headers[specHeader]

  if (specPaths) {
    return Array.isArray(specPaths) ? specPaths[0] : specPaths
  }

  return null
}

const getCurrentSpecFile = (req, specs: Cypress.DevServerConfig['specs']) => {
  // Route by header (Cypress does this when it forwards on the request to the dev server)
  const specPaths = req.headers['__cypress_spec_path']

  if (specPaths) {
    debug('spec paths', specPaths)

    return Array.isArray(specPaths) ? specPaths[0] : specPaths
  }

  // Route by url (You, navigating to your browser)
  // return specs.find((spec) => {
  //   if (isSamePath(`/${spec.relative}`, decode(req.originalUrl))) return false

  //   debug('clean spec file name', cleanSpecFileName(parse(spec.relative)))
  //   debug('normalizePath', normalizePath(decode(req.originalUrl)))
  //   debug('decode', decode(req.originalUrl))

  //   return isSamePath(cleanSpecFileName(parse(spec.relative)), normalizePath(decode(url)))
  // })?.absolute
}

export class CypressViteDevServer {
  server: ViteDevServer
  options: Cypress.DevServerConfig
  _template?: string
  _client?: string

  constructor (server: ViteDevServer, options: Cypress.DevServerConfig) {
    debug('Setting up Cypress\'s Vite plugin')

    this.options = options
    this.server = server
    this.getTemplate()
    this.getClient()
  }

  async getTemplate () {
    const indexHtmlPath = resolve('index.html')

    this._template = await fsp.readFile(indexHtmlPath, 'utf-8')
    debug('Loaded html template successfully from', indexHtmlPath)

    return this._template
  }

  async getClient () {
    const clientPath = resolve(process.cwd(), join('client', 'initCypressTests.js'))

    this._client = await fsp.readFile(clientPath, 'utf-8')
    debug('Loaded client successfully from', clientPath)

    return this._client
  }

  /**
   * Route matching and handling.
   *
   * There are 4 cases to cover
   * 1. User loads the site's index.
   * 2. User is trying to run a spec from Cypress.
   * 3. User is trying to visit a resource that does not exist.
   * 4. User is trying to visit an HTML page that does not exist.
   */

  handleAllRoutes (req: Connect.IncomingMessage, res: ServerResponse, next: Function) {
    if (isCypressSpecRequest(req)) {
      // We're going to request the same route with the same headers,
      // But from this time, it'll be inside of the iframe.
      if (isRequestFromWithinCyIframe(req)) {
        return next()
      }

      // If you request a non-existent from top, you'll end up here...
      // That's not great :/
      return this.handleCurrentSpecRoute(req, res)
    }

    return next()
  }

  getCurrentSpecFile (req) {
    const specPaths = req.headers['__cypress_spec_path']

    if (specPaths) {
      debug('spec paths', specPaths)

      const absolutePath = Array.isArray(specPaths) ? specPaths[0] : specPaths

      return this.options.specs.find((s) => {
        return s.absolute === absolutePath
      })
    }
  }

  getSupportFile () {
    const supportFile = this.options.config.supportFile

    if (supportFile) {
      return relative(this.options.config.projectRoot, supportFile)
    }
  }

  // When the user requests `/` and is not trying to load a spec
  async handleIndexRoute (req, res) {
    return res.end(await this.server.transformIndexHtml(req.originalUrl, `<html><body><h1>Hello Index</h1></body></html>`, req.originalUrl))
  }

  async handleCurrentSpecRoute (req, res) {
    const specFile = this.getCurrentSpecFile(req)
    const supportFile = this.getSupportFile()

    if (!specFile) {
      throw new Error('Attempted to resolve request to Vite Dev Server, but no specs were found. Re-run Cypress with `DEBUG=cypress:vite-dev-server:*` for more details')
    }

    let client = '<script type="module">'

    if (supportFile) client += `await import('/${supportFile}');`

    client += `await import('/${specFile.relative}');`
    client += `;(function () { ${await this.getClient()} })()`

    const html = (await this.getTemplate()).replace('</body>', `${client}</script></body>`)

    const ret = await this.server.transformIndexHtml(req.url, html, req.originalUrl)

    return res.end(ret)
  }

  // When the user requests `/does-not-exist`
  handle404 (req, res) {
    debug('res end 404')

    return res.end(`<html><body>404!</body></html>`)
  }
}
