import { URL, Url } from 'url'
import debugModule from 'debug'
import minimatch from 'minimatch'
import fs from 'fs-extra'
import { clientCertificateStore } from './agent'

const { pki, asn1, pkcs12, util } = require('node-forge')

const debug = debugModule('cypress:network:client-certificates')

export class ParsedUrl {
  constructor (url: string) {
    if (url === '*' || url === 'https://*') {
      this.host = '*'
      this.path = undefined
      this.port = undefined
    } else {
      let parsed = new URL(url)

      this.host = parsed.hostname
      this.port = !parsed.port ? undefined : parseInt(parsed.port)
      if (parsed.pathname.length === 0 || parsed.pathname === '/') {
        this.path = undefined
      } else if (
        parsed.pathname.length > 0 &&
        !parsed.pathname.endsWith('/') &&
        !parsed.pathname.endsWith('*')
      ) {
        this.path = `${parsed.pathname}/`
      } else {
        this.path = parsed.pathname
      }
    }

    this.hostMatcher = new minimatch.Minimatch(this.host)
    this.pathMatcher = new minimatch.Minimatch(this.path ?? '')
  }

  path: string | undefined
  host: string
  port: number | undefined
  hostMatcher: minimatch.IMinimatch
  pathMatcher: minimatch.IMinimatch
}

export class UrlMatcher {
  static buildMatcherRule (url: string): ParsedUrl {
    return new ParsedUrl(url)
  }

  static matchUrl (hostname: string | undefined | null, path: string | undefined | null, port: number | undefined | null, rule: ParsedUrl | undefined): boolean {
    if (!hostname || !rule) {
      return false
    }

    let ret = rule.hostMatcher.match(hostname)

    if (ret && rule.port) {
      ret = rule.port === port
    }

    if (ret && rule.path) {
      ret = rule.pathMatcher?.match(path ?? '')
    }

    return ret
  }
}

/**
 * Defines the certificates that should be used for the specified URL
 */
export class UrlClientCertificates {
  constructor (url: string) {
    this.subjects = ''
    this.url = url
    this.pathnameLength = new URL(url).pathname.length
    this.clientCertificates = new ClientCertificates()
  }
  clientCertificates: ClientCertificates
  url: string
  subjects: string
  pathnameLength: number
  matchRule: ParsedUrl | undefined

  addSubject (subject: string) {
    if (!this.subjects) {
      this.subjects = subject
    } else {
      this.subjects = `${this.subjects} - ${subject}`
    }
  }
}

/**
 * Client certificates; this is in a data structure that is compatible with the NodeJS TLS API described
 * at https://nodejs.org/api/tls.html#tls_tls_createsecurecontext_options
 */
export class ClientCertificates {
  ca: Buffer[] = []
  cert: Buffer[] = []
  key: PemKey[] = []
  pfx: PfxCertificate[] = []
}

export class PemKey {
  constructor (pem: Buffer, passphrase: string | undefined) {
    this.pem = pem
    this.passphrase = passphrase
  }

  pem: Buffer
  passphrase: string | undefined
}

export class PfxCertificate {
  constructor (buf: Buffer, passphrase: string | undefined) {
    this.buf = buf
    this.passphrase = passphrase
  }

  buf: Buffer
  passphrase: string | undefined
}

export class ClientCertificateStore {
  private _urlClientCertificates: UrlClientCertificates[] = []

  addClientCertificatesForUrl (cert: UrlClientCertificates) {
    debug(
      'ClientCertificateStore::addClientCertificatesForUrl: "%s"',
      cert.url,
    )

    const existing = this._urlClientCertificates.find((x) => x.url === cert.url)

    if (existing) {
      throw new Error(`ClientCertificateStore::addClientCertificatesForUrl: Url ${cert.url} already in store`)
    }

    cert.matchRule = UrlMatcher.buildMatcherRule(cert.url)
    this._urlClientCertificates.push(cert)
  }

