// TODO:
// 1. test these method implementations using encoded characters
// look at the spec to figure out whether we SHOULD be decoding them
// or leaving them as encoded.  also look at UrlParse to see what it does
//
// 2. there is a bug when handling about:blank which borks it and
// turns it into about://blank

import _ from 'lodash'
import UrlParse from 'url-parse'
import * as cors from '@packages/network/lib/cors'

const reHttp = /^https?:\/\//
const reWww = /^www/
const reFile = /^file:\/\//
const reLocalHost = /^(localhost|0\.0\.0\.0|127\.0\.0\.1)/
const reQueryParam = /\?[^/]+/

export interface LocationObject {
  auth: string
  authObj?: Cypress.Auth
  hash: string
  href: string
  host: string
  hostname: string
  origin: string
  pathname: string
  port: number
  protocol: string
  search: string
  superDomainOrigin: string
  superDomain: string
  toString: () => string
}

export class $Location {
  remote: UrlParse

  constructor (remote) {
    this.remote = new UrlParse(remote)
  }

  getAuth () {
    return this.remote.auth
  }

  getAuthObj () {
    const a = this.remote.auth

    if (a) {
      const [username, password] = a.split(':')

      return {
        username,

        password,
      }
    }

    return
  }

  getHash () {
    return this.remote.hash
  }

  getHref () {
    return this.getToString()
  }

  // Location Host
  // The URLUtils.host property is a DOMString containing the host,
  // that is the hostname, and then, if the port of the URL is nonempty,
  // a ':', and the port of the URL.
  getHost () {
    return this.remote.host
  }

  getHostName () {
    return this.remote.hostname
  }

  getProtocol () {
    return this.remote.protocol
  }

  getPathName () {
    return this.remote.pathname || '/'
  }

  getPort () {
    return this.remote.port
  }

  getSearch () {
    return this.remote.query
  }

  getOrigin () {
    // https://github.com/unshiftio/url-parse/issues/38
    if (this.remote.origin === 'null') {
      return null
    }

    return this.remote.origin
  }

  getSuperDomainOrigin () {
    return cors.getSuperDomainOrigin(this.remote.href)
  }

  getSuperDomain () {
    return cors.getSuperDomain(this.remote.href)
  }

  getToString () {
    return this.remote.toString()
  }

  getObject (): LocationObject {
    return {
      auth: this.getAuth(),
      authObj: this.getAuthObj(),
      hash: this.getHash(),
      href: this.getHref(),
      host: this.getHost(),
      hostname: this.getHostName(),
      origin: this.getOrigin(),
      pathname: this.getPathName(),
      port: this.getPort(),
      protocol: this.getProtocol(),
      search: this.getSearch(),
      superDomainOrigin: this.getSuperDomainOrigin(),
      superDomain: this.getSuperDomain(),
      toString: _.bind(this.getToString, this),
    }
  }

  static isLocalFileUrl (url) {
    return reFile.test(url)
  }

  static isFullyQualifiedUrl (url) {
    return reHttp.test(url)
  }

  static isUrlLike (url) {
    // https://github.com/cypress-io/cypress/issues/5090
    // In the case of a url like /?foo=..
    if (/\.{2,}/.test(url)) {
      return false
    }

    // beta.cypress.io
    // aws.amazon.com/bucket/foo
    // foo.bar.co.uk
    // foo.bar.co.uk/asdf
    url = url.split('/')[0].split('.')

    return (url.length === 3) || (url.length === 4)
  }

  static fullyQualifyUrl (url) {
    if (url.startsWith(window.location.origin)) {
      return url
    }

    return this.resolve(window.location.origin, url)
  }

  static mergeUrlWithParams (url, params) {
    url = new UrlParse(url, null, true)
    url.set('query', _.merge(url.query || {}, params))

    return url.toString()
  }

  static normalize (url) {
    // A properly formed URL will always have a trailing
    // slash at the end of it
    // http://localhost:8000/
    //
    // A url with a path (sub folder) does not necessarily
    // have a trailing slash after it
    // http://localhost:8000/app
    //
    // If the webserver redirects us we will follow those
    // correctly
    // http://getbootstrap.com/css => 301 http://getbootstrap.com/css/
    //
    // A file being served by the file system never has a leading slash
    // or a trailing slash
    // index.html NOT index.html/ or /index.html
    //
    if (reHttp.test(url) || reWww.test(url) || reLocalHost.test(url) || this.isUrlLike(url)) {
      // if we're missing a protocol then go
      // ahead and append it
      if (!reHttp.test(url)) {
        url = `http://${url}`
      }

      url = new UrlParse(url)

      if (!url.pathname) {
        url.set('pathname', '/')
      }

      return url.toString()
    }

    return url
  }

  static qualifyWithBaseUrl (baseUrl, url) {
    // if we have a root url and our url isnt full qualified
    if (baseUrl && !this.isFullyQualifiedUrl(url)) {
      const urlEndsWithSlash = (url) => {
        return url[url.length - 1] === '/'
      }

      // https://github.com/cypress-io/cypress/issues/9360
      // When user passed the URL that ends with '/', then we should preserve it.
      const originalUrlEndsWithSlash = urlEndsWithSlash(url)

      // prepend the root url to it
      url = this.join(baseUrl, url)

      // https://github.com/cypress-io/cypress/issues/2101
      // Has query param and ends with /
      if (!originalUrlEndsWithSlash && reQueryParam.test(url) && urlEndsWithSlash(url)) {
        url = url.substring(0, url.length - 1)
      }
    }

    return this.fullyQualifyUrl(url)
  }

  static isAbsoluteRelative (segment) {
    // does this start with a forward slash?
    return segment && segment[0] === '/'
  }

  static join (from, ...rest) {
    const last = _.last(rest)

    const paths = _.reduce(rest, (memo, segment) => {
      if (segment === last) {
        memo.push(_.trimStart(segment, '/'))
      } else {
        memo.push(_.trim(segment, '/'))
      }

      return memo
    }, [_.trimEnd(from, '/')])

    return paths.join('/')
  }

  static resolve (from, to) {
    return new URL(to, from).toString()
  }

  static create (remote): LocationObject {
    const location = new $Location(remote)

    return location.getObject()
  }
}
