interface ExistingCookie {
  name: string
  value: string
  httpOnly?: boolean
  secure?: boolean
}

interface WriteCase {
  // `{site}` is replaced with the registrable domain of the page
  write: string
  title?: string
  https?: boolean
  existing?: ExistingCookie
  // Firefox handles the write differently from the cookie spec, which the patch follows
  notFirefox?: boolean
}

interface RecordArgs {
  site: string
  url: string
  write: string
  existing?: ExistingCookie
}

// Runs as-is in the primary origin and as a cy.origin() callback, so it can't close over anything.
const record = ({ site, url, write, existing }: RecordArgs) => {
  cy.visit(url)

  if (existing) {
    cy.setCookie(existing.name, existing.value, {
      domain: `www.${site}`,
      hostOnly: true,
      path: '/',
      httpOnly: !!existing.httpOnly,
      secure: !!existing.secure,
    })
  }

  cy.window().then((win) => {
    win.document.cookie = write
    win.document.cookie = 'written=1; Path=/'
  })

  // cross-origin writes reach the browser asynchronously and in order
  const waitForWrite = (attempts: number) => {
    cy.getCookie('written', { log: false }).then((cookie) => {
      if (cookie) return

      if (attempts === 200) throw new Error('the document.cookie write never reached the browser')

      waitForWrite(attempts + 1)
    })
  }

  waitForWrite(0)

  return cy.document().then((doc) => {
    return cy.getAllCookies().then((cookies) => {
      const now = Date.now() / 1000

      return {
        documentCookie: doc.cookie.split('; ').filter((pair) => pair !== 'written=1').sort(),
        cookies: cookies
        .filter((cookie) => cookie.domain.endsWith(site) && cookie.name !== 'written')
        .map((cookie) => {
          return {
            name: cookie.name,
            value: cookie.value,
            domain: cookie.domain.replace(site, '{site}'),
            path: cookie.path,
            secure: cookie.secure,
            httpOnly: cookie.httpOnly,
            hostOnly: !!cookie.hostOnly,
            // Cypress stores a cookie without a SameSite attribute as lax; browsers
            // report it as missing (Chromium) or 'unspecified' (Firefox)
            sameSite: `${cookie.sameSite || 'lax'}`.replace('unspecified', 'lax'),
            expiresInHours: cookie.expiry ? Math.round((cookie.expiry - now) / 3600) : null,
          }
        })
        .sort((a, b) => `${a.name} ${a.domain} ${a.path}`.localeCompare(`${b.name} ${b.domain} ${b.path}`)),
      }
    })
  })
}