  getClientCertificateAgentOptionsForUrl (requestUrl: Url): ClientCertificates | null {
    if (
      !this._urlClientCertificates ||
      this._urlClientCertificates.length === 0
    ) {
      return null
    }

    const port = !requestUrl.port ? undefined : parseInt(requestUrl.port)
    const matchingCerts = this._urlClientCertificates.filter((cert) => {
      return UrlMatcher.matchUrl(requestUrl.hostname, requestUrl.path, port, cert.matchRule)
    })

    switch (matchingCerts.length) {
      case 0:
        debug(`not using client certificate(s) for url '${requestUrl.href}'`)

        return null
      case 1:
        debug(
          `using client certificate(s) '${matchingCerts[0].subjects}' for url '${requestUrl.href}'`,
        )

        return matchingCerts[0].clientCertificates
      default:
        matchingCerts.sort((a, b) => {
          return b.pathnameLength - a.pathnameLength
        })

        debug(
          `using client certificate(s) '${matchingCerts[0].subjects}' for url '${requestUrl.href}'`,
        )

        return matchingCerts[0].clientCertificates
    }
  }

  getCertCount (): Number {
    return !this._urlClientCertificates ? 0 : this._urlClientCertificates.length
  }

  clear (): void {
    this._urlClientCertificates = []
  }
}

/**
 * Load and parse the client certificate configuration.  The structure and content of this
 * has already been validated; this function reads cert content from file and adds it to the
 * network ClientCertificateStore
 * @param config
 */
export function loadClientCertificateConfig (config) {
  const { clientCertificates } = config

  let index = 0

  try {
    clientCertificateStore.clear()

    // The basic validation of the certificate configuration has already been done by this point
    // within the 'isValidClientCertificatesSet' function within packages/config/src/validation.js
    if (clientCertificates) {
      clientCertificates.forEach((item) => {
        debug(`loading client cert at index ${index}`)

        const urlClientCertificates = new UrlClientCertificates(item.url)

        if (item.ca) {
          item.ca.forEach((ca: string) => {
            if (ca) {
              debug(`loading CA cert from '${ca}'`)
              const caRaw = loadBinaryFromFile(ca)

              try {
                pki.certificateFromPem(caRaw)
              } catch (error: any) {
                throw new Error(`Cannot parse CA cert: ${error.message}`)
              }

              urlClientCertificates.clientCertificates.ca.push(caRaw)
            }
          })
        }

        if (!item.certs || item.certs.length === 0) {
          throw new Error('Either PEM or PFX must be supplied')
        }

        item.certs.forEach((cert) => {
          if (!cert || (!cert.cert && !cert.pfx)) {
            throw new Error('Either PEM or PFX must be supplied')
          }

          if (cert.cert) {
            if (!cert.key) {
              throw new Error(`No PEM key defined for cert: ${cert.cert}`)
            }

            debug(
              `loading PEM cert information from '${JSON.stringify(cert)}'`,
            )

            debug(`loading PEM cert from '${cert.cert}'`)
            const pemRaw = loadBinaryFromFile(cert.cert)
            let pemParsed = undefined

            try {
              pemParsed = pki.certificateFromPem(pemRaw)
            } catch (error: any) {
              throw new Error(`Cannot parse PEM cert: ${error.message}`)
            }

            urlClientCertificates.clientCertificates.cert.push(pemRaw)

            let passphrase: string | undefined = undefined

            if (cert.passphrase) {
              debug(`loading PEM passphrase from '${cert.passphrase}'`)
              passphrase = loadTextFromFile(cert.passphrase)
            }

            debug(`loading PEM key from '${cert.key}'`)
            const pemKeyRaw = loadBinaryFromFile(cert.key)

            try {
              if (passphrase) {
                if (!pki.decryptRsaPrivateKey(pemKeyRaw, passphrase)) {
                  throw new Error(
                    `Cannot decrypt PEM key with supplied passphrase (check the passphrase file content and that it doesn't have unexpected whitespace at the end)`,
                  )
                }
              } else {
                if (!pki.privateKeyFromPem(pemKeyRaw)) {
                  throw new Error('Cannot load PEM key')
                }
              }
            } catch (error: any) {
              throw new Error(`Cannot parse PEM key: ${error.message}`)
            }

            urlClientCertificates.clientCertificates.key.push(
              new PemKey(pemKeyRaw, passphrase),
            )

            const subject = extractSubjectFromPem(pemParsed)

            urlClientCertificates.addSubject(subject)
            debug(
              `loaded client PEM certificate: ${subject} for url: ${urlClientCertificates.url}`,
            )
          }

          if (cert.pfx) {
            debug(
              `loading PFX cert information from '${JSON.stringify(cert)}'`,
            )

            let passphrase: string | undefined = undefined

            if (cert.passphrase) {
              debug(`loading PFX passphrase from '${cert.passphrase}'`)
              passphrase = loadTextFromFile(cert.passphrase)
            }

            debug(`loading PFX cert from '${cert.pfx}'`)
            const pfxRaw = loadBinaryFromFile(cert.pfx)
            const pfxParsed = loadPfx(pfxRaw, passphrase)

            urlClientCertificates.clientCertificates.pfx.push(
              new PfxCertificate(pfxRaw, passphrase),
            )

            const subject = extractSubjectFromPfx(pfxParsed)

            urlClientCertificates.addSubject(subject)
            debug(
              `loaded client PFX certificate: ${subject} for url: ${urlClientCertificates.url}`,
            )
          }
        })

        clientCertificateStore.addClientCertificatesForUrl(urlClientCertificates)
        index++
      })

      debug(
        `loaded client certificates for ${clientCertificateStore.getCertCount()} URL(s)`,
      )
    }
  } catch (e: any) {
    debug(
      `Failed to load client certificate for clientCertificates[${index}]: ${e.message} ${e.stack}`,
    )

    throw new Error(
      `Failed to load client certificates for clientCertificates[${index}]: ${e.message}.  For more debug details run Cypress with DEBUG=cypress:server:client-certificates*`,
    )
  }
}

