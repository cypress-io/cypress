_       = require("lodash")
fs      = require("fs-extra")
os      = require("os")
path    = require("path")
Forge   = require("node-forge")
Promise = require("bluebird")

fs = Promise.promisifyAll(fs)

pki   = Forge.pki

generateKeyPairAsync = Promise.promisify(pki.rsa.generateKeyPair)

ipAddressRe = /^[\d\.]+$/
asterisksRe = /\*/g

CAattrs = [{
  name: "commonName",
  value: "CypressProxyCA"
}, {
  name: "countryName",
  value: "Internet"
}, {
  shortName: "ST",
  value: "Internet"
}, {
  name: "localityName",
  value: "Internet"
}, {
  name: "organizationName",
  value: "Cypress.io"
}, {
  shortName: "OU",
  value: "CA"
}]

CAextensions = [{
  name: "basicConstraints",
  cA: true
}, {
  name: "keyUsage",
  keyCertSign: true,
  digitalSignature: true,
  nonRepudiation: true,
  keyEncipherment: true,
  dataEncipherment: true
}, {
  name: "extKeyUsage",
  serverAuth: true,
  clientAuth: true,
  codeSigning: true,
  emailProtection: true,
  timeStamping: true
}, {
  name: "nsCertType",
  client: true,
  server: true,
  email: true,
  objsign: true,
  sslCA: true,
  emailCA: true,
  objCA: true
}, {
  name: "subjectKeyIdentifier"
}]

ServerAttrs = [{
  name: "countryName",
  value: "Internet"
}, {
  shortName: "ST",
  value: "Internet"
}, {
  name: "localityName",
  value: "Internet"
}, {
  name: "organizationName",
  value: "Cypress Proxy CA"
}, {
  shortName: "OU",
  value: "Cypress Proxy Server Certificate"
}]

ServerExtensions = [{
  name: "basicConstraints",
  cA: false
}, {
  name: "keyUsage",
  keyCertSign: false,
  digitalSignature: true,
  nonRepudiation: false,
  keyEncipherment: true,
  dataEncipherment: true
}, {
  name: "extKeyUsage",
  serverAuth: true,
  clientAuth: true,
  codeSigning: false,
  emailProtection: false,
  timeStamping: false
}, {
  name: "nsCertType",
  client: true,
  server: true,
  email: false,
  objsign: false,
  sslCA: false,
  emailCA: false,
  objCA: false
}, {
  name: "subjectKeyIdentifier"
}]

class CA
  constructor: (caFolder) ->
    if not caFolder
      caFolder = path.join(os.tmpdir(), 'cy-ca')

    @baseCAFolder = caFolder
    @certsFolder  = path.join(@baseCAFolder, "certs")
    @keysFolder   = path.join(@baseCAFolder, "keys")

  removeAll: ->
    fs
    .removeAsync(@baseCAFolder)
    .catchReturn({ code: "ENOENT" })

  randomSerialNumber: ->
    ## generate random 16 bytes hex string
    sn = ""

    for i in [1..4]
      sn += ("00000000" + Math.floor(Math.random()*Math.pow(256, 4)).toString(16)).slice(-8)

    sn

  generateCA: ->
    generateKeyPairAsync({bits: 512})
    .then (keys) =>
      cert = pki.createCertificate()
      cert.publicKey = keys.publicKey
      cert.serialNumber = @randomSerialNumber()

      cert.validity.notBefore = new Date()
      cert.validity.notAfter = new Date()
      cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 10)
      cert.setSubject(CAattrs)
      cert.setIssuer(CAattrs)
      cert.setExtensions(CAextensions)
      cert.sign(keys.privateKey, Forge.md.sha256.create())

      @CAcert = cert
      @CAkeys = keys

      Promise.all([
        fs.outputFileAsync(path.join(@certsFolder, "ca.pem"),        pki.certificateToPem(cert))
        fs.outputFileAsync(path.join(@keysFolder, "ca.private.key"), pki.privateKeyToPem(keys.privateKey))
        fs.outputFileAsync(path.join(@keysFolder, "ca.public.key"),  pki.publicKeyToPem(keys.publicKey))
      ])

  loadCA: ->
    Promise.props({
      certPEM:       fs.readFileAsync(path.join(@certsFolder, "ca.pem"),         "utf-8")
      keyPrivatePEM: fs.readFileAsync(path.join(@keysFolder,  "ca.private.key"), "utf-8")
      keyPublicPEM:  fs.readFileAsync(path.join(@keysFolder,  "ca.public.key"),  "utf-8")
    })
    .then (results) =>
      @CAcert = pki.certificateFromPem(results.certPEM)
      @CAkeys = {
        privateKey: pki.privateKeyFromPem(results.keyPrivatePEM)
        publicKey:  pki.publicKeyFromPem(results.keyPublicPEM)
      }
    .return(undefined)

  generateServerCertificateKeys: (hosts) ->
    hosts = [].concat(hosts)

    mainHost   = hosts[0]
    keysServer = pki.rsa.generateKeyPair(1024)
    certServer = pki.createCertificate()

    certServer.publicKey = keysServer.publicKey
    certServer.serialNumber = @randomSerialNumber()
    certServer.validity.notBefore = new Date
    certServer.validity.notAfter = new Date
    certServer.validity.notAfter.setFullYear(certServer.validity.notBefore.getFullYear() + 2)

    attrsServer = _.clone(ServerAttrs)
    attrsServer.unshift({
      name: "commonName",
      value: mainHost
    })

    certServer.setSubject(attrsServer)
    certServer.setIssuer(@CAcert.issuer.attributes)
    certServer.setExtensions(ServerExtensions.concat([{
      name: "subjectAltName",
      altNames: hosts.map (host) ->
        if host.match(ipAddressRe)
          {type: 7, ip: host}
        else
          {type: 2, value: host}
    }]))

    certServer.sign(@CAkeys.privateKey, Forge.md.sha256.create())

    certPem       = pki.certificateToPem(certServer)
    keyPrivatePem = pki.privateKeyToPem(keysServer.privateKey)
    keyPublicPem  = pki.publicKeyToPem(keysServer.publicKey)

    dest = mainHost.replace(asterisksRe, "_")

    Promise.all([
      fs.outputFileAsync(path.join(@certsFolder, dest + ".pem"),        certPem)
      fs.outputFileAsync(path.join(@keysFolder,  dest + ".key"),        keyPrivatePem)
      fs.outputFileAsync(path.join(@keysFolder,  dest + ".public.key"), keyPublicPem)
    ])
    .return([certPem, keyPrivatePem])

  getCertificateKeysForHostname: (hostname) ->
    dest = hostname.replace(asterisksRe, "_")

    Promise.all([
      fs.readFileAsync(path.join(@certsFolder, dest + ".pem"))
      fs.readFileAsync(path.join(@keysFolder,  dest + ".key"))
    ])

  getCACertPath: ->
    path.join(@certsFolder, "ca.pem")

  @create = (caFolder) ->
    ca = new CA(caFolder)

    fs.statAsync(path.join(ca.certsFolder, "ca.pem"))
    .bind(ca)
    .then(ca.loadCA)
    .catch(ca.generateCA)
    .return(ca)

module.exports = CA