const cases: WriteCase[] = [
  // path
  { write: 'foo=bar; Path=/' },
  { write: 'foo=bar' },
  { write: 'foo=bar; Path=/fixtures/auth' },
  { write: 'foo=bar; Path=fixtures' },
  { write: 'foo=bar; Path=/a; Path=/' },

  // domain
  { write: 'foo=bar; Domain={site}; Path=/' },
  { write: 'foo=bar; Domain=.{site}; Path=/' },
  { write: 'foo=bar; Domain=www.{site}; Path=/' },
  { write: 'foo=bar; Domain=WWW.{site}; Path=/' },
  { write: 'foo=bar; Domain=app.{site}; Path=/' },
  { write: 'foo=bar; Domain=app.www.{site}; Path=/' },
  { write: 'foo=bar; Domain=com; Path=/' },
  { write: 'foo=bar; Domain=other.example; Path=/' },
  { write: 'foo=bar; Domain=; Path=/' },

  // lifetime
  { write: 'foo=bar; Max-Age=7200; Path=/' },
  { write: 'foo=bar; Max-Age=99999999999; Path=/' },
  { write: 'foo=bar; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Path=/' },
  { write: 'foo=bar; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=7200; Path=/' },
  { write: 'foo=; Max-Age=0; Path=/', existing: { name: 'foo', value: 'bar' } },
  { write: 'foo=baz; Path=/', existing: { name: 'foo', value: 'bar' } },

  // HttpOnly
  { write: 'foo=bar; HttpOnly; Path=/' },
  { write: 'foo=baz; Path=/', title: 'foo=baz; Path=/ over an HttpOnly cookie', existing: { name: 'foo', value: 'bar', httpOnly: true } },
  { write: 'foo=baz', title: 'foo=baz under an HttpOnly cookie', existing: { name: 'foo', value: 'bar', httpOnly: true } },
  { write: 'foo=; Max-Age=0; Path=/', title: 'foo=; Max-Age=0; Path=/ over an HttpOnly cookie', existing: { name: 'foo', value: 'bar', httpOnly: true } },

  // Secure
  { write: 'foo=bar; Secure; Path=/' },
  { write: 'foo=bar; Secure; Path=/', https: true },
  { write: 'foo=baz; Path=/', title: 'foo=baz; Path=/ over a Secure cookie', existing: { name: 'foo', value: 'bar', secure: true } },
  { write: 'foo=baz; Path=/fixtures', title: 'foo=baz; Path=/fixtures under a Secure cookie', existing: { name: 'foo', value: 'bar', secure: true }, notFirefox: true },
  { write: 'foo=baz; Path=/', title: 'foo=baz; Path=/ over a Secure cookie', https: true, existing: { name: 'foo', value: 'bar', secure: true } },

  // SameSite
  { write: 'foo=bar; SameSite=Strict; Path=/' },
  { write: 'foo=bar; SameSite=Lax; Path=/' },
  { write: 'foo=bar; SameSite=None; Path=/' },
  { write: 'foo=bar; SameSite=None; Path=/', https: true },
  { write: 'foo=bar; SameSite=None; Secure; Path=/', https: true },
  { write: 'foo=bar; SameSite=bogus; Path=/' },

  // prefixes
  { write: '__Secure-foo=bar; Path=/', https: true },
  { write: '__secure-foo=bar; Path=/', https: true },
  { write: '__Secure-foo=bar; Secure; Path=/', https: true },
  { write: '__Secure-foo=bar; Secure; Path=/' },
  { write: '__Host-foo=bar; Secure; Path=/', https: true },
  { write: '__Host-foo=bar; Secure', https: true },
  { write: '__Host-foo=bar; Secure; Path=/fixtures', https: true },
  { write: '__Host-foo=bar; Secure; Path=/; Domain=www.{site}', https: true },
  { write: '__host-foo=bar; Path=/', https: true },
  { write: '__Http-foo=bar; Secure; Path=/', https: true },
  { write: '__Host-Http-foo=bar; Secure; Path=/', https: true },

  // names and values
  { write: 'foo', notFirefox: true },
  { write: '=foo', notFirefox: true },
  { write: 'foo=' },
  { write: '=' },
  { write: '=__Host-foo=bar; Secure; Path=/', https: true },
  { write: 'foo=bar=baz; Path=/' },
  { write: ' foo = bar ; Path=/' },
  { write: 'foo="bar"; Path=/' },
  { write: 'foo=bar baz; Path=/' },
  { write: 'foo=b\u0001ar; Path=/', title: 'foo=b\\u0001ar; Path=/' },
  { write: `foo=${'a'.repeat(5000)}; Path=/`, title: 'a name and value over 4096 bytes' },
  { write: `foo=bar; Path=/${'a'.repeat(1100)}`, title: 'an attribute value over 1024 bytes' },
]

// Compares what a document.cookie write does in the primary origin, where the
// browser handles it, with what the same write does inside cy.origin().
describe('document.cookie writes in cy.origin() match the browser', () => {
  cases.forEach(({ write, title, https, existing, notFirefox }) => {
    it(`${title || write} (${https ? 'https' : 'http'})`, { browser: notFirefox ? '!firefox' : undefined }, () => {
      const args = (site: string): RecordArgs => {
        const origin = https ? `https://www.${site}:3502` : `http://www.${site}:3500`

        return { site, url: `${origin}/fixtures/secondary-origin.html`, write: write.replace('{site}', site), existing }
      }

      record(args('foobar.com')).then((native) => {
        cy.origin(`${https ? 'https' : 'http'}://www.barbaz.com:${https ? 3502 : 3500}`, { args: args('barbaz.com') }, record).then((patched) => {
          expect(patched).to.deep.equal(native)
        })
      })
    })
  })
})
