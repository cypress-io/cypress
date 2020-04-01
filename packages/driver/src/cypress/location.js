// TODO:
// 1. test these method implementations using encoded characters
// look at the spec to figure out whether we SHOULD be decoding them
// or leaving them as encoded.  also look at UrlParse to see what it does
//
// 2. there is a bug when handling about:blank which borks it and
// turns it into about://blank

const _ = require('lodash')
const UrlParse = require('url-parse')
const cors = require('@packages/network/lib/cors')

const reHttp = /^https?:\/\//
const reWww = /^www/
const reFile = /^file:\/\//
const reLocalHost = /^(localhost|0\.0\.0\.0|127\.0\.0\.1)/

class $Location {
  constructor (remote) {
    this.remote = new UrlParse(remote)
  }

  getAuth () {
    return this.remote.auth
  }

  getAuthObj () {
    let a

    a = this.remote.auth

    if (a) {
      const [username, password] = a.split(':')

      return {
        username,

        password,
      }
    }
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

  getOrigin () {
    // https://github.com/unshiftio/url-parse/issues/38
    if (this.remote.origin === 'null') {
      return null
    }

    return this.remote.origin
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

  getOriginPolicy () {
    // origin policy is comprised of
    // protocol + superdomain
    // and subdomain is not factored in
    return _.compact([
      `${this.getProtocol()}//${this.getSuperDomain()}`,
      this.getPort(),
    ]).join(':')
  }

  getSuperDomain () {
    return cors.getSuperDomain(this.remote.href)
  }

  getToString () {
    return this.remote.toString()
  }

  getObject () {
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
      originPolicy: this.getOriginPolicy(),
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
    // beta.cypress.io
    // aws.amazon.com/bucket/foo
    // foo.bar.co.uk
    // foo.bar.co.uk/asdf
    url = url.split('/')[0].split('.')

    return (url.length === 3) || (url.length === 4)
  }

  static fullyQualifyUrl (url) {
    if (this.isFullyQualifiedUrl(url)) {
      return url
    }

    const existing = new UrlParse(window.location.href)

    // always normalize against our existing origin
    // as the baseUrl so that we do not accidentally
    // have relative url's
    url = new UrlParse(url, existing.origin)

    return url.toString()
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
    if (baseUrl && (!this.isFullyQualifiedUrl(url))) {
      // prepend the root url to it
      url = this.join(baseUrl, url)
    }

    return this.fullyQualifyUrl(url)
  }

  static isAbsoluteRelative (segment) {
    // does this start with a forward slash?
    return segment && (segment[0] === '/')
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
    }
    , [_.trimEnd(from, '/')])

    return paths.join('/')
  }

  static resolve (from, to) {
    // if to is fully qualified then
    // just return that
    if (this.isFullyQualifiedUrl(to)) {
      return to
    }

    // else take from and figure out if
    // to is relative or absolute-relative

    // if to is absolute relative '/foo'
    if (this.isAbsoluteRelative(to)) {
      // get origin from 'from'
      const {
        origin,
      } = this.create(from)

      return this.join(origin, to)
    }

    return this.join(from, to)
  }

  static create (remote) {
    const location = new $Location(remote)

    return location.getObject()
  }
}

module.exports = $Location
