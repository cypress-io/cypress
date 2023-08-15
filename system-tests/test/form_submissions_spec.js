const rp = require('@cypress/request-promise')
const path = require('path')
const bodyParser = require('body-parser')
const multer = require('multer')
const { fs } = require('@packages/server/lib/util/fs')
const systemTests = require('../lib/system-tests').default
const Fixtures = require('../lib/fixtures')

const HTTPS_PORT = 11443
const HTTP_PORT = 11180

describe('e2e form submissions', () => {
  return systemTests.setup()
})

const e2ePath = Fixtures.projectPath('e2e')
const pathToLargeImage = Fixtures.path('server/large-img/earth.jpg')

const getFormHtml = (formAttrs, textValue = '') => {
  return `\
<html>
<body>
  <form method="POST" ${formAttrs}>
    <input name="foo" type="text" value="${textValue}"/>
    <input name="bar" type="file"/>
    <input type="submit"/>
  </form>
</body>
</html>\
`
}

const onServer = function (app) {
  app.post('/verify-attachment', multer().any(), async (req, res) => {
    const file = req.files[0]

    const fixturePath = path.resolve(e2ePath, 'cypress', 'fixtures', req.body.foo)

    const fixtureBuf = await fs.readFileAsync(fixturePath)
    const uploadBuf = file.buffer

    const ret = fixtureBuf.compare(uploadBuf)

    if (ret === 0) {
      return res.send('files match')
    }

    return res.send(
      `\
file did not match. file at ${fixturePath} did not match uploaded buf.
<br/>
<hr/>
buffer compare yielded: ${ret}\
`,
    )
  })

  // all routes below this point will have bodies parsed
  app.use(bodyParser.text({
    type: '*/*', // parse any content-type
  }))

  app.get('/', (req, res) => {
    return res
    .type('html')
    .send(getFormHtml('action="/dump-body"'))
  })

  app.get('/multipart-form-data', (req, res) => {
    return res
    .type('html')
    .send(getFormHtml('action="/dump-body" enctype="multipart/form-data"'))
  })

  app.get('/multipart-with-attachment', (req, res) => {
    return res
    .type('html')
    .send(getFormHtml('action="/verify-attachment" enctype="multipart/form-data"', req.query.fixturePath))
  })

  return app.post('/dump-body', (req, res) => {
    return res
    .type('html')
    .send(req.body)
  })
}

describe('e2e forms', () => {
  context('submissions with jquery XHR POST', () => {
    systemTests.setup()

    systemTests.it('passing', {
      spec: 'form_submission_passing.cy.js',
      snapshot: true,
    })

    systemTests.it('failing', {
      spec: 'form_submission_failing.cy.js',
      snapshot: true,
      expectedExitCode: 1,
      onStdout: (stdout) => {
        return stdout
        .replace(/((?: {6}-)+[^\n]+\n)/gm, '')
      }, // remove variable diff
    })
  })

  context('<form> submissions', () => {
    systemTests.setup({
      settings: {
        e2e: {},
        env: {
          PATH_TO_LARGE_IMAGE: pathToLargeImage,
        },
      },
      servers: [
        {
          port: HTTPS_PORT,
          https: true,
          onServer,
        },
        {
          port: HTTP_PORT,
          onServer,
        },
      ],
    })

    before(() => {
      // go out and fetch this image if we don't already have it
      return fs
      .readFileAsync(pathToLargeImage)
      .catch({ code: 'ENOENT' }, () => {
        // 16MB image, too big to include with git repo
        return rp('https://test-page-speed.cypress.io/files/huge-image.jpg')
        .then((resp) => {
          return fs.outputFileAsync(pathToLargeImage, resp)
        })
      })
    })

    systemTests.it('passes with https on localhost', {
      // FIXME: webkit is 404ing on redirects after the form submit on the default clientRoute /__/
      browser: '!webkit',
      config: {
        videoCompression: false,
        baseUrl: `https://localhost:${HTTPS_PORT}`,
      },
      spec: 'form_submission_multipart.cy.js',
      snapshot: true,
    })

    systemTests.it('passes with http on localhost', {
      // FIXME: webkit is 404ing on redirects after the form submit on the default clientRoute /__/
      browser: '!webkit',
      config: {
        videoCompression: false,
        baseUrl: `http://localhost:${HTTP_PORT}`,
        e2e: {},
      },
      spec: 'form_submission_multipart.cy.js',
      snapshot: true,
    })
  })
})
