const { app, BrowserWindow } = require('electron')

let express

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
  win.toggleDevTools()

  loadExpress()
  launchExpress()
}

if (app != null) {
  app.whenReady().then(createWindow)
} else {
  loadExpress()
  launchExpress()
}

function loadExpress () {
  console.time('init-express')
  console.time('load-express')
  express = require('express')
  console.timeEnd('load-express')
}

function launchExpress () {
  // Requiring some module that is NOT inside the cache
  // eslint-disable-next-line no-unused-vars
  const router = require('express/lib/router/route.js')
  // Requiring some module that IS inside the cache
  // eslint-disable-next-line no-unused-vars
  const accepts = require('accepts')

  const app = express()

  app.get('/', (req, res) => res.send('hello world'))

  const port = 3000

  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
    console.timeEnd('init-express')
  })
}
