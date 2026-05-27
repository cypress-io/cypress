import get from 'lodash/get'
import once from 'lodash/once'
import browser from 'webextension-polyfill'

import { connect as clientConnect } from './client'

const checkIfFirefox = async () => {
  if (!browser || !get(browser, 'runtime.getBrowserInfo')) {
    return false
  }

  const { name } = await browser.runtime.getBrowserInfo()

  return name === 'Firefox'
}

const connect = function (host: string, path: string, extraOpts?: any) {
  const listenToCookieChanges = once(() => {
    return browser.cookies.onChanged.addListener((info: any) => {
      if (info.cause !== 'overwrite') {
        return ws.emit('automation:push:request', 'change:cookie', info)
      }
    })
  })

  const listenToDownloads = once(() => {
    browser.downloads.onCreated.addListener((downloadItem: any) => {
      ws.emit('automation:push:request', 'create:download', {
        id: `${downloadItem.id}`,
        filePath: downloadItem.filename,
        mime: downloadItem.mime,
        url: downloadItem.url,
      })
    })

    browser.downloads.onChanged.addListener((downloadDelta: any) => {
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

  const fail = (id: number, err: any) => {
    return ws.emit('automation:response', id, {
      __error: err.message,
      __stack: err.stack,
      __name: err.name,
    })
  }

  const invoke = function (method: string, id: number, ...args: any[]) {
    const respond = (data: any) => {
      return ws.emit('automation:response', id, { response: data })
    }

    return Promise.resolve().then(() => {
      // @ts-expect-error
      return automation[method].apply(automation, args.concat(respond))
    }).catch((err) => {
      return fail(id, err)
    })
  }

  const ws = clientConnect(host, path, extraOpts)

  ws.on('automation:request', (id: number, msg: string, data: any) => {
    switch (msg) {
      case 'reset:browser:state':
        return invoke('resetBrowserState', id)
      default:
        return fail(id, { message: `No handler registered for: '${msg}'` })
    }
  })

  ws.on('automation:config', async (config: any) => {
    const isFirefox = await checkIfFirefox()

    listenToCookieChanges()
    if (isFirefox) {
      // Non-Firefox browsers use CDP for this instead
      listenToDownloads()
    }
  })

  ws.on('connect', () => {
    ws.emit('automation:client:connected')
  })

  return ws
}

export const automation = {
  connect,

  resetBrowserState (fn: any) {
    // We remove browser data. Firefox goes through this path, while chrome goes through cdp automation
    // Note that firefox does not support fileSystems or serverBoundCertificates
    // (https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/browsingData/DataTypeSet).
    return browser.browsingData.remove({}, { cache: true, cookies: true, downloads: true, formData: true, history: true, indexedDB: true, localStorage: true, passwords: true, pluginData: true, serviceWorkers: true }).then(fn)
  },
}
