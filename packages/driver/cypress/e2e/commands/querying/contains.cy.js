const { assertLogLength } = require('../../../support/utils')

const { _, $ } = Cypress

describe('src/cy/commands/contains', () => {
  beforeEach(() => {
    cy.visit('/fixtures/dom.html')
  })

  it('is scoped to the body and will not return title elements', () => {
    cy.contains('DOM Fixture').then(($el) => {
      expect($el).not.to.match('title')
    })
  })

  it('will not find script elements', () => {
    cy.$$('<script>// some-script-content </script>').appendTo(cy.$$('body'))

    cy.contains('some-script-content').should('not.exist')
  })

  it('will not find style elements', () => {
    cy.$$('<style> some-style-content {} </style>').appendTo(cy.$$('body'))

    cy.contains('some-style-content').should('not.exist')
  })

  it('finds the nearest element by :contains selector', () => {
    cy.contains('li 0').then(($el) => {
      expect($el.length).to.eq(1)

      expect($el).to.match('li')
    })
  })

  it('resets the subject between chain invocations', () => {
    const span = cy.$$('.k-in:contains(Quality Control):last')
    const label = cy.$$('#complex-contains label')

    cy.get('#complex-contains').contains('nested contains').then(($label) => {
      expect($label.get(0)).to.eq(label.get(0))

      return $label
    })

    cy.contains('Quality Control').then(($span) => {
      expect($span.get(0)).to.eq(span.get(0))
    })
  })

  it('GET is scoped to the current subject', () => {
    const span = cy.$$('#click-me a span')

    cy.get('#click-me a').contains('click').then(($span) => {
      expect($span.length).to.eq(1)

      expect($span.get(0)).to.eq(span.get(0))
    })
  })

  it('can find input type=submits by value', () => {
    cy.contains('input contains submit').then(($el) => {
      expect($el.length).to.eq(1)

      expect($el).to.match('input[type=submit]')
    })
  })

  it('has an optional filter argument', () => {
    cy.contains('ul', 'li 0').then(($el) => {
      expect($el.length).to.eq(1)

      expect($el).to.match('ul')
    })
  })

  it('disregards priority elements when provided a filter', () => {
    const form = cy.$$('#click-me')

    cy.contains('form', 'click me').then(($form) => {
      expect($form.get(0)).to.eq(form.get(0))
    })
  })

  it('searches all els in comma separated filter', () => {
    cy.contains('a,button', 'Naruto').then(($el) => {
      expect($el.length).to.eq(1)

      expect($el).to.match('a')
    })

    cy.contains('a,button', 'Boruto').then(($el) => {
      expect($el.length).to.eq(1)

      expect($el).to.match('button')
    })
  })

  it('searches all els in comma separated filter with spaces', () => {
    const aText = 'Naruto'
    const bText = 'Boruto'

    cy.contains('a, button', aText).then(($el) => {
      expect($el.length).to.eq(1)
      expect($el).to.match('a')

      expect($el.text()).to.eq(aText)
    })

    cy.contains('a, button', bText).then(($el) => {
      expect($el.length).to.eq(1)
      expect($el).to.match('button')

      expect($el.text()).to.eq(bText)
    })
  })

  it('favors input type=submit', () => {
    const input = cy.$$('#input-type-submit input')

    cy.contains('click me').then(($input) => {
      expect($input.get(0)).to.eq(input.get(0))
    })
  })

  it('favors buttons next', () => {
    const button = cy.$$('#button-inside-a button')

    cy.contains('click button').then(($btn) => {
      expect($btn.get(0)).to.eq(button.get(0))
    })
  })

  it('favors anchors next', () => {
    cy.contains('Home Page').then(($el) => {
      expect($el.length).to.eq(1)

      expect($el).to.match('a')
    })
  })

  it('reduces right by priority element', () => {
    const label = cy.$$('#complex-contains label')

    // it should find label because label is the first priority element
    // out of the collection of contains elements
    cy.get('#complex-contains').contains('nested contains').then(($label) => {
      expect($label.get(0)).to.eq(label.get(0))
    })
  })

  it('retries until content is found', () => {
    const span = $('<span>brand new content</span>')

    // only append the span after we retry
    // three times
    const retry = _.after(3, () => {
      cy.$$('body').append(span)
    })

    cy.on('command:retry', retry)

    cy.contains('brand new content').then(($span) => {
      expect($span.get(0)).to.eq(span.get(0))
    })
  })

  it('finds the furthest descendent when filter matches more than 1 element', () => {
    cy
    .get('#contains-multiple-filter-match').contains('li', 'Maintenance').then(($row) => {
      expect($row).to.have.class('active')
    })
  })

  it('returns the parent node which contains content spanned across a child element and text node', () => {
    const item = cy.$$('#upper .item')

    cy.contains('New York').then(($item) => {
      expect($item).to.be.ok

      expect($item.get(0)).to.eq(item.get(0))
    })
  })

  it('finds text by regexp and restores contains', () => {
    const { contains } = Cypress.$Cypress.$.expr[':']

    cy.contains(/^asdf \d+/).then(($li) => {
      expect($li).to.have.text('asdf 1')

      expect(Cypress.$Cypress.$.expr[':'].contains).to.eq(contains)
    })
  })

  it('finds text by regexp when second parameter is a regexp and restores contains', () => {
    const { contains } = Cypress.$Cypress.$.expr[':']

    cy.contains('#asdf>li:first', /asdf 1/).then(($li) => {
      expect($li).to.have.text('asdf 1')

      expect(Cypress.$Cypress.$.expr[':'].contains).to.eq(contains)
    })
  })

  it('returns elements found first when multiple siblings found', () => {
    cy.contains('li', 'asdf').then(($li) => {
      expect($li).to.have.text('asdf 1')
    })
  })

  it('returns first ul when multiple uls', () => {
    cy.contains('ul', 'jkl').then(($ul) => {
      expect($ul.find('li:first')).to.have.text('jkl 1')
    })
  })

  it('cancels existing promises', (done) => {
    let retrys = 0

    cy.stub(Cypress.runner, 'stop')

    const abort = _.after(2, () => {
      cy.spy(cy, 'now')

      Cypress.stop()
    })

    cy.on('stop', () => {
      _.delay(() => {
        expect(cy.now).not.to.be.called
        expect(retrys).to.eq(2)

        done()
      }
      , 50)
    })

    cy.on('command:retry', () => {
      retrys += 1

      abort()
    })

    cy.contains('DOES NOT CONTAIN THIS!')
  })

  // https://github.com/cypress-io/cypress/issues/8626
  it(`works correctly with ' character inside Regexp.`, () => {
    $(`<button>'</button>`).appendTo($('body'))
    cy.contains(/\'/)
  })

  // https://github.com/cypress-io/cypress/issues/19116
  it('handles backslashes', () => {
    $('<div id="backslashes">"&lt;OE_D]dQ\\</div>').appendTo(cy.$$('body'))
    cy.get('#backslashes').contains('"<OE_D]dQ\\')
  })

  // https://github.com/cypress-io/cypress/issues/21108
  it('shows correct error message when regex starts with =(equals sign)', () => {
    cy.on('fail', (err) => {
      expect(err.message).to.include('Expected to find content')
    })

    cy.visit('fixtures/dom.html')
    cy.contains(/=[0-6]/, { timeout: 100 }).should('have.text', 'a=2')
  })

  describe('should(\'not.exist\')', () => {
    it('returns null when no content exists', () => {
      cy.contains('alksjdflkasjdflkajsdf').should('not.exist').then(($el) => {
        expect($el).to.be.null
      })
    })
  })

  describe('should(\'be.visible\')', () => {
    it('returns invisible element', () => {
      const span = cy.$$('#not-hidden').hide()

      cy.contains('span', 'my hidden content').should('not.be.visible').then(($span) => {
        expect($span.get(0)).to.eq(span.get(0))
      })
    })

    it('returns invisible element when parent chain is visible', () => {
      cy.get('#form-header-region').contains('Back').should('not.be.visible')
    })
  })

  describe('handles whitespace', () => {
    it('finds el with new lines', () => {
      const btn = $(`\
<button id="whitespace1">
White
space
</button>\
`).appendTo(cy.$$('body'))

      cy.get('#whitespace1').contains('White space')
      cy.contains('White space').then(($btn) => {
        expect($btn.get(0)).to.eq(btn.get(0))
      })
    })

    it('finds el with new lines + spaces', () => {
      const btn = $(`\
<button id="whitespace2">
White
space
</button>\
`).appendTo(cy.$$('body'))

      cy.get('#whitespace2').contains('White space')
      cy.contains('White space').then(($btn) => {
        expect($btn.get(0)).to.eq(btn.get(0))
      })
    })

    it('finds el with multiple spaces', () => {
      const btn = $(`\
<button id="whitespace3">
White   space
</button>\
`).appendTo(cy.$$('body'))

      cy.get('#whitespace3').contains('White space')
      cy.contains('White space').then(($btn) => {
        expect($btn.get(0)).to.eq(btn.get(0))
      })
    })

    it('finds el with regex', () => {
      const btn = $(`\
<button id="whitespace4">
White   space
</button>\
`).appendTo(cy.$$('body'))

      cy.get('#whitespace4').contains('White space')
      cy.contains(/White space/).then(($btn) => {
        expect($btn.get(0)).to.eq(btn.get(0))
      })
    })

    it('does not normalize text in pre tag', () => {
      $(`\
<pre id="whitespace5">
White
space
</pre>\
`).appendTo(cy.$$('body'))

      cy.contains('White space').should('not.match', 'pre')
      cy.get('#whitespace5').contains('White\nspace')
    })

    it('finds el with leading/trailing spaces', () => {
      const btn = $(`<button id="whitespace6">        White   space             </button>`).appendTo(cy.$$('body'))

      cy.get('#whitespace6').contains('White space')
      cy.contains('White space').then(($btn) => {
        expect($btn.get(0)).to.eq(btn.get(0))
      })
    })
  })

  describe('case sensitivity', () => {
    beforeEach(() => {
      $('<button id="test-button">Test</button>').appendTo(cy.$$('body'))
    })

    it('is case sensitive when matchCase is undefined', () => {
      cy.get('#test-button').contains('Test')
    })

    it('is case sensitive when matchCase is true', () => {
      cy.get('#test-button').contains('Test', {
        matchCase: true,
      })
    })

    it('is case insensitive when matchCase is false', () => {
      cy.get('#test-button').contains('test', {
        matchCase: false,
      })

      cy.get('#test-button').contains(/Test/, {
        matchCase: false,
      })
    })

    it('does not crash when matchCase: false is used with regex flag, i', () => {
      cy.get('#test-button').contains(/Test/i, {
        matchCase: false,
      })
    })

    it('throws when content has "i" flag while matchCase: true', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.eq('You passed a regular expression with the case-insensitive (_i_) flag and `{ matchCase: true }` to `cy.contains()`. Those options conflict with each other, so please choose one or the other.')

        done()
      })

      cy.get('#test-button').contains(/Test/i, {
        matchCase: true,
      })
    })

    it('passes when "i" flag is used with undefined option', () => {
      cy.get('#test-button').contains(/Test/i)
    })
  })

  // https://github.com/cypress-io/cypress/issues/14861
  describe('ignores style and script tag in body', () => {
    it('style', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('Expected to find content: ')

        done()
      })

      cy.visit('fixtures/content-in-body.html')
      cy.contains('font-size', { timeout: 500 })
    })

    it('script', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('Expected to find content: ')

        done()
      })

      cy.visit('fixtures/content-in-body.html')
      cy.contains('I am in the script tag in body', { timeout: 500 })
    })

    // https://github.com/cypress-io/cypress/issues/19377
    describe('cy.contains() does not remove <style> and <script> tags', () => {
      it('cy.contains() does not remove style tags from the DOM', () => {
        cy.visit('fixtures/content-in-body.html')

        cy.get('button#my_button_1').should('be.visible')
        cy.contains('Hello').should('be.visible')
        cy.get('button#my_button_1').should('be.visible')
      })

      it('cy.contains() does not remove script tags from the DOM', () => {
        cy.visit('fixtures/content-in-body.html')

        cy.window().then((win) => {
          const scriptElement = win.document.getElementById('my_script')

          expect(scriptElement?.id).to.equal('my_script')
        })

        cy.get('button#my_button_2').click()
        cy.contains('This is the result').should('be.visible')
        cy.window().then((win) => {
          const scriptElement = win.document.getElementById('my_script')

          expect(scriptElement?.id).to.equal('my_script')
        })
      })
    })
  })

  describe('subject contains text nodes', () => {
    it('searches for content within subject', () => {
      const badge = cy.$$('#edge-case-contains .badge:contains(5)')

      cy.get('#edge-case-contains').find('.badge').contains(5).then(($badge) => {
        expect($badge.get(0)).to.eq(badge.get(0))
      })
    })

    it('returns the first element when subject contains multiple elements', () => {
      const badge = cy.$$('#edge-case-contains .badge-multi:contains(1)')

      cy.get('#edge-case-contains').find('.badge-multi').contains(1).then(($badge) => {
        expect($badge.length).to.eq(1)

        expect($badge.get(0)).to.eq(badge.get(0))
      })
    })

    it('returns the subject when it has a text node of matching content', () => {
      const count = cy.$$('#edge-case-contains .count:contains(2)')

      cy.get('#edge-case-contains').find('.count').contains(2).then(($count) => {
        expect($count.length).to.eq(1)

        expect($count.get(0)).to.eq(count.get(0))
      })
    })

    it('retries until it finds the subject has the matching text node', () => {
      const count = $('<span class=\'count\'>100</span>')
      let retried3Times = false

      // make sure it retries 3 times.
      const retry = _.after(3, () => {
        retried3Times = true

        cy.$$('#edge-case-contains').append(count)
      })

      cy.on('command:retry', retry)

      cy.get('#edge-case-contains').contains(100).then(($count) => {
        expect(retried3Times).to.be.true
        expect($count.length).to.eq(1)

        expect($count.get(0)).to.eq(count.get(0))
      })
    })

    it('retries until it finds a filtered contains has the matching text node', () => {
      const count = $('<span class=\'count\'>100</span>')
      let retried3Times = false

      const retry = _.after(3, () => {
        retried3Times = true

        cy.$$('#edge-case-contains').append(count)
      })

      cy.on('command:retry', retry)

      cy.get('#edge-case-contains').contains('.count', 100).then(($count) => {
        expect(retried3Times).to.be.true
        expect($count.length).to.eq(1)

        expect($count.get(0)).to.eq(count.get(0))
      })
    })

    it('returns the first matched element when multiple match and there is no filter', () => {
      const icon = cy.$$('#edge-case-contains i:contains(25)')

      cy.get('#edge-case-contains').contains(25).then(($icon) => {
        expect($icon.length).to.eq(1)

        expect($icon.get(0)).to.eq(icon.get(0))
      })
    })
  })

  describe('special characters', () => {
    _.each('\' " [ ] { } . @ # $ % ^ & * ( ) , ; :'.split(' '), (char) => {
      it(`finds content by string with character: ${char}`, () => {
        const span = $(`<span>special char ${char} content</span>`).appendTo(cy.$$('body'))

        cy.contains('span', char).then(($span) => {
          expect($span.get(0)).to.eq(span.get(0))
        })
      })

      it(`finds content by regex with character: ${char}`, () => {
        const span = $(`<span>special char ${char} content</span>`).appendTo(cy.$$('body'))

        cy.contains('span', new RegExp(_.escapeRegExp(char))).then(($span) => {
          expect($span.get(0)).to.eq(span.get(0))
        })
      })
    })
  })

  describe('.log', () => {
    beforeEach(function () {
      this.logs = []

      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'contains') {
          this.lastLog = log
        }

        this.logs.push(log)
      })

      return null
    })

    it('logs immediately before resolving', (done) => {
      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'contains') {
          expect(log.pick('state', 'type')).to.deep.eq({
            state: 'pending',
            type: 'child',
          })

          done()
        }
      })

      cy.get('body').contains('foo')
    })

    it('snapshots and ends after finding element', () => {
      cy.contains('foo').then(function () {
        expect(this.lastLog.get('ended')).to.be.true
        expect(this.lastLog.get('state')).to.eq('passed')
        expect(this.lastLog.get('snapshots').length).to.eq(1)

        expect(this.lastLog.get('snapshots')[0]).to.be.an('object')
      })
    })

    // GOOD: [ {name: get} , {name: contains} ]
    // BAD:  [ {name: get} , {name: get} , {name: contains} ]
    it('silences internal cy.get() log', () => {
      cy.get('#complex-contains').contains('nested contains').then(function ($label) {
        const names = _.map(this.logs, (log) => log.get('name'))

        assertLogLength(this.logs, 2)

        expect(names).to.deep.eq(['get', 'contains'])
      })
    })

    it('passes in $el', () => {
      cy.get('#complex-contains').contains('nested contains').then(function ($label) {
        expect(this.lastLog.get('$el').get(0)).to.eq($label.get(0))
      })
    })

    it('sets type to parent when subject isnt element', () => {
      cy.window().contains('foo').then(function () {
        expect(this.lastLog.get('type')).to.eq('parent')

        cy.document().contains('foo').then(function () {
          expect(this.lastLog.get('type')).to.eq('parent')
        })
      })
    })

    it('sets type to child when used as a child command', () => {
      cy.get('body').contains('foo').then(function () {
        expect(this.lastLog.get('type')).to.eq('child')
      })
    })

    it('logs when not exists', () => {
      cy.contains('does-not-exist').should('not.exist').then(function () {
        expect(this.lastLog.get('message')).to.eq('does-not-exist')

        expect(this.lastLog.get('$el').length).to.eq(0)
      })
    })

    it('logs when should be visible with filter', () => {
      cy.contains('div', 'Nested Find').should('be.visible').then(function ($div) {
        expect(this.lastLog.get('message')).to.eq('div, Nested Find')

        expect(this.lastLog.get('$el').get(0)).to.eq($div.get(0))
      })
    })

    // https://github.com/cypress-io/cypress/issues/1119
    it('logs "0" on cy.contains(0)', function () {
      cy.state('document').write('<span>0</span>')

      cy.contains(0).then(() => {
        expect(this.lastLog.get('message')).to.eq('0')
      })
    })

    it('#consoleProps', () => {
      const $complex = cy.$$('#complex-contains')

      cy.get('#complex-contains').contains('nested contains').then(function ($label) {
        const consoleProps = this.lastLog.invoke('consoleProps')

        expect(consoleProps).to.deep.eq({
          Command: 'contains',
          Content: 'nested contains',
          'Applied To': $complex.get(0),
          Yielded: $label.get(0),
          Elements: 1,
        })
      })
    })
  })

  describe('errors', {
    defaultCommandTimeout: 100,
  }, () => {
    beforeEach(function () {
      this.logs = []

      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'contains') {
          this.lastLog = log

          this.logs.push(log)
        }
      })

      return null
    })

    _.each([undefined, null], (val) => {
      it(`throws when text is ${val}`, (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq('`cy.contains()` can only accept a string, number or regular expression.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/contains')

          done()
        })

        cy.contains(val)
      })
    })

    it('throws on a blank string', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.eq('`cy.contains()` cannot be passed an empty string.')
        expect(err.docsUrl).to.eq('https://on.cypress.io/contains')

        done()
      })

      cy.contains('')
    })

    it('logs once on error', function (done) {
      cy.on('fail', (err) => {
        assertLogLength(this.logs, 1)

        done()
      })

      cy.contains(undefined)
    })

    it('throws when passed a subject not an element', (done) => {
      cy.on('fail', () => {
        done()
      })

      cy.wrap('foo').contains('bar')
    })

    it('throws when there is no filter and no subject', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('Expected to find content: \'brand new content\' but never did.')

        done()
      })

      cy.contains('brand new content')
    })

    it('throws when there is a filter', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('Expected to find content: \'brand new content\' within the selector: \'span\' but never did.')

        done()
      })

      cy.contains('span', 'brand new content')
    })

    it('throws when there is no filter but there is a subject', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('Expected to find content: \'0\' within the element: <div.badge> but never did.')

        done()
      })

      cy.get('#edge-case-contains').find('.badge').contains(0)
    })

    it('throws when there is both a subject and a filter', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('Expected to find content: \'foo\' within the element: <div#edge-case-contains> and with the selector: \'ul\' but never did.')

        done()
      })

      cy.get('#edge-case-contains').contains('ul', 'foo')
    })

    it('throws after timing out while not trying to find an element that contains content', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('Expected not to find content: \'button\' but continuously found it.')

        done()
      })

      cy.contains('button').should('not.exist')
    })

    it('logs out $el when existing $el is found even on failure', function (done) {
      const button = cy.$$('#button')

      cy.on('fail', (err) => {
        expect(this.lastLog.get('state')).to.eq('failed')
        expect(this.lastLog.get('error')).to.eq(err)
        expect(this.lastLog.get('$el').get(0)).to.eq(button.get(0))
        const consoleProps = this.lastLog.invoke('consoleProps')

        expect(consoleProps.Yielded).to.eq(button.get(0))
        expect(consoleProps.Elements).to.eq(button.length)

        done()
      })

      cy.contains('button').should('not.exist')
    })

    it('throws when assertion is have.length > 1', function (done) {
      cy.on('fail', (err) => {
        assertLogLength(this.logs, 1)
        expect(err.message).to.eq('`cy.contains()` cannot be passed a `length` option because it will only ever return 1 element.')
        expect(err.docsUrl).to.eq('https://on.cypress.io/contains')

        done()
      })

      cy.contains('Nested Find').should('have.length', 2)
    })

    it('restores contains even when cy.get fails', (done) => {
      const { contains } = Cypress.$Cypress.$.expr[':']

      const cyNow = cy.now

      cy.on('fail', (err) => {
        expect(err.message).to.include('Syntax error, unrecognized expression')
        expect(Cypress.$Cypress.$.expr[':'].contains).to.eq(contains)

        done()
      })

      cy.stub(cy, 'now').callsFake(() => cyNow('get', 'aBad:jQuery^Selector', {}))

      cy.contains(/^asdf \d+/)
    })

    it('restores contains on abort', (done) => {
      cy.timeout(1000)

      const { contains } = Cypress.$Cypress.$.expr[':']

      cy.stub(Cypress.runner, 'stop')

      cy.on('stop', () => {
        _.delay(() => {
          expect(Cypress.$Cypress.$.expr[':'].contains).to.eq(contains)

          done()
        }
        , 50)
      })

      cy.on('command:retry', _.after(2, () => {
        Cypress.stop()
      }))

      cy.contains(/^does not contain asdfasdf at all$/)
    })
  })
})
