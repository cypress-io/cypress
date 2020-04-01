/* eslint-disable
    no-unused-vars,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const { _, Location, Promise } = Cypress

const urls = {
  blank: 'about:blank',
  cypress: 'http://0.0.0.0:2020/__/#/tests/app.coffee',
  signin: 'http://localhost:2020/signin',
  users: 'http://localhost:2020/users/1',
  google: 'https://www.google.com',
  ember: 'http://localhost:2020/index.html#/posts',
  app: 'http://localhost:2020/app/#posts/1',
  search: 'http://localhost:2020/search?q=books',
  pathname: 'http://localhost:2020/app/index.html',
  local: 'http://127.0.0.1:8080/foo/bar',
  stack: 'https://stackoverflow.com/',
  trailHash: 'http://localhost:3500/index.html?foo=bar#',
  email: 'http://localhost:3500/?email=brian@cypress.io',
  heroku: 'https://example.herokuapp.com',
  herokuSub: 'https://foo.example.herokuapp.com',
  unknown: 'http://what.is.so.unknown',
  auth: 'http://cypress:password123@localhost:8080/foo',
}

describe('src/cypress/location', function () {
  beforeEach(function () {
    this.setup = (remote) => {
      return new Location(urls[remote])
    }
  })

  context('#getAuth', () => {
    return it('returns string with username + password', function () {
      const str = this.setup('auth').getAuth()

      return expect(str).to.eq('cypress:password123')
    })
  })

  context('#getAuthObj', function () {
    it('returns an object with username and password', function () {
      const obj = this.setup('auth').getAuthObj()

      return expect(obj).to.deep.eq({
        username: 'cypress',
        password: 'password123',
      })
    })

    return it('returns undefined when no username or password', function () {
      return expect(this.setup('app').getAuthObj()).to.be.undefined
    })
  })

  context('#getHash', function () {
    it('returns the hash fragment prepended with #', function () {
      const str = this.setup('app').getHash()

      return expect(str).to.eq('#posts/1')
    })

    it('returns empty string when no hash', function () {
      const str = this.setup('signin').getHash()

      return expect(str).to.eq('')
    })

    return it('returns empty when only hash is present', function () {
      // its weird, but this matches current browser behavior
      const str = this.setup('hash').getHash()

      return expect(str).to.eq('')
    })
  })

  context('#getHref', function () {
    it('returns the full url', function () {
      const str = this.setup('signin').getHref()

      return expect(str).to.eq('http://localhost:2020/signin')
    })

    it('does not apply a leading slash after removing query params', function () {
      const str = this.setup('ember').getHref()

      return expect(str).to.eq('http://localhost:2020/index.html#/posts')
    })

    return it('includes hash even when hash is empty', function () {
      const str = this.setup('trailHash').getHref()

      return expect(str).to.eq(urls.trailHash)
    })
  })

  context('#getHost', function () {
    it('returns port if port is present', function () {
      const str = this.setup('signin').getHost()

      return expect(str).to.eq('localhost:2020')
    })

    return it('omits port if port is blank', function () {
      const str = this.setup('google').getHost()

      return expect(str).to.eq('www.google.com')
    })
  })

  context('#getHostName', () => {
    return it('returns host without port', function () {
      const str = this.setup('signin').getHostName()

      return expect(str).to.eq('localhost')
    })
  })

  context('#getOrigin', function () {
    it('returns the origin including port', function () {
      const str = this.setup('signin').getOrigin()

      return expect(str).to.eq('http://localhost:2020')
    })

    it('returns the origin without port', function () {
      const str = this.setup('google').getOrigin()

      return expect(str).to.eq('https://www.google.com')
    })

    return it('returns the origin as null for about:blank', function () {
      const origin = this.setup('blank').getOrigin()

      return expect(origin).to.eq(null)
    })
  })

  context('#getPathName', function () {
    it('returns the path', function () {
      const str = this.setup('signin').getPathName()

      return expect(str).to.eq('/signin')
    })

    it('returns a / with no path', function () {
      const str = this.setup('google').getPathName()

      return expect(str).to.eq('/')
    })

    return it('returns the full pathname without a host', function () {
      const str = this.setup('pathname').getPathName()

      return expect(str).to.eq('/app/index.html')
    })
  })

  context('#getPort', function () {
    it('returns the port', function () {
      const str = this.setup('signin').getPort()

      return expect(str).to.eq('2020')
    })

    return it('returns empty string if port is blank', function () {
      const str = this.setup('google').getPort()

      return expect(str).to.eq('')
    })
  })

  context('#getProtocol', function () {
    it('returns the http protocol', function () {
      const str = this.setup('signin').getProtocol()

      return expect(str).to.eq('http:')
    })

    return it('returns the https protocol', function () {
      const str = this.setup('google').getProtocol()

      return expect(str).to.eq('https:')
    })
  })

  context('#getSearch', function () {
    it('returns the search params with ? prepended', function () {
      const str = this.setup('search').getSearch()

      return expect(str).to.eq('?q=books')
    })

    return it('returns an empty string with no seach params', function () {
      const str = this.setup('google').getSearch()

      return expect(str).to.eq('')
    })
  })

  context('#getToString', () => {
    return it('returns the toString function', function () {
      const str = this.setup('signin').getToString()

      return expect(str).to.eq('http://localhost:2020/signin')
    })
  })

  context('#getOriginPolicy', function () {
    it('handles ip addresses', function () {
      const str = this.setup('local').getOriginPolicy()

      return expect(str).to.eq('http://127.0.0.1:8080')
    })

    it('handles 1 part localhost', function () {
      const str = this.setup('users').getOriginPolicy()

      return expect(str).to.eq('http://localhost:2020')
    })

    it('handles 2 parts stack', function () {
      const str = this.setup('stack').getOriginPolicy()

      return expect(str).to.eq('https://stackoverflow.com')
    })

    it('handles subdomains google', function () {
      const str = this.setup('google').getOriginPolicy()

      return expect(str).to.eq('https://google.com')
    })

    it('issue: #255 two domains in the url', function () {
      const str = this.setup('email').getOriginPolicy()

      return expect(str).to.eq('http://localhost:3500')
    })

    it('handles private tlds in the public suffix', function () {
      const str = this.setup('heroku').getOriginPolicy()

      return expect(str).to.eq('https://example.herokuapp.com')
    })

    it('handles subdomains of private tlds in the public suffix', function () {
      const str = this.setup('herokuSub').getOriginPolicy()

      return expect(str).to.eq('https://example.herokuapp.com')
    })

    return it('falls back to dumb check when invalid tld', function () {
      const str = this.setup('unknown').getOriginPolicy()

      return expect(str).to.eq('http://so.unknown')
    })
  })

  context('.create', () => {
    it('returns an object literal', () => {
      const obj = Location.create(urls.cypress, urls.signin)
      const keys = ['auth', 'authObj', 'hash', 'href', 'host', 'hostname', 'origin', 'pathname', 'port', 'protocol', 'search', 'toString', 'originPolicy', 'superDomain']

      return expect(obj).to.have.keys(keys)
    })

    return it('can invoke toString function', () => {
      const obj = Location.create(urls.signin)

      return expect(obj.toString()).to.eq('http://localhost:2020/signin')
    })
  })

  context('.mergeUrlWithParams', function () {
    beforeEach(function () {
      this.url = function (str, expected, params) {
        const url = Location.mergeUrlWithParams(str, params)

        return expect(url).to.eq(expected)
      }
    })

    it('merges params into a URL', function () {
      return this.url('http://example.com/a', 'http://example.com/a?foo=bar', { foo: 'bar' })
    })

    it('overrides existing queryparams', function () {
      return this.url('http://example.com/a?foo=quux', 'http://example.com/a?foo=bar', { foo: 'bar' })
    })

    return it('appends and overrides existing queryparams', function () {
      return this.url('http://example.com/a?foo=quux', 'http://example.com/a?foo=bar&baz=quuz', { foo: 'bar', baz: 'quuz' })
    })
  })

  context('.normalize', function () {
    beforeEach(function () {
      this.url = function (source, expected) {
        const url = Location.normalize(source)

        return expect(url).to.eq(expected)
      }
    })

    describe('http urls', function () {
      it('does not trim url', function () {
        return this.url('http://github.com/foo/', 'http://github.com/foo/')
      })

      it('adds trailing slash to host', function () {
        return this.url('https://localhost:4200', 'https://localhost:4200/')
      })

      it('does not mutate hash when setting path to slash', function () {
        return this.url('http://0.0.0.0:3000#foo/bar', 'http://0.0.0.0:3000/#foo/bar')
      })

      return it('does not mutate path when it exists', function () {
        return this.url('http://localhost:3000/foo/bar', 'http://localhost:3000/foo/bar')
      })
    })

    describe('http-less urls', function () {
      it('trims url', function () {
        return this.url('/index.html/', '/index.html/')
      })

      it('does not add trailing slash with query params', function () {
        return this.url('timeout?ms=1000', 'timeout?ms=1000')
      })

      it('does not strip path segments', function () {
        return this.url('fixtures/sinon.html', 'fixtures/sinon.html')
      })

      it('formats urls with protocols', function () {
        return this.url('beta.cypress.io', 'http://beta.cypress.io/')
      })

      it('formats urls with protocols and query params', function () {
        return this.url('beta.cypress.io?foo=bar', 'http://beta.cypress.io/?foo=bar')
      })

      it('formats urls with 3 segments and path', function () {
        return this.url('aws.amazon.com/s3/bucket', 'http://aws.amazon.com/s3/bucket')
      })

      it('formats urls with 4 segments', function () {
        return this.url('foo.bar.co.uk', 'http://foo.bar.co.uk/')
      })

      return it('formats urls with 4 segments and path', function () {
        return this.url('foo.bar.co.uk/baz/quux', 'http://foo.bar.co.uk/baz/quux')
      })
    })

    describe('localhost, 0.0.0.0, 127.0.0.1', () => {
      return _.each(['localhost', '0.0.0.0', '127.0.0.1'], (host) => {
        return it(`inserts http:// automatically for ${host}`, function () {
          return this.url(`${host}:4200`, `http://${host}:4200/`)
        })
      })
    })

    return describe('localhost', () => {
      return it('keeps path / query params / hash around', function () {
        return this.url('localhost:4200/foo/bar?quux=asdf#/main', 'http://localhost:4200/foo/bar?quux=asdf#/main')
      })
    })
  })

  return context('.fullyQualifyUrl', function () {
    beforeEach(function () {
      this.normalize = (url) => Location.normalize(url)
    })

    it('does not append trailing slash on a sub directory', function () {
      let url = this.normalize('http://localhost:4200/app')

      url = Location.fullyQualifyUrl(url)

      return expect(url).to.eq('http://localhost:4200/app')
    })

    it('does not append a trailing slash to url with hash', function () {
      let url = this.normalize('http://localhost:4000/#/home')

      url = Location.fullyQualifyUrl(url)

      return expect(url).to.eq('http://localhost:4000/#/home')
    })

    it('does not append a trailing slash to protocol-less url with hash', function () {
      let url = this.normalize('www.github.com/#/home')

      url = Location.fullyQualifyUrl(url)

      return expect(url).to.eq('http://www.github.com/#/home')
    })

    it('handles urls without a host', function () {
      let url = this.normalize('index.html')

      url = Location.fullyQualifyUrl(url)

      return expect(url).to.eq('http://localhost:3500/index.html')
    })

    it('does not insert trailing slash without a host', () => {
      const url = Location.fullyQualifyUrl('index.html')

      return expect(url).to.eq('http://localhost:3500/index.html')
    })

    it('handles no host + query params', function () {
      let url = this.normalize('timeout?ms=1000')

      url = Location.fullyQualifyUrl(url)

      return expect(url).to.eq('http://localhost:3500/timeout?ms=1000')
    })

    return it('does not strip off path', function () {
      let url = this.normalize('fixtures/sinon.html')

      url = Location.fullyQualifyUrl(url)

      return expect(url).to.eq('http://localhost:3500/fixtures/sinon.html')
    })
  })
})
