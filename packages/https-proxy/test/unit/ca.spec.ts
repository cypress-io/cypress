import { describe, it, expect, beforeEach, vi } from 'vitest'
import os from 'os'
import fs from 'fs-extra'
import path from 'path'
import { CA } from '../../lib/ca'

vi.mock('fs-extra', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      readFile: vi.fn(),
      outputFile: vi.fn(),
      remove: vi.fn(),
      stat: vi.fn(),
    },
  }
})

// make sure the properties we set on the certificate are reflected
const validateCertificate = (ca: CA) => {
  expect(ca).toBeInstanceOf(CA)

  // should represent an instance of a pki.Certificate object
  expect(ca.CAcert).toBeInstanceOf(Object)
  expect(ca.CAcert.version).toEqual(2)
  expect(ca.CAcert.extensions).toBeInstanceOf(Array)
  expect(ca.CAcert.extensions).toHaveLength(5)
  expect(ca.CAcert.extensions).toEqual(expect.arrayContaining([
    expect.objectContaining({
      name: 'basicConstraints',
      cA: true,
    }),
    expect.objectContaining({
      name: 'keyUsage',
      keyCertSign: true,
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true,
    }),
    expect.objectContaining({
      name: 'extKeyUsage',
      serverAuth: true,
      clientAuth: true,
      codeSigning: true,
      emailProtection: true,
      timeStamping: true,
    }),
    expect.objectContaining({
      name: 'nsCertType',
      client: true,
      server: true,
      email: true,
      objsign: true,
      sslCA: true,
      emailCA: true,
      objCA: true,
    }),
    expect.objectContaining({
      name: 'subjectKeyIdentifier',
    }),
  ]))

  expect(ca.CAcert.issuer.attributes).toBeInstanceOf(Array)
  expect(ca.CAcert.issuer.attributes).toHaveLength(6)
  expect(ca.CAcert.issuer.attributes).toEqual(expect.arrayContaining([
    expect.objectContaining({
      name: 'commonName',
      value: 'CypressProxyCA',
    }), expect.objectContaining({
      name: 'countryName',
      value: 'Internet',
    }), expect.objectContaining({
      shortName: 'ST',
      value: 'Internet',
    }), expect.objectContaining({
      name: 'localityName',
      value: 'Internet',
    }), expect.objectContaining({
      name: 'organizationName',
      value: 'Cypress.io',
    }), expect.objectContaining({
      shortName: 'OU',
      value: 'CA',
    }),
  ]))

  expect(ca.CAcert.subject.attributes).toBeInstanceOf(Array)
  expect(ca.CAcert.subject.attributes).toHaveLength(6)
  expect(ca.CAcert.subject.attributes).toEqual(expect.arrayContaining([
    expect.objectContaining({
      name: 'commonName',
      value: 'CypressProxyCA',
    }), expect.objectContaining({
      name: 'countryName',
      value: 'Internet',
    }), expect.objectContaining({
      shortName: 'ST',
      value: 'Internet',
    }), expect.objectContaining({
      name: 'localityName',
      value: 'Internet',
    }), expect.objectContaining({
      name: 'organizationName',
      value: 'Cypress.io',
    }), expect.objectContaining({
      shortName: 'OU',
      value: 'CA',
    }),
  ]))

  expect(ca.CAcert.validity.notBefore).toBeInstanceOf(Date)
  expect(ca.CAcert.validity.notAfter).toBeInstanceOf(Date)

  // cert should be valid for 10 years
  expect(ca.CAcert.validity.notAfter.getFullYear()).toEqual(ca.CAcert.validity.notBefore.getFullYear() + 10)

  expect(ca.CAcert.serialNumber).toEqual(expect.any(String))

  // should represent an instance of a pki.rsa.KeyPair object
  expect(ca.CAkeys).toBeInstanceOf(Object)
  expect(ca.CAkeys).toHaveProperty('privateKey')
  expect(ca.CAkeys).toHaveProperty('publicKey')
}

