import { promises as fsp } from 'fs'
import { decode, isSamePath } from 'ufo'
import { resolve } from 'path'
import debugFn from 'debug'
import type { ViteDevServer } from 'vite'
import { normalizePath } from 'vite'

const debug = debugFn('cypress:vite-dev-server:server')

export type RequestType = 'index' | '404' | 'spec' | 'module'

const matchRequest = (url: string, files): RequestType => {
  const normalizedUrl = normalizePath(decode(url))
  const isIndex = isSamePath(normalizedUrl, '/index.html') || isSamePath(normalizedUrl, '/')

  if (isIndex) return 'index'

  return 'spec'
}

export class CypressViteDevServer {
  server: ViteDevServer
  indexHtmlPath: string
  template?: string

  constructor (server: ViteDevServer) {
    debug('Setting up Cypress\'s Vite plugin')

    this.server = server
    this.indexHtmlPath = resolve('index.html')

    debug('Resolved html path at', this.indexHtmlPath)
  }

  async loadTemplate () {
    if (this.template) {
      debug('The html template has already been loaded. It was loaded from', this.indexHtmlPath)

      return this.template
    }

    this.template = await fsp.readFile(this.indexHtmlPath, 'utf-8')
    debug('Loaded html template successfully')

    return this.template
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

  // When the user requests `/` and is not trying to load a spec
  handleIndexRoute () {

  }

  // When the user requests `/does-not-exist`
  handle404 () {
  }
}
