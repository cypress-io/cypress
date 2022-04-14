const compression = require('compression')
const systemTests = require('../lib/system-tests').default
const Fixtures = require('../lib/fixtures')
const path = require('path')

const PORT = 9876

// based off of the most common encodings used on the Internet:
// https://w3techs.com/technologies/overview/character_encoding/all
// as of this writing, these tests will cover ~99% of websites
const TEST_ENCODINGS = [
  'iso-8859-1',
  'euc-kr',
  'shift-jis',
  'gb2312',
]

const e2ePath = Fixtures.projectPath('e2e')

const fullController = (charset) => {
  return (function (req, res) {
    res.set({ 'content-type': `text/html;charset=${charset}` })

    return res.sendFile(path.join(e2ePath, `static/charsets/${charset}.html`))
  })
}

const pageOnlyController = (charset) => {
  return (function (req, res) {
    res.set()

    return res.sendFile(path.join(e2ePath, `static/charsets/${charset}.html`), {
      headers: { 'content-type': 'text/html' },
    })
  })
}

describe('e2e interception spec', () => {
  systemTests.setup({
    servers: [
      {
        onServer (app) {
          return TEST_ENCODINGS.forEach((enc) => {
            app.get(`/${enc}.html`, fullController(enc))

            app.use(`/${enc}.html.gz`, compression())
            app.get(`/${enc}.html.gz`, fullController(enc))

            app.get(`/${enc}.html.pageonly`, pageOnlyController(enc))

            app.use(`/${enc}.html.gz.pageonly`, compression())

            return app.get(`/${enc}.html.gz.pageonly`, pageOnlyController(enc))
          })
        },

        port: PORT,
      },
    ] })

  context('character encodings', () => {
    // @see https://github.com/cypress-io/cypress/issues/1543
    it('does not mangle non-UTF-8 text', function () {
      return systemTests.exec(this, {
        spec: 'character_encoding.cy.js',
        config: {
          defaultCommandTimeout: 100,
          baseUrl: 'http://localhost:9876',
        },
        snapshot: true,
      })
    })
  })
})