describe('lib/ca', () => {
  let tmpDir: string

  beforeEach(async () => {
    vi.useFakeTimers()
    tmpDir = path.join(os.tmpdir(), 'cy-ca')
    vi.mocked(fs.outputFile).mockClear()
    vi.mocked(fs.remove).mockClear()
    vi.mocked(fs.readFile).mockClear()
    vi.mocked(fs.remove).mockClear()
    vi.mocked(fs.readFile).mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('#generateServerCertificateKeys', () => {
    it('generates certs for each host', async function () {
      const ca = await CA.create(tmpDir)

      const [certPem, keyPrivatePem] = await ca.generateServerCertificateKeys('www.cypress.io')

      expect(certPem).to.include('-----BEGIN CERTIFICATE-----')

      expect(keyPrivatePem).to.include('-----BEGIN RSA PRIVATE KEY-----')
    })
  })

  describe('.create', () => {
    it('loads existing certs and keys if version matches CA_VERSIONand certs can be loaded from disk', async function () {
      // have some mock certs and keys for the tests as a string
      const MOCK_CERT_PEM = `-----BEGIN CERTIFICATE-----\r\nMIIEADCCAuigAwIBAgIQ6MJNvbbXbCX7WclKcbjYeDANBgkqhkiG9w0BAQsFADB0\r\nMRcwFQYDVQQDEw5DeXByZXNzUHJveHlDQTERMA8GA1UEBhMISW50ZXJuZXQxETAP\r\nBgNVBAgTCEludGVybmV0MREwDwYDVQQHEwhJbnRlcm5ldDETMBEGA1UEChMKQ3lw\r\ncmVzcy5pbzELMAkGA1UECxMCQ0EwHhcNMjUxMDEzMDA1NjA5WhcNMzUxMDEzMDA1\r\nNjA5WjB0MRcwFQYDVQQDEw5DeXByZXNzUHJveHlDQTERMA8GA1UEBhMISW50ZXJu\r\nZXQxETAPBgNVBAgTCEludGVybmV0MREwDwYDVQQHEwhJbnRlcm5ldDETMBEGA1UE\r\nChMKQ3lwcmVzcy5pbzELMAkGA1UECxMCQ0EwggEiMA0GCSqGSIb3DQEBAQUAA4IB\r\nDwAwggEKAoIBAQDKOjGEdnGWigjUxWGSFESJKHL8NtGJiu+yfPp+sQNOlm1xmoGQ\r\n/fqcwVznS5Tg6R04awCmOkJ+vBay5ZlMn7l1ke95HPnHlVdUFd+rIgQ3GIQcoF6n\r\nigop7fl6nHQch5G7plmYl996r5BR9I3V0mnG37W0X6puPx75cniW2o7mswduvraW\r\nw8DY/QrA1AgNquOSrwklJbxbAzwQQSI8qezaVJKlPLdtDbDKtZqYotw+68Emd0ul\r\nml72f4gYFwlLkqUObku+s6X+8QZwsVfVqp4nX1JMHlT2HeoXqZpwVqeyufXT1ptT\r\npTwS0P95+47mHqgKNygtPMUGx7WqCrDWzSPXAgMBAAGjgY0wgYowDAYDVR0TBAUw\r\nAwEB/zALBgNVHQ8EBAMCAvQwOwYDVR0lBDQwMgYIKwYBBQUHAwEGCCsGAQUFBwMC\r\nBggrBgEFBQcDAwYIKwYBBQUHAwQGCCsGAQUFBwMIMBEGCWCGSAGG+EIBAQQEAwIA\r\n9zAdBgNVHQ4EFgQUJuQ4X4StMVeALE08ZtcMiyGT91kwDQYJKoZIhvcNAQELBQAD\r\nggEBALKuo2EZs+X0VFM95PcEYPa2a3F+7jdTOCa7aorbew3jiQQUSWH8RYDkmIg5\r\nDI9r6qq5sBmJfsVdTnxpn6w4DIY3dHd1UkGI+zEgKvPzqHwMUHNJGV3U79/JGfV2\r\nQZKllDQlJVEtNPo0o0TLvbPqAET5Z11gfQ1ZNZ4OBYAoJCZg8UflzVpeMsQCorNG\r\nzMObOnOVXWi6QHSQDkwMI3QVvseK1SfMgqcdgyodbEVJoEeay/B5mlYYvhs8iuSc\r\ncfkl3LZx/NtmetyM2SIVI+M7kkKQfcluOMQcBP3UCZ1/m7RajFbe55koi5EgGeFH\r\n1jg+r2qr6VclijKRfbqR6L4JBdg=\r\n-----END CERTIFICATE-----\r\n`
      const MOCK_KEY_PRIVATE_PEM = `-----BEGIN RSA PRIVATE KEY-----\r\nMIIEpAIBAAKCAQEA3/Acf8Fy6ECV88Qsz9fVA61cSK5Ki+wS88SYdz41xFp7ssew\r\nwYZvB9Aqii4vu8/to1AItLTV7I5ZEJEZJvlffK7fp15WMEqlpEHVAb3DoNw5ZAPY\r\n56liRHMi0RPV6t/QsyKTP/LYgNaDt+A9HE/My+E/+VfniOOE36tL9UxD+gipffLt\r\n+17c2oeT3Vzin3K4VuxNGtaFwUKUR+XJWcpGxxa/3GT3F6Xfmy1JTnDaFVGHL6ug\r\nW56z8uDyf8UUNaA8HSo2Ak+2Mc32xS0/+5FUSHdp5J8/ghjvnrRl01qmjnKVNSU8\r\n9wYPdoNw0D2N4uOoV2W8J2F76Gq1qlSO6bM1pwIDAQABAoIBAAcN6M/rd6OyWSbv\r\nMJwxh9/QR75wYx/KRYSRVl43QvlXAluM59gI1JmR6K0mrFFFyQ4ieMu8gJqtl0eq\r\n0niEVYo3dgsvMRbfWx10B3JBGJcKKPKqHlyZ3OMcH2Ynsk7uUwQ5nBrhGwnf+BFE\r\nSpiIOQLZKys/JieNR0PGgSOOjfuj2BoS+RMl30tRFOY/4QZP4oyuG/DND77+Cz/z\r\n7vBvF/78HoXfqbSQfLjT+D7kOvTVwF+jDYCUjMpo9uhQfWEA0a0+E8ZdIfzvtEca\r\nzhY18T0hvcDiq+revXjG9uOh7dPls1INdZazM85asife7GVmVEMmAsTXBlPU5wi0\r\nulqso60CgYEA/nRFSASQi5ySyt6De3PKEWc5GhFBVrA5YANKd2olMKvNbkm6W4TZ\r\n9mvJKxHmc2uTIOaRBAgOOZgNrYX2GgFC38IrNPtYBxTl+YmbFX+n4Z7Rp5s+HMz/\r\nVP6e8BLNaSYBT3Cqj1Nb/qfeqHgGmTs2Wk1qWeonyeoXyTO5fWd2JWMCgYEA4Uxh\r\nreKZr6Uz0BWhga7c74fkOg38CWzyW6OBuizlsxUCkzt4gGOXHOqb2O/pN/f2bBDB\r\nME4aErHngRTqW4vSpLPPsgvAxR1Q/dB8YUpesnO1pTFVIcWyVK/HIfo8Fg8ohNpE\r\nyEeemEVvtXz4nLK/Q8/KqV9KCuuCXucaqG4W0+0CgYEAvqTCm7i/y7pdyR16CW6x\r\ngOSDxeITwC18b1FH47xlbNfrrKwUsikRXS1YpapdrTB2JXpaQFkAv2oLJW1u/ADh\r\n5+AEm0eNppCj1Zih1zOzxrlFf3wyx0VYMIgs8NZFjHhrFuflAkmEbYG8syBqYTgZ\r\n+wJxojhr4z4+4AKfATQZMt0CgYATAdenzNs8Z0qUvo5um2sGRkep4i4mOWvE8Wlr\r\nZIhIcHhUJYtIAZ7pEJ3vUmYxk5jViyBRS/WFKD8os7QF3yj5PjZChh1QQ+XmU+V6\r\na8TLd1mWwy+0drJR1LaPFkZlcgfwFV4CK5Cktg7zl8R9q9LZDLnDSke73hyUlxi3\r\npvoEDQKBgQCgJVyo0p3x8bQe8RLKHb6la710I12Px4+sujImdG5+Spqrxyq5ii36\r\nbj/U3txxbqRg8RIzBZ1Zvde8TKt7RyhFqpkCfBQkqd/5/zriHOQZ7lgSNtjq5cYB\r\nEQ/JzKUoa0lAEuAxWQ7eSs8qy+Q36VphSTcNAqCt7rFhWmuASJVObg==\r\n-----END RSA PRIVATE KEY-----\r\n`
      const MOCK_KEY_PUBLIC_PEM = `-----BEGIN PUBLIC KEY-----\r\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA3/Acf8Fy6ECV88Qsz9fV\r\nA61cSK5Ki+wS88SYdz41xFp7ssewwYZvB9Aqii4vu8/to1AItLTV7I5ZEJEZJvlf\r\nfK7fp15WMEqlpEHVAb3DoNw5ZAPY56liRHMi0RPV6t/QsyKTP/LYgNaDt+A9HE/M\r\ny+E/+VfniOOE36tL9UxD+gipffLt+17c2oeT3Vzin3K4VuxNGtaFwUKUR+XJWcpG\r\nxxa/3GT3F6Xfmy1JTnDaFVGHL6ugW56z8uDyf8UUNaA8HSo2Ak+2Mc32xS0/+5FU\r\nSHdp5J8/ghjvnrRl01qmjnKVNSU89wYPdoNw0D2N4uOoV2W8J2F76Gq1qlSO6bM1\r\npwIDAQAB\r\n-----END PUBLIC KEY-----\r\n`

      // @ts-expect-error
      vi.mocked(fs.readFile).mockImplementation((pathToRead: string) => {
        if (pathToRead === `${tmpDir}/ca_version.txt`) {
          // return version 1 to match current CA_VERSION
          return Promise.resolve('1')
        }

        if (pathToRead === `${tmpDir}/certs/ca.pem`) {
          return Promise.resolve(MOCK_CERT_PEM)
        }

        if (pathToRead === `${tmpDir}/keys/ca.private.key`) {
          return Promise.resolve(MOCK_KEY_PRIVATE_PEM)
        }

        if (pathToRead === `${tmpDir}/keys/ca.public.key`) {
          return Promise.resolve(MOCK_KEY_PUBLIC_PEM)
        }

        return Promise.reject(new Error(`file not found: ${pathToRead}. Did you remember to mock it?`))
      })

      const ca = await CA.create(tmpDir)

      validateCertificate(ca)

      // should not attempt to write the certs and keys if discovering cert succeeds version check and can load certs from disk
      expect(fs.outputFile).not.toHaveBeenCalledWith(`${tmpDir}/certs/ca.pem`, expect.any(String))
      expect(fs.outputFile).not.toHaveBeenCalledWith(`${tmpDir}/keys/ca.private.key`, expect.any(String))
      expect(fs.outputFile).not.toHaveBeenCalledWith(`${tmpDir}/keys/ca.public.key`, expect.any(String))
      expect(fs.outputFile).not.toHaveBeenCalledWith(`${tmpDir}/ca_version.txt`, '1')
    })

    it('clears out CA folder if no ca_version.txt is found and generates certs and keys', async function () {
      vi.mocked(fs.readFile).mockImplementation((pathToRead: string) => {
        // mock failing of loading anything certificate related

        return Promise.reject(new Error(`file not found: ${pathToRead}`))
      })

      const ca = await CA.create(tmpDir)

      validateCertificate(ca)

      // if discovering the version fails or can't discover certs, the temp dir for cy-ca should be removed
      expect(fs.remove).toHaveBeenCalledWith(tmpDir)

      // should attempt to write the certs and keys if discovering cert fails version check or otherwise
      expect(fs.outputFile).toHaveBeenCalledWith(`${tmpDir}/certs/ca.pem`, expect.any(String))
      expect(fs.outputFile).toHaveBeenCalledWith(`${tmpDir}/keys/ca.private.key`, expect.any(String))
      expect(fs.outputFile).toHaveBeenCalledWith(`${tmpDir}/keys/ca.public.key`, expect.any(String))
      expect(fs.outputFile).toHaveBeenCalledWith(`${tmpDir}/ca_version.txt`, '1')
    })

    it('clears out CA folder with old CA_VERSION and regenerates certs and keys', async function () {
      // @ts-expect-error
      vi.mocked(fs.readFile).mockImplementation((pathToRead: string) => {
        if (pathToRead === `${tmpDir}/ca_version.txt`) {
          // return version 0 to return version mismatch
          return Promise.resolve('0')
        }

        return Promise.reject(new Error(`file not found: ${pathToRead}`))
      })

      const ca = await CA.create(tmpDir)

      validateCertificate(ca)

      // if discovering the version is a mismatch, the temp dir for cy-ca should be removed
      expect(fs.remove).toHaveBeenCalledWith(tmpDir)

      // should attempt to write the certs and keys if discovering cert fails version check or otherwise
      expect(fs.outputFile).toHaveBeenCalledWith(`${tmpDir}/certs/ca.pem`, expect.any(String))
      expect(fs.outputFile).toHaveBeenCalledWith(`${tmpDir}/keys/ca.private.key`, expect.any(String))
      expect(fs.outputFile).toHaveBeenCalledWith(`${tmpDir}/keys/ca.public.key`, expect.any(String))
      expect(fs.outputFile).toHaveBeenCalledWith(`${tmpDir}/ca_version.txt`, '1')
    })
  })
})
