const { _, Location } = Cypress

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

describe('src/cypress/location', () => {
  beforeEach(function () {
    this.setup = (remote) => {
      return new Location(urls[remote])
    }
  })

  context('#getAuth', () => {
    it('returns string with username + password', function () {
      const str = this.setup('auth').getAuth()

      expect(str).to.eq('cypress:password123')
    })
  })

  context('#getAuthObj', () => {
    it('returns an object with username and password', function () {
      const obj = this.setup('auth').getAuthObj()

      expect(obj).to.deep.eq({
        username: 'cypress',
        password: 'password123',
      })
    })

    it('returns undefined when no username or password', function () {
      expect(this.setup('app').getAuthObj()).to.be.undefined
    })
  })

  context('#getHash', () => {
    it('returns the hash fragment prepended with #', function () {
      const str = this.setup('app').getHash()

      expect(str).to.eq('#posts/1')
    })

    it('returns empty string when no hash', function () {
      const str = this.setup('signin').getHash()

      expect(str).to.eq('')
    })

    it('returns empty when only hash is present', function () {
      // its weird, but this matches current browser behavior
      const str = this.setup('hash').getHash()

      expect(str).to.eq('')
    })
  })

  context('#getHref', () => {
    it('returns the full url', function () {
      const str = this.setup('signin').getHref()

      expect(str).to.eq('http://localhost:2020/signin')
    })

    it('does not apply a leading slash after removing query params', function () {
      const str = this.setup('ember').getHref()

      expect(str).to.eq('http://localhost:2020/index.html#/posts')
    })

    it('includes hash even when hash is empty', function () {
      const str = this.setup('trailHash').getHref()

      expect(str).to.eq(urls.trailHash)
    })
  })

  context('#getHost', () => {
    it('returns port if port is present', function () {
      const str = this.setup('signin').getHost()

      expect(str).to.eq('localhost:2020')
    })

    it('omits port if port is blank', function () {
      const str = this.setup('google').getHost()

      expect(str).to.eq('www.google.com')
    })
  })

  context('#getHostName', () => {
    it('returns host without port', function () {
      const str = this.setup('signin').getHostName()

      expect(str).to.eq('localhost')
    })
  })

  context('#getOrigin', () => {
    it('returns the origin including port', function () {
      const str = this.setup('signin').getOrigin()

      expect(str).to.eq('http://localhost:2020')
    })

    it('returns the origin without port', function () {
      const str = this.setup('google').getOrigin()

      expect(str).to.eq('https://www.google.com')
    })

    it('returns the origin as null for about:blank', function () {
      const origin = this.setup('blank').getOrigin()

      expect(origin).to.eq(null)
    })
  })

  context('#getPathName', () => {
    it('returns the path', function () {
      const str = this.setup('signin').getPathName()

      expect(str).to.eq('/signin')
    })

    it('returns a / with no path', function () {
      const str = this.setup('google').getPathName()

      expect(str).to.eq('/')
    })

    it('returns the full pathname without a host', function () {
      const str = this.setup('pathname').getPathName()

      expect(str).to.eq('/app/index.html')
    })
  })

  context('#getPort', () => {
    it('returns the port', function () {
      const str = this.setup('signin').getPort()

      expect(str).to.eq('2020')
    })

    it('returns empty string if port is blank', function () {
      const str = this.setup('google').getPort()

      expect(str).to.eq('')
    })
  })

  context('#getProtocol', () => {
    it('returns the http protocol', function () {
      const str = this.setup('signin').getProtocol()

      expect(str).to.eq('http:')
    })

    it('returns the https protocol', function () {
      const str = this.setup('google').getProtocol()

      expect(str).to.eq('https:')
    })
  })

  context('#getSearch', () => {
    it('returns the search params with ? prepended', function () {
      const str = this.setup('search').getSearch()

      expect(str).to.eq('?q=books')
    })

    it('returns an empty string with no search params', function () {
      const str = this.setup('google').getSearch()

      expect(str).to.eq('')
    })
  })

  context('#getToString', () => {
    it('returns the toString function', function () {
      const str = this.setup('signin').getToString()

      expect(str).to.eq('http://localhost:2020/signin')
    })
  })

  context('#getOrigin', () => {
    it('handles ip addresses', function () {
      const str = this.setup('local').getOrigin()

      expect(str).to.eq('http://127.0.0.1:8080')
    })

    it('handles 1 part localhost', function () {
      const str = this.setup('users').getOrigin()

      expect(str).to.eq('http://localhost:2020')
    })

    it('handles 2 parts stack', function () {
      const str = this.setup('stack').getOrigin()

      expect(str).to.eq('https://stackoverflow.com')
    })

    it('handles subdomains google', function () {
      const str = this.setup('google').getOrigin()

      expect(str).to.eq('https://www.google.com')
    })

    it('issue: #255 two domains in the url', function () {
      const str = this.setup('email').getOrigin()

      expect(str).to.eq('http://localhost:3500')
    })

    it('handles private tlds in the public suffix', function () {
      const str = this.setup('heroku').getOrigin()

      expect(str).to.eq('https://example.herokuapp.com')
    })

    it('handles subdomains of private tlds in the public suffix', function () {
      const str = this.setup('herokuSub').getOrigin()

      expect(str).to.eq('https://foo.example.herokuapp.com')
    })

    it('falls back to dumb check when invalid tld', function () {
      const str = this.setup('unknown').getOrigin()

      expect(str).to.eq('http://what.is.so.unknown')
    })
  })

  context('#getSuperDomainOrigin', () => {
    it('handles ip addresses', function () {
      const str = this.setup('local').getSuperDomainOrigin()

      expect(str).to.eq('http://127.0.0.1:8080')
    })

    it('handles 1 part localhost', function () {
      const str = this.setup('users').getSuperDomainOrigin()

      expect(str).to.eq('http://localhost:2020')
    })

    it('handles 2 parts stack', function () {
      const str = this.setup('stack').getSuperDomainOrigin()

      expect(str).to.eq('https://stackoverflow.com')
    })

    it('handles subdomains google', function () {
      const str = this.setup('google').getSuperDomainOrigin()

      expect(str).to.eq('https://google.com')
    })

    it('issue: #255 two domains in the url', function () {
      const str = this.setup('email').getSuperDomainOrigin()

      expect(str).to.eq('http://localhost:3500')
    })

    it('handles private tlds in the public suffix', function () {
      const str = this.setup('heroku').getSuperDomainOrigin()

      expect(str).to.eq('https://example.herokuapp.com')
    })

    it('handles subdomains of private tlds in the public suffix', function () {
      const str = this.setup('herokuSub').getSuperDomainOrigin()

      expect(str).to.eq('https://example.herokuapp.com')
    })

    it('falls back to dumb check when invalid tld', function () {
      const str = this.setup('unknown').getSuperDomainOrigin()

      expect(str).to.eq('http://so.unknown')
    })
  })

  context('.create', () => {
    it('returns an object literal', () => {
      const obj = Location.create(urls.cypress, urls.signin)
      const keys = ['auth', 'authObj', 'hash', 'href', 'host', 'hostname', 'pathname', 'port', 'protocol', 'search', 'toString', 'origin', 'superDomainOrigin', 'superDomain']

      expect(obj).to.have.keys(keys)
    })

    it('can invoke toString function', () => {
      const obj = Location.create(urls.signin)

      expect(obj.toString()).to.eq('http://localhost:2020/signin')
    })
  })

  context('.mergeUrlWithParams', () => {
    beforeEach(function () {
      this.url = (str, expected, params) => {
        const url = Location.mergeUrlWithParams(str, params)

        expect(url).to.eq(expected)
      }
    })

    it('merges params into a URL', function () {
      this.url('http://example.com/a', 'http://example.com/a?foo=bar', { foo: 'bar' })
    })

    it('overrides existing queryparams', function () {
      this.url('http://example.com/a?foo=quux', 'http://example.com/a?foo=bar', { foo: 'bar' })
    })

    it('appends and overrides existing queryparams', function () {
      this.url('http://example.com/a?foo=quux', 'http://example.com/a?foo=bar&baz=quuz', { foo: 'bar', baz: 'quuz' })
    })
  })

  context('.normalize', () => {
    beforeEach(function () {
      this.url = (source, expected) => {
        const url = Location.normalize(source)

        expect(url).to.eq(expected)
      }
    })

    describe('http urls', () => {
      it('does not trim url', function () {
        this.url('http://github.com/foo/', 'http://github.com/foo/')
      })

      it('adds trailing slash to host', function () {
        this.url('https://localhost:4200', 'https://localhost:4200/')
      })

      it('does not mutate hash when setting path to slash', function () {
        this.url('http://0.0.0.0:3000#foo/bar', 'http://0.0.0.0:3000/#foo/bar')
      })

      it('does not mutate path when it exists', function () {
        this.url('http://localhost:3000/foo/bar', 'http://localhost:3000/foo/bar')
      })
    })

    describe('http-less urls', () => {
      it('trims url', function () {
        this.url('/index.html/', '/index.html/')
      })

      it('does not add trailing slash with query params', function () {
        this.url('timeout?ms=1000', 'timeout?ms=1000')
      })

      it('does not strip path segments', function () {
        this.url('fixtures/sinon.html', 'fixtures/sinon.html')
      })

      it('formats urls with protocols', function () {
        this.url('beta.cypress.io', 'http://beta.cypress.io/')
      })

      it('formats urls with protocols and query params', function () {
        this.url('beta.cypress.io?foo=bar', 'http://beta.cypress.io/?foo=bar')
      })

      it('formats urls with 3 segments and path', function () {
        this.url('aws.amazon.com/s3/bucket', 'http://aws.amazon.com/s3/bucket')
      })

      it('formats urls with 4 segments', function () {
        this.url('foo.bar.co.uk', 'http://foo.bar.co.uk/')
      })

      it('formats urls with 4 segments and path', function () {
        this.url('foo.bar.co.uk/baz/quux', 'http://foo.bar.co.uk/baz/quux')
      })
    })

    describe('localhost, 0.0.0.0, 127.0.0.1', () => {
      _.each(['localhost', '0.0.0.0', '127.0.0.1'], (host) => {
        it(`inserts http:// automatically for ${host}`, function () {
          this.url(`${host}:4200`, `http://${host}:4200/`)
        })
      })
    })

    describe('localhost', () => {
      it('keeps path / query params / hash around', function () {
        this.url('localhost:4200/foo/bar?quux=asdf#/main', 'http://localhost:4200/foo/bar?quux=asdf#/main')
      })
    })
  })

  context('.fullyQualifyUrl', () => {
    beforeEach(function () {
      this.normalize = (url) => {
        return Location.normalize(url)
      }
    })

    it('does not append trailing slash on a sub directory', function () {
      let url = this.normalize('http://localhost:4200/app')

      url = Location.fullyQualifyUrl(url)

      expect(url).to.eq('http://localhost:4200/app')
    })

    it('does not append a trailing slash to url with hash', function () {
      let url = this.normalize('http://localhost:4000/#/home')

      url = Location.fullyQualifyUrl(url)

      expect(url).to.eq('http://localhost:4000/#/home')
    })

    it('does not append a trailing slash to protocol-less url with hash', function () {
      let url = this.normalize('www.github.com/#/home')

      url = Location.fullyQualifyUrl(url)

      expect(url).to.eq('http://www.github.com/#/home')
    })

    it('handles urls without a host', function () {
      let url = this.normalize('index.html')

      url = Location.fullyQualifyUrl(url)

      expect(url).to.eq('http://localhost:3500/index.html')
    })

    it('does not insert trailing slash without a host', () => {
      const url = Location.fullyQualifyUrl('index.html')

      expect(url).to.eq('http://localhost:3500/index.html')
    })

    it('handles no host + query params', function () {
      let url = this.normalize('timeout?ms=1000')

      url = Location.fullyQualifyUrl(url)

      expect(url).to.eq('http://localhost:3500/timeout?ms=1000')
    })

    it('does not strip off path', function () {
      let url = this.normalize('fixtures/sinon.html')

      url = Location.fullyQualifyUrl(url)

      expect(url).to.eq('http://localhost:3500/fixtures/sinon.html')
    })

    // https://github.com/cypress-io/cypress/issues/5090
    it('handles query param with two dots', function () {
      let url = this.normalize('?foo=..')

      url = Location.qualifyWithBaseUrl('http://localhost:3500/', url)

      expect(url).to.eq('http://localhost:3500/?foo=..')
    })

    // https://github.com/cypress-io/cypress/issues/2101
    describe('handles query param in baseUrl', () => {
      const cases = [
        'http://localhost:3500/?foo=bar',
        'http://localhost:3500?foo=bar',
        'http://localhost:3500/?foo',
        'http://localhost:3500/?foo=bar&a=b',
        'http://localhost:3500/abcd?foo=bar',
      ]

      cases.forEach((c) => {
        it(c, function () {
          let url = this.normalize('')

          url = Location.qualifyWithBaseUrl(c, '')

          expect(url).to.eq(c)
        })
      })
    })

    // https://github.com/cypress-io/cypress/issues/9360
    it('does not remove slash when user passed it.', () => {
      const url = Location.qualifyWithBaseUrl('http://localhost:3500/', '/pageOne?param1=/param/')

      expect(url).to.eq('http://localhost:3500/pageOne?param1=/param/')
    })
  })
})
