const { _ } = Cypress

// Reading and decoding files from an input element would, in the real world,
// be handled by the application under test, and they would assert on their
// application state. We want to assert on how attachFile behaves directly
// though, and getting the files associated with an <input> as strings is
// handy.
function getFileContents (subject) {
  const decoder = new TextDecoder('utf8')

  const fileContents = _.map(subject[0].files, (f) => {
    return f
    .arrayBuffer()
    .then((c) => decoder.decode(c))
  })

  return Promise.all(fileContents)
}

describe('src/cy/commands/actions/attachFile', () => {
  beforeEach(() => {
    cy.visit('/fixtures/files-form.html')
  })

  context('#attachFile', () => {
    it('attaches a single file', () => {
      cy.get('#basic')
      .attachFile({ contents: 'foo' })

      cy.get('#basic')
      .then((input) => {
        expect(input[0].files.length).to.eq(1)
        expect(input[0].files[0].name).to.eq('')
        expect(input[0].files[0].type).to.eq('')
        expect(input[0].files[0].lastModified).to.be.closeTo(Date.now(), 1000)
      })

      cy.get('#basic')
      .then(getFileContents)
      .then((contents) => {
        expect(contents[0]).to.eql('foo')
      })
    })

    it('attaches multiple files', () => {
      cy.get('#multiple')
      .attachFile([
        {
          contents: 'foo',
          fileName: 'foo.txt',
        }, {
          contents: { a: 'bar' },
          fileName: 'bar.json',
        }, {
          contents: Buffer.from('baz'),
          fileName: 'baz.bin',
        },
      ])

      cy.get('#multiple')
      .should('include.value', 'foo.txt')
      .then((input) => {
        expect(input[0].files[0].name).to.eq('foo.txt')
        expect(input[0].files[1].name).to.eq('bar.json')
        expect(input[0].files[2].name).to.eq('baz.bin')
      })

      cy.get('#multiple')
      .then(getFileContents)
      .then((contents) => {
        expect(contents[0]).to.eq('foo')
        expect(contents[1]).to.eq('{"a":"bar"}')
        expect(contents[2]).to.eq('baz')
      })
    })

    it('attaches files with custom lastModified and mimeType', () => {
      cy.get('#basic').attachFile({
        contents: 'foo',
        mimeType: 'text/plain',
        lastModified: 1234,
      })

      cy.get('#basic').then((input) => {
        expect(input[0].files[0].type).to.eq('text/plain')
        expect(input[0].files[0].lastModified).to.eq(1234)
      })
    })

    it('attaches files to an input from a label', () => {
      cy.get('#basic-label').attachFile({ contents: 'foo' })

      cy.get('#basic')
      .then(getFileContents)
      .then((contents) => {
        expect(contents[0]).to.eql('foo')
      })
    })

    it('attaches files to a hidden input from a visible label', () => {
      cy.get('#hidden-label').attachFile({ contents: 'foo' })

      cy.get('#hidden')
      .then(getFileContents)
      .then((contents) => {
        expect(contents[0]).to.eql('foo')
      })
    })

    describe('errors', {
      defaultCommandTimeout: 50,
    }, () => {
      it('is a child command', (done) => {
        cy.on('fail', () => {
          done()
        })

        cy.attachFile({ contents: 'foo' })
      })

      it('throws when non dom subject', (done) => {
        cy.on('fail', () => {
          done()
        })

        cy.noop({}).attachFile({ contents: 'foo' })
      })

      it('throws when non-input subject', function (done) {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.attachFile()` can only be called on an `<input type="file">` or a `<label for="fileInput">` pointing to one. Your subject is: `<body>...</body>`')
          expect(err.docsUrl).to.eq('https://on.cypress.io/attachFile')
          done()
        })

        cy.get('body').attachFile({ contents: 'foo' })
      })

      it('throws when non-file input', function (done) {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.attachFile()` can only be called on an `<input type="file">` or a `<label for="fileInput">` pointing to one. Your subject is: `<input type="text" id="text-input">`')
          expect(err.docsUrl).to.eq('https://on.cypress.io/attachFile')
          done()
        })

        cy.get('#text-input').attachFile({ contents: 'foo' })
      })

      it('throws when label for non-file input', function (done) {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.attachFile()` can only be called on an `<input type="file">` or a `<label for="fileInput">` pointing to one. Your subject is: `<label for="text-input" id="text-label">Text label</label>`')
          expect(err.docsUrl).to.eq('https://on.cypress.io/attachFile')
          done()
        })

        cy.get('#text-label').attachFile({ contents: 'foo' })
      })

      it('throws when label without an attached input', function (done) {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.attachFile()` can only be called on an `<input type="file">` or a `<label for="fileInput">` pointing to one. Your subject is: `<label for="nonexistent" id="nonexistent-label">Bad label</label>`')
          expect(err.docsUrl).to.eq('https://on.cypress.io/attachFile')
          done()
        })

        cy.get('#nonexistent-label').attachFile({ contents: 'foo' })
      })

      it('throws when subject is collection of elements', function (done) {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.attachFile()` can only be called on a single element. Your subject contained 3 elements.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/attachFile')
          done()
        })

        cy.get('input[type="file"]').attachFile({ contents: 'foo' })
      })
    })

    /*
     * Tests TODO:
     * Error on { contents: undefined | null }
     * Check on the emitted events (including bubbling)
     * Doesn't change the subject when triggered on <label>
     * Can skip logging with log: false
     * Invalid 'action'
     * Can empty previously filled input
     * Actionability:
     *   Not on hidden input
     *   Not on covered input
     *   Not on disabled input
     *   Not on disabled input through label
     *   Can force on hidden input
     *   Can force on covered input
     *   Can force on disabled input
     *   Can force on hidden label
     *   Can force on disabled input through label
     *
     *   Can scroll to input
     *   Can scroll to label
     *   No scroll on 'forced'
     *   Opacity 0
     *   Waits for input to be visible
     *   Waits for input to be enabled
     *   Waits for label to be visible
     *   Waits until input stops animating
     *   Waits until label stops animating
     *
     *   Can specify scrollBehavior in config
     *   Calls scrollIntoView by default
     *
     * Add e2e test covering common frameworks, to make sure it works with real applications (that we didn't write):
     *   https://uppy.io/
     *   https://www.dropzone.dev/js/
     *   https://github.com/lian-yue/vue-upload-component
     * (though some of these will have to wait for drag-n-drop support)
     */
  })
})
