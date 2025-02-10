import {
  assertLogLength,
  attachKeyListeners,
  shouldBeCalledOnce,
  shouldNotBeCalled,
} from '../../../support/utils'

const { _, $ } = Cypress

describe('src/cy/commands/actions/type - #clear', () => {
  beforeEach(() => {
    cy.visit('/fixtures/dom.html')
  })

  it('does not change the subject', () => {
    const textarea = cy.$$('textarea')

    cy.get('textarea').clear().then(($textarea) => {
      expect($textarea[0]).to.eq(textarea[0])
    })
  })

  it('removes the current value', () => {
    const textarea = cy.$$('#comments')

    textarea.val('foo bar')

    // make sure it really has that value first
    expect(textarea).to.have.value('foo bar')

    cy.get('#comments').clear().then(($textarea) => {
      expect($textarea).to.have.value('')
    })
  })

  it('waits until element is no longer disabled', () => {
    const clicked = cy.stub()
    const textarea = cy.$$('#comments').val('foo bar').prop('disabled', true)

    const retried = cy.stub()

    textarea.on('click', clicked)

    cy.on('command:retry', _.after(3, () => {
      textarea.prop('disabled', false)
      retried()
    }))

    cy.get('#comments').clear().then(() => {
      expect(clicked).to.be.calledOnce

      expect(retried).to.be.called
    })
  })

  it('requeries if the DOM rerenders during actionability', () => {
    const clicked = cy.stub()
    const retried = cy.stub()

    const textarea = cy.$$('#comments').val('foo bar').prop('disabled', true)

    cy.on('command:retry', _.after(3, () => {
      if (!retried.callCount) {
        textarea.replaceWith(textarea[0].outerHTML)
        cy.$$('#comments').prop('disabled', false).on('click', clicked)
        retried()
      }
    }))

    cy.get('#comments').clear().then(() => {
      expect(clicked).to.be.calledOnce
      expect(retried).to.be.called
    })
  })

  it('can force clear even when being covered by another element', () => {
    const $input = $('<input />')
    .attr('id', 'input-covered-in-span')
    .prependTo(cy.$$('body'))

    const left = $input.offset()?.left || 0
    const top = $input.offset()?.top || 0

    $('<span>span on input</span>')
    .css('position', 'absolute')
    .css('left', left)
    .css('top', top)
    .css('padding', '5px')
    .css('display', 'inline-block')
    .css('backgroundColor', 'yellow')
    .prependTo(cy.$$('body'))

    const clicked = cy.stub()

    $input.on('click', clicked)

    cy.get('#input-covered-in-span').clear({ force: true }).then(() => {
      expect(clicked).to.be.called
    })
  })

  it('can specify scrollBehavior in options', () => {
    cy.get('input:first').then((el) => {
      cy.spy(el[0], 'scrollIntoView')
    })

    cy.get('input:first').clear({ scrollBehavior: 'bottom' })

    cy.get('input:first').then((el) => {
      expect(el[0].scrollIntoView).calledWith({ block: 'end' })
    })
  })

  it('does not scroll when scrollBehavior is false in options', () => {
    cy.get('input:first').then((el) => {
      cy.spy(el[0], 'scrollIntoView')
    })

    cy.get('input:first').clear({ scrollBehavior: false })

    cy.get('input:first').then((el) => {
      expect(el[0].scrollIntoView).not.to.be.called
    })
  })

  it('does not scroll when scrollBehavior is false in config', { scrollBehavior: false }, () => {
    cy.get('input:first').then((el) => {
      cy.spy(el[0], 'scrollIntoView')
    })

    cy.get('input:first').clear()

    cy.get('input:first').then((el) => {
      expect(el[0].scrollIntoView).not.to.be.called
    })
  })

  it('calls scrollIntoView by default', () => {
    cy.get('input:first').then((el) => {
      cy.spy(el[0], 'scrollIntoView')
    })

    cy.get('input:first').clear()

    cy.get('input:first').then((el) => {
      expect(el[0].scrollIntoView).to.be.calledWith({ block: 'start' })
    })
  })

  // https://github.com/cypress-io/cypress/issues/4233
  it('can scroll to an element behind a sticky header', () => {
    cy.viewport(400, 400)
    cy.visit('./fixtures/sticky-header.html')
    cy.get('input:first').clear()
  })

  // https://github.com/cypress-io/cypress/issues/5835
  it('can force clear when hidden in input', () => {
    const input = cy.$$('input:first')
    .val('foo')
    .hide()

    attachKeyListeners({ input })
    cy.get('input:first')
    .focus()
    .clear({ force: true })
    .should('have.value', '')

    cy.getAll('input', 'keydown input keyup').each(shouldBeCalledOnce)
    cy.getAll('input', 'textInput keypress').each(shouldNotBeCalled)
  })

  it('can force clear when hidden in textarea', () => {
    const textarea = cy.$$('textarea:first')
    .val('foo')
    .hide()

    attachKeyListeners({ textarea })
    cy.get('textarea:first')
    .focus()
    .clear({ force: true })
    .should('have.value', '')

    cy.getAll('textarea', 'keydown input keyup').each(shouldBeCalledOnce)
    cy.getAll('textarea', 'textInput keypress').each(shouldNotBeCalled)
  })

  it('passes timeout and interval down to click', (done) => {
    const input = $('<input />').attr('id', 'input-covered-in-span').prependTo(cy.$$('body'))

    const left = input.offset()?.left || 0
    const top = input.offset()?.top || 0

    $('<span>span on input</span>')
    .css('position', 'absolute')
    .css('left', left)
    .css('top', top)
    .css('padding', 5)
    .css('display', 'inline-block')
    .css('backgroundColor', 'yellow')
    .prependTo(cy.$$('body'))

    cy.on('command:retry', (options) => {
      expect(options.timeout).to.eq(1000)
      expect(options.interval).to.eq(60)

      done()
    })

    // @ts-expect-error: TODO: Internal types for clear should accept interval
    cy.get('#input-covered-in-span').clear({ timeout: 1000, interval: 60 })
  })

  context('works on input type', () => {
    const inputTypes = [
      'date',
      'datetime',
      'datetime-local',
      'email',
      'month',
      'number',
      'password',
      'search',
      'tel',
      'text',
      'time',
      'url',
      'week',
    ]

    inputTypes.forEach((type) => {
      it(type, () => {
        cy.get(`#${type}-with-value`).clear().then(($input) => {
          expect($input.val()).to.equal('')
        })
      })
    })
  })

  describe('assertion verification', () => {
    beforeEach(function () {
      cy.on('log:added', (attrs, log) => {
        if (log.get('name') === 'assert') {
          this.lastLog = log
        }
      })
    })

    it('eventually passes the assertion', () => {
      cy.$$('input:first').keyup(function () {
        _.delay(() => {
          $(this).addClass('cleared')
        }
        , 100)
      })

      cy.get('input:first').clear().should('have.class', 'cleared').then(function () {
        const { lastLog } = this

        expect(lastLog.get('name')).to.eq('assert')
        expect(lastLog.get('state')).to.eq('passed')

        expect(lastLog.get('ended')).to.be.true
      })
    })

    it('eventually passes the assertion on multiple inputs', () => {
      cy.$$('input').keyup(function () {
        _.delay(() => {
          $(this).addClass('cleared')
        }
        , 100)
      })

      cy.get('input').invoke('slice', 0, 2).clear().should('have.class', 'cleared')
    })
  })

  describe('errors', {
    defaultCommandTimeout: 100,
  }, () => {
    beforeEach(function () {
      this.logs = []

      cy.on('log:added', (attrs, log) => {
        this.lastLog = log

        this.logs.push(log)
      })
    })

    it('throws when not a dom subject', (done) => {
      cy.on('fail', (err) => {
        done()
      })

      cy.noop({}).clear()
    })

    it('throws when subject is not in the document', (done) => {
      const cleared = cy.stub()

      const input = cy.$$('input:first').val('123').keydown((e) => {
        cleared()

        input.remove()
      })

      cy.on('fail', (err) => {
        expect(cleared).to.be.calledOnce
        expect(err.message).to.include('`cy.clear()` failed because the page updated')

        done()
      })

      cy.get('input:first').clear().clear()
    })

    it('throws if any subject isnt a textarea or text-like', function (done) {
      cy.on('fail', (err) => {
        const { lastLog } = this

        assertLogLength(this.logs, 3)
        expect(lastLog.get('error')).to.eq(err)
        expect(err.message).to.include('`cy.clear()` failed because it requires a valid clearable element.')
        expect(err.message).to.include('The element cleared was:')
        expect(err.message).to.include('`<form id="checkboxes">...</form>`')
        expect(err.message).to.include(`A clearable element matches one of the following selectors:`)
        expect(err.docsUrl).to.equal('https://on.cypress.io/clear')

        done()
      })

      cy.get('textarea:first,form#checkboxes').clear()
    })

    it('throws if any subject isnt a :text', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('`cy.clear()` failed because it requires a valid clearable element.')
        expect(err.message).to.include('The element cleared was:')
        expect(err.message).to.include('`<div id="does-not-wrap-input">Text</div>`')
        expect(err.message).to.include(`A clearable element matches one of the following selectors:`)
        expect(err.docsUrl).to.equal('https://on.cypress.io/clear')

        done()
      })

      cy.get('#does-not-wrap-input').clear()
    })

    it('throws center hidden error if the element is too high', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('`cy.clear()` failed because the center of this element is hidden from view')

        done()
      })

      cy.get('#dom').clear()
    })

    it('throws on an input radio', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('`cy.clear()` failed because it requires a valid clearable element.')
        expect(err.message).to.include('The element cleared was:')
        expect(err.message).to.include('`<input type="radio" name="gender" value="male">`')
        expect(err.message).to.include(`A clearable element matches one of the following selectors:`)
        expect(err.docsUrl).to.equal('https://on.cypress.io/clear')
        done()
      })

      cy.get(':radio').clear()
    })

    it('throws on an input checkbox', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('`cy.clear()` failed because it requires a valid clearable element.')
        expect(err.message).to.include('The element cleared was:')
        expect(err.message).to.include('`<input type="checkbox" name="colors" value="blue">`')
        expect(err.message).to.include(`A clearable element matches one of the following selectors:`)
        expect(err.docsUrl).to.equal('https://on.cypress.io/clear')

        done()
      })

      cy.get(':checkbox').clear()
    })

    it('throws when the subject isnt visible', (done) => {
      cy.$$('input:text:first').show().hide()

      cy.on('fail', (err) => {
        expect(err.message).to.include('`cy.clear()` failed because this element is not visible')

        done()
      })

      cy.get('input:text:first').clear()
    })

    it('throws when subject is disabled', function (done) {
      cy.$$('input:text:first').prop('disabled', true)

      cy.on('fail', (err) => {
        // get + type logs
        expect(this.logs.length).eq(2)
        expect(err.message).to.include('`cy.clear()` failed because this element is `disabled`:\n')

        done()
      })

      cy.get('input:text:first').clear()
    })

    it('logs once when not dom subject', function (done) {
      cy.on('fail', (err) => {
        const { lastLog } = this

        assertLogLength(this.logs, 1)
        expect(lastLog.get('error')).to.eq(err)

        done()
      })

      cy.clear()
    })

    it('throws when input cannot be cleared', function (done) {
      const $input = $('<input />')
      .attr('id', 'input-covered-in-span')
      .prependTo(cy.$$('body'))

      const left = $input.offset()?.left || 0
      const top = $input.offset()?.top || 0

      $('<span>span on input</span>')
      .css('position', 'absolute')
      .css('left', left)
      .css('top', top)
      .css('padding', '5px')
      .css('display', 'inline-block')
      .css('backgroundColor', 'yellow')
      .css('width', '120px')
      .prependTo(cy.$$('body'))

      cy.on('fail', (err) => {
        assertLogLength(this.logs, 2)
        expect(err.message).to.include('`cy.clear()` failed because this element')
        expect(err.message).to.include('is being covered by another element')

        done()
      })

      cy.get('#input-covered-in-span').clear()
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

      cy.get('input:first').clear().should('have.class', 'cleared')
    })

    it('does not log an additional log on failure', function (done) {
      const logs: any[] = []

      cy.on('log:added', (attrs, log) => {
        return logs.push(log)
      })

      cy.on('fail', () => {
        assertLogLength(this.logs, 3)

        done()
      })

      cy.get('input:first').clear().should('have.class', 'cleared')
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

      cy.get('input:first').clear({ log: false })
      .then(function () {
        const { lastLog, hiddenLog } = this

        expect(lastLog.get('name')).to.eq('get')
        expect(hiddenLog).to.be.undefined
      })
    })

    it('can send hidden log when protocol is enabled', { protocolEnabled: true }, function () {
      cy.on('_log:added', (attrs, log) => {
        this.hiddenLog = log
      })

      cy.get('input:first').clear({ log: false })
      .then(function () {
        const { lastLog, hiddenLog } = this

        expect(lastLog.get('name')).to.eq('get')

        expect(hiddenLog).to.be.ok
        expect(hiddenLog.get('name'), 'log name').to.eq('clear')
        expect(hiddenLog.get('hidden'), 'log hidden').to.be.true
        expect(hiddenLog.get('snapshots').length, 'log snapshot length').to.eq(1)
      })
    })

    it('logs immediately before resolving', () => {
      const $input = cy.$$('input:first')

      let expected = false

      cy.on('log:added', (attrs, log) => {
        if (log.get('name') === 'clear') {
          expect(log.get('state')).to.eq('pending')
          expect(log.get('$el').get(0)).to.eq($input.get(0))

          expected = true
        }
      })

      cy.get('input:first').clear().then(() => {
        expect(expected).to.be.true
      })
    })

    it('ends', () => {
      const logs: any[] = []

      cy.on('log:added', (attrs, log) => {
        if (log.get('name') === 'clear') {
          logs.push(log)
        }
      })

      cy.get('input').invoke('slice', 0, 2).clear().then(() => {
        _.each(logs, (log) => {
          expect(log.get('state')).to.eq('passed')

          expect(log.get('ended')).to.be.true
        })
      })
    })

    it('snapshots after clicking', () => {
      cy.get('input:first').clear().then(function ($input) {
        const { lastLog } = this

        expect(lastLog.get('snapshots').length).to.eq(1)

        expect(lastLog.get('snapshots')[0]).to.be.an('object')
      })
    })

    it('logs deltaOptions', () => {
      cy.get('input:first').clear({ force: true, timeout: 1000 }).then(function () {
        const { lastLog } = this

        expect(lastLog.get('message')).to.eq('{force: true, timeout: 1000}')

        expect(lastLog.invoke('consoleProps').props.Options).to.deep.eq({ force: true, timeout: 1000 })
      })
    })

    it('logs console props', () => {
      cy.get('input:first')
      .clear().then(function () {
        const { lastLog } = this
        const consoleProps = lastLog.invoke('consoleProps')

        expect(consoleProps).to.be.ok
        expect(consoleProps).to.have.property('name', 'clear')
        expect(consoleProps).to.have.property('type', 'command')
        expect(consoleProps).to.have.property('props')
        expect(consoleProps.props).to.have.property('Applied To')
        expect(consoleProps.props).to.have.property('Elements', 1)
        expect(consoleProps.props).to.have.property('Coords')
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
  })
})
