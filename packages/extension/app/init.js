const browser = require('webextension-polyfill')
const background = require('./background')

const HOST = 'CHANGE_ME_HOST'
const PATH = 'CHANGE_ME_PATH'

// immediately connect
background.connect(HOST, PATH)

browser.runtime.onMessageExternal.addListener((message) => {
  if (message.host && message.path) {
    return new Promise((resolve) => {
      background.connect(message.host, message.path, {}, resolve)
    })
  }
})
