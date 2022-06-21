import { expect } from 'chai'
import { ParsedUrl, UrlMatcher, UrlClientCertificates, ClientCertificateStore, ClientCertificates, loadClientCertificateConfig } from '../../lib/client-certificates'
import { clientCertificateStore } from '../../lib/agent'
import urllib from 'url'
import fs from 'fs-extra'
import os from 'os'
import path from 'path'
import Forge from 'node-forge'
import { v4 as uuidv4 } from 'uuid'
const { pki, pkcs12, asn1 } = Forge

function urlShouldMatch (url: string, matcher: string) {
  let rule = UrlMatcher.buildMatcherRule(matcher)
  let parsedUrl = new ParsedUrl(url)

  expect(UrlMatcher.matchUrl(parsedUrl.host, parsedUrl.path, parsedUrl.port, rule), `'${url}' should match '${matcher}' (rule: ${JSON.stringify(rule)})`).to.be.true
}

function urlShouldNotMatch (url: string, matcher: string) {
  let rule = UrlMatcher.buildMatcherRule(matcher)
  let parsedUrl = new ParsedUrl(url)

  expect(UrlMatcher.matchUrl(parsedUrl.host, parsedUrl.path, parsedUrl.port, rule), `'${url}' should not match '${matcher}' (rule: ${JSON.stringify(rule)})`).to.be.false
}

function checkParsed (parsed: ParsedUrl, host: string, path: string | undefined, port: number | undefined) {
  expect(parsed.host, `'host ${parsed.host}' should be '${host}'`).to.eq(host)
  expect(parsed.path, `'path ${parsed.path}' should be '${path}'`).to.eq(path)
  expect(parsed.port, `'port ${parsed.port}' should be '${port}'`).to.eq(port)
}

describe('lib/client-certificates', () => {
  context('ParsedUrl', () => {
    it('parses clean URLs', () => {
      let parsed = new ParsedUrl('https://a.host.com')

      checkParsed(parsed, 'a.host.com', undefined, undefined)

      parsed = new ParsedUrl('https://a.host.com:1234')
      expect(parsed.host).to.eq('a.host.com')
      expect(parsed.port).to.eq(1234)

      parsed = new ParsedUrl('https://a.host.com/a/path/')
      expect(parsed.host).to.eq('a.host.com')
      expect(parsed.path).to.eq('/a/path/')
    })

    it('parses wildcard URLs', () => {
      let parsed = new ParsedUrl('https://a.host.*')

      expect(parsed.host).to.eq('a.host.*')

      parsed = new ParsedUrl('https://*.host.com')
      expect(parsed.host).to.eq('*.host.com')

      parsed = new ParsedUrl('https://a.host.com/a/path/*')
      expect(parsed.host).to.eq('a.host.com')
      expect(parsed.path).to.eq('/a/path/*')

      parsed = new ParsedUrl('https://a.host.com/*/path/')
      expect(parsed.host).to.eq('a.host.com')
      expect(parsed.path).to.eq('/*/path/')

      parsed = new ParsedUrl('*')
      expect(parsed.host).to.eq('*')
      expect(parsed.path).to.eq(undefined)
    })
  })

  context('ClientCertificateUrlMatcher', () => {
    it('matches basic hostnames', () => {
      let matcher = 'https://a.host.com'

      urlShouldMatch('https://a.host.com', matcher)
      urlShouldMatch('https://a.host.com/a/path', matcher)
      urlShouldNotMatch('https://a.host.co.uk', matcher)
    })

    it('matches wildcard hostnames', () => {
      let matcher1 = 'https://a.host.*'

      urlShouldMatch('https://a.host.com', matcher1)
      urlShouldMatch('https://a.host.com/a/path', matcher1)
      urlShouldMatch('https://a.host.co.uk', matcher1)
      urlShouldNotMatch('https://a.b.host.co.uk', matcher1)

      matcher1 = 'https://a.*.host.*'
      urlShouldNotMatch('https://a.host.com', matcher1)
      urlShouldNotMatch('https://z.a.host.com', matcher1)
      urlShouldMatch('https://a.b.host.com', matcher1)
      urlShouldMatch('https://a.b.c.host.com', matcher1)
      urlShouldMatch('https://a.b.c.host.co.uk', matcher1)

      matcher1 = '*'
      urlShouldMatch('https://a.host.com', matcher1)
      urlShouldMatch('https://a.b.c.d.e.f.host.co.uk', matcher1)
    })

    it('matches basic paths', () => {
      let matcher = 'https://a.path.com/a'

      urlShouldMatch('https://a.path.com/a', matcher)
      urlShouldNotMatch('https://a.path.com', matcher)
      urlShouldNotMatch('https://a.path.com/a/b', matcher)
    })

    it('matches wildcard paths', () => {
      let matcher = 'https://a.path2.com/**'

      urlShouldMatch('https://a.path2.com/a', matcher)
      urlShouldMatch('https://a.path2.com/a/b', matcher)
    })
  })

  context('UrlClientCertificates', () => {
    it('constructs, populates default properties', () => {
      let url = 'http://a.host.com/home'
      let certs = new UrlClientCertificates(url)

      expect(certs.url).to.eq(url)
      expect(certs.pathnameLength).to.eq(5)
      expect(certs)
    })
  })

  context('ClientCertificateStore', () => {
    it('adds and retrieves certs for urls', () => {
      const url1 = urllib.parse('https://host.com')
      const url2 = urllib.parse('https://company.com')
      const store = new ClientCertificateStore()

      expect(store.getCertCount()).to.eq(0)

      let options = store.getClientCertificateAgentOptionsForUrl(url1)

      expect(options).to.eq(null)

      const certs1 = new UrlClientCertificates(url1.href)

      certs1.clientCertificates = new ClientCertificates()
      certs1.clientCertificates.ca.push(Buffer.from([1, 2, 3, 4]))

      const certs2 = new UrlClientCertificates(url2.href)

      certs2.clientCertificates = new ClientCertificates()
      certs2.clientCertificates.ca.push(Buffer.from([4, 3, 2, 1]))

      store.addClientCertificatesForUrl(certs1)
      expect(store.getCertCount()).to.eq(1)

      store.addClientCertificatesForUrl(certs2)
      expect(store.getCertCount()).to.eq(2)

      const act = () => {
        store.addClientCertificatesForUrl(certs2)
      }

      expect(act).to.throw('ClientCertificateStore::addClientCertificatesForUrl: Url https://company.com/ already in store')

      const options1 = store.getClientCertificateAgentOptionsForUrl(url1)
      const options2 = store.getClientCertificateAgentOptionsForUrl(url2)

      expect(options1.ca).to.eq(certs1.clientCertificates.ca)
      expect(options2.ca).to.eq(certs2.clientCertificates.ca)
    })
  })
})

