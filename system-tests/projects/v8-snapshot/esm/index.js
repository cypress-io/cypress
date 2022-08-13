'use strict'
exports.__esModule = true

const { app, BrowserWindow } = require('electron')
const { start } = require('./entry.mjs')

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  win.loadFile('index.html')
  // @ts-ignore
  win.toggleDevTools()

  const isObjectLike = require('lodash/isObjectLike')
  const res = isObjectLike({ a: 1, b: 2 })

  console.log(res)
}

if (app != null) {
  start()
  app.whenReady().then(createWindow)
} else {
  start()
}
