const get = require('lodash/get')
const once = require('lodash/once')
const browser = require('webextension-polyfill')

const client = require('./client')

// temporary work around to try and 'patch' resource type since it is missing in BiDi
const EXTENSION_TO_CDP_RESOURCE_TYPE_MAP = {
  main_frame: 'document',
  sub_frame: 'document',
  // we get the 'xhr' / 'fetch' resource type from the resourceTypeAndCredentialManager since we are patching fetch and xhr.
  // mark this as other for now
  xmlhttprequest: 'other',
  websocket: 'websocket',
  stylesheet: 'stylesheet',
  xslt: 'stylesheet',
  script: 'script',
  image: 'image',
  imageset: 'image',
  font: 'font',
  csp_report: 'cspviolationreport',
  ping: 'ping',
  web_manifest: 'manifest',
  beacon: 'other',
  media: 'other',
  object: 'other',
  object_subrequest: 'other',
  speculative: 'other',
  xml_dtd: 'other',
}

const checkIfFirefox = async () => {
  if (!browser || !get(browser, 'runtime.getBrowserInfo')) {
    return false
  }

  const { name } = await browser.runtime.getBrowserInfo()

  return name === 'Firefox'
}

const connect = function (host, path, extraOpts) {
  const listenToCookieChanges = once(() => {
    return browser.cookies.onChanged.addListener((info) => {
      if (info.cause !== 'overwrite') {
        return ws.emit('automation:push:request', 'change:cookie', info)
      }
    })
  })

  const listenToDownloads = once(() => {
    browser.downloads.onCreated.addListener((downloadItem) => {
      ws.emit('automation:push:request', 'create:download', {
        id: `${downloadItem.id}`,
        filePath: downloadItem.filename,
        mime: downloadItem.mime,
        url: downloadItem.url,
      })
    })

    browser.downloads.onChanged.addListener((downloadDelta) => {
      const state = (downloadDelta.state || {}).current

      if (state === 'complete') {
        ws.emit('automation:push:request', 'complete:download', {
          id: `${downloadDelta.id}`,
        })
      }

      if (state === 'canceled') {
        ws.emit('automation:push:request', 'canceled:download', {
          id: `${downloadDelta.id}`,
        })
      }
    })
  })

  // TODO: intercept all types here. gate this behind shouldUseBiDi
  const listenToOnBeforeHeaders = once(() => {
    // adds a header to the request to mark it as a request for the AUT frame
    // itself, so the proxy can utilize that for injection purposes
    browser.webRequest.onBeforeSendHeaders.addListener((details) => {
      const modifiedHeaders = {
        requestHeaders: [
          ...details.requestHeaders,
          {
            name: 'X-Cypress-Resource-Type',
            value: EXTENSION_TO_CDP_RESOURCE_TYPE_MAP[details.type],
          },
        ],
      }

      return modifiedHeaders
    }, { urls: ['<all_urls>'] }, ['blocking', 'requestHeaders'])
  })

  const ws = client.connect(host, path, extraOpts)

  ws.on('automation:config', async (config) => {
    const isFirefox = await checkIfFirefox()

    listenToCookieChanges()
    // Non-Firefox browsers use CDP for these instead
    if (isFirefox) {
      listenToDownloads()
      listenToOnBeforeHeaders()
    }
  })

  ws.on('connect', () => {
    ws.emit('automation:client:connected')
  })

  return ws
}

const automation = {
  connect,
}

module.exports = automation
