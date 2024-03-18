const systemTests = require('../lib/system-tests').default

const onServer = (app) => {
  app.get('/lots-of-requests', (req, res) => {
    const test = req.query.test
    const i = req.query.i

    res.send(
      `<html>
        <head>
          <title>Lots of Requests</title>
          <script>
            for (let j = 0; j < 50; j++) {
              fetch('/1mb?test=${test}&i=${i}&j=' + j).catch(() => {})
            }
          </script>
        </head>
        <body>
          <a href="/lots-of-requests?test=${test}&i=2">Visit</a>
          <script>
            fetch('/1mb?test=${test}&i=${i}&last=1')
            .then((response) => {
              const html = '<div id="done">Done</div>'
              document.body.insertAdjacentHTML('beforeend', html)
            })
            .catch(() => {})
          </script>
        </body>
      </html>`,
    )
  })

  app.get('/1mb', (req, res) => {
    return res.type('text').send('x'.repeat(1024 * 1024))
  })
}

describe('e2e proxy correlation spec', () => {
  const timedOutRequests = (stderr) => {
    const matches = stderr.matchAll(/Never received pre-request or url without pre-request for request (.*) after waiting/g)

    // filter out all non-localhost requests since we only care about ones that came from the app,
    // browsers make requests that don't have pre-requests for various reasons
    //   e.g. https://clientservices.googleapis.com/* and https://accounts.google.com/* in chrome
    //        https://firefox.settings.services.mozilla.com/v1/ and https://tracking-protection.cdn.mozilla.net/* in firefox
    return [...matches].filter((match) => match[1].includes('localhost')).map((match) => match[1])
  }

  systemTests.setup({
    servers: {
      port: 3500,
      onServer,
    },
    settings: {
      e2e: {
        baseUrl: 'http://localhost:3500',
      },
    },
  })

  systemTests.it('correctly correlates requests', {
    spec: 'proxy_correlation.cy.js',
    processEnv: {
      DEBUG: 'cypress:proxy:http:util:prerequests',
    },
    config: {
      experimentalWebKitSupport: true,
      defaultCommandTimeout: 10000,
    },
    onStderr (stderr) {
      const requests = timedOutRequests(stderr)

      expect(requests).to.be.empty
    },
  })
})
