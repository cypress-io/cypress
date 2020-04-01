/* eslint-disable
    no-unused-vars,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const $ = Cypress.$.bind(Cypress)
const {
  _,
} = Cypress

describe('src/cy/commands/actions/select', function () {
  before(() => {
    return cy
    .visit('/fixtures/dom.html')
    .then(function (win) {
      this.body = win.document.body.outerHTML
    })
  })

  beforeEach(function () {
    const doc = cy.state('document')

    return $(doc.body).empty().html(this.body)
  })

  return context('#select', function () {
    it('does not change the subject', () => {
      const select = cy.$$('select[name=maps]')

      return cy.get('select[name=maps]').select('train').then(($select) => expect($select).to.match(select))
    })

    it('selects by value', () => cy.get('select[name=maps]').select('de_train').then(($select) => expect($select).to.have.value('de_train')))

    it('selects by text', () => cy.get('select[name=maps]').select('train').then(($select) => expect($select).to.have.value('de_train')))

    it('selects by trimmed text with newlines stripped', () => cy.get('select[name=maps]').select('italy').then(($select) => expect($select).to.have.value('cs_italy')))

    it('prioritizes value over text', () => cy.get('select[name=foods]').select('Ramen').then(($select) => expect($select).to.have.value('Ramen')))

    it('can select an array of values', () => cy.get('select[name=movies]').select(['apoc', 'br']).then(($select) => expect($select.val()).to.deep.eq(['apoc', 'br'])))

    it('can handle options nested in optgroups', () => cy.get('select[name=starwars]').select('Jar Jar').then(($select) => expect($select).to.have.value('jarjar')))

    it('can handle options with same value selected by text', () => {
      return cy.get('select[name=startrek-same]').select('Uhura').then(($select) => {
        expect($select.val()).to.equal('same')
        expect($select.find('option:selected')).to.have.text('Uhura')
        expect($select[0].selectedIndex).to.equal(2)

        return expect($select[0].selectedOptions[0]).to.eql($select.find('option:selected')[0])
      })
    })

    it('can handle options with some same values selected by text', () => {
      return cy.get('select[name=startrek-some-same]').select('Uhura').then(($select) => {
        expect($select.val()).to.equal('same')
        expect($select.find('option:selected')).to.have.text('Uhura')
        expect($select[0].selectedIndex).to.equal(2)

        return expect($select[0].selectedOptions[0]).to.eql($select.find('option:selected')[0])
      })
    })

    it('can select an array of values', () => cy.get('select[name=movies]').select(['apoc', 'br']).then(($select) => expect($select.val()).to.deep.eq(['apoc', 'br'])))

    it('can select an array of texts', () => cy.get('select[name=movies]').select(['The Human Condition', 'There Will Be Blood']).then(($select) => expect($select.val()).to.deep.eq(['thc', 'twbb'])))

    // readonly should only be limited to inputs, not checkboxes
    it('can select a readonly select', () => cy.get('select[name=hunter]').select('gon').then(($select) => expect($select.val()).to.eq('gon-val')))

    it('clears previous values when providing an array', () => {
      // make sure we have a previous value
      const select = cy.$$('select[name=movies]').val(['2001'])

      expect(select.val()).to.deep.eq(['2001'])

      return cy.get('select[name=movies]').select(['apoc', 'br']).then(($select) => expect($select.val()).to.deep.eq(['apoc', 'br']))
    })

    it('lists the select as the focused element', () => {
      const select = cy.$$('#select-maps')

      return cy.get('#select-maps').select('de_train').focused().then(($focused) => expect($focused.get(0)).to.eq(select.get(0)))
    })

    it('causes previous input to receive blur', (done) => {
      cy.$$('input:text:first').blur(() => done())

      cy.get('input:text:first').type('foo')

      return cy.get('#select-maps').select('de_train')
    })

    it('can forcibly click even when being covered by another element', (done) => {
      const select = $('<select><option>foo</option></select>').attr('id', 'select-covered-in-span').prependTo(cy.$$('body'))
      const span = $('<span>span on select</span>').css({ position: 'absolute', left: select.offset().left, top: select.offset().top, padding: 5, display: 'inline-block', backgroundColor: 'yellow' }).prependTo(cy.$$('body'))

      select.on('click', () => done())

      return cy.get('#select-covered-in-span').select('foo', { force: true })
    })

    it('passes timeout and interval down to click', (done) => {
      const select = $('<select />').attr('id', 'select-covered-in-span').prependTo(cy.$$('body'))
      const span = $('<span>span on select</span>').css({ position: 'absolute', left: select.offset().left, top: select.offset().top, padding: 5, display: 'inline-block', backgroundColor: 'yellow' }).prependTo(cy.$$('body'))

      cy.on('command:retry', (options) => {
        expect(options.timeout).to.eq(1000)
        expect(options.interval).to.eq(60)

        return done()
      })

      return cy.get('#select-covered-in-span').select('foobar', { timeout: 1000, interval: 60 })
    })

    it('can forcibly click even when element is invisible', (done) => {
      const select = cy.$$('#select-maps').hide()

      select.click(() => done())

      return cy.get('#select-maps').select('de_dust2', { force: true })
    })

    it('retries until <option> can be selected', () => {
      const option = cy.$$('<option>foo</option>')

      cy.on('command:retry', _.once(() => {
        return cy.$$('#select-maps').append(option)
      }))

      return cy.get('#select-maps').select('foo')
    })

    it('retries until <select> is no longer disabled', () => {
      const select = cy.$$('select[name=disabled]')

      cy.on('command:retry', _.once(() => {
        return select.prop('disabled', false)
      }))

      return cy.get('select[name=disabled]').select('foo')
    })

    it('retries until <options> are no longer disabled', () => {
      const select = cy.$$('select[name=opt-disabled]')

      cy.on('command:retry', _.once(() => {
        return select.find('option').prop('disabled', false)
      }))

      return cy.get('select[name=opt-disabled]').select('bar')
    })

    describe('assertion verification', function () {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'assert') {
            this.lastLog = log
          }
        })

        return null
      })

      return it('eventually passes the assertion', function () {
        cy.$$('#select-maps').change(function () {
          return _.delay(() => {
            return $(this).addClass('selected')
          }
          , 100)
        })

        return cy.get('#select-maps').select('de_nuke').should('have.class', 'selected').then(function () {
          const {
            lastLog,
          } = this

          expect(lastLog.get('name')).to.eq('assert')
          expect(lastLog.get('state')).to.eq('passed')

          return expect(lastLog.get('ended')).to.be.true
        })
      })
    })

    describe('events', () => {
      it('emits click event', (done) => {
        cy.$$('select[name=maps]').click(() => done())

        return cy.get('select[name=maps]').select('train')
      })

      it('emits change event', (done) => {
        cy.$$('select[name=maps]').change(() => done())

        return cy.get('select[name=maps]').select('train')
      })

      it('emits focus event', (done) => {
        cy.$$('select[name=maps]').one('focus', () => done())

        return cy.get('select[name=maps]').select('train')
      })

      it('emits input event', (done) => {
        cy.$$('select[name=maps]').one('input', () => done())

        return cy.get('select[name=maps]').select('train')
      })

      return it('emits all events in the correct order', () => {
        const fired = []
        const events = ['mousedown', 'focus', 'mouseup', 'click', 'input', 'change']

        _.each(events, (event) => {
          return cy.$$('select[name=maps]').one(event, () => fired.push(event))
        })

        return cy.get('select[name=maps]').select('train').then(() => expect(fired).to.deep.eq(events))
      })
    })

    describe('errors', function () {
      beforeEach(function () {
        Cypress.config('defaultCommandTimeout', 100)

        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log

          return this.logs.push(log)
        })

        return null
      })

      it('throws when not a dom subject', (done) => {
        cy.on('fail', () => done())

        return cy.noop({}).select('foo')
      })

      it('throws when subject is not in the document', (done) => {
        let selected = 0

        const $select = cy.$$('#select-maps').change((e) => {
          selected += 1

          return $select.remove()
        })

        cy.on('fail', (err) => {
          expect(selected).to.eq(1)
          expect(err.message).to.include('`cy.select()` failed because this element')

          return done()
        })

        return cy.get('#select-maps').select('de_dust2').select('de_aztec')
      })

      it('throws when more than 1 element in the collection', (done) => {
        const num = cy.$$('select').length

        cy.on('fail', (err) => {
          expect(err.message).to.include(`\`cy.select()\` can only be called on a single \`<select>\`. Your subject contained ${num} elements.`)
          expect(err.docsUrl).to.eq('https://on.cypress.io/select')

          return done()
        })

        return cy.get('select').select('foo')
      })

      it('throws on anything other than a select', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.select()` can only be called on a `<select>`. Your subject is a: `<input id="input">`')
          expect(err.docsUrl).to.eq('https://on.cypress.io/select')

          return done()
        })

        return cy.get('input:first').select('foo')
      })

      it('throws when finding duplicate values', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.select()` matched more than one `option` by value or text: `bm`')
          expect(err.docsUrl).to.eq('https://on.cypress.io/select')

          return done()
        })

        return cy.get('select[name=names]').select('bm')
      })

      it('throws when passing an array to a non multiple select', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.select()` was called with an array of arguments but does not have a `multiple` attribute set.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/select')

          return done()
        })

        return cy.get('select[name=names]').select(['bm', 'ss'])
      })

      it('throws when the subject isnt visible', (done) => {
        const select = cy.$$('#select-maps').show().hide()

        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.select()` failed because this element is not visible')

          return done()
        })

        return cy.get('#select-maps').select('de_dust2')
      })

      it('throws when value or text does not exist', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.select()` failed because it could not find a single `<option>` with value or text matching: `foo`')
          expect(err.docsUrl).to.eq('https://on.cypress.io/select')

          return done()
        })

        return cy.get('select[name=foods]').select('foo')
      })

      it('throws when the <select> itself is disabled', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.select()` failed because this element is currently disabled:')
          expect(err.docsUrl).to.eq('https://on.cypress.io/select')

          return done()
        })

        return cy.get('select[name=disabled]').select('foo')
      })

      it('throws when options are disabled', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.select()` failed because this `<option>` you are trying to select is currently disabled:')
          expect(err.docsUrl).to.eq('https://on.cypress.io/select')

          return done()
        })

        return cy.get('select[name=opt-disabled]').select('bar')
      })

      it('eventually fails the assertion', function (done) {
        cy.on('fail', (err) => {
          const {
            lastLog,
          } = this

          expect(err.message).to.include(lastLog.get('error').message)
          expect(err.message).not.to.include('undefined')
          expect(lastLog.get('name')).to.eq('assert')
          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('error')).to.be.an.instanceof(chai.AssertionError)

          return done()
        })

        return cy.get('#select-maps').select('de_nuke').should('have.class', 'selected')
      })

      it('does not log an additional log on failure', function (done) {
        cy.on('fail', () => {
          expect(this.logs.length).to.eq(3)

          return done()
        })

        return cy.get('#select-maps').select('de_nuke').should('have.class', 'selected')
      })

      return it('only logs once on failure', function (done) {
        cy.on('fail', (err) => {
          // 2 logs, 1 for cy.get, 1 for cy.select
          expect(this.logs.length).to.eq(2)

          return done()
        })

        return cy.get('#select-maps').select('does_not_exist')
      })
    })

    return describe('.log', function () {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log

          return this.logs.push(log)
        })

        return null
      })

      it('logs out select', () => {
        return cy.get('#select-maps').select('de_dust2').then(function () {
          const {
            lastLog,
          } = this

          return expect(lastLog.get('name')).to.eq('select')
        })
      })

      it('passes in $el', () => {
        return cy.get('#select-maps').select('de_dust2').then(function ($select) {
          const {
            lastLog,
          } = this

          return expect(lastLog.get('$el')).to.eq($select)
        })
      })

      it('snapshots before clicking', function (done) {
        cy.$$('#select-maps').change(() => {
          const {
            lastLog,
          } = this

          expect(lastLog.get('snapshots').length).to.eq(1)
          expect(lastLog.get('snapshots')[0].name).to.eq('before')
          expect(lastLog.get('snapshots')[0].body).to.be.an('object')

          return done()
        })

        return cy.get('#select-maps').select('de_dust2').then(($select) => {})
      })

      it('snapshots after clicking', () => {
        return cy.get('#select-maps').select('de_dust2').then(function ($select) {
          const {
            lastLog,
          } = this

          expect(lastLog.get('snapshots').length).to.eq(2)
          expect(lastLog.get('snapshots')[1].name).to.eq('after')

          return expect(lastLog.get('snapshots')[1].body).to.be.an('object')
        })
      })

      it('is not immediately ended', function (done) {
        cy.$$('#select-maps').click(() => {
          const {
            lastLog,
          } = this

          expect(lastLog.get('state')).to.eq('pending')

          return done()
        })

        return cy.get('#select-maps').select('de_dust2')
      })

      it('ends', () => {
        return cy.get('#select-maps').select('de_dust2').then(function () {
          const {
            lastLog,
          } = this

          return expect(lastLog.get('state')).to.eq('passed')
        })
      })

      it('#consoleProps', () => {
        return cy.get('#select-maps').select('de_dust2').then(function ($select) {
          const { fromElWindow } = Cypress.dom.getElementCoordinatesByPosition($select)
          const console = this.lastLog.invoke('consoleProps')

          expect(console.Command).to.eq('select')
          expect(console.Selected).to.deep.eq(['de_dust2'])
          expect(console['Applied To']).to.eq($select.get(0))
          expect(console.Coords.x).to.be.closeTo(fromElWindow.x, 10)

          return expect(console.Coords.y).to.be.closeTo(fromElWindow.y, 10)
        })
      })

      it('logs only one select event', function () {
        const types = []

        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'select') {
            return types.push(log)
          }
        })

        return cy.get('#select-maps').select('de_dust2').then(function () {
          expect(this.logs.length).to.eq(2)

          return expect(types.length).to.eq(1)
        })
      })

      return it('logs deltaOptions', () => {
        return cy.get('#select-maps').select('de_dust2', { force: true, timeout: 1000 }).then(function () {
          const {
            lastLog,
          } = this

          expect(lastLog.get('message')).to.eq('{force: true, timeout: 1000}')

          return expect(lastLog.invoke('consoleProps').Options).to.deep.eq({ force: true, timeout: 1000 })
        })
      })
    })
  })
})
