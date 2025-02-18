import { assertLogLength } from '../../../support/utils'

const { _, $ } = Cypress

describe('src/cy/commands/actions/select', () => {
  beforeEach(() => {
    cy.visit('/fixtures/dom.html')
  })

  context('#select', () => {
    it('does not change the subject', () => {
      const select = cy.$$('select[name=maps]')

      cy.get('select[name=maps]').select('train').then(($select) => {
        expect($select.get(0)).to.eq(select.get(0))
      })
    })

    it('selects by value', () => {
      cy.get('select[name=maps]').select('de_train').then(($select) => {
        expect($select).to.have.value('de_train')
      })
    })

    it('selects by text', () => {
      cy.get('select[name=maps]').select('train').then(($select) => {
        expect($select).to.have.value('de_train')
      })
    })

    it('selects by index', () => {
      cy.get('select[name=maps]').select(2).then(($select) => {
        expect($select).to.have.value('de_nuke')
      })
    })

    it('selects by trimmed text with newlines stripped', () => {
      cy.get('select[name=maps]').select('italy').then(($select) => {
        expect($select).to.have.value('cs_italy')
      })
    })

    it('prioritizes value over text', () => {
      cy.get('select[name=foods]').select('Ramen').then(($select) => {
        expect($select).to.have.value('Ramen')
      })
    })

    it('can handle valid index 0', () => {
      cy.get('select[name=maps]').select(0).then(($select) => {
        expect($select).to.have.value('de_dust2')
      })
    })

    it('can select by value when value contains a quotation mark', () => {
      cy.$$('select[name=maps] option:nth-child(3)').attr('value', '"test"')

      cy.get('select[name=maps]').select('"test"').then(($select) => {
        expect(($select[0] as HTMLSelectElement).selectedOptions[0].text).to.eq('nuke')
      })
    })

    it('can select by index when value contains a quotation mark', () => {
      cy.$$('select[name=maps] option:nth-child(3)').attr('value', '"test"')

      cy.get('select[name=maps]').select(2).then(($select) => {
        expect(($select[0] as HTMLSelectElement).selectedOptions[0].text).to.eq('nuke')
      })
    })

    it('can handle index when all values are identical', () => {
      cy.$$('select[name=maps] option').attr('value', 'foo')

      cy.get('select[name=maps]').select(2).then(($select) => {
        expect(($select[0] as HTMLSelectElement).selectedOptions[0].text).to.eq('nuke')
      })
    })

    it('can select an array of values', () => {
      cy.get('select[name=movies]').select(['apoc', 'br', 'co']).then(($select) => {
        expect($select.val()).to.deep.eq(['apoc', 'br', 'co'])
      })
    })

    it('can handle options nested in optgroups', () => {
      cy.get('select[name=starwars]').select('Jar Jar').then(($select) => {
        expect($select).to.have.value('jarjar')
      })
    })

    it('can handle options with same value selected by text', () => {
      cy.get('select[name=startrek-same]').select('Uhura').then(($select) => {
        expect($select.val()).to.equal('same')
        expect($select.find('option:selected')).to.have.text('Uhura')
        expect(($select[0] as HTMLSelectElement).selectedIndex).to.equal(2)
      })
    })

    it('can handle options with some same values selected by text', () => {
      cy.get('select[name=startrek-some-same]').select('Uhura').then(($select) => {
        expect($select.val()).to.equal('same')
        expect($select.find('option:selected')).to.have.text('Uhura')
        expect(($select[0] as HTMLSelectElement).selectedIndex).to.equal(2)
      })
    })

    it('can select an array of texts', () => {
      cy.get('select[name=movies]').select(['The Human Condition', 'There Will Be Blood']).then(($select) => {
        expect($select.val()).to.deep.eq(['thc', 'twbb'])
      })
    })

    it('can select an array of indexes', () => {
      cy.get('select[name=movies]').select([1, 5]).then(($select) => {
        expect($select.val()).to.deep.eq(['thc', 'twbb'])
      })
    })

    it('can select an array of same value and index', () => {
      cy.get('select[name=movies]').select(['thc', 1]).then(($select) => {
        expect($select.val()).to.deep.eq(['thc'])
      })
    })

    it('unselects all options if called with empty array', () => {
      cy.get('select[name=movies]').select(['apoc', 'br'])

      cy.get('select[name=movies]').select([]).then(($select) => {
        expect($select.val()).to.deep.eq([])
      })
    })

    // readonly should only be limited to inputs, not checkboxes
    it('can select a readonly select', () => {
      cy.get('select[name=hunter]').select('gon').then(($select) => {
        expect($select.val()).to.eq('gon-val')
      })
    })

    it('clears previous values when providing an array', () => {
      // make sure we have a previous value
      const select = cy.$$('select[name=movies]').val(['2001'])

      expect(select.val()).to.deep.eq(['2001'])

      cy.get('select[name=movies]').select(['apoc', 'br']).then(($select) => {
        expect($select.val()).to.deep.eq(['apoc', 'br'])
      })
    })

    it('lists the select as the focused element', () => {
      const select = cy.$$('#select-maps')

      cy.get('#select-maps').select('de_train').focused().then(($focused) => {
        expect($focused.get(0)).to.eq(select.get(0))
      })
    })

    it('causes previous input to receive blur', (done) => {
      cy.$$('input:text:first').blur(() => {
        done()
      })

      cy.get('input:text:first').type('foo')
      cy.get('#select-maps').select('de_train')
    })

    it('can forcibly click even when being covered by another element', () => {
      let clicked = false
      const select = $('<select><option>foo</option></select>').attr('id', 'select-covered-in-span').prependTo(cy.$$('body'))

      $('<span>span on select</span>')
      .css('position', 'absolute')
      .css('left', `${select.offset()?.left}`)
      .css('top', `${select.offset()?.top}`)
      .css('padding', '5px')
      .css('display', 'inline-block')
      .css('backgroundColor', 'yellow')
      .prependTo(cy.$$('body'))

      select.on('click', () => {
        clicked = true
      })

      cy.get('#select-covered-in-span').select('foo', { force: true }).then(() => {
        expect(clicked).to.be.true
      })
    })

    it('passes timeout and interval down to click', (done) => {
      const select = $('<select />').attr('id', 'select-covered-in-span').prependTo(cy.$$('body'))

      $('<span>span on select</span>')
      .css('position', 'absolute')
      .css('left', `${select.offset()?.left}`)
      .css('top', `${select.offset()?.top}`)
      .css('padding', '5px')
      .css('display', 'inline-block')
      .css('backgroundColor', 'yellow')
      .prependTo(cy.$$('body'))

      cy.on('command:retry', (options) => {
        expect(options.timeout).to.eq(1000)
        expect(options.interval).to.eq(60)

        done()
      })

      cy.get('#select-covered-in-span').select('foobar', { timeout: 1000, interval: 60 })
    })

    it('can forcibly click even when element is invisible', () => {
      let clicked = false

      const select = cy.$$('#select-maps').hide()

      select.click(() => {
        clicked = true
      })

      cy.get('#select-maps').select('de_dust2', { force: true }).then(() => {
        expect(clicked).to.be.true
      })
    })

    it('can forcibly click when select is disabled', () => {
      cy.get('select[name=disabled]')
      // default select value
      .invoke('val').should('eq', 'foo')

      cy.get('select[name=disabled]')
      .select('bar', { force: true })
      .invoke('val').should('eq', 'bar')
    })

    it('retries until <option> can be selected', () => {
      const option = cy.$$('<option>foo</option>')

      cy.on('command:retry', _.once(() => {
        cy.$$('#select-maps').append(option)
      }))

      cy.get('#select-maps').select('foo')
    })

    it('retries until <select> is no longer disabled', () => {
      const select = cy.$$('select[name=disabled]')

      cy.on('command:retry', _.once(() => {
        // Replace the element with a copy of itself, to ensure .select() is requerying the DOM
        select.replaceWith(select[0].outerHTML)
        cy.$$('select[name=disabled]').prop('disabled', false)
      }))

      cy.get('select[name=disabled]').select('foo')
      cy.get('select[name=disabled]').invoke('val').should('eq', 'foo')
    })

    it('retries until <optgroup> is no longer disabled', () => {
      const select = cy.$$('select[name=optgroup-disabled]')

      cy.on('command:retry', _.once(() => {
        select.find('optgroup').prop('disabled', false)
      }))

      cy.get('select[name=optgroup-disabled]').select('bar')
      .invoke('val').should('eq', 'bar')
    })

    it('retries until <options> are no longer disabled', () => {
      const select = cy.$$('select[name=opt-disabled]')

      cy.on('command:retry', _.once(() => {
        select.find('option').prop('disabled', false)
      }))

      cy.get('select[name=opt-disabled]').select('bar')
      .invoke('val').should('eq', 'bar')
    })

    it('selects items with the value which has &nbsp;', () => {
      cy.get('select[name=movies]').select('gone&nbsp;with&nbsp;the&nbsp;wind')
    })

    describe('assertion verification', () => {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'assert') {
            this.lastLog = log
          }

          return null
        })

        return null
      })

      it('eventually passes the assertion', () => {
        cy.$$('#select-maps').change(function () {
          _.delay(() => {
            $(this).addClass('selected')
          }, 100)
        })

        cy.get('#select-maps').select('de_nuke').should('have.class', 'selected').then(function () {
          const { lastLog } = this

          expect(lastLog.get('name')).to.eq('assert')
          expect(lastLog.get('state')).to.eq('passed')
          expect(lastLog.get('ended')).to.be.true
        })
      })
    })

    describe('events', () => {
      it('emits click event', (done) => {
        cy.$$('select[name=maps]').click(() => {
          done()
        })

        cy.get('select[name=maps]').select('train')
      })

      it('emits change event', (done) => {
        cy.$$('select[name=maps]').change(() => {
          done()
        })

        cy.get('select[name=maps]').select('train')
      })

      it('emits focus event', (done) => {
        cy.$$('select[name=maps]').one('focus', () => {
          done()
        })

        cy.get('select[name=maps]').select('train')
      })

      it('emits input event', (done) => {
        cy.$$('select[name=maps]').one('input', () => {
          done()
        })

        cy.get('select[name=maps]').select('train')
      })

      it('emits all events in the correct order', () => {
        const fired: any[] = []
        const events = ['mousedown', 'focus', 'mouseup', 'click', 'input', 'change']

        _.each(events, (event) => {
          cy.$$('select[name=maps]').one(event, () => {
            fired.push(event)
          })
        })

        cy.get('select[name=maps]').select('train').then(() => {
          expect(fired).to.deep.eq(events)
        })
      })

      // https://github.com/cypress-io/cypress/issues/19494
      it('does not fire `change`, `input` events when selecting the same option again', () => {
        cy.visit('fixtures/select-event-counter.html')

        // Nothing happens when selecting the option with `selected` attribute
        cy.get('.ice-cream').select('Chocolate')
        cy.get('#change-result').should('not.have.text', 'Number of times onChange event fired: 1')
        cy.get('#input-result').should('not.have.text', 'Number of times input event fired: 1')

        cy.get('.ice-cream').select('Sardine')
        cy.get('#change-result').should('have.text', 'Number of times onChange event fired: 1')
        cy.get('#input-result').should('have.text', 'Number of times input event fired: 1')

        // Select the option that is already selected - `change`, `input` events should not fire.
        cy.get('.ice-cream').select('Sardine')
        cy.get('#change-result').should('have.text', 'Number of times onChange event fired: 1')
        cy.get('#input-result').should('have.text', 'Number of times input event fired: 1')
      })
    })

    describe('errors', {
      defaultCommandTimeout: 100,
    }, () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log

          return this.logs.push(log)
        })

        return null
      })

      it('throws when not a dom subject', (done) => {
        cy.on('fail', () => {
          done()
        })

        cy.noop({}).select('foo')
      })

      it('throws when subject is not in the document', (done) => {
        let selected = 0

        const $select = cy.$$('#select-maps').change((e) => {
          selected += 1
          $select.remove()
        })

        cy.on('fail', (err) => {
          expect(selected).to.eq(1)
          expect(err.message).to.include('`cy.select()` failed because the page updated')

          done()
        })

        cy.get('#select-maps').select('de_aztec').select('de_dust2')
      })

      it('throws when more than 1 element in the collection', (done) => {
        const num = cy.$$('select').length

        cy.on('fail', (err) => {
          expect(err.message).to.include(`\`cy.select()\` can only be called on a single \`<select>\`. Your subject contained ${num} elements.`)
          expect(err.docsUrl).to.eq('https://on.cypress.io/select')

          done()
        })

        cy.get('select').select('foo')
      })

      it('throws when called with no arguments', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.select()` must be passed a string, number, or array as its 1st argument. You passed: `undefined`.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/select')

          done()
        })

        // @ts-expect-error - testing invalid arguments
        cy.get('select[name=maps]').select()
      })

      it('throws when called with null', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.select()` must be passed a string, number, or array as its 1st argument. You passed: `null`.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/select')

          done()
        })

        // @ts-expect-error - testing invalid arguments
        cy.get('select[name=maps]').select(null)
      })

      it('throws when called with invalid type', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.select()` must be passed a string, number, or array as its 1st argument. You passed: `true`.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/select')

          done()
        })

        // @ts-expect-error - testing invalid arguments
        cy.get('select[name=foods]').select(true)
      })

      it('throws on anything other than a select', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.select()` can only be called on a `<select>`. Your subject is a: `<input id="input">`')
          expect(err.docsUrl).to.eq('https://on.cypress.io/select')

          done()
        })

        cy.get('input:first').select('foo')
      })

      it('throws on negative index', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.select()` was called with an invalid index: `-1`. Index must be a non-negative integer.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/select')

          done()
        })

        cy.get('select:first').select(-1)
      })

      it('throws on non-integer index', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.select()` was called with an invalid index: `1.5`. Index must be a non-negative integer.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/select')

          done()
        })

        cy.get('select:first').select(1.5)
      })

      it('throws on out-of-range index', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.select()` failed because it could not find a single `<option>` with value, index, or text matching: `3`')
          expect(err.docsUrl).to.eq('https://on.cypress.io/select')

          done()
        })

        cy.get('select[name=foods]').select(3)
      })

      it('throws when finding duplicate values', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.select()` matched more than one `option` by value or text: `bm`')
          expect(err.docsUrl).to.eq('https://on.cypress.io/select')

          done()
        })

        cy.get('select[name=names]').select('bm')
      })

      it('throws when passing an array to a non multiple select', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.select()` was called with an array of arguments but does not have a `multiple` attribute set.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/select')

          done()
        })

        cy.get('select[name=names]').select(['bm', 'ss'])
      })

      it('throws when the subject isnt visible', (done) => {
        cy.$$('#select-maps').show().hide()

        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.select()` failed because this element is not visible')

          done()
        })

        cy.get('#select-maps').select('de_dust2')
      })

      it('throws when value or text does not exist', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.select()` failed because it could not find a single `<option>` with value, index, or text matching: `foo`')
          expect(err.docsUrl).to.eq('https://on.cypress.io/select')

          done()
        })

        cy.get('select[name=foods]').select('foo')
      })

      it('throws invalid argument error when called with empty string', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.select()` failed because it could not find a single `<option>` with value, index, or text matching: ``')
          expect(err.docsUrl).to.eq('https://on.cypress.io/select')

          done()
        })

        cy.get('select[name=foods]').select('')
      })

      it('throws invalid array argument error when called with invalid array', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.select()` must be passed an array containing only strings and/or numbers. You passed: `[true,false]`')
          expect(err.docsUrl).to.eq('https://on.cypress.io/select')

          done()
        })

        // @ts-expect-error - testing invalid arguments
        cy.get('select[name=foods]').select([true, false])
      })

      it('throws when the <select> itself is disabled', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.select()` failed because this element is `disabled`:')

          done()
        })

        cy.get('select[name=disabled]').select('foo')
      })

      it('throws when the <select> is disabled by a disabled <fieldset>', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.select()` failed because this element is `disabled`:')

          done()
        })

        cy.get('select[name=fieldset-disabled]').select('foo')
      })

      it('throws when optgroup is disabled', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.select()` failed because this `<option>` you are trying to select is within an `<optgroup>` that is currently disabled:')
          expect(err.docsUrl).to.eq('https://on.cypress.io/select')

          done()
        })

        cy.get('select[name=optgroup-disabled]').select('bar')
      })

      it('throws when options are disabled', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.select()` failed because this `<option>` you are trying to select is currently disabled:')
          expect(err.docsUrl).to.eq('https://on.cypress.io/select')

          done()
        })

        cy.get('select[name=opt-disabled]').select('bar')
      })

      it('eventually fails the assertion', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(err.message).to.include(lastLog.get('error').message)
          expect(err.message).not.to.include('undefined')
          expect(lastLog.get('name')).to.eq('assert')
          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('error')).to.be.an.instanceof(chai.AssertionError)

          done()
        })

        cy.get('#select-maps').select('de_nuke').should('have.class', 'selected')
      })

      it('does not log an additional log on failure', function (done) {
        cy.on('fail', () => {
          assertLogLength(this.logs, 3)

          done()
        })

        cy.get('#select-maps').select('de_nuke').should('have.class', 'selected')
      })

      it('only logs once on failure', function (done) {
        cy.on('fail', (err) => {
          // 2 logs, 1 for cy.get, 1 for cy.select
          assertLogLength(this.logs, 2)

          done()
        })

        cy.get('#select-maps').select('does_not_exist')
      })
    })

    describe('.log', () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log

          return this.logs.push(log)
        })

        return null
      })

      it('can turn off logging when protocol is disabled', { protocolEnabled: false }, function () {
        cy.on('_log:added', (attrs, log) => {
          this.hiddenLog = log
        })

        cy.get('#select-maps').select('de_dust2', { log: false })

        cy.then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog.get('name'), 'log name').to.not.eq('select')
          expect(hiddenLog).to.be.undefined
        })
      })

      it('can send hidden log when protocol is enabled', { protocolEnabled: true }, function () {
        cy.on('_log:added', (attrs, log) => {
          this.hiddenLog = log
        })

        cy.get('#select-maps').select('de_dust2', { log: false })

        cy.then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog.get('name'), 'log name').to.not.eq('select')

          expect(hiddenLog.get('name'), 'log name').to.eq('select')
          expect(hiddenLog.get('hidden'), 'log hidden').to.be.true
          expect(hiddenLog.get('snapshots').length, 'log snapshot length').to.eq(2)
        })
      })

      it('logs out select', () => {
        cy.get('#select-maps').select('de_dust2').then(function () {
          const { lastLog } = this

          expect(lastLog.get('name')).to.eq('select')
        })
      })

      it('passes in $el', () => {
        cy.get('#select-maps').select('de_dust2').then(function ($select) {
          const { lastLog } = this

          expect(lastLog.get('$el')).to.eql($select)
        })
      })

      it('snapshots before clicking', function (done) {
        cy.$$('#select-maps').change(() => {
          const { lastLog } = this

          expect(lastLog.get('snapshots').length).to.eq(1)
          expect(lastLog.get('snapshots')[0].name).to.eq('before')
          expect(lastLog.get('snapshots')[0].body).to.be.an('object')

          done()
        })

        cy.get('#select-maps').select('de_aztec').then(($select) => { })
      })

      it('snapshots after clicking', () => {
        cy.get('#select-maps').select('de_dust2').then(function ($select) {
          const { lastLog } = this

          expect(lastLog.get('snapshots').length).to.eq(2)
          expect(lastLog.get('snapshots')[1].name).to.eq('after')
          expect(lastLog.get('snapshots')[1].body).to.be.an('object')
        })
      })

      it('is not immediately ended', function (done) {
        cy.$$('#select-maps').click(() => {
          const { lastLog } = this

          expect(lastLog.get('state')).to.eq('pending')

          done()
        })

        cy.get('#select-maps').select('de_dust2')
      })

      it('ends', () => {
        cy.get('#select-maps').select('de_dust2').then(function () {
          const { lastLog } = this

          expect(lastLog.get('state')).to.eq('passed')
        })
      })

      it('#consoleProps', () => {
        cy.get('#select-maps').select('de_dust2').then(function ($select) {
          const { fromElWindow } = Cypress.dom.getElementCoordinatesByPosition($select)
          const consoleProps = this.lastLog.invoke('consoleProps')

          expect(consoleProps.name).to.eq('select')
          expect(consoleProps.type).to.eq('command')
          expect(consoleProps.props.Selected).to.deep.eq(['de_dust2'])
          expect(consoleProps.props['Applied To']).to.eq($select.get(0))
          expect(consoleProps.props.Coords.x).to.be.closeTo(fromElWindow.x, 10)
          expect(consoleProps.props.Coords.y).to.be.closeTo(fromElWindow.y, 10)

          expect(consoleProps).to.have.property('table')
          expect(consoleProps.table[1]()).to.containSubset({
            'name': 'Mouse Events',
            'data': [
              { 'Event Type': 'pointerover' },
              { 'Event Type': 'mouseover' },
              { 'Event Type': 'pointermove' },
              { 'Event Type': 'pointerdown' },
              { 'Event Type': 'mousedown' },
              { 'Event Type': 'pointerover' },
              { 'Event Type': 'pointerup' },
              { 'Event Type': 'mouseup' },
              { 'Event Type': 'click' },
            ],
          })
        })
      })

      it('logs only one select event', () => {
        const types: any[] = []

        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'select') {
            return types.push(log)
          }

          return null
        })

        cy.get('#select-maps').select('de_dust2').then(function () {
          assertLogLength(this.logs, 2)
          expect(types.length).to.eq(1)
        })
      })

      it('logs deltaOptions', () => {
        cy.get('#select-maps').select('de_dust2', { force: true, timeout: 1000 }).then(function () {
          const { lastLog } = this

          expect(lastLog.get('message')).to.eq('{force: true, timeout: 1000}')
          expect(lastLog.invoke('consoleProps').props.Options).to.deep.eq({ force: true, timeout: 1000 })
        })
      })
    })
  })
})
