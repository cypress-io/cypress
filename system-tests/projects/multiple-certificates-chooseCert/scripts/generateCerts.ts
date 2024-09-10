import * as fs from 'fs'
import * as path from 'path'
import { runCommand } from './utils'

const certsDir = path.join(__dirname, 'certs')

export const certificates = {
  generate: async () => {
    // Create certs directory
    certificates.clean()
    fs.mkdirSync(certsDir)

    // Generate CA key and certificate
    await runCommand(`openssl genrsa -out ${path.join(certsDir, 'ca.key')} 2048`)
    await runCommand(`openssl req -new -x509 -key ${path.join(certsDir, 'ca.key')} -out ${path.join(certsDir, 'ca.crt')} -subj "/CN=MyCA"`)

    // Generate server key and CSR
    await runCommand(`openssl genrsa -out ${path.join(certsDir, 'server.key')} 2048`)
    await runCommand(`openssl req -new -key ${path.join(certsDir, 'server.key')} -out ${path.join(certsDir, 'server.csr')} -subj "/CN=localhost"`)

    // Sign server certificate with CA
    await runCommand(`openssl x509 -req -in ${path.join(certsDir, 'server.csr')} -CA ${path.join(certsDir, 'ca.crt')} -CAkey ${path.join(certsDir, 'ca.key')} -CAcreateserial -out ${path.join(certsDir, 'server.crt')} -days 30`)

    // Generate admin client key and CSR
    await runCommand(`openssl genrsa -out ${path.join(certsDir, 'admin.key')} 2048`)
    await runCommand(`openssl req -new -key ${path.join(certsDir, 'admin.key')} -out ${path.join(certsDir, 'admin.csr')} -subj "/CN=admin"`)

    // Sign admin client certificate with CA
    await runCommand(`openssl x509 -req -in ${path.join(certsDir, 'admin.csr')} -CA ${path.join(certsDir, 'ca.crt')} -CAkey ${path.join(certsDir, 'ca.key')} -CAcreateserial -out ${path.join(certsDir, 'admin.crt')} -days 30`)

    // Generate user client key and CSR
    await runCommand(`openssl genrsa -out ${path.join(certsDir, 'user.key')} 2048`)
    await runCommand(`openssl req -new -key ${path.join(certsDir, 'user.key')} -out ${path.join(certsDir, 'user.csr')} -subj "/CN=user"`)

    // Sign user client certificate with CA
    await runCommand(`openssl x509 -req -in ${path.join(certsDir, 'user.csr')} -CA ${path.join(certsDir, 'ca.crt')} -CAkey ${path.join(certsDir, 'ca.key')} -CAcreateserial -out ${path.join(certsDir, 'user.crt')} -days 30`)
  },
  clean: async () => {
    // Remove certs directory
    if (fs.existsSync(certsDir)) {
      fs.rmdirSync(certsDir, { recursive: true })
    }
  },
}
