const detect = require('detect-port-alt')
const http = require('http')
const url = require('url')

class Server {
  constructor (plugin, port) {
    this.plugin = plugin
    this._listenAddr = '0.0.0.0'
    this._listenPort = port
  }

  async start () {
    try {
      this._listenPort = await detect(this._listenPort, this._listenAddr)
    } catch (err) {
      throw new Error(
        `${`Could not find an open port.` +
          '\n'}${
          `Network error message: ${ err.message}` || err
          }\n`,
      )
    }

    // Create an HTTP server
    if (!this.server) {
      this.server = http.createServer((req, res) => {
        const userRequest = url.parse(req.url, true).query.r

        this.plugin.activateModule(userRequest).then(() => {
          res.writeHead(200, { 'Content-Type': 'image/svg+xml' })
          res.end(
            '<?xml version="1.0" encoding="utf-8"?>\n' +
              '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n' +
              '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><text y="20">lazy-compile-webpack-plugin</text> </svg>',
          )
        })
      })
    }

    return new Promise((resove, reject) => {
      this.server.listen(this._listenPort, this._listenAddr, (err) => {
        if (err) {
          return reject(
            new Error(
              `${`Could not start the backend.` +
                '\n'}${
                `Network error message: ${ err.message}` || err
                }\n`,
            ),
          )
        }

        resove()
      })
    })
  }

  close () {
    if (this.server) {
      this.server.close()
    }
  }

  createActivationUrl (userRequest) {
    return `http://{host}:${this._listenPort}?r=${encodeURIComponent(
      userRequest,
    )}`
  }
}

module.exports = Server
