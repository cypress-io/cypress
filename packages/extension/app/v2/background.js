const get = require('lodash/get')
const once = require('lodash/once')
const browser = require('webextension-polyfill')

const client = require('./client')

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

  const ws = client.connect(host, path, extraOpts)

  ws.on('automation:config', async (config) => {
    const isFirefox = await checkIfFirefox()

    listenToCookieChanges()
    // Non-Firefox browsers use CDP for these instead
    if (isFirefox) {
      listenToDownloads()
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
