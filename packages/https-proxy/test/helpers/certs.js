const fs = require('fs')
const path = require('path')
const sslRootCas = require('ssl-root-cas')

sslRootCas
.inject()
.addFile(path.join(__dirname, 'certs', 'server', 'my-root-ca.crt.pem'))

const options = {
  key: fs.readFileSync(path.join(__dirname, 'certs', 'server', 'my-server.key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'certs', 'server', 'my-server.crt.pem')),
}

module.exports = options
