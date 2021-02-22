import Debug from 'debug'
import Forge from 'node-forge'
import fs from 'fs-extra'
import path from 'path'
import { networkPki } from '@packages/network'
const { pki, asn1, pkcs12, util } = Forge
const debug = Debug('cypress:server:pki')
/**
 * Load and parse the client PKI certificate configuration.  The structure and content of this
 * has already been validated; this function reads cert content from file and adds it to the
 * networkPki.ClientPkiCertificateStore
 * @param config
 */
export function loadPkiConfig (config) {
  const { clientPkiCertificates, projectRoot } = config
  try {
    // The basic validation of the certificate configuration has already been done by this point
    // within the 'isValidClientPkiCertificatesSet' function within packages/server/lib/util/validation.js
    if (clientPkiCertificates) {
      let store = networkPki.ClientPkiCertificateStore.Instance
      let index = 0
      clientPkiCertificates.forEach((item) => {
        debug(`loading client pki cert at index ${index++}`)
        let urlPkiCertificates = new networkPki.UrlPkiCertificates(item.url)
        if (item.ca) {
          item.ca.forEach((ca) => {
            debug(`loading CA cert from '${ca}'`)
            urlPkiCertificates.pkiCertificates.ca.push(loadCertificateFile(projectRoot, ca))
          })
        }
        item.certs.forEach((cert) => {
          if (cert.cert) {
            if (!cert.key) {
              throw new Error(`No PEM key defined for cert: ${cert.cert}`)
            }
            debug(`loading PEM cert information from '${JSON.stringify(cert)}'`)
            debug(`loading PEM cert from '${cert.cert}'`)
            let pem = loadCertificateFile(projectRoot, cert.cert)
            urlPkiCertificates.pkiCertificates.cert.push(pem)
            let passphrase: string | undefined = undefined
            if (cert.passphrase) {
              debug(`loading PEM passphrase from '${cert.passphrase}'`)
              passphrase = loadPassphraseFile(projectRoot, cert.passphrase)
            }
            debug(`loading PEM key from '${cert.key}'`)
            urlPkiCertificates.pkiCertificates.key.push(new networkPki.PemKey(loadCertificateFile(projectRoot, cert.key), passphrase))
            // ******************************************************
            // TODO: validate that the cert, key and passphrase match
            // ******************************************************
            let subject = extractSubjectFromPem(loadPemCert(pem))
            urlPkiCertificates.addSubject(subject)
            debug(`loaded client PEM certificate: ${subject} for url: ${urlPkiCertificates.url}`)
          }
          if (cert.pfx) {
            debug(`loading PFX cert information from '${JSON.stringify(cert)}'`)
            let passphrase: string | undefined = undefined
            if (cert.passphrase) {
              debug(`loading PFX passphrase from '${cert.passphrase}'`)
              passphrase = loadPassphraseFile(projectRoot, cert.passphrase)
            }
            debug(`loading PFX cert from '${cert.pfx}'`)
            let pfx = new networkPki.PfxCertificate(loadCertificateFile(projectRoot, cert.pfx), passphrase)
            urlPkiCertificates.pkiCertificates.pfx.push(pfx)
            let subject = extractSubjectFromPfx(loadPfx(pfx.buf, pfx.passphrase))
            urlPkiCertificates.addSubject(subject)
            debug(`loaded client PFX certificate: ${subject} for url: ${urlPkiCertificates.url}`)
          }
        })
        store.addPkiCertificatesForUrl(urlPkiCertificates)
      })
      debug(`loaded client PKI certificates for ${store.getCertCount()} URLs`)
    }
  } catch (e) {
    debug(`Failed to load all client PKI certificates: ${e.message} ${e.stack}`)
    throw new Error('Failed to load all client PKI certificates')
  }
}
function loadCertificateFile (projectRoot: string, filepath: string): Buffer {
  let retrievePath: string = path.isAbsolute(filepath) ? filepath : path.join(projectRoot, filepath)
  debug(`loadCertificateFile: ${retrievePath}`)
  return fs.readFileSync(retrievePath)
}
function loadPassphraseFile (projectRoot: string, filepath: string): string {
  let retrievePath: string = path.isAbsolute(filepath) ? filepath : path.join(projectRoot, filepath)
  debug(`loadPassphraseFile: ${retrievePath}`)
  return fs.readFileSync(retrievePath, 'utf8').toString()
}
function loadPemCert (pem: Buffer) {
  try {
    return pki.certificateFromPem(pem)
  } catch (e) {
    throw new Error(`Unable to load PEM file: ${e.message}`)
  }
}
function extractSubjectFromPem (cert) {
  try {
    return cert.subject.attributes
    .map((attr) => [attr.shortName, attr.value].join('='))
    .join(', ')
  } catch (e) {
    throw new Error(`Unable to extract subject from PEM file: ${e.message}`)
  }
}
function loadPfx (pfx: Buffer, passphrase: string | undefined) {
  try {
    const certDer = util.decode64(pfx.toString('base64'))
    const certAsn1 = asn1.fromDer(certDer)
    return pkcs12.pkcs12FromAsn1(certAsn1, passphrase)
  } catch (e) {
    throw new Error(`Unable to load PFX file: ${e.message}`)
  }
}
function extractSubjectFromPfx (certPkcs12) {
  try {
    const certs = certPkcs12.getBags({ bagType: pki.oids.certBag })[pki.oids.certBag].map((item) => item.cert)
    return certs[0].subject.attributes
    .map((attr) => [attr.shortName, attr.value].join('='))
    .join(', ')
  } catch (e) {
    throw new Error(`Unable to extract subject from PFX file: ${e.message}`)
  }
}

