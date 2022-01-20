import path from 'path'
import Debug from 'debug'
import { Router } from 'express'

import AppData from './util/app_data'
import CacheBuster from './util/cache_buster'
import specController from './controllers/spec'
import reporter from './controllers/reporter'
import client from './controllers/client'
import type { InitializeRoutes } from './routes'

const debug = Debug('cypress:server:routes-e2e')

export const createRoutesE2E = ({
  config,
  networkProxy,
  onError,
}: InitializeRoutes) => {
  const routesE2E = Router()

  // routing for the actual specs which are processed automatically
  // this could be just a regular .js file or a .coffee file
  routesE2E.get(`/${config.namespace}/tests`, (req, res, next) => {
    // slice out the cache buster
    const test = CacheBuster.strip(req.query.p)

    specController.handle(test, req, res, config, next, onError)
  })

  routesE2E.get(`/${config.namespace}/socket.io.js`, (req, res) => {
    client.handle(req, res)
  })

  routesE2E.get(`/${config.namespace}/reporter/*`, (req, res) => {
    reporter.handle(req, res)
  })

  routesE2E.get(`/${config.namespace}/automation/getLocalStorage`, (req, res) => {
    // gathers and sends localStorage and sessionStorage via postMessage to the Cypress frame
    // detect existence of local/session storage with JSON.stringify(...).length since localStorage.length may not be accurate
    res.send(`<html><body><script>(${(function () {
      const _localStorageStr = JSON.stringify(window.localStorage)
      const _localStorage = _localStorageStr.length > 2 && JSON.parse(_localStorageStr)
      const _sessionStorageStr = JSON.stringify(window.sessionStorage)
      const _sessionStorage = _sessionStorageStr.length > 2 && JSON.parse(JSON.stringify(window.sessionStorage))

      const value = {} as any

      if (_localStorage) {
        value.localStorage = _localStorage
      }

      if (_sessionStorage) {
        value.sessionStorage = _sessionStorage
      }

      window.parent.postMessage({
        value,
        type: 'localStorage',
      }, '*')
    }).toString()})()</script></body></html>`)
  })

  /* eslint-disable no-undef */
  routesE2E.get(`/${config.namespace}/automation/setLocalStorage`, (req, res) => {
    const origin = req.originalUrl.slice(req.originalUrl.indexOf('?') + 1)

    networkProxy.http.getRenderedHTMLOrigins()[origin] = true
    res.send(`<html><body><script>(${(function () {
      window.onmessage = function (event) {
        const msg = event.data

        if (msg.type === 'set:storage:data') {
          const { data } = msg

          const setData = (storageData, type) => {
            if (!storageData) return

            const { clear, value } = storageData

            if (clear) {
              // @ts-ignore
              window[type].clear()
            }

            if (value) {
              Object.keys(value).forEach((key) => {
                // @ts-ignore
                window[type].setItem(key, value[key])
              })
            }
          }

          setData(data.localStorage, 'localStorage')
          setData(data.sessionStorage, 'sessionStorage')

          window.parent.postMessage({ type: 'set:storage:complete' }, '*')
        }
      }

      window.parent.postMessage({ type: 'set:storage:load' }, '*')
    }).toString()})()</script></body></html>`)
  })
  /* eslint-enable no-undef */

  routesE2E.get(`/${config.namespace}/source-maps/:id.map`, (req, res) => {
    networkProxy.handleSourceMapRequest(req, res)
  })

  // special fallback - serve local files from the project's root folder
  routesE2E.get('/__root/*', (req, res) => {
    const file = path.join(config.projectRoot, req.params[0])

    res.sendFile(file, { etag: false })
  })

  // special fallback - serve dist'd (bundled/static) files from the project path folder
  routesE2E.get(`/${config.namespace}/bundled/*`, (req, res) => {
    const file = AppData.getBundledFilePath(config.projectRoot, path.join('src', req.params[0]))

    debug(`Serving dist'd bundle at file path: %o`, { path: file, url: req.url })

    res.sendFile(file, { etag: false })
  })

  return routesE2E
}
