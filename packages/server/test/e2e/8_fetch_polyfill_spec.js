const e2e = require('../support/helpers/e2e').default
const { stripIndent } = require('common-tags')
const bodyParser = require('body-parser')

const onServer = function (app) {
  app.use(bodyParser.json({ extended: false }))

  app.get('/get-json', (req, res) => {
    return res.json([1, 2, 3])
  })

  app.get('/get-text', (req, res) => {
    return res.send('pong')
  })

  app.post('/add', (req, res) => {
    if (req.body.method !== 'add') {
      throw new Error('wrong body method')
    }

    return res.json({ answer: req.body.a + req.body.b })
  })

  // page posts a JSON object
  app.get('/addition', (req, res) => {
    return res.send(stripIndent`
      <body>
        <div id="result"></div>
        <script>
          const data = {
            method: 'add',
            a: 2,
            b: 15
          }
          fetch('/add', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          }).then((response) => {
            if (!response) {
              throw new Error('no response')
            }
            if (!response.ok) {
              throw new Error('response is not ok')
            }
            return response.json()
          }).then(j => {
            // either answer from the server
            // or from the network stub
            if (j.answer !== 17 && j.answer !== 193) {
              throw new Error('wrong answer')
            }
            document.getElementById('result').innerText = 'answer: ' + j.answer
          })
        </script>
      </body>
    `)
  })

  // page fetches JSON array
  app.get('/first', (req, res) => {
    return res.send(stripIndent`
      <body>
        <script>
          fetch('/get-json')
          .then((response) => {
            if (!response) {
              throw new Error('no response')
            }
            if (!response.ok) {
              throw new Error('response is not ok')
            }
            return response.json()
          })
          .then((list) => {
            if (list.length !== 3) {
              throw new Error('Wrong number of items')
            }
            if (list[0] !== 1) {
              throw new Error('Wrong first item')
            }
            if (list[1] !== 2) {
              throw new Error('Wrong second item')
            }
            if (list[2] !== 3) {
              throw new Error('Wrong third item')
            }
          })
        </script>
        <a href="/second">second</a>
      </body>
    `)
  })

  // page fetches text
  app.get('/second', (req, res) => {
    return res.send(stripIndent`
      <body>
        <div id="result"></div>
        <script>
          fetch('/get-text')
          .then((response) => {
            if (!response) {
              throw new Error('no response')
            }
            if (!response.ok) {
              throw new Error('response is not ok')
            }
            if (response.status !== 200) {
              throw new Error('response status not 200')
            }
            return response.text()
          })
          .then((text) => {
            // allow response from the server
            // or stub response
            if (text !== 'pong' && text !== 'mock pong') {
              throw new Error('Wrong text response')
            }
            document.getElementById('result').innerText = 'text: ' + text
          })
        </script>
      </body>
    `)
  })
}

describe('e2e fetch polyfill', () => {
  e2e.setup({
    servers: {
      port: 1818,
      onServer,
    },
  })

  e2e.it('passes', {
    spec: 'fetch_spec.coffee',
    snapshot: false,
    config: {
      experimentalFetchPolyfill: true,
    },
  })
})

describe('e2e no fetch polyfill', () => {
  e2e.setup({
    servers: {
      port: 1818,
      onServer,
    },
  })

  e2e.it('passes', {
    spec: 'fetch_no_polyfill_spec.coffee',
    snapshot: false,
    config: {
      experimentalFetchPolyfill: false,
    },
  })
})
