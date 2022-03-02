import { promises as fsp } from 'fs'
import { decode, isSamePath } from 'ufo'
import { parse, join, resolve } from 'path'
import debugFn from 'debug'
import type { ViteDevServer } from 'vite'
import { normalizePath } from 'vite'
import { commonSpecExtensions } from '../constants'

const debug = debugFn('cypress:vite-dev-server:server')

export type RequestType = 'index' | '404' | 'current-spec' | 'module'

const matchRequest = (url: string, specs): RequestType => {
  const normalizedUrl = normalizePath(decode(url))
  const isIndex = isSamePath(normalizedUrl, '/index.html') || isSamePath(normalizedUrl, '/')

  if (isIndex) return 'index'

  if (getCurrentSpecFile(url, specs)) return 'current-spec'

  return 'module'
}

const cleanSpecFileName = (file) => {
  if (typeof file === 'string') file = parse(file)

  let cleanPath

  commonSpecExtensions.some((extension) => {
    if (file.name.endsWith(extension)) {
      cleanPath = join(`/${ file.dir}`, file.name.slice(0, -extension.length))

      return true
    }
  })

  return cleanPath
}

const getCurrentSpecFile = (url: string, specs: any[]) => {
  return specs.find((spec) => {
    if (isSamePath(`/${ spec}`, decode(url))) return false

    return isSamePath(cleanSpecFileName(parse(spec)), normalizePath(decode(url)))
  })
}

export class CypressViteDevServer {
  server: ViteDevServer
  indexHtmlPath: string
  _template?: string
  specs: any[]

  constructor (server: ViteDevServer, specs) {
    debug('Setting up Cypress\'s Vite plugin')

    this.specs = specs
    this.server = server
    this.indexHtmlPath = resolve('index.html')
    this.getTemplate()

    debug('Resolved html path at', this.indexHtmlPath)
  }

  async getTemplate () {
    if (this._template) {
      debug('The html template has already been loaded. It was loaded from', this.indexHtmlPath)

      return this._template
    }

    this._template = await fsp.readFile(this.indexHtmlPath, 'utf-8')
    debug('Loaded html template successfully')

    return this._template
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

  handleAllRoutes (req, res, next) {
    const matched = matchRequest(req.originalUrl, this.specs)

    if (matched === 'index') return this.handleIndexRoute(req, res)

    if (matched === 'current-spec') return this.handleCurrentSpecRoute(req, res)

    return next()
  }

  // When the user requests `/` and is not trying to load a spec
  async handleIndexRoute (req, res) {
    return res.end(await this.server.transformIndexHtml(req.url, `<html><body><h1>Hello Index</h1></body></html>`, req.originalUrl))
  }

  async handleCurrentSpecRoute (req, res) {
    const html = (await this.getTemplate()).replace('</body>', `
      <script src="./${getCurrentSpecFile(req, res)}"></script>
      </body>
    `)

    return res.end(await this.server.transformIndexHtml(req.url, html))
  }

  // When the user requests `/does-not-exist`
  handle404 (req, res) {
    return res.end(`<html><body>404!</body></html>`)
  }
}
