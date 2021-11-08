/*
 * Tests TODO:
 *
 * Add e2e test covering common frameworks, to make sure it works with real applications (that we didn't write):
 *   https://uppy.io/
 *   https://www.dropzone.dev/js/
 *   https://github.com/lian-yue/vue-upload-component
 * (though some of these will have to wait for drag-n-drop support)
 */

const { _, $ } = Cypress

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
      .attachFile({ contents: 'foo', fileName: 'foo.txt' })

      cy.get('#basic')
      .then((input) => {
        expect(input[0].files.length).to.eq(1)
        expect(input[0].files[0].name).to.eq('foo.txt')
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
        },
        Buffer.from('baz'),
      ])

      cy.get('#multiple')
      .should('include.value', 'foo.txt')
      .then((input) => {
        expect(input[0].files[0].name).to.eq('foo.txt')
        expect(input[0].files[1].name).to.eq('bar.json')
        expect(input[0].files[2].name).to.eq('')
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

    it('invokes change and input events on the input', (done) => {
      const $input = cy.$$('#basic')

      $input.on('input', (e) => {
        const obj = _.pick(e.originalEvent, 'bubbles', 'cancelable', 'composed', 'target', 'type')

        expect(obj).to.deep.eq({
          bubbles: true,
          cancelable: false,
          composed: true,
          target: $input.get(0),
          type: 'input',
        })

        $input.on('change', (e) => {
          const obj = _.pick(e.originalEvent, 'bubbles', 'cancelable', 'composed', 'target', 'type')

          expect(obj).to.deep.eq({
            bubbles: true,
            cancelable: false,
            composed: false,
            target: $input.get(0),
            type: 'change',
          })

          done()
        })
      })

      cy.get('#basic').attachFile({ contents: 'foo' })
    })

    it('bubbles events', (done) => {
      cy.window().then((win) => {
        $(win).on('input', () => {
          done()
        })
      })

      cy.get('#basic').attachFile({ contents: 'foo' })
    })

    it('invokes events on the input without changing subject when passed a label', (done) => {
      cy.$$('#basic-label').on('input', () => {
        throw new Error('shouldn\'t happen')
      })

      cy.$$('#basic').on('input', () => {
        done()
      })

      cy.get('#basic-label').attachFile({ contents: 'foo' })
      .should('have.id', 'basic-label')
    })

    it('can empty previously filled input', () => {
      cy.get('#basic').attachFile({ contents: 'foo' })
      cy.get('#basic').attachFile([])
      .then((input) => {
        expect(input[0].files.length).to.eq(0)
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
          expect(err.message).to.include('`cy.attachFile()` can only be called on a single element. Your subject contained')
          expect(err.docsUrl).to.eq('https://on.cypress.io/attachFile')
          done()
        })

        cy.get('input[type="file"]').attachFile({ contents: 'foo' })
      })

      it('throws when no arguments given', function (done) {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.attachFile()` must be passed a Buffer or an object with a non-null `contents` property as its 1st argument. You passed: `undefined`.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/attachFile')
          done()
        })

        cy.get('#basic').attachFile()
      })

      it('throws when file is null', function (done) {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.attachFile()` must be passed a Buffer or an object with a non-null `contents` property as its 1st argument. You passed: `null`.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/attachFile')
          done()
        })

        cy.get('#basic').attachFile(null)
      })

      it('throws when single file.contents is null', function (done) {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.attachFile()` must be passed a Buffer or an object with a non-null `contents` property as its 1st argument. You passed: `{"contents":null}`.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/attachFile')
          done()
        })

        cy.get('#basic').attachFile({ contents: null })
      })

      it('throws when any of multiple files contents is undefined', function (done) {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.attachFile()` must be passed an array of Buffers or objects with non-null `contents`. At files[1] you passed: `{}`.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/attachFile')
          done()
        })

        cy.get('#basic').attachFile([{ contents: 'foo' }, {}])
      })

      it('throws on invalid action', function (done) {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.attachFile()` `action` can only be `input` or `drag-n-drop`. You passed: `foobar`.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/attachFile')
          done()
        })

        cy.get('#basic').attachFile({ contents: 'foo' }, { action: 'foobar' })
      })
    })

    /*
     * The tests around actionability are somewhat limited, since the functionality is thoroughly tested in the
     * `cy.trigger()` unit tests. We include a few tests directly on `cy.attachFile()` in order to ensure we're
     * using $actionability.verify() properly, but don't extensively exercise the logic within it here.
     *
     * See trigger_spec.js for the full actionability test suite.
     */
    describe('actionability', {
      defaultCommandTimeout: 50,
    }, () => {
      it('attaches files to a hidden input from a visible label', () => {
        cy.get('#hidden-label').attachFile({ contents: 'foo' })

        cy.get('#hidden')
        .then(getFileContents)
        .then((contents) => {
          expect(contents[0]).to.eql('foo')
        })
      })

      it('does not work on hidden inputs by default', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.attachFile()` failed because this element is not visible')
          done()
        })

        cy.get('#hidden').attachFile({ contents: 'foo' })
      })

      it('can force on hidden inputs', () => {
        cy.get('#hidden').attachFile({ contents: 'foo' }, { force: true })
      })

      it('does not work on covered inputs by default', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include(`\`<input id="covered" type="file">\`

is being covered by another element:

\`<div id="covering"></div>\``)

          done()
        })

        cy.get('#covered').attachFile({ contents: 'foo' })
      })

      it('can force on covered inputs', () => {
        cy.get('#covered').attachFile({ contents: 'foo' }, { force: true })
      })

      it('does not work on disabled inputs by default', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.attachFile()` failed because this element is `disabled`')
          done()
        })

        cy.get('#disabled-label').attachFile({ contents: 'foo' })
      })

      it('can force on disabled inputs', () => {
        cy.get('#disabled-label').attachFile({ contents: 'foo' }, { force: true })
      })

      it('does not work on hidden labels by default', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.attachFile()` failed because this element is not visible')
          done()
        })

        cy.get('#hidden-basic-label').attachFile({ contents: 'foo' })
      })

      it('can force on hidden labels', () => {
        cy.get('#hidden-basic-label').attachFile({ contents: 'foo' }, { force: true })
      })

      it('can scroll to input', () => {
        const scrolled = []

        cy.on('scrolled', ($el, type) => {
          scrolled.push(type)
        })

        cy.get('#scroll').attachFile({ contents: 'foo' })
        .then(() => {
          expect(scrolled).not.to.be.empty
        })
      })

      it('can scroll to label', () => {
        const scrolled = []

        cy.on('scrolled', ($el, type) => {
          scrolled.push(type)
        })

        cy.get('#scroll-label').attachFile({ contents: 'foo' })
        .then(() => {
          expect(scrolled).not.to.be.empty
        })
      })

      it('does not scroll when forced', () => {
        const scrolled = []

        cy.on('scrolled', ($el, type) => {
          scrolled.push(type)
        })

        cy.get('#scroll-label').attachFile({ contents: 'foo' }, { force: true })
        .then(() => {
          expect(scrolled).to.be.empty
        })
      })

      it('waits until input stops animating', {
        defaultCommandTimeout: 1000,
      }, () => {
        let retries = 0

        cy.on('command:retry', (obj) => {
          retries += 1
        })

        cy.stub(cy, 'ensureElementIsNotAnimating')
        .throws(new Error('animating!'))
        .onThirdCall().returns()

        cy.get('#basic').attachFile({ contents: 'foo' }).then(() => {
          expect(retries).to.eq(3)
          expect(cy.ensureElementIsNotAnimating).to.be.calledThrice
        })
      })

      it('can specify scrollBehavior in options', () => {
        cy.get('#scroll').then((el) => {
          cy.spy(el[0], 'scrollIntoView')
        })

        cy.get('#scroll').attachFile({ contents: 'foo' }, { scrollBehavior: 'bottom' })

        cy.get('#scroll').then((el) => {
          expect(el[0].scrollIntoView).to.be.calledWith({ block: 'end' })
        })
      })
    })
  })
})
