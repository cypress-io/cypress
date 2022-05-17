const { assertLogLength } = require('../../support/utils')
const { stripIndent } = require('common-tags')
const { _ } = Cypress

const okResponse = {
  contents: 'contents',
  filePath: '/path/to/foo.json',
}

describe('src/cy/commands/files', () => {
  beforeEach(() => {
    // call through normally on everything
    cy.stub(Cypress, 'backend').callThrough()
  })

  describe('#readFile', () => {
    it('triggers \'read:file\' with the right options', () => {
      Cypress.backend.resolves(okResponse)

      cy.readFile('foo.json').then(() => {
        expect(Cypress.backend).to.be.calledWith(
          'read:file',
          'foo.json',
          { encoding: 'utf8' },
        )
      })
    })

    it('can take encoding as second argument', () => {
      Cypress.backend.resolves(okResponse)

      cy.readFile('foo.json', 'ascii').then(() => {
        expect(Cypress.backend).to.be.calledWith(
          'read:file',
          'foo.json',
          { encoding: 'ascii' },
        )
      })
    })

    // https://github.com/cypress-io/cypress/issues/1558
    it('passes explicit null encoding through to server and decodes response', () => {
      Cypress.backend.resolves({
        contents: Buffer.from('\n'),
        filePath: '/path/to/foo.json',
      })

      cy.readFile('foo.json', null).then(() => {
        expect(Cypress.backend).to.be.calledWith(
          'read:file',
          'foo.json',
          { encoding: null },
        )
      }).should('eql', Buffer.from('\n'))
    })

    it('sets the contents as the subject', () => {
      Cypress.backend.resolves(okResponse)

      cy.readFile('foo.json').then((subject) => {
        expect(subject).to.equal('contents')
      })
    })

    it('retries to read when ENOENT', () => {
      const err = new Error('foo')

      err.code = 'ENOENT'

      let retries = 0

      cy.on('command:retry', () => {
        retries += 1
      })

      Cypress.backend
      .onFirstCall()
      .rejects(err)
      .onSecondCall()
      .resolves(okResponse)

      cy.readFile('foo.json').then(() => {
        expect(retries).to.eq(1)
      })
    })

    it('retries assertions until they pass', () => {
      let retries = 0

      cy.on('command:retry', () => {
        retries += 1
      })

      Cypress.backend
      .onFirstCall()
      .resolves({
        contents: 'foobarbaz',
      })
      .onSecondCall()
      .resolves({
        contents: 'quux',
      })

      cy.readFile('foo.json').should('eq', 'quux').then(() => {
        expect(retries).to.eq(1)
      })
    })

    it('really works', () => {
      cy.readFile('./cypress/fixtures/fileSpec.json').its('baseUrl').should('eq', 'http://localhost:3500')
    })

    it('works when contents are supposed to be null', () => {
      cy.readFile('does-not-exist').should('be.null')
    })

    describe('.log', () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log
          this.logs.push(log)
        })

        return null
      })

      it('can turn off logging', () => {
        Cypress.backend.resolves(okResponse)

        cy.readFile('foo.json', { log: false }).then(function () {
          const logs = _.filter(this.logs, (log) => {
            return log.get('name') === 'readFile'
          })

          expect(logs.length).to.eq(0)
        })
      })

      it('logs immediately before resolving', function () {
        Cypress.backend.resolves(okResponse)

        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'readFile') {
            expect(log.get('state')).to.eq('pending')
            expect(log.get('message')).to.eq('foo.json')
            expect(log.get('timeout')).to.eq(Cypress.config('defaultCommandTimeout'))
          }
        })

        cy.readFile('foo.json').then(() => {
          if (!this.lastLog) {
            throw new Error('failed to log before resolving')
          }
        })
      })
    })

    describe('errors', {
      defaultCommandTimeout: 50,
    }, () => {
      beforeEach(function () {
        cy.visit('/fixtures/empty.html')

        this.logs = []

        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'readFile') {
            this.lastLog = log
            this.logs.push(log)
          }
        })

        return null
      })

      it('throws when file argument is absent', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(err.message).to.eq('`cy.readFile()` must be passed a non-empty string as its 1st argument. You passed: `undefined`.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/readfile')

          done()
        })

        cy.readFile()
      })

      it('throws when file argument is not a string', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(err.message).to.eq('`cy.readFile()` must be passed a non-empty string as its 1st argument. You passed: `2`.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/readfile')

          done()
        })

        cy.readFile(2)
      })

      it('throws when file argument is an empty string', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(err.message).to.eq('`cy.readFile()` must be passed a non-empty string as its 1st argument. You passed: ``.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/readfile')

          done()
        })

        cy.readFile('')
      })

      it('throws when there is an error reading the file', function (done) {
        const err = new Error('EISDIR: illegal operation on a directory, read')

        err.name = 'EISDIR'
        err.code = 'EISDIR'
        err.filePath = '/path/to/foo'

        Cypress.backend.rejects(err)

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(err.message).to.eq(stripIndent`\
            \`cy.readFile(\"foo\")\` failed while trying to read the file at the following path:

              \`/path/to/foo\`

            The following error occurred:

              > "EISDIR: illegal operation on a directory, read"`)

          expect(err.docsUrl).to.eq('https://on.cypress.io/readfile')

          done()
        })

        cy.readFile('foo')
      })

      it('has implicit existence assertion and throws a specific error when file does not exist', function (done) {
        const err = new Error('ENOENT: no such file or directory, open \'foo.json\'')

        err.name = 'ENOENT'
        err.code = 'ENOENT'
        err.filePath = '/path/to/foo.json'

        Cypress.backend.rejects(err)

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')

          expect(err.message).to.eq(stripIndent`
            Timed out retrying after 50ms: \`cy.readFile(\"foo.json\")\` failed because the file does not exist at the following path:

            \`/path/to/foo.json\``)

          expect(err.docsUrl).to.eq('https://on.cypress.io/readfile')

          done()
        })

        cy.readFile('foo.json')
      })

      // https://github.com/cypress-io/cypress/issues/20683
      it('has implicit existence assertion, retries and throws a specific error when file does not exist for null encoding', function (done) {
        const err = new Error('ENOENT: no such file or directory, open \'foo.json\'')

        err.name = 'ENOENT'
        err.code = 'ENOENT'
        err.filePath = '/path/to/foo.json'

        Cypress.backend.rejects(err)
        let hasRetried = false

        cy.on('command:retry', () => {
          hasRetried = true
        })

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')

          expect(err.message).to.eq(stripIndent`
            Timed out retrying after 50ms: \`cy.readFile(\"foo.json\")\` failed because the file does not exist at the following path:

            \`/path/to/foo.json\``)

          expect(err.docsUrl).to.eq('https://on.cypress.io/readfile')

          expect(hasRetried).to.be.true

          done()
        })

        cy.readFile('foo.json', null)
      })

      it('throws a specific error when file exists when it shouldn\'t', function (done) {
        Cypress.backend.resolves(okResponse)

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(err.message).to.eq(stripIndent`\
            Timed out retrying after 50ms: \`cy.readFile(\"foo.json\")\` failed because the file exists when expected not to exist at the following path:

            \`/path/to/foo.json\``)

          expect(err.docsUrl).to.eq('https://on.cypress.io/readfile')

          done()
        })

        cy.readFile('foo.json').should('not.exist')
      })

      it('passes through assertion error when not about existence', function (done) {
        Cypress.backend.resolves({
          contents: 'foo',
        })

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(err.message).to.eq('Timed out retrying after 50ms: expected \'foo\' to equal \'contents\'')

          done()
        })

        cy.readFile('foo.json').should('equal', 'contents')
      })

      it('throws when the read timeout expires', function (done) {
        Cypress.backend.callsFake(() => {
          return new Cypress.Promise(() => { /* Broken promise for timeout */ })
        })

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(err.message).to.eq(stripIndent`\
            \`cy.readFile("foo")\` timed out after waiting \`10ms\`.
          `)

          expect(err.docsUrl).to.eq('https://on.cypress.io/readfile')

          done()
        })

        cy.readFile('foo', { timeout: 10 })
      })

      it('uses defaultCommandTimeout config value if option not provided', {
        defaultCommandTimeout: 42,
      }, function (done) {
        Cypress.backend.callsFake(() => {
          return new Cypress.Promise(() => { /* Broken promise for timeout */ })
        })

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(err.message).to.eq(stripIndent`\
            \`cy.readFile("foo")\` timed out after waiting \`42ms\`.
          `)

          expect(err.docsUrl).to.eq('https://on.cypress.io/readfile')

          done()
        })

        cy.readFile('foo')
      })
    })
  })

  describe('#writeFile', () => {
    it('triggers \'write:file\' with the right options', () => {
      Cypress.backend.resolves(okResponse)

      cy.writeFile('foo.txt', 'contents').then(() => {
        expect(Cypress.backend).to.be.calledWith(
          'write:file',
          'foo.txt',
          'contents',
          {
            encoding: 'utf8',
            flag: 'w',
          },
        )
      })
    })

    it('can take encoding as third argument', () => {
      Cypress.backend.resolves(okResponse)

      cy.writeFile('foo.txt', 'contents', 'ascii').then(() => {
        expect(Cypress.backend).to.be.calledWith(
          'write:file',
          'foo.txt',
          'contents',
          {
            encoding: 'ascii',
            flag: 'w',
          },
        )
      })
    })

    // https://github.com/cypress-io/cypress/issues/1558
    it('explicit null encoding is sent to server as Buffer', () => {
      Cypress.backend.resolves(okResponse)

      cy.writeFile('foo.txt', Buffer.from([0, 0, 54, 255]), null).then(() => {
        expect(Cypress.backend).to.be.calledWith(
          'write:file',
          'foo.txt',
          Buffer.from([0, 0, 54, 255]),
          {
            encoding: null,
            flag: 'w',
          },
        )
      })
    })

    it('can take encoding as part of options', () => {
      Cypress.backend.resolves(okResponse)

      cy.writeFile('foo.txt', 'contents', { encoding: 'ascii' }).then(() => {
        expect(Cypress.backend).to.be.calledWith(
          'write:file',
          'foo.txt',
          'contents',
          {
            encoding: 'ascii',
            flag: 'w',
          },
        )
      })
    })

    it('yields null', () => {
      Cypress.backend.resolves(okResponse)

      cy.writeFile('foo.txt', 'contents').then((subject) => {
        expect(subject).to.eq(null)
      })
    })

    it('can write a string', () => {
      Cypress.backend.resolves(okResponse)

      cy.writeFile('foo.txt', 'contents')
    })

    it('can write an array as json', () => {
      Cypress.backend.resolves(okResponse)

      cy.writeFile('foo.json', [])
    })

    it('can write an object as json', () => {
      Cypress.backend.resolves(okResponse)

      cy.writeFile('foo.json', {})
    })

    it('writes the file to the filesystem, overwriting existing file', () => {
      cy
      .writeFile('cypress/fixtures/foo.txt', '')
      .writeFile('cypress/fixtures/foo.txt', 'bar')
      .readFile('cypress/fixtures/foo.txt').should('equal', 'bar')
      .exec('rm cypress/fixtures/foo.txt')
    })

    describe('.flag', () => {
      it('sends a flag if specified', () => {
        Cypress.backend.resolves(okResponse)

        cy.writeFile('foo.txt', 'contents', { flag: 'a+' }).then(() => {
          expect(Cypress.backend).to.be.calledWith(
            'write:file',
            'foo.txt',
            'contents',
            {
              encoding: 'utf8',
              flag: 'a+',
            },
          )
        })
      })

      it('appends content to existing file if specified', () => {
        cy
        .writeFile('cypress/fixtures/foo.txt', 'foo')
        .writeFile('cypress/fixtures/foo.txt', 'bar', { flag: 'a+' })
        .readFile('cypress/fixtures/foo.txt').should('equal', 'foobar')
        .exec('rm cypress/fixtures/foo.txt')
      })
    })

    describe('.log', () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log
          this.logs.push(log)
        })

        return null
      })

      it('can turn off logging', () => {
        Cypress.backend.resolves(okResponse)

        cy.writeFile('foo.txt', 'contents', { log: false }).then(function () {
          const logs = _.filter(this.logs, (log) => {
            return log.get('name') === 'writeFile'
          })

          expect(logs.length).to.eq(0)
        })
      })

      it('logs immediately before resolving', function () {
        Cypress.backend.resolves(okResponse)

        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'writeFile') {
            expect(log.get('state')).to.eq('pending')
            expect(log.get('message')).to.eq('foo.txt', 'contents')
            expect(log.get('timeout')).to.eq(Cypress.config('defaultCommandTimeout'))
          }
        })

        cy.writeFile('foo.txt', 'contents').then(() => {
          if (!this.lastLog) {
            throw new Error('failed to log before resolving')
          }
        })
      })
    })

    describe('errors', {
      defaultCommandTimeout: 50,
    }, () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'writeFile') {
            this.lastLog = log
            this.logs.push(log)
          }
        })

        return null
      })

      it('throws when file name argument is absent', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(err.message).to.eq('`cy.writeFile()` must be passed a non-empty string as its 1st argument. You passed: `undefined`.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/writefile')

          done()
        })

        cy.writeFile()
      })

      it('throws when file name argument is not a string', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(err.message).to.eq('`cy.writeFile()` must be passed a non-empty string as its 1st argument. You passed: `2`.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/writefile')

          done()
        })

        cy.writeFile(2)
      })

      it('throws when contents argument is absent', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(err.message).to.eq('`cy.writeFile()` must be passed a non-empty string, an object, or an array as its 2nd argument. You passed: `undefined`.')

          done()
        })

        cy.writeFile('foo.txt')
      })

      it('throws when contents argument is not a string, object, or array', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(err.message).to.eq('`cy.writeFile()` must be passed a non-empty string, an object, or an array as its 2nd argument. You passed: `2`.')

          done()
        })

        cy.writeFile('foo.txt', 2)
      })

      it('throws when there is an error writing the file', function (done) {
        const err = new Error('WHOKNOWS: unable to write file')

        err.name = 'WHOKNOWS'
        err.code = 'WHOKNOWS'
        err.filePath = '/path/to/foo.txt'

        Cypress.backend.rejects(err)

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(err.message).to.eq(stripIndent`
            \`cy.writeFile(\"foo.txt\")\` failed while trying to write the file at the following path:

              \`/path/to/foo.txt\`

            The following error occurred:

              > "WHOKNOWS: unable to write file"`)

          expect(err.docsUrl).to.eq('https://on.cypress.io/writefile')

          done()
        })

        cy.writeFile('foo.txt', 'contents')
      })

      it('throws when the write timeout expires', function (done) {
        Cypress.backend.callsFake(() => {
          return new Cypress.Promise(() => {})
        })

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(err.message).to.eq(stripIndent`
            \`cy.writeFile("foo.txt")\` timed out after waiting \`10ms\`.
          `)

          expect(err.docsUrl).to.eq('https://on.cypress.io/writefile')

          done()
        })

        cy.writeFile('foo.txt', 'contents', { timeout: 10 })
      })

      it('uses defaultCommandTimeout config value if option not provided', {
        defaultCommandTimeout: 42,
      }, function (done) {
        Cypress.backend.callsFake(() => {
          return new Cypress.Promise(() => { /* Broken promise for timeout */ })
        })

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(err.message).to.eq(stripIndent`
            \`cy.writeFile("foo.txt")\` timed out after waiting \`42ms\`.
          `)

          expect(err.docsUrl).to.eq('https://on.cypress.io/writefile')

          done()
        })

        cy.writeFile('foo.txt', 'contents')
      })
    })
  })
})
