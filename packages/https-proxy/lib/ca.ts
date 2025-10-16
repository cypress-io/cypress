import _ from 'lodash'
import { promisify } from 'util'
import debugModule from 'debug'
import os from 'os'
import path from 'path'
import { pki, md } from 'node-forge'
import fs from 'fs-extra'

const debug = debugModule('cypress:https-proxy:ca')

// if this is higher than the user's cached CA version, the Cypress
// certificate cache will be cleared so that new certificates can
// supersede older ones
const CA_VERSION = 1

const generateKeyPairAsync = promisify(pki.rsa.generateKeyPair)

const ipAddressRe = /^[\d\.]+$/

const CAattrs = [{
  name: 'commonName',
  value: 'CypressProxyCA',
}, {
  name: 'countryName',
  value: 'Internet',
}, {
  shortName: 'ST',
  value: 'Internet',
}, {
  name: 'localityName',
  value: 'Internet',
}, {
  name: 'organizationName',
  value: 'Cypress.io',
}, {
  shortName: 'OU',
  value: 'CA',
}]

const CAextensions = [{
  name: 'basicConstraints',
  cA: true,
}, {
  name: 'keyUsage',
  keyCertSign: true,
  digitalSignature: true,
  nonRepudiation: true,
  keyEncipherment: true,
  dataEncipherment: true,
}, {
  name: 'extKeyUsage',
  serverAuth: true,
  clientAuth: true,
  codeSigning: true,
  emailProtection: true,
  timeStamping: true,
}, {
  name: 'nsCertType',
  client: true,
  server: true,
  email: true,
  objsign: true,
  sslCA: true,
  emailCA: true,
  objCA: true,
}, {
  name: 'subjectKeyIdentifier',
}]

const ServerAttrs = [{
  name: 'countryName',
  value: 'Internet',
}, {
  shortName: 'ST',
  value: 'Internet',
}, {
  name: 'localityName',
  value: 'Internet',
}, {
  name: 'organizationName',
  value: 'Cypress Proxy CA',
}, {
  shortName: 'OU',
  value: 'Cypress Proxy Server Certificate',
}]

const ServerExtensions = [{
  name: 'basicConstraints',
  cA: false,
}, {
  name: 'keyUsage',
  keyCertSign: false,
  digitalSignature: true,
  nonRepudiation: false,
  keyEncipherment: true,
  dataEncipherment: true,
}, {
  name: 'extKeyUsage',
  serverAuth: true,
  clientAuth: true,
  codeSigning: false,
  emailProtection: false,
  timeStamping: false,
}, {
  name: 'nsCertType',
  client: true,
  server: true,
  email: false,
  objsign: false,
  sslCA: false,
  emailCA: false,
  objCA: false,
}, {
  name: 'subjectKeyIdentifier',
}]

function hostnameToFilename (hostname: string) {
  return hostname.replace(/\*/g, '_')
}

export class CA {
  baseCAFolder: string
  certsFolder: string
  keysFolder: string
  CAcert: pki.Certificate
  CAkeys: pki.rsa.KeyPair

  constructor (caFolder?: string) {
    if (!caFolder) {
      caFolder = path.join(os.tmpdir(), 'cy-ca')
    }

    this.baseCAFolder = caFolder
    this.certsFolder = path.join(this.baseCAFolder, 'certs')
    this.keysFolder = path.join(this.baseCAFolder, 'keys')
  }

