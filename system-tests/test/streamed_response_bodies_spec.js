const { expect } = require('chai')
const systemTests = require('../lib/system-tests').default

let connections = 0

const onServer = function (app) {
  app.get('/connections', (req, res) => {
    return res.json({ connections })
  })

  app.get('/ndjson', (req, res) => {
    let n = 0
    let int

    connections += 1

    res.on('close', () => {
      clearInterval(int)
      connections -= 1
    })

    res.set({
      'Content-Type': 'application/x-ndjson',
    })

    // never calls res.end() - the point is to prove a response that never
    // finishes still delivers bytes to the page as they're written
    int = setInterval(() => {
      n += 1

      res.write(`${JSON.stringify({ n })}\n`)
    }, 100)
  })

  return app.get('/long-poll', (req, res) => {
    res.set({
      'Content-Type': 'application/json',
    })

    // the shape under test is headers-arrived-body-pending: without the
    // explicit flush, Express holds the headers until the first write and
    // this becomes a plain delayed response instead of a silent hold
    res.flushHeaders()

    setTimeout(() => {
      res.write(JSON.stringify({ answered: true }))
      res.end()
    }, 1500)
  })
}

describe('e2e streamed response bodies', () => {
  systemTests.setup({
    servers: [{
      port: 3043,
      // serves projects/e2e so the spec can visit this origin directly and
      // fetch same-origin, keeping CORS out of the picture
      static: true,
      onServer,
    }],
  })

  // https://github.com/cypress-io/cypress/issues/34623
  // NOTE: no snapshot - the point of this spec is a never-ending response
  // body, so there's no deterministic mocha-events output to capture.
  // Success is asserted via expectedExitCode plus the passing-count guard
  // below (exit code 0 alone would also pass a run that executed no tests).
  systemTests.it('passes', {
    browser: '!webkit', // CDP Fetch continue-then-stream is Chrome/CDP-specific
    spec: 'streamed_response_bodies.cy.js',
    snapshot: false,
    expectedExitCode: 0,
    onStdout: (stdout) => {
      expect(stdout).to.include('4 passing')
    },
  })
})
