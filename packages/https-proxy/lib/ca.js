const _ = require('lodash')
const debug = require('debug')('cypress:https-proxy:ca')
const os = require('os')
const path = require('path')
const Forge = require('node-forge')
const Promise = require('bluebird')
let fs = require('fs-extra')

// if this is higher than the user's cached CA version, the Cypress
// certificate cache will be cleared so that new certificates can
// supersede older ones
const CA_VERSION = 1

fs = Promise.promisifyAll(fs)

const {
  pki,
} = Forge

const generateKeyPairAsync = Promise.promisify(pki.rsa.generateKeyPair)

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

function hostnameToFilename (hostname) {
  return hostname.replace(/\*/g, '_')
}

class CA {
  constructor (caFolder) {
    if (!caFolder) {
      caFolder = path.join(os.tmpdir(), 'cy-ca')
    }

    this.baseCAFolder = caFolder
    this.certsFolder = path.join(this.baseCAFolder, 'certs')
    this.keysFolder = path.join(this.baseCAFolder, 'keys')
  }

  removeAll () {
    return fs
    .removeAsync(this.baseCAFolder)
    .catchReturn({ code: 'ENOENT' })
  }

  randomSerialNumber () {
    // generate random 16 bytes hex string
    let sn = ''

    for (let i = 1; i <= 4; i++) {
      sn += (`00000000${Math.floor(Math.random() * Math.pow(256, 4)).toString(16)}`).slice(-8)
    }

    return sn
  }

  generateCA () {
    return generateKeyPairAsync({ bits: 2048 })
    .then((keys) => {
      const cert = pki.createCertificate()

      cert.publicKey = keys.publicKey
      cert.serialNumber = this.randomSerialNumber()

      cert.validity.notBefore = new Date()
      cert.validity.notAfter = new Date()
      cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 10)
      cert.setSubject(CAattrs)
      cert.setIssuer(CAattrs)
      cert.setExtensions(CAextensions)
      cert.sign(keys.privateKey, Forge.md.sha256.create())

      this.CAcert = cert
      this.CAkeys = keys

      return Promise.all([
        fs.outputFileAsync(this.getCACertPath(), pki.certificateToPem(cert)),
        fs.outputFileAsync(this.getCAPrivateKeyPath(), pki.privateKeyToPem(keys.privateKey)),
        fs.outputFileAsync(this.getCAPublicKeyPath(), pki.publicKeyToPem(keys.publicKey)),
        this.writeCAVersion(),
      ])
    })
  }

  loadCA () {
    return Promise.props({
      certPEM: fs.readFileAsync(this.getCACertPath(), 'utf-8'),
      keyPrivatePEM: fs.readFileAsync(this.getCAPrivateKeyPath(), 'utf-8'),
      keyPublicPEM: fs.readFileAsync(this.getCAPublicKeyPath(), 'utf-8'),
    })
    .then((results) => {
      this.CAcert = pki.certificateFromPem(results.certPEM)

      this.CAkeys = {
        privateKey: pki.privateKeyFromPem(results.keyPrivatePEM),
        publicKey: pki.publicKeyFromPem(results.keyPublicPEM),
      }
    })
    .return(undefined)
  }

  generateServerCertificateKeys (hosts) {
    hosts = [].concat(hosts)

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
      altNames: hosts.map((host) => {
        if (host.match(ipAddressRe)) {
          return { type: 7, ip: host }
        }

        return { type: 2, value: host }
      }),
    }]))

    certServer.sign(this.CAkeys.privateKey, Forge.md.sha256.create())

    const certPem = pki.certificateToPem(certServer)
    const keyPrivatePem = pki.privateKeyToPem(keysServer.privateKey)
    const keyPublicPem = pki.publicKeyToPem(keysServer.publicKey)

    const baseFilename = hostnameToFilename(mainHost)

    return Promise.all([
      fs.outputFileAsync(this.getCertPath(baseFilename), certPem),
      fs.outputFileAsync(this.getPrivateKeyPath(baseFilename), keyPrivatePem),
      fs.outputFileAsync(this.getPublicKeyPath(baseFilename), keyPublicPem),
    ])
    .return([certPem, keyPrivatePem])
  }

  clearDataForHostname (hostname) {
    const baseFilename = hostnameToFilename(hostname)

    return Promise.all([
      fs.remove(this.getCertPath(baseFilename)),
      fs.remove(this.getPrivateKeyPath(baseFilename)),
      fs.remove(this.getPublicKeyPath(baseFilename)),
    ])
  }

  getCertificateKeysForHostname (hostname) {
    const baseFilename = hostnameToFilename(hostname)

    return Promise.all([
      fs.readFileAsync(this.getCertPath(baseFilename)),
      fs.readFileAsync(this.getPrivateKeyPath(baseFilename)),
    ])
  }

  getPrivateKeyPath (baseFilename) {
    return path.join(this.keysFolder, `${baseFilename}.key`)
  }

  getPublicKeyPath (baseFilename) {
    return path.join(this.keysFolder, `${baseFilename}.public.key`)
  }

  getCertPath (baseFilename) {
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

  getCAVersion () {
    return fs.readFileAsync(this.getCAVersionPath())
    .then(Number)
    .catch(function (err) {
      debug('error reading cached CA version: %o', { err })

      return 0
    })
  }

  writeCAVersion () {
    return fs.outputFileAsync(this.getCAVersionPath(), String(CA_VERSION))
  }

  assertMinimumCAVersion () {
    return this.getCAVersion().then(function (actualVersion) {
      debug('checking CA version %o', { actualVersion, CA_VERSION })
      if (actualVersion >= CA_VERSION) {
        return
      }

      throw new Error(`expected ca_version to be >= ${CA_VERSION}, but it was ${actualVersion}`)
    })
  }

  static create (caFolder) {
    const ca = new CA(caFolder)

    return fs.statAsync(ca.getCACertPath())
    .bind(ca)
    .then(ca.assertMinimumCAVersion)
    .tapCatch(ca.removeAll)
    .then(ca.loadCA)
    .catch(ca.generateCA)
    .return(ca)
  }
}

module.exports = CA
