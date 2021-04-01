import { Url } from 'url'
import debugModule from 'debug'
import escapeRegExp from 'escape-string-regexp'

const debug = debugModule('cypress:network:pki')

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
  }

  path: string | undefined;
  host: string;
  port: number | undefined;
}

export class PkiUrlMatcher {
  static buildMatcherRule (url: string): ParsedUrl {
    let parsed = new ParsedUrl(url)

    parsed.host = this.createMatcherValue(parsed.host)
    parsed.path = this.createMatcherValue(parsed.path)

    return parsed
  }

  static matchUrl (parsedUrl: ParsedUrl, rule: ParsedUrl | undefined): boolean {
    if (!parsedUrl || !rule) {
      return false
    }

    let ret = new RegExp(rule.host).test(parsedUrl.host)

    if (ret && rule.port) {
      ret = rule.port === parsedUrl.port
    }

    if (ret && rule.path) {
      ret = new RegExp(rule.path).test(parsedUrl.path || '')
    }

    return ret
  }

  static createMatcherValue (value: string | undefined): string {
    if (!value) {
      return ''
    }

    let escaped = escapeRegExp(value)

    escaped = escaped.replace(/\\\*/g, '.+') // Replace all instances of '\*' with '.+'

    return `^${escaped}$`
  }
}

/**
 * Defines the certificates that should be used for the specified URL
 */
export class UrlPkiCertificates {
  constructor (url: string) {
    this.subjects = ''
    this.url = url
    this.pathnameLength = new URL(url).pathname.length
    this.pkiCertificates = new PkiCertificates()
  }
  pkiCertificates: PkiCertificates;
  url: string;
  subjects: string;
  pathnameLength: number;
  matchRule: ParsedUrl | undefined;

  addSubject (subject: string) {
    if (!this.subjects) {
      this.subjects = subject
    } else {
      this.subjects = `${this.subjects} - ${subject}`
    }
  }
}

/**
 * PKI certificates; this is in a data structure that is compatible with the NodeJS TLS API described
 * at https://nodejs.org/api/tls.html#tls_tls_createsecurecontext_options
 */
export class PkiCertificates {
  ca: Buffer[] = [];
  cert: Buffer[] = [];
  key: PemKey[] = [];
  pfx: PfxCertificate[] = [];
}

export class PemKey {
  constructor (pem: Buffer, passphrase: string | undefined) {
    this.pem = pem
    this.passphrase = passphrase
  }

  pem: Buffer;
  passphrase: string | undefined;
}

export class PfxCertificate {
  constructor (buf: Buffer, passphrase: string | undefined) {
    this.buf = buf
    this.passphrase = passphrase
  }

  buf: Buffer;
  passphrase: string | undefined;
}

export class ClientPkiCertificateStore {
  private _urlPkicertificates: UrlPkiCertificates[] = [];

  addPkiCertificatesForUrl (cert: UrlPkiCertificates) {
    debug(
      'ClientPkiCertificateStore::getPkiCertificatesForUrl: "%s"',
      cert.url,
    )

    // TODO: Will need to validate for duplicate URLs etc.
    cert.matchRule = PkiUrlMatcher.buildMatcherRule(cert.url)
    this._urlPkicertificates.push(cert)
  }

  getPkiAgentOptionsForUrl (requestUrl: Url): PkiCertificates | null {
    if (
      !this._urlPkicertificates ||
      this.getPkiAgentOptionsForUrl.length === 0
    ) {
      return null
    }

    let parsedUrl = new ParsedUrl(requestUrl.href)
    let matchingCerts = this._urlPkicertificates.filter((cert) => {
      return PkiUrlMatcher.matchUrl(parsedUrl, cert.matchRule)
    })

    switch (matchingCerts.length) {
      case 0:
        debug(`not using client certificate(s) for url '${requestUrl.href}'`)

        return null
      case 1:
        debug(
          `using client certificate(s) '${matchingCerts[0].subjects}' for url '${requestUrl.href}'`,
        )

        return matchingCerts[0].pkiCertificates
      default:
        matchingCerts.sort((a, b) => {
          return b.pathnameLength - a.pathnameLength
        })

        debug(
          `using client certificate(s) '${matchingCerts[0].subjects}' for url '${requestUrl.href}'`,
        )

        return matchingCerts[0].pkiCertificates
    }
  }

  getCertCount (): Number {
    return !this._urlPkicertificates ? 0 : this._urlPkicertificates.length
  }
}
