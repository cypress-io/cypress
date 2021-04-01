import { expect } from 'chai'
import fs from 'fs-extra'
import path from 'path'
import Forge from 'node-forge'
import { loadPkiConfig } from '../../lib/pki'
import { clientPkiCertificateStore } from '@packages/network/lib/agent'
import urllib from 'url'
import { v4 as uuidv4 } from 'uuid'
const { pki, pkcs12, asn1 } = Forge

// This testing covers the following areas:
// PEM:
// Valid crt/key, no passphrase
// Valid crt/key, passphrase
// Valid crt/key, relative pathing
// Valid crt/key, invalid (and not there) passphrase
// Multiple crt/key
// Invalid crt
// Invalid key
// Invalid ca
// Missing crt
// Missing key
// Missing ca
// PFX:
// Valid pfx and passphrase
// Valid pfx, passphrase
// Valid pfx, INVALID passphrase (invalid and not there)
// Invalid pfx
// Missing pfx
// Missing passphrase
//
// Neither PEM nor PFX supplied

function createCertAndKey (passphrase: string | undefined): [object, object] {
  let keys = pki.rsa.generateKeyPair(2048)
  let cert = pki.createCertificate()

  cert.publicKey = keys.publicKey
  cert.serialNumber = '01'
  cert.validity.notBefore = new Date()
  cert.validity.notAfter = new Date()
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1)

  let attrs = [
    {
      name: 'commonName',
      value: 'example.org',
    },
    {
      name: 'countryName',
      value: 'US',
    },
    {
      shortName: 'ST',
      value: 'California',
    },
    {
      name: 'localityName',
      value: 'San Fran',
    },
    {
      name: 'organizationName',
      value: 'Test',
    },
    {
      shortName: 'OU',
      value: 'Test',
    },
  ]

  cert.setSubject(attrs)
  cert.setIssuer(attrs)
  cert.sign(keys.privateKey)

  return [cert, keys.privateKey]
}

function createPemFiles (
  certFilepath: string,
  keyFilepath: string,
  passphraseFilepath: string | undefined,
  passphrase: string | undefined,
) {
  const certInfo = createCertAndKey(passphrase)

  fs.writeFileSync(certFilepath, pki.certificateToPem(certInfo[0]))
  const key = passphrase
    ? pki.encryptRsaPrivateKey(certInfo[1], passphrase)
    : pki.privateKeyToPem(certInfo[1])

  fs.writeFileSync(keyFilepath, key)

  if (passphraseFilepath) {
    fs.writeFileSync(passphraseFilepath, passphrase)
  }
}

function createPfxFiles (
  certFilepath: string,
  passphraseFilepath: string | undefined,
  passphrase: string | undefined,
) {
  const certInfo = createCertAndKey(passphrase)

  let p12Asn1 = pkcs12.toPkcs12Asn1(certInfo[1], [certInfo[0]], passphrase)

  fs.writeFileSync(certFilepath, asn1.toDer(p12Asn1).getBytes(), { encoding: 'binary' })

  if (passphraseFilepath) {
    fs.writeFileSync(passphraseFilepath, passphrase)
  }
}

function createCaFile (filepath: string) {
  const certInfo = createCertAndKey(undefined)

  fs.writeFileSync(filepath, pki.certificateToPem(certInfo[0]))
}

function createUniqueUrl (): string {
  return `http://${uuidv4()}`
}

function createSinglePemConfig (
  url,
  caFilepath,
  pemFilepath,
  pemKeyFilepath,
  pemPassphraseFilepath,
) {
  return {
    projectRoot: __dirname,
    clientPkiCertificates: [
      {
        url,
        ca: [caFilepath],
        certs: [
          {
            cert: pemFilepath,
            key: pemKeyFilepath,
            passphrase: pemPassphraseFilepath,
          },
        ],
      },
    ],
  }
}

