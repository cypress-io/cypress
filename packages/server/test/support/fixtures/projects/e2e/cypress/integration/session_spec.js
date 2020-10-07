const { _ } = Cypress

describe('Cypress.Session utilities', () => {
  it('can capture session from point in the test', { isInteractive: true }, async () => {
    await cy
    .visit('http://127.0.0.1:2290')

    window.localStorage.foobar = 'baz'

    await Cypress.Session.saveSession('foo')
    const result = await Cypress.Session.getSession('foo')

    expect(result.cookies).have.deep.same.members([
      {
        'name': '3',
        'value': 'true',
        'path': '/cookies/three',
        'domain': '127.0.0.3',
        'secure': false,
        'httpOnly': false,
        'sameSite': 'lax',
      },
      {
        'name': '2',
        'value': 'true',
        'path': '/cookies/two',
        'domain': '127.0.0.2',
        'secure': false,
        'httpOnly': false,
        'sameSite': 'lax',
      },
      {
        'name': '1',
        'value': 'true',
        'path': '/cookies/one',
        'domain': '127.0.0.1',
        'secure': false,
        'httpOnly': false,
        'sameSite': 'lax',
      },
    ])

    expect(_.omit(result, 'cookies')).deep.eq({
      name: 'foo',
      localStorage: { foobar: 'baz' },
      sessionStorage: {},
    })
  })
})