// The following testing covers the areas:
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

function createCertAndKey (): [object, object] {
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
  const certInfo = createCertAndKey()

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
  const certInfo = createCertAndKey()

  let p12Asn1 = pkcs12.toPkcs12Asn1(certInfo[1], [certInfo[0]], passphrase)

  fs.writeFileSync(certFilepath, asn1.toDer(p12Asn1).getBytes(), { encoding: 'binary' })

  if (passphraseFilepath) {
    fs.writeFileSync(passphraseFilepath, passphrase)
  }
}

function createCaFile (filepath: string) {
  const certInfo = createCertAndKey()

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
    clientCertificates: [
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
    clientCertificates: [
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

const tempDirPath = path.join(os.tmpdir(), tempDirName)
const caFilepath = path.join(tempDirPath, caFilename)
const pemFilepath = path.join(tempDirPath, pemFilename)
const pemKeyFilepath = path.join(tempDirPath, pemKeyFilename)
const pemPassphraseFilepath = path.join(tempDirPath, pemPassphraseFilename)
const pfxFilepath = path.join(tempDirPath, pfxFilename)
const pfxPassphraseFilepath = path.join(tempDirPath, pfxPassphraseFilename)

describe('lib/client-certificates', () => {
  before(() => {
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

      loadClientCertificateConfig(config)
      const options = clientCertificateStore.getClientCertificateAgentOptionsForUrl(
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
        clientCertificates: [
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

      loadClientCertificateConfig(config)
      const options = clientCertificateStore.getClientCertificateAgentOptionsForUrl(
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

      loadClientCertificateConfig(config)
      const options = clientCertificateStore.getClientCertificateAgentOptionsForUrl(
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

      const relativeCaFilepath = path.relative(__dirname, caFilepath)
      const relativePemFilepath = path.relative(__dirname, pemFilepath)
      const relativeKeyFilepath = path.relative(__dirname, pemKeyFilepath)

      const url = createUniqueUrl()
      const config = createSinglePemConfig(
        url,
        relativeCaFilepath,
        relativePemFilepath,
        relativeKeyFilepath,
        undefined,
      )

      loadClientCertificateConfig(config)
      const options = clientCertificateStore.getClientCertificateAgentOptionsForUrl(
        urllib.parse(url),
      )

      expect(options).not.to.be.null
      expect(options.ca.length).to.eq(1)
      expect(options.pfx).to.be.empty
      expect(options.cert.length).to.eq(1)
      expect(options.key.length).to.eq(1)
      expect(options.key[0].passphrase).to.be.undefined
    })

    // TODO: fix this flaky test
    it.skip('detects invalid PEM key passphrase', () => {
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
        loadClientCertificateConfig(config)
      }

      expect(act).to.throw(
        `Cannot decrypt PEM key with supplied passphrase (check the passphrase file content and that it doesn't have unexpected whitespace at the end)`,
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
        loadClientCertificateConfig(config)
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
        loadClientCertificateConfig(config)
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
        loadClientCertificateConfig(config)
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
        loadClientCertificateConfig(config)
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
        loadClientCertificateConfig(config)
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
        loadClientCertificateConfig(config)
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
        loadClientCertificateConfig(config)
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
        loadClientCertificateConfig(config)
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

      loadClientCertificateConfig(config)

      const options = clientCertificateStore.getClientCertificateAgentOptionsForUrl(
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
        loadClientCertificateConfig(config)
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
        loadClientCertificateConfig(config)
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
        loadClientCertificateConfig(config)
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
        loadClientCertificateConfig(config)
      }

      expect(act).to.throw('Unable to load PFX file: Too few bytes to read ASN.1 value')
    })

    it('detects neither PEM nor PFX supplied', () => {
      const config = {
        projectRoot: __dirname,
        clientCertificates: [
          {
            url: createUniqueUrl(),
            ca: [],
            certs: [
            ],
          },
        ],
      }

      const act = () => {
        loadClientCertificateConfig(config)
      }

      expect(act).to.throw('Either PEM or PFX must be supplied')
    })
  })
})
