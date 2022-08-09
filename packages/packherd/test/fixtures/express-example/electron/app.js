const { app, BrowserWindow } = require('electron')
const express = require('express')

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
  })
  win.loadFile('index.html')
  win.toggleDevTools()

  launchExpress()
}

app.whenReady().then(createWindow)

function launchExpress() {
  const app = express()
  const port = 3000
  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
  })
}
