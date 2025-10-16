import fs from 'fs'
import path from 'path'

export const options = {
  key: fs.readFileSync(path.join(__dirname, 'certs', 'server', 'my-server.key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'certs', 'server', 'my-server.crt.pem')),
}