  async removeAll () {
    try {
      await fs.remove(this.baseCAFolder)
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err
      }
    }
  }

  randomSerialNumber () {
    // generate random 16 bytes hex string
    let sn = ''

    for (let i = 1; i <= 4; i++) {
      sn += (`00000000${Math.floor(Math.random() * Math.pow(256, 4)).toString(16)}`).slice(-8)
    }

    return sn
  }

  async generateCA (): Promise<void> {
    const keys = await generateKeyPairAsync({ bits: 2048 })

    const cert = pki.createCertificate()

    cert.publicKey = keys.publicKey
    cert.serialNumber = this.randomSerialNumber()

    cert.validity.notBefore = new Date()
    cert.validity.notAfter = new Date()
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 10)
    cert.setSubject(CAattrs)
    cert.setIssuer(CAattrs)
    cert.setExtensions(CAextensions)
    cert.sign(keys.privateKey, md.sha256.create())

    this.CAcert = cert
    this.CAkeys = keys

    const certPem = pki.certificateToPem(cert)
    const keyPrivatePem = pki.privateKeyToPem(keys.privateKey)
    const keyPublicPem = pki.publicKeyToPem(keys.publicKey)

    await Promise.all([
      fs.outputFile(this.getCACertPath(), certPem),
      fs.outputFile(this.getCAPrivateKeyPath(), keyPrivatePem),
      fs.outputFile(this.getCAPublicKeyPath(), keyPublicPem),
      this.writeCAVersion(),
    ])

    return undefined
  }

  async loadCA (): Promise<void> {
    const [certPEM, keyPrivatePEM, keyPublicPEM] = await Promise.all([
      fs.readFile(this.getCACertPath(), 'utf-8'),
      fs.readFile(this.getCAPrivateKeyPath(), 'utf-8'),
      fs.readFile(this.getCAPublicKeyPath(), 'utf-8'),
    ])

    this.CAcert = pki.certificateFromPem(certPEM)

    this.CAkeys = {
      privateKey: pki.privateKeyFromPem(keyPrivatePEM),
      publicKey: pki.publicKeyFromPem(keyPublicPEM),
    }

    return undefined
  }

  async generateServerCertificateKeys (hostsArg: string): Promise<[string, string]> {
    const hosts: string[] = [].concat(hostsArg)

    const mainHost = hosts[0]
    const keysServer = pki.rsa.generateKeyPair(2048)
    const certServer = pki.createCertificate()

    certServer.publicKey = keysServer.publicKey
    certServer.serialNumber = this.randomSerialNumber()
    certServer.validity.notBefore = new Date
    certServer.validity.notAfter = new Date
    certServer.validity.notAfter.setFullYear(certServer.validity.notBefore.getFullYear() + 2)

    const attrsServer = _.clone(ServerAttrs)

    attrsServer.unshift({
      name: 'commonName',
      value: mainHost,
    })

    certServer.setSubject(attrsServer)
    certServer.setIssuer(this.CAcert.issuer.attributes)
    certServer.setExtensions(ServerExtensions.concat([{
      name: 'subjectAltName',
      // @ts-expect-error
      altNames: hosts.map((host: string) => {
        if (host.match(ipAddressRe)) {
          return { type: 7, ip: host }
        }

        return { type: 2, value: host }
      }),
    }]))

    certServer.sign(this.CAkeys.privateKey, md.sha256.create())

    const certPem = pki.certificateToPem(certServer)
    const keyPrivatePem = pki.privateKeyToPem(keysServer.privateKey)
    const keyPublicPem = pki.publicKeyToPem(keysServer.publicKey)

    const baseFilename = hostnameToFilename(mainHost)

    await Promise.all([
      fs.outputFile(this.getCertPath(baseFilename), certPem),
      fs.outputFile(this.getPrivateKeyPath(baseFilename), keyPrivatePem),
      fs.outputFile(this.getPublicKeyPath(baseFilename), keyPublicPem),
    ])

    return [certPem, keyPrivatePem]
  }

  async clearDataForHostname (hostname: string): Promise<void> {
    const baseFilename = hostnameToFilename(hostname)

    await Promise.all([
      fs.remove(this.getCertPath(baseFilename)),
      fs.remove(this.getPrivateKeyPath(baseFilename)),
      fs.remove(this.getPublicKeyPath(baseFilename)),
    ])

    return undefined
  }

  async getCertificateKeysForHostname (hostname: string): Promise<[string, string]> {
    const baseFilename = hostnameToFilename(hostname)

    const [certPem, keyPrivatePem] = await Promise.all([
      fs.readFile(this.getCertPath(baseFilename)),
      fs.readFile(this.getPrivateKeyPath(baseFilename)),
    ])

    return [certPem.toString(), keyPrivatePem.toString()]
  }

  getPrivateKeyPath (baseFilename: string) {
    return path.join(this.keysFolder, `${baseFilename}.key`)
  }

  getPublicKeyPath (baseFilename: string) {
    return path.join(this.keysFolder, `${baseFilename}.public.key`)
  }

  getCertPath (baseFilename: string) {
    return path.join(this.certsFolder, `${baseFilename}.pem`)
  }

  getCACertPath () {
    return path.join(this.certsFolder, 'ca.pem')
  }

  getCAPrivateKeyPath () {
    return path.join(this.keysFolder, 'ca.private.key')
  }

  getCAPublicKeyPath () {
    return path.join(this.keysFolder, 'ca.public.key')
  }

  getCAVersionPath () {
    return path.join(this.baseCAFolder, 'ca_version.txt')
  }

  async getCAVersion () {
    try {
      const version = await fs.readFile(this.getCAVersionPath())

      return Number(version)
    } catch (err) {
      debug('error reading cached CA version: %o', { err })

      return 0
    }
  }

  writeCAVersion () {
    return fs.outputFile(this.getCAVersionPath(), String(CA_VERSION))
  }

  async assertMinimumCAVersion () {
    const actualVersion = await this.getCAVersion()

    debug('checking CA version %o', { actualVersion, CA_VERSION })
    if (actualVersion >= CA_VERSION) {
      return
    }

    throw new Error(`expected ca_version to be >= ${CA_VERSION}, but it was ${actualVersion}`)
  }

  static async create (caFolder?: string) {
    const ca = new CA(caFolder)

    try {
      await fs.stat(ca.getCACertPath())
      try {
        await ca.assertMinimumCAVersion()
      } catch (err) {
        debug('CA version mismatch or is missing, removing all certs and keys in the CA folder')
        await ca.removeAll()
        throw new Error('CA version mismatch or is missing, catch below and regenerate certs and keys')
      }

      await ca.loadCA()

      return ca
    } catch (err) {
      await ca.generateCA()
    }

    return ca
  }
}
