const { _ } = Cypress
const { HTTPS } = Cypress.env()

describe('set:cookies', () => {
  it('t1', async () => {
    const request_cookies = [{
      name: 'c-expires',
      maxAge: 10000,
    },
    {
      name: 'c-httpOnly',
      httpOnly: true,
    },
    {
      name: 'c-domain',
      domain: 'foo.com',
      url: `https://bar.foo.com:${HTTPS}/cookie`,
    },
    {
      name: 'c-domain2',
      domain: '.bar.foo.com',
      url: `https://bar.foo.com:${HTTPS}/cookie`,
    },
    {
      name: 'c-no-domain',
      url: `https://bar.foo.com:${HTTPS}/cookie`,
    },
    {
      name: 'c-secureFalse',
      secure: false,
      sameSite: null,
      url: `/cookie`,
    },
    {
      name: 'c-path',
      path: '/foo/bar',

    },
    {
      name: '__Secure-cookie',
      path: '/foo/bar',
      url: `https://bar.foo.com:${HTTPS}/cookie`,
    },
    {
      name: '__Host-cookie',
      url: `https://bar.foo.com:${HTTPS}/cookie`,
    }]

    const expected_cookies = [
      {
        'name': 'c-expires',
        'value': 'value',
        'path': '/',
        'domain': '127.0.0.1',
        'secure': true,
        'httpOnly': false,
        'sameSite': 'no_restriction',
        'expiry': 100,
      },
      {
        'name': 'c-secureFalse',
        'value': 'value',
        'path': '/',
        'domain': '127.0.0.3',
        'secure': false,
        'httpOnly': false,
        ...(Cypress.isBrowser({ family: 'firefox' }) ? { sameSite: 'no_restriction' } : {}),
      },

      {
        'name': 'c-domain',
        'value': 'value',
        'path': '/',
        'domain': '.foo.com',
        'secure': true,
        'httpOnly': false,
        'sameSite': 'no_restriction',
      },
      {
        'name': 'c-domain2',
        'value': 'value',
        'path': '/',
        'domain': '.bar.foo.com',
        'secure': true,
        'httpOnly': false,
        'sameSite': 'no_restriction',
      },
      {
        'name': 'c-no-domain',
        'value': 'value',
        'path': '/',
        'domain': 'bar.foo.com',
        'secure': true,
        'httpOnly': false,
        'hostOnly': true,
        'sameSite': 'no_restriction',
      },
      {
        'name': '__Secure-cookie',
        'value': 'value',
        'path': '/foo/bar',
        'domain': 'bar.foo.com',
        'secure': true,
        'httpOnly': false,
        'hostOnly': true,
        'sameSite': 'no_restriction',
      },

      {
        'name': '__Host-cookie',
        'value': 'value',
        'path': '/',
        'domain': 'bar.foo.com',
        'secure': true,
        'httpOnly': false,
        'hostOnly': true,
        'sameSite': 'no_restriction',
      },
      {
        'name': 'c-httpOnly',
        'value': 'value',
        'path': '/',
        'domain': '127.0.0.1',
        'secure': true,
        'httpOnly': true,
        'sameSite': 'no_restriction',
      },
      {
        'name': 'c-path',
        'value': 'value',
        'path': '/foo/bar',
        'domain': '127.0.0.1',
        'secure': true,
        'httpOnly': false,
        'sameSite': 'no_restriction',
      },
    ]

    const reqCookie = (cookieOpts) => {
      const { url, name, ...cookie } = cookieOpts

      return fetch(`${url || `https://127.0.0.1:${HTTPS}/cookie`}/${encodeURIComponent(name)}/?${(JSON.stringify(cookie))}`, { credentials: 'include' })
    }

    const cleanse = (cookies) => {
      return _.cloneDeepWith(cookies, (value, key) => {
        if (key === 'expiry') {
          return 100
        }
      })
    }

    await Cypress.session.clearCookies()

    expect(await Cypress.session.getCookies()).deep.eq([])

    await Promise.all(request_cookies.map((cookie) => reqCookie(cookie)))

    const initial_cookies = await Cypress.session.getCookies()

    expect(cleanse(initial_cookies)).deep.members(expected_cookies)

    await Cypress.session.clearCookies({})

    const cleared_cookies = await Cypress.session.getCookies()

    expect(cleared_cookies).deep.eq([])

    await Cypress.session.setCookies(initial_cookies)

    const restored_cookies = await Cypress.session.getCookies()

    expect(cleanse(restored_cookies)).deep.members(expected_cookies)
  })
})
