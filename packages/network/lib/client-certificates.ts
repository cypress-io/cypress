import { Url } from 'url'
import debugModule from 'debug'
import minimatch from 'minimatch'

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

  path: string | undefined;
  host: string;
  port: number | undefined;
  hostMatcher: minimatch.IMinimatch;
  pathMatcher: minimatch.IMinimatch;
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

    if (ret && rule.path && path) {
      ret = rule.hostMatcher?.match(path)
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
  clientCertificates: ClientCertificates;
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
 * Client certificates; this is in a data structure that is compatible with the NodeJS TLS API described
 * at https://nodejs.org/api/tls.html#tls_tls_createsecurecontext_options
 */
export class ClientCertificates {
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

export class ClientCertificateStore {
  private _urlClientCertificates: UrlClientCertificates[] = [];

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