function createSinglePfxConfig (
  url,
  caFilepath,
  pfxFilepath,
  pfxPassphraseFilepath,
) {
  return {
    projectRoot: __dirname,
    clientPkiCertificates: [
      {
        url,
        ca: [caFilepath],
        certs: [
          {
            pfx: pfxFilepath,
            passphrase: pfxPassphraseFilepath,
          },
        ],
      },
    ],
  }
}

const tempDirName = 'server-pki-tests'
const caFilename = 'testca.crt'
const pemFilename = 'testpem.crt'
const pemKeyFilename = 'testpem.key'
const pemPassphraseFilename = 'testpem.pass'
const pfxFilename = 'testpfx.p12'
const pfxPassphraseFilename = 'testpfx.pass'

const tempDirPath = path.join(__dirname, tempDirName)
const caFilepath = path.join(tempDirPath, caFilename)
const pemFilepath = path.join(tempDirPath, pemFilename)
const pemKeyFilepath = path.join(tempDirPath, pemKeyFilename)
const pemPassphraseFilepath = path.join(tempDirPath, pemPassphraseFilename)
const pfxFilepath = path.join(tempDirPath, pfxFilename)
const pfxPassphraseFilepath = path.join(tempDirPath, pfxPassphraseFilename)

describe('lib/pki', () => {
  before(() => {
    console.log(`Server PKI test files will be stored under: ${tempDirPath}`)
    if (!fs.existsSync(tempDirPath)) {
      fs.mkdirSync(tempDirPath)
    }
  })

  after(() => {
    fs.rmdirSync(tempDirPath, { recursive: true })
  })

  context('loads cert files', () => {
    it('loads valid single PEM (no passphrase) and CA via absolute pathing', () => {
      createPemFiles(pemFilepath, pemKeyFilepath, undefined, undefined)
      createCaFile(caFilepath)

      const url = createUniqueUrl()
      const config = createSinglePemConfig(
        url,
        caFilepath,
        pemFilepath,
        pemKeyFilepath,
        undefined,
      )
      const pemFileData = fs.readFileSync(pemFilepath)
      const keyFileData = fs.readFileSync(pemKeyFilepath)
      const caFileData = fs.readFileSync(caFilepath)

      loadPkiConfig(config)
      const options = clientPkiCertificateStore.getPkiAgentOptionsForUrl(
        urllib.parse(url),
      )

      expect(options).not.to.be.null
      expect(options.ca.length).to.eq(1)
      expect(options.ca[0]).to.deep.equal(caFileData)
      expect(options.pfx).to.be.empty
      expect(options.cert.length).to.eq(1)
      expect(options.cert[0]).to.deep.equal(pemFileData)
      expect(options.key.length).to.eq(1)
      expect(options.key[0].passphrase).to.be.undefined
      expect(options.key[0].pem).to.deep.equal(keyFileData)
    })

    it('loads valid multiple PEMs (no passphrase) and CAs', () => {
      const pemFilepath1 = path.join(tempDirPath, 'testpem1.crt')
      const keyFilepath1 = path.join(tempDirPath, 'testpem1.key')
      const caFilepath1 = path.join(tempDirPath, 'testca1.crt')
      const pemFilepath2 = path.join(tempDirPath, 'testpem2.crt')
      const keyFilepath2 = path.join(tempDirPath, 'testpem2.key')
      const caFilepath2 = path.join(tempDirPath, 'testca2.crt')
      const pemFilepath3 = path.join(tempDirPath, 'testpem3.crt')
      const keyFilepath3 = path.join(tempDirPath, 'testpem3.key')
      const caFilepath3 = path.join(tempDirPath, 'testca3.crt')

      createPemFiles(pemFilepath1, keyFilepath1, undefined, undefined)
      createPemFiles(pemFilepath2, keyFilepath2, undefined, undefined)
      createPemFiles(pemFilepath3, keyFilepath3, undefined, undefined)
      createCaFile(caFilepath1)
      createCaFile(caFilepath2)
      createCaFile(caFilepath3)

      const url = createUniqueUrl()
      const config = {
        projectRoot: __dirname,
        clientPkiCertificates: [
          {
            url,
            ca: [caFilepath1, caFilepath2, caFilepath3],
            certs: [
              {
                cert: pemFilepath1,
                key: keyFilepath1,
              },
              {
                cert: pemFilepath2,
                key: keyFilepath2,
              },
              {
                cert: pemFilepath3,
                key: keyFilepath3,
              },
            ],
          },
        ],
      }

      const pemFileData1 = fs.readFileSync(pemFilepath1)
      const keyFileData1 = fs.readFileSync(keyFilepath1)
      const caFileData1 = fs.readFileSync(caFilepath1)
      const pemFileData2 = fs.readFileSync(pemFilepath2)
      const keyFileData2 = fs.readFileSync(keyFilepath2)
      const caFileData2 = fs.readFileSync(caFilepath2)
      const pemFileData3 = fs.readFileSync(pemFilepath3)
      const keyFileData3 = fs.readFileSync(keyFilepath3)
      const caFileData3 = fs.readFileSync(caFilepath3)

      loadPkiConfig(config)
      const options = clientPkiCertificateStore.getPkiAgentOptionsForUrl(
        urllib.parse(url),
      )

      expect(options).not.to.be.null
      expect(options.ca.length).to.eq(3)
      expect(options.ca[0]).to.deep.equal(caFileData1)
      expect(options.ca[1]).to.deep.equal(caFileData2)
      expect(options.ca[2]).to.deep.equal(caFileData3)
      expect(options.pfx).to.be.empty
      expect(options.cert.length).to.eq(3)
      expect(options.cert[0]).to.deep.equal(pemFileData1)
      expect(options.cert[1]).to.deep.equal(pemFileData2)
      expect(options.cert[2]).to.deep.equal(pemFileData3)
      expect(options.key.length).to.eq(3)
      expect(options.key[0].passphrase).to.be.undefined
      expect(options.key[0].pem).to.deep.equal(keyFileData1)
      expect(options.key[1].pem).to.deep.equal(keyFileData2)
      expect(options.key[2].pem).to.deep.equal(keyFileData3)
    })

    it('loads valid single PEM (with passphrase)', () => {
      const passphrase = 'a_phrase'

      createPemFiles(
        pemFilepath,
        pemKeyFilepath,
        pemPassphraseFilepath,
        passphrase,
      )

      const url = createUniqueUrl()
      const config = createSinglePemConfig(
        url,
        undefined,
        pemFilepath,
        pemKeyFilepath,
        pemPassphraseFilepath,
      )
      const pemFileData = fs.readFileSync(pemFilepath)
      const keyFileData = fs.readFileSync(pemKeyFilepath)

      loadPkiConfig(config)
      const options = clientPkiCertificateStore.getPkiAgentOptionsForUrl(
        urllib.parse(url),
      )

      expect(options).not.to.be.null
      expect(options.ca.length).to.eq(0)
      expect(options.pfx).to.be.empty
      expect(options.cert.length).to.eq(1)
      expect(options.cert[0]).to.deep.equal(pemFileData)
      expect(options.key.length).to.eq(1)
      expect(options.key[0].passphrase).to.equal(passphrase)
      expect(options.key[0].pem).to.deep.equal(keyFileData)
    })

    it('loads valid single PEM and CA via relative pathing', () => {
      createPemFiles(pemFilepath, pemKeyFilepath, undefined, undefined)
      createCaFile(caFilepath)

      const relativeCaFilepath = path.join('./', tempDirName, caFilename)
      const relativePemFilepath = path.join('./', tempDirName, caFilename)
      const relativeKeyFilepath = path.join('./', tempDirName, pemKeyFilename)

      const url = createUniqueUrl()
      const config = createSinglePemConfig(
        url,
        relativeCaFilepath,
        relativePemFilepath,
        relativeKeyFilepath,
        undefined,
      )

      loadPkiConfig(config)
      const options = clientPkiCertificateStore.getPkiAgentOptionsForUrl(
        urllib.parse(url),
      )

      expect(options).not.to.be.null
      expect(options.ca.length).to.eq(1)
      expect(options.pfx).to.be.empty
      expect(options.cert.length).to.eq(1)
      expect(options.key.length).to.eq(1)
      expect(options.key[0].passphrase).to.be.undefined
    })

    it('detects invalid PEM key passphrase', () => {
      const passphrase = 'a_phrase'

      createPemFiles(
        pemFilepath,
        pemKeyFilepath,
        pemPassphraseFilepath,
        passphrase,
      )

      fs.writeFileSync(pemPassphraseFilepath, 'not-the-passphrase')

      const url = createUniqueUrl()
      const config = createSinglePemConfig(
        url,
        undefined,
        pemFilepath,
        pemKeyFilepath,
        pemPassphraseFilepath,
      )
      const act = () => {
        loadPkiConfig(config)
      }

      expect(act).to.throw(
        'Cannot decrypt PEM key with supplied passphrase (check the passphrase file content and that it doesn\'t have unexpected whitespace at the end)',
      )
    })

    it('detects invalid PEM key file (no passphrase)', () => {
      createPemFiles(pemFilepath, pemKeyFilepath, undefined, undefined)
      fs.writeFileSync(pemKeyFilepath, 'not-a-key')

      const url = createUniqueUrl()
      const config = createSinglePemConfig(
        url,
        undefined,
        pemFilepath,
        pemKeyFilepath,
        undefined,
      )
      const act = () => {
        loadPkiConfig(config)
      }

      expect(act).to.throw('Invalid PEM formatted message')
    })

    it('detects invalid PEM key file (with passphrase)', () => {
      const passphrase = 'a_phrase'

      createPemFiles(
        pemFilepath,
        pemKeyFilepath,
        pemPassphraseFilepath,
        passphrase,
      )

      fs.writeFileSync(pemKeyFilepath, 'not-a-key')

      const url = createUniqueUrl()
      const config = createSinglePemConfig(
        url,
        undefined,
        pemFilepath,
        pemKeyFilepath,
        pemPassphraseFilepath,
      )
      const act = () => {
        loadPkiConfig(config)
      }

      expect(act).to.throw('Invalid PEM formatted message')
    })

    it('detects invalid PEM cert file', () => {
      fs.writeFileSync(pemFilepath, 'not-a-cert')

      const url = createUniqueUrl()
      const config = createSinglePemConfig(
        url,
        undefined,
        pemFilepath,
        pemKeyFilepath,
        undefined,
      )
      const act = () => {
        loadPkiConfig(config)
      }

      expect(act).to.throw('Cannot parse PEM cert')
    })

    it('detects invalid CA file', () => {
      fs.writeFileSync(caFilepath, 'not-a-cert')

      const url = createUniqueUrl()
      const config = createSinglePemConfig(
        url,
        caFilepath,
        pemFilepath,
        pemKeyFilepath,
        undefined,
      )
      const act = () => {
        loadPkiConfig(config)
      }

      expect(act).to.throw('Cannot parse CA cert')
    })

    it('detects missing PEM cert file', () => {
      const url = createUniqueUrl()
      const passphrase = 'a_phrase'

      createPemFiles(
        pemFilepath,
        pemKeyFilepath,
        pemPassphraseFilepath,
        passphrase,
      )

      const config = createSinglePemConfig(
        url,
        undefined,
        'not-a-path',
        pemKeyFilepath,
        pemPassphraseFilepath,
      )
      const act = () => {
        loadPkiConfig(config)
      }

      expect(act).to.throw('no such file or directory')
    })

    it('detects missing PEM key file', () => {
      const url = createUniqueUrl()
      const passphrase = 'a_phrase'

      createPemFiles(
        pemFilepath,
        pemKeyFilepath,
        pemPassphraseFilepath,
        passphrase,
      )

      const config = createSinglePemConfig(
        url,
        undefined,
        pemFilepath,
        'not-a-path',
        pemPassphraseFilepath,
      )
      const act = () => {
        loadPkiConfig(config)
      }

      expect(act).to.throw('no such file or directory')
    })

    it('detects missing PEM passphrase file', () => {
      const url = createUniqueUrl()
      const passphrase = 'a_phrase'

      createPemFiles(
        pemFilepath,
        pemKeyFilepath,
        pemPassphraseFilepath,
        passphrase,
      )

      const config = createSinglePemConfig(
        url,
        undefined,
        pemFilepath,
        pemKeyFilepath,
        'not-a-path',
      )
      const act = () => {
        loadPkiConfig(config)
      }

      expect(act).to.throw('no such file or directory')
    })

    it('detects missing CA file', () => {
      const url = createUniqueUrl()
      const passphrase = 'a_phrase'

      createPemFiles(
        pemFilepath,
        pemKeyFilepath,
        pemPassphraseFilepath,
        passphrase,
      )

      createCaFile(caFilepath)
      const config = createSinglePemConfig(
        url,
        'not-a-path',
        pemFilepath,
        pemKeyFilepath,
        pemPassphraseFilepath,
      )
      const act = () => {
        loadPkiConfig(config)
      }

      expect(act).to.throw('no such file or directory')
    })

    it('loads valid single PFX', () => {
      const passphrase = 'a_passphrase'

      createPfxFiles(pfxFilepath, pfxPassphraseFilepath, passphrase)

      const url = createUniqueUrl()
      const config = createSinglePfxConfig(
        url,
        undefined,
        pfxFilepath,
        pfxPassphraseFilepath,
      )
      const pfxFileData = fs.readFileSync(pfxFilepath)

      loadPkiConfig(config)

      const options = clientPkiCertificateStore.getPkiAgentOptionsForUrl(
        urllib.parse(url),
      )

      expect(options).not.to.be.null
      expect(options.cert).to.be.empty
      expect(options.pfx.length).to.eq(1)
      expect(options.pfx[0].buf).to.deep.equal(pfxFileData)
      expect(options.pfx[0].passphrase).to.equal(passphrase)
    })

    it('detects invalid PFX passphrase', () => {
      const passphrase = 'a_passphrase'

      createPfxFiles(pfxFilepath, undefined, passphrase)
      fs.writeFileSync(pfxPassphraseFilepath, 'not-a-passphrase')

      const config = createSinglePfxConfig(
        createUniqueUrl(),
        undefined,
        pfxFilepath,
        pfxPassphraseFilepath,
      )

      const act = () => {
        loadPkiConfig(config)
      }

      expect(act).to.throw('Invalid password?')
    })

    it('detects missing PFX passphrase file', () => {
      const passphrase = 'a_passphrase'

      createPfxFiles(pfxFilepath, undefined, passphrase)

      const config = createSinglePfxConfig(
        createUniqueUrl(),
        undefined,
        pfxFilepath,
        pfxPassphraseFilepath,
      )

      const act = () => {
        loadPkiConfig(config)
      }

      expect(act).to.throw('Invalid password?')
    })

    it('detects invalid PFX file', () => {
      fs.writeFileSync(pfxFilepath, 'not-a-pfx')

      const config = createSinglePfxConfig(
        createUniqueUrl(),
        undefined,
        pfxFilepath,
        pfxPassphraseFilepath,
      )

      const act = () => {
        loadPkiConfig(config)
      }

      expect(act).to.throw('Unable to load PFX file: Too few bytes to read ASN.1 value')
    })

    it('detects missing PFX file', () => {
      const config = createSinglePfxConfig(
        createUniqueUrl(),
        undefined,
        pfxFilepath,
        pfxPassphraseFilepath,
      )

      const act = () => {
        loadPkiConfig(config)
      }

      expect(act).to.throw('Unable to load PFX file: Too few bytes to read ASN.1 value')
    })

    it('detects neither PEM nor PFX supplied', () => {
      const config = {
        projectRoot: __dirname,
        clientPkiCertificates: [
          {
            url: createUniqueUrl(),
            ca: [],
            certs: [
            ],
          },
        ],
      }

      const act = () => {
        loadPkiConfig(config)
      }

      expect(act).to.throw('Either PEM or PFX must be supplied')
    })
  })
})