function loadBinaryFromFile (filepath: string): Buffer {
  debug(`loadCertificateFile: ${filepath}`)

  // TODO: update to async
  // eslint-disable-next-line no-restricted-syntax
  return fs.readFileSync(filepath)
}

function loadTextFromFile (filepath: string): string {
  debug(`loadPassphraseFile: ${filepath}`)

  // TODO: update to async
  // eslint-disable-next-line no-restricted-syntax
  return fs.readFileSync(filepath, 'utf8').toString()
}

/**
 * Extract subject from supplied pem instance
 */
function extractSubjectFromPem (pem): string {
  try {
    return pem.subject.attributes
    .map((attr) => [attr.shortName, attr.value].join('='))
    .join(', ')
  } catch (e: any) {
    throw new Error(`Unable to extract subject from PEM file: ${e.message}`)
  }
}

/**
 * Load PFX data from the supplied Buffer and passphrase
 */
function loadPfx (pfx: Buffer, passphrase: string | undefined) {
  try {
    const certDer = util.decode64(pfx.toString('base64'))
    const certAsn1 = asn1.fromDer(certDer)

    return pkcs12.pkcs12FromAsn1(certAsn1, passphrase)
  } catch (e: any) {
    debug(`loadPfx fail: ${e.message} ${e.stackTrace}`)
    throw new Error(`Unable to load PFX file: ${e.message}`)
  }
}

/**
 * Extract subject from supplied pfx instance
 */
function extractSubjectFromPfx (pfx) {
  try {
    const certs = pfx.getBags({ bagType: pki.oids.certBag })[pki.oids.certBag].map((item) => item.cert)

    return certs[0].subject.attributes.map((attr) => [attr.shortName, attr.value].join('=')).join(', ')
  } catch (e: any) {
    throw new Error(`Unable to extract subject from PFX file: ${e.message}`)
  }
}
