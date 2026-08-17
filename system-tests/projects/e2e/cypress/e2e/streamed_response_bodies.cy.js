/* eslint-disable no-undef */
const readLines = (reader, decoder, buffered, lines, minLines) => {
  return reader.read().then(({ value, done }) => {
    if (done) return lines

    buffered += decoder.decode(value, { stream: true })

    const chunks = buffered.split('\n')

    // the last entry may be a partial line - keep it buffered for the next read
    buffered = chunks.pop()

    chunks.forEach((chunk) => {
      if (chunk) lines.push(JSON.parse(chunk))
    })

    if (lines.length >= minLines) return lines

    return readLines(reader, decoder, buffered, lines, minLines)
  })
}

// relies on the beforeEach visit: with no baseUrl, a relative cy.request
// resolves against the visited origin and is invalid before any visit
const expectConnections = (n, attempts = 20) => {
  return cy.request('/connections').then(({ body }) => {
    if (body.connections === n) return

    if (!attempts) throw new Error(`expected ${n} connections, got ${body.connections}`)

    return cy.wait(100).then(() => expectConnections(n, attempts - 1))
  })
}

describe('streamed response bodies', () => {
  beforeEach(() => {
    cy.visit('http://127.0.0.1:3043/index.html')
  })

  it('reads progressive ndjson bytes from a never-ending response without hanging the run', () => {
    // before the continue-then-stream fix, the CDP Fetch path eagerly
    // materialized the full response body before continuing it - since this
    // response never ends, that used to wedge the run here indefinitely
    cy.window().then({ timeout: 15000 }, (win) => {
      return win.fetch('/ndjson').then((response) => {
        const reader = response.body.getReader()
        const decoder = new win.TextDecoder()

        return readLines(reader, decoder, '', [], 3)
        .finally(() => reader.cancel())
      })
    }).then((lines) => {
      // consecutive from wherever delivery started - the first line is written
      // while the response pause is still held, and whether those buffered
      // bytes survive the continue is a browser detail, not the point here
      expect(lines).to.have.length.of.at.least(3)
      expect(lines[0].n).to.be.at.most(3)
      lines.forEach(({ n }, i) => i && expect(n).to.eq(lines[i - 1].n + 1))
    })
  })

  it('receives a long-poll response that stays silent before answering', () => {
    cy.window().then({ timeout: 15000 }, (win) => {
      return win.fetch('/long-poll').then((response) => {
        return response.json()
      })
    }).should('deep.eq', { answered: true })
  })

  it('a cy.intercept response handler still reads and replaces a chunked body', () => {
    // a matched route forces the CDP path to materialize the body so the
    // handler sees real bytes - the long-poll response is the chunked,
    // no-content-length shape that would otherwise classify as streamed
    cy.intercept('**/long-poll', (req) => {
      req.continue((res) => {
        expect(res.body).to.deep.eq({ answered: true })
        res.body = { answered: 'intercepted' }
      })
    })

    cy.window().then({ timeout: 15000 }, (win) => {
      return win.fetch('/long-poll').then((response) => {
        return response.json()
      })
    }).should('deep.eq', { answered: 'intercepted' })
  })

  it('connections do not accumulate', () => {
    expectConnections(0)

    cy.window()
    .then((win) => {
      return win.fetch('/ndjson').then((response) => {
        return response.body.getReader()
      })
    }).then((reader) => {
      expectConnections(1)
      .then(() => {
        reader.cancel()
      })

      expectConnections(0)
    })
  })
})
