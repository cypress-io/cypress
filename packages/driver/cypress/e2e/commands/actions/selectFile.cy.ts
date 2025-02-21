// @ts-expect-error - this is being redeclared
const { _, $ } = Cypress

// Reading and decoding files from an input element would, in the real world,
// be handled by the application under test, and they would assert on their
// application state. We want to assert on how selectFile behaves directly
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

describe('src/cy/commands/actions/selectFile', () => {
  beforeEach(() => {
    cy.visit('/fixtures/files-form.html')
    cy.wrap(Cypress.Buffer.from('foo')).as('foo')
  })

  context('#selectFile', () => {
    it('selects a single file', () => {
      cy.get('#basic')
      .selectFile({ contents: '@foo', fileName: 'foo.txt' })

      cy.get('#basic')
      .then((input) => {
        const $input = input[0] as HTMLInputElement
        const $file = $input.files?.[0]

        expect($input.files?.length).to.eq(1)
        expect($file?.name).to.eq('foo.txt')
        expect($file?.type).to.eq('text/plain')
        expect($file?.lastModified).to.be.closeTo(Date.now(), 1000)
      })

      cy.get('#basic')
      .then(getFileContents)
      .then((contents) => {
        expect(contents[0]).to.eql('foo')
      })
    })

    it('selects multiple files', () => {
      cy.get('#multiple')
      .selectFile([
        {
          contents: '@foo',
          fileName: 'foo.txt',
        }, {
          contents: Cypress.Buffer.from('{"a":"bar"}'),
          fileName: 'bar.json',
        },
        Cypress.Buffer.from('baz'),
        // 'baz' in ascii
        Uint8Array.from([98, 97, 122]),
      ])

      cy.get('#multiple')
      .should('include.value', 'foo.txt')
      .then((input) => {
        const $input = input[0] as HTMLInputElement

        expect($input.files?.[0].name).to.eq('foo.txt')
        expect($input.files?.[1].name).to.eq('bar.json')
        expect($input.files?.[2].name).to.eq('')
        expect($input.files?.[3].name).to.eq('')
      })

      cy.get('#multiple')
      .then(getFileContents)
      .then((contents) => {
        expect(contents[0]).to.eq('foo')
        expect(contents[1]).to.eq('{"a":"bar"}')
        expect(contents[2]).to.eq('baz')
        expect(contents[3]).to.eq('baz')
      })
    })

    it('allows custom lastModified', () => {
      cy.get('#basic').selectFile({
        contents: '@foo',
        lastModified: 1234,
      })

      cy.get('#basic').then((input) => {
        const $input = input[0] as HTMLInputElement

        expect($input.files?.[0].lastModified).to.eq(1234)
      })
    })

    it('selects files with an input from a label', () => {
      cy.get('#basic-label').selectFile({ contents: '@foo' })

      cy.get('#basic')
      .then(getFileContents)
      .then((contents) => {
        expect(contents[0]).to.eql('foo')
      })
    })

    it('selects files with an input from a containing label', () => {
      cy.get('#containing-label').selectFile({ contents: '@foo' })

      cy.get('#contained')
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

      cy.get('#basic').selectFile({ contents: '@foo' })
    })

    it('bubbles events', (done) => {
      cy.window().then((win) => {
        $(win).on('input', () => {
          done()
        })
      })

      cy.get('#basic').selectFile({ contents: '@foo' })
    })

    it('invokes events on the input without changing subject when passed a label', (done) => {
      cy.$$('#basic-label').on('input', () => {
        throw new Error('shouldn\'t happen')
      })

      cy.$$('#basic').on('input', () => {
        done()
      })

      cy.get('#basic-label').selectFile({ contents: '@foo' })
      .should('have.id', 'basic-label')
    })

    it('can empty previously filled input', () => {
      cy.get('#basic').selectFile({ contents: '@foo' })
      cy.get('#basic').selectFile([])
      .then((input) => {
        const $input = input[0] as HTMLInputElement

        expect($input.files?.length).to.eq(0)
      })
    })

    it('works with shadow DOMs', () => {
      cy.get('#shadow')
      .shadow()
      .find('input')
      .as('shadowInput')
      .selectFile('@foo')

      cy.get('@shadowInput')
      .then(getFileContents)
      .then((contents) => {
        expect(contents[0]).to.eql('foo')
      })
    })

    it('uses the AUT\'s File constructor', () => {
      cy.window().then(($autWindow) => {
        cy.get('#basic').selectFile('@foo', { action: 'select' }).then((input) => {
          const $input = input[0] as HTMLInputElement

          expect($input.files?.[0]).to.be.instanceOf($autWindow.File)
        })

        cy.get('#basic').selectFile('@foo', { action: 'drag-drop' }).then((input) => {
          const $input = input[0] as HTMLInputElement

          expect($input.files?.[0]).to.be.instanceOf($autWindow.File)
        })
      })
    })

    describe('shorthands', () => {
      const validJsonString = `{
  "foo": 1,
  "bar": {
    "baz": "cypress"
  }
}
`

      it('works with aliased strings', () => {
        cy.wrap('foobar').as('alias')

        cy.get('#basic').selectFile('@alias')
        .then(getFileContents)
        .then((contents) => {
          expect(contents[0]).to.eql('foobar')
        })
      })

      it('works with aliased objects', () => {
        cy.wrap({ foo: 'bar' }).as('alias')

        cy.get('#basic').selectFile('@alias')
        .then(getFileContents)
        .then((contents) => {
          expect(contents[0]).to.eql('{"foo":"bar"}')
        })
      })

      it('works with aliased fixtures', () => {
        cy.fixture('valid.json').as('myFixture')

        cy.get('#basic').selectFile('@myFixture')
        .then((input) => {
          const $input = input[0] as HTMLInputElement

          expect($input.files?.[0].name).to.eq('valid.json')
          expect($input.files?.[0].type).to.eq('application/json')
        })
        .then(getFileContents)
        .then((contents) => {
          // Because json files are loaded as objects, they get reencoded before
          // being used, stripping spaces and newlines
          expect(contents[0]).to.eql('{"foo":1,"bar":{"baz":"cypress"}}')
        })
      })

      // Because this is such an important recipe for users, it gets a separate test
      // even though readFile already has unit tests around reading files as buffers.
      it('works with files read with null encoding', () => {
        cy.readFile('cypress/fixtures/valid.json', { encoding: null }).as('myFile')

        cy.get('#basic').selectFile('@myFile')
        .then((input) => {
          const $input = input[0] as HTMLInputElement

          expect($input.files?.[0].name).to.eq('valid.json')
          expect($input.files?.[0].type).to.eq('application/json')
        })
        .then(getFileContents)
        .then((contents) => {
          expect(contents[0]).to.eql(validJsonString)
        })
      })

      it('works with passed in paths', () => {
        cy.get('#multiple').selectFile(['cypress/fixtures/valid.json', 'cypress/fixtures/app.js'])
        .then(getFileContents)
        .then((contents) => {
          expect(contents[0]).to.eql(validJsonString)
          expect(contents[1]).to.eql('{ \'bar\' }\n')
        })

        cy.get('#multiple')
        .should('include.value', 'valid.json')
        .then((input) => {
          const $input = input[0] as HTMLInputElement

          expect($input.files?.[0].name).to.eq('valid.json')
          expect($input.files?.[1].name).to.eq('app.js')
          expect($input.files?.[0].type).to.eq('application/json')
          expect($input.files?.[1].type).to.eq('application/javascript')
        })
      })

      it('allows users to override the inferred filenames and mimetypes', () => {
        cy.fixture('valid.json').as('myFixture')

        cy.get('#multiple').selectFile([{
          contents: 'cypress/fixtures/valid.json',
          fileName: '1.png',
        },
        {
          contents: '@myFixture',
          fileName: '2.png',
          mimeType: 'text/plain',
        }])
        .then((input) => {
          const $input = input[0] as HTMLInputElement

          expect($input.files?.[0].name).to.eq('1.png')
          expect($input.files?.[1].name).to.eq('2.png')
          // The mimetype should be inferred from the user-supplied filename,
          // rather than the actual path
          expect($input.files?.[0].type).to.eq('image/png')
          // And ever if they supply a filename, explicit mimetype
          // should always take precedent.
          expect($input.files?.[1].type).to.eq('text/plain')
        })
      })
    })

    describe('mime types', () => {
      it('uses empty string for unknown extensions', () => {
        cy.get('#basic')
        .selectFile({ contents: '@foo', fileName: 'foo.barbaz' })
        .then((input) => {
          expect((input[0] as HTMLInputElement).files?.[0].type).to.eq('')
        })
      })

      it('works with several common extensions', () => {
        [
          ['png', 'image/png'],
          ['jpg', 'image/jpeg'],
          ['zip', 'application/zip'],
          ['yaml', 'text/yaml'],
          ['json', 'application/json'],
        ].forEach(([extension, mimeType]) => {
          cy.get('#basic')
          .selectFile({ contents: '@foo', fileName: `foo.${extension}` })
          .then((input) => {
            expect((input[0] as HTMLInputElement).files?.[0].type).to.eq(mimeType)
          })
        })
      })

      it('allows users to specify a mimetype', () => {
        cy.get('#basic')
        .selectFile({ contents: '@foo', fileName: 'foo.zip', mimeType: 'image/png' })
        .then((input) => {
          expect((input[0] as HTMLInputElement).files?.[0].type).to.eq('image/png')
        })
      })
    })

    describe('errors', {
      defaultCommandTimeout: 100,
    }, () => {
      it('is a child command', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('A child command must be chained after a parent because it operates on a previous subject.')
          done()
        })

        cy.selectFile({ contents: '@foo' })
      })

      it('throws when non dom subject', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.selectFile()` failed because it requires a DOM element.')
          done()
        })

        cy.noop({}).selectFile({ contents: '@foo' })
      })

      it('throws when non-input subject', function (done) {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.selectFile()` can only be called on an `<input type="file">` or a `<label for="fileInput">` pointing to or containing a file input, but received the element:')
          expect(err.docsUrl).to.eq('https://on.cypress.io/selectfile')
          done()
        })

        cy.get('body').selectFile({ contents: '@foo' }, { timeout: 0 })
      })

      it('throws when non-file input', function (done) {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.selectFile()` can only be called on an `<input type="file">` or a `<label for="fileInput">` pointing to or containing a file input, but received the element:')
          expect(err.docsUrl).to.eq('https://on.cypress.io/selectfile')
          done()
        })

        cy.get('#text-input').selectFile({ contents: '@foo' })
      })

      it('throws when label for non-file input', function (done) {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.selectFile()` can only be called on an `<input type="file">` or a `<label for="fileInput">` pointing to or containing a file input, but received the element:')
          expect(err.docsUrl).to.eq('https://on.cypress.io/selectfile')
          done()
        })

        cy.get('#text-label').selectFile({ contents: '@foo' })
      })

      it('throws when label without an attached input', function (done) {
        // Even though this label contains a file input, testing on real browsers confirms that clicking it
        // does *not* activate the contained input.
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.selectFile()` can only be called on an `<input type="file">` or a `<label for="fileInput">` pointing to or containing a file input, but received the element:')
          expect(err.docsUrl).to.eq('https://on.cypress.io/selectfile')
          done()
        })

        cy.get('#nonexistent-label').selectFile({ contents: '@foo' })
      })

      it('throws when subject is collection of elements', function (done) {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.selectFile()` can only be called on a single element. Your subject contained')
          expect(err.docsUrl).to.eq('https://on.cypress.io/selectfile')
          done()
        })

        cy.get('input[type="file"]').selectFile({ contents: '@foo' })
      })

      it('throws when no arguments given', function (done) {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.selectFile()` must be passed a Buffer or an object with a non-null `contents` property as its 1st argument. You passed: `undefined`.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/selectfile')
          done()
        })

        // @ts-expect-error - testing invalid argument
        cy.get('#basic').selectFile()
      })

      it('throws when file is null', function (done) {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.selectFile()` must be passed a Buffer or an object with a non-null `contents` property as its 1st argument. You passed: `null`.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/selectfile')
          done()
        })

        // @ts-expect-error - testing invalid argument
        cy.get('#basic').selectFile(null)
      })

      it('throws when single file.contents is null', function (done) {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.selectFile()` must be passed a Buffer or an object with a non-null `contents` property as its 1st argument. You passed: `{"contents":null}`.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/selectfile')
          done()
        })

        cy.get('#basic').selectFile({ contents: null })
      })

      it('throws when file is an unknown alias', function (done) {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.selectFile()` could not find a registered alias for: `@unknown`.')
          done()
        })

        cy.get('#basic').selectFile('@unknown')
      })

      it('throws when file is an alias for a DOM node', function (done) {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.selectFile()` can only attach strings, Buffers or objects, while your alias `@body` resolved to: `<body>...</body>`.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/selectfile')
          done()
        })

        cy.get('body').as('body')
        cy.get('#basic').selectFile('@body')
      })

      it('throws when file is an alias for null', function (done) {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.selectFile()` can only attach strings, Buffers or objects, while your alias `@null` resolved to: `null`.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/selectfile')
          done()
        })

        cy.wrap(null).as('null')
        cy.get('#basic').selectFile('@null')
      })

      it('throws with aliased intercepts', function (done) {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.selectFile()` can only attach strings, Buffers or objects, while your alias `@postUser` resolved to: `null`.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/selectfile')
          done()
        })

        cy.intercept('POST', '/users', {}).as('postUser')
        cy.get('#basic').selectFile('@postUser')
      })

      it('throws when any path does not exist', function (done) {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.selectFile("this/file/doesNotExist.json")` failed because the file does not exist at the following path:')
          expect(err.docsUrl).to.eq('https://on.cypress.io/selectfile')
          done()
        })

        cy.get('#basic').selectFile(['cypress/fixtures/valid.json', 'this/file/doesNotExist.json'])
      })

      it('throws when any file\'s contents is undefined', function (done) {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.selectFile()` must be passed an array of Buffers or objects with non-null `contents`. At files[1] you passed: `{}`.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/selectfile')
          done()
        })

        // @ts-expect-error - testing invalid argument
        cy.get('#basic').selectFile([{ contents: '@foo' }, {}])
      })

      it('throws on invalid action', function (done) {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.selectFile()` `action` can only be `select` or `drag-drop`. You passed: `foobar`.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/selectfile')
          done()
        })

        // @ts-expect-error - testing invalid argument
        cy.get('#basic').selectFile({ contents: '@foo' }, { action: 'foobar' })
      })
    })

    describe('.log', () => {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          this.lastLog = log
        })
      })

      it('can turn off logging when protocol is disabled', { protocolEnabled: false }, function () {
        cy.on('_log:added', (attrs, log) => {
          this.hiddenLog = log
        })

        cy.get('#basic')
        .selectFile({ contents: '@foo', fileName: 'foo.txt' }, { log: false })

        cy.then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog.get('name')).to.eq('get')
          expect(hiddenLog).to.be.undefined
        })
      })

      it('can send hidden log when protocol is enabled', { protocolEnabled: true }, function () {
        cy.on('_log:added', (attrs, log) => {
          this.hiddenLog = log
        })

        cy.get('#basic')
        .selectFile({ contents: '@foo', fileName: 'foo.txt' }, { log: false })

        cy.then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog.get('name')).to.eq('get')

          expect(hiddenLog.get('name'), 'log name').to.eq('selectFile')
          expect(hiddenLog.get('hidden'), 'log hidden').to.be.true
          expect(hiddenLog.get('snapshots').length, 'log snapshot length').to.eq(2)
        })
      })

      it('logs out selectFile', () => {
        cy.get('#basic')
        .selectFile({ contents: '@foo', fileName: 'foo.txt' }).then(function () {
          const { lastLog } = this

          expect(lastLog.get('name')).to.eq('selectFile')
        })
      })
    })

    it('retries until label is not disabled', () => {
      cy.on('command:retry', () => {
        // Replace the label with a copy of itself, to ensure selectFile is requerying the DOM
        const hidden = cy.$$('#hidden-basic-label')

        hidden.replaceWith(hidden[0].outerHTML)

        cy.$$('#hidden-basic-label').show()
      })

      cy.get('#hidden-basic-label').selectFile({ contents: '@foo' })
    })

    it('retries until input is not disabled', () => {
      cy.on('command:retry', () => {
        // Replace the input with a copy of itself, to ensure selectFile is requerying the DOM
        const disabled = cy.$$('#disabled')

        disabled.replaceWith(disabled[0].outerHTML)

        cy.$$('#disabled').prop('disabled', false)
      })

      cy.get('#disabled-label').selectFile({ contents: '@foo' })
    })

    /*
     * The tests around actionability are somewhat limited, since the functionality is thoroughly tested in the
     * `cy.trigger()` unit tests. We include a few tests directly on `cy.selectFile()` in order to ensure we're
     * using $actionability.verify() properly, but don't extensively exercise the logic within it here.
     *
     * See trigger_spec.js for the full actionability test suite.
     */
    describe('actionability', {
      defaultCommandTimeout: 50,
    }, () => {
      it('selects files with a hidden input from a visible label', () => {
        cy.get('#hidden-label').selectFile({ contents: '@foo' })

        cy.get('#hidden')
        .then(getFileContents)
        .then((contents) => {
          expect(contents[0]).to.eql('foo')
        })
      })

      it('does not work on hidden inputs by default', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.selectFile()` failed because this element is not visible')
          done()
        })

        cy.get('#hidden').selectFile({ contents: '@foo' })
      })

      it('can force on hidden inputs', () => {
        cy.get('#hidden').selectFile({ contents: '@foo' }, { force: true })
      })

      it('does not work on covered inputs by default', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include(`\`<input id="covered" type="file">\`

is being covered by another element:

\`<div id="covering"></div>\``)

          done()
        })

        cy.get('#covered').selectFile({ contents: '@foo' })
      })

      it('can force on covered inputs', () => {
        cy.get('#covered').selectFile({ contents: '@foo' }, { force: true })
      })

      it('does not work on disabled inputs by default', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.selectFile()` failed because this element is `disabled`')
          done()
        })

        cy.get('#disabled-label').selectFile({ contents: '@foo' })
      })

      it('can force on disabled inputs', () => {
        cy.get('#disabled-label').selectFile({ contents: '@foo' }, { force: true })
      })

      it('does not work on hidden labels by default', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.selectFile()` failed because this element is not visible')
          done()
        })

        cy.get('#hidden-basic-label').selectFile({ contents: '@foo' })
      })

      it('can force on hidden labels', () => {
        cy.get('#hidden-basic-label').selectFile({ contents: '@foo' }, { force: true })
      })

      // TODO(webkit): fix+unskip for experimental webkit
      it('can scroll to input', { browser: '!webkit' }, () => {
        const scrolled: any[] = []

        cy.on('scrolled', ($el, type) => {
          scrolled.push(type)
        })

        cy.get('#scroll').selectFile({ contents: '@foo' })
        .then(() => {
          expect(scrolled).not.to.be.empty
        })
      })

      it('can scroll to label', () => {
        const scrolled: any[] = []

        cy.on('scrolled', ($el, type) => {
          scrolled.push(type)
        })

        cy.get('#scroll-label').selectFile({ contents: '@foo' })
        .then(() => {
          expect(scrolled).not.to.be.empty
        })
      })

      it('does not scroll when forced', () => {
        const scrolled: any[] = []

        cy.on('scrolled', ($el, type) => {
          scrolled.push(type)
        })

        cy.get('#scroll-label').selectFile({ contents: '@foo' }, { force: true })
        .then(() => {
          expect(scrolled).to.be.empty
        })
      })

      // TODO(webkit): fix+unskip for experimental webkit
      it('can specify scrollBehavior in options', { browser: '!webkit' }, () => {
        cy.get('#scroll').then((el) => {
          cy.spy(el[0], 'scrollIntoView')
        })

        cy.get('#scroll').selectFile({ contents: '@foo' }, { scrollBehavior: 'bottom' })

        cy.get('#scroll').then((el) => {
          expect(el[0].scrollIntoView).to.be.calledWith({ block: 'end' })
        })
      })
    })

    describe('drag-drop', () => {
      it('attaches a file to an input when targeted', () => {
        cy.get('#basic').selectFile({ contents: '@foo' }, { action: 'drag-drop' })

        cy.get('#basic')
        .then(getFileContents)
        .then((contents) => {
          expect(contents[0]).to.eql('foo')
        })
      })

      it('invokes change and input events on an input when dropped over', (done) => {
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

        cy.get('#basic').selectFile({ contents: '@foo' }, { action: 'drag-drop' })
      })

      it('does not follow labels to their inputs', () => {
        cy.get('#basic-label').selectFile({ contents: '@foo' }, { action: 'drag-drop' })

        cy.get('#basic').then((input) => {
          expect((input[0] as HTMLInputElement).files?.length).to.eql(0)
        })
      })

      it('does not select multiple files with a single-file input', () => {
        cy.get('#basic').selectFile(['@foo', '@foo'], { action: 'drag-drop' })
        cy.get('#basic').then((input) => {
          expect((input[0] as HTMLInputElement).files?.length).to.eql(0)
        })
      })

      it('drops files onto any element and triggers events', (done) => {
        const $body = cy.$$('body')
        let events: any[] = []

        $body.on('input', (e) => {
          throw new Error('should not trigger input')
        })

        $body.on('change', (e) => {
          throw new Error('should not trigger change')
        })

        $body.on('drag', (e) => events.push(e))
        $body.on('dragenter', (e) => events.push(e))
        $body.on('dragover', (e) => events.push(e))
        $body.on('drop', (e) => {
          events.push(e)
          expect(_.map(events, 'originalEvent.type')).to.deep.eq(['drag', 'dragenter', 'dragover', 'drop'])
          expect(_.every(events, ['originalEvent.bubbles', true])).to.be.true
          expect(_.every(events, ['originalEvent.cancelable', true])).to.be.true
          expect(_.every(events, ['originalEvent.composed', true])).to.be.true
          expect(_.every(events, ['originalEvent.target', $body[0]])).to.be.true

          done()
        })

        cy.get('body').selectFile('@foo', { action: 'drag-drop' })
      })

      it('includes an entry in `dataTransfer.types`', (done) => {
        cy.$$('#multiple').on('drop', (e) => {
          expect(e.originalEvent?.dataTransfer?.types).to.contain('Files')
          done()
        })

        cy.get('#multiple').selectFile({ contents: '@foo' }, { action: 'drag-drop' })
      })
    })
  })
})
