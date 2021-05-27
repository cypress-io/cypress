import Debug from 'debug'
import Forge from 'node-forge'
import fs from 'fs-extra'
import { clientCertificates as networkClientCertificates } from '@packages/network'
import { clientCertificateStore } from '@packages/network/lib/agent'
const { pki, asn1, pkcs12, util } = Forge
const debug = Debug('cypress:server:client-certificates')

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
    // The basic validation of the certificate configuration has already been done by this point
    // within the 'isValidClientCertificatesSet' function within packages/server/lib/util/validation.js
    if (clientCertificates) {
      clientCertificates.forEach((item) => {
        debug(`loading client cert at index ${index}`)

        const urlClientCertificates = new networkClientCertificates.UrlClientCertificates(item.url)

        if (item.ca) {
          item.ca.forEach((ca: string) => {
            if (ca) {
              debug(`loading CA cert from '${ca}'`)
              const caRaw = loadBinaryFromFile(ca)

              try {
                pki.certificateFromPem(caRaw)
              } catch (error) {
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
            } catch (error) {
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
                    'Cannot decrypt PEM key with supplied passphrase (check the passphrase file content and that it doesn\'t have unexpected whitespace at the end)',
                  )
                }
              } else {
                if (!pki.privateKeyFromPem(pemKeyRaw)) {
                  throw new Error('Cannot load PEM key')
                }
              }
            } catch (error) {
              throw new Error(`Cannot parse PEM key: ${error.message}`)
            }

            urlClientCertificates.clientCertificates.key.push(
              new networkClientCertificates.PemKey(pemKeyRaw, passphrase),
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
              new networkClientCertificates.PfxCertificate(pfxRaw, passphrase),
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
  } catch (e) {
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

  return fs.readFileSync(filepath)
}

function loadTextFromFile (filepath: string): string {
  debug(`loadPassphraseFile: ${filepath}`)

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
  } catch (e) {
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
  } catch (e) {
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
  } catch (e) {
    throw new Error(`Unable to extract subject from PFX file: ${e.message}`)
  }
}
