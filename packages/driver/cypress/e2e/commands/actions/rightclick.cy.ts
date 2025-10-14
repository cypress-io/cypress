import {
  assertLogLength,
  attachListeners,
  attachFocusListeners,
  attachMouseClickListeners,
  attachMouseHoverListeners,
  clickCommandLog,
  isFirefox,
  isWebKit,
  shouldBeCalled,
  shouldBeCalledOnce,
  shouldNotBeCalled,
} from '../../../support/utils'

const { _, $ } = Cypress

const attachContextmenuListeners = attachListeners(['contextmenu'])

const getMidPoint = (el) => {
  const box = el.getBoundingClientRect()
  const midX = Math.ceil(box.left + box.width / 2 + el.ownerDocument.defaultView.scrollX)
  const midY = Math.ceil(box.top + box.height / 2 + el.ownerDocument.defaultView.scrollY)

  return { x: midX, y: midY }
}

describe('src/cy/commands/actions/rightclick', () => {
  beforeEach(() => {
    cy.visit('/fixtures/dom.html')
  })

  context('#rightclick', () => {
    it('can rightclick', () => {
      const el = cy.$$('button:first')

      attachMouseClickListeners({ el })
      attachContextmenuListeners({ el })

      cy.get('button:first').rightclick().should('have.focus')

      cy.getAll('el', 'pointerdown mousedown contextmenu pointerup mouseup').each(shouldBeCalled)
      cy.getAll('el', 'click').each(shouldNotBeCalled)

      cy.getAll('el', 'pointerdown mousedown pointerup mouseup').each((stub) => {
        expect(stub.firstCall.args[0]).to.containSubset({
          button: 2,
          buttons: 2,
          which: 3,
        })
      })

      cy.getAll('el', 'contextmenu').each((stub) => {
        expect(stub.firstCall.args[0]).to.containSubset({
          altKey: false,
          bubbles: true,
          target: el.get(0),
          button: 2,
          buttons: 2,
          cancelable: true,
          data: undefined,
          detail: 0,
          handleObj: { type: 'contextmenu', origType: 'contextmenu', data: undefined },
          relatedTarget: null,
          shiftKey: false,
          type: 'contextmenu',
          view: cy.state('window'),
          which: 3,
        })
      })
    })

    it('can rightclick disabled with force', () => {
      const el = cy.$$('input:first')
      .prop('disabled', true)

      attachMouseClickListeners({ el })
      attachFocusListeners({ el })
      attachContextmenuListeners({ el })

      cy.get('input:first').rightclick({ force: true })

      cy.getAll('el', 'mousedown contextmenu mouseup').each(shouldNotBeCalled)

      // On disabled inputs, pointer events are still fired in chrome, not in firefox or webkit
      cy.getAll('el', 'pointerdown pointerup').each(isFirefox || isWebKit ? shouldNotBeCalled : shouldBeCalled)
    })

    it('rightclick cancel contextmenu', () => {
      const el = cy.$$('button:first')

      // canceling contextmenu prevents the native contextmenu
      // likely we want to call attention to this, since we cannot
      // reproduce the native contextmenu
      el.on('contextmenu', () => false)

      attachMouseClickListeners({ el })
      attachFocusListeners({ el })
      attachContextmenuListeners({ el })

      cy.get('button:first').rightclick().should('have.focus')

      cy.getAll('el', 'pointerdown mousedown contextmenu pointerup mouseup').each(shouldBeCalled)
      cy.getAll('el', 'click').each(shouldNotBeCalled)
    })

    it('rightclick cancel mousedown', () => {
      const el = cy.$$('button:first')

      el.on('mousedown', () => false)

      attachMouseClickListeners({ el })
      attachFocusListeners({ el })
      attachContextmenuListeners({ el })

      cy.get('button:first').rightclick().should('not.have.focus')

      cy.getAll('el', 'pointerdown mousedown contextmenu pointerup mouseup').each(shouldBeCalled)
      cy.getAll('el', 'focus click').each(shouldNotBeCalled)
    })

    it('rightclick cancel pointerdown', () => {
      const el = cy.$$('button:first')

      el.on('pointerdown', () => false)

      attachMouseClickListeners({ el })
      attachFocusListeners({ el })
      attachContextmenuListeners({ el })

      cy.get('button:first').rightclick()

      cy.getAll('el', 'pointerdown pointerup contextmenu').each(shouldBeCalled)
      cy.getAll('el', 'mousedown mouseup').each(shouldNotBeCalled)
    })

    it('rightclick remove el on pointerdown', () => {
      const el = cy.$$('button:first')

      el.on('pointerdown', () => el.get(0).remove())

      attachMouseClickListeners({ el })
      attachFocusListeners({ el })
      attachContextmenuListeners({ el })

      cy.get('button:first').rightclick().should('not.exist')

      cy.getAll('el', 'pointerdown').each(shouldBeCalled)
      cy.getAll('el', 'mousedown mouseup contextmenu pointerup').each(shouldNotBeCalled)
    })

    it('rightclick remove el on mouseover', () => {
      const el = cy.$$('button:first')
      .css({
        transform: 'translateY(-50px)',
      })
      const el2 = cy.$$('div#tabindex')

      el.on('mouseover', () => el.get(0).remove())

      attachMouseClickListeners({ el, el2 })
      attachMouseHoverListeners({ el, el2 })
      attachFocusListeners({ el, el2 })
      attachContextmenuListeners({ el, el2 })

      cy.get('button:first').rightclick().should('not.exist')
      cy.get('div#tabindex').should('have.focus')

      cy.getAll('el', 'pointerover mouseover').each(shouldBeCalledOnce)
      cy.getAll('el', 'pointerdown mousedown pointerup mouseup contextmenu').each(shouldNotBeCalled)
      cy.getAll('el2', 'focus pointerdown pointerup contextmenu').each(shouldBeCalled)
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

        null
      })

      it('throws when not a dom subject', (done) => {
        cy.on('fail', () => {
          done()
        })

        cy.rightclick()
      })

      it('logs once when not dom subject', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.rightclick()
      })

      it('throws when any member of the subject isnt visible', function (done) {
        cy.timeout(300)
        cy.$$('#three-buttons button').show().last().hide()

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 4)
          expect(lastLog.get('error')).to.eq(err)
          expect(err.message).to.include('`cy.rightclick()` failed because this element is not visible')

          done()
        })

        cy.get('#three-buttons button').rightclick({ multiple: true })
      })
    })

    describe('.log', () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log

          this.logs.push(log)
        })
      })

      it('can turn off logging when protocol is disabled', function () {
        cy.state('isProtocolEnabled', false)
        cy.on('_log:added', (attrs, log) => {
          this.hiddenLog = log
        })

        cy.get('button:first').rightclick({ log: false })

        cy.then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog.get('name'), 'log name').to.not.eq('rightclick')
          expect(hiddenLog).to.be.undefined
        })
      })

      it('can send hidden log when protocol is enabled', function () {
        cy.state('isProtocolEnabled', true)
        cy.on('_log:added', (attrs, log) => {
          this.hiddenLog = log
        })

        cy.get('button:first').rightclick({ log: false })

        cy.then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog.get('name'), 'log name').to.not.eq('rightclick')
          expect(hiddenLog.get('name'), 'log name').to.eq('rightclick')
          expect(hiddenLog.get('hidden'), 'log hidden').to.be.true
          expect(hiddenLog.get('snapshots').length, 'log snapshot length').to.eq(2)
        })
      })

      it('logs immediately before resolving', (done) => {
        const $button = cy.$$('button:first')

        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'rightclick') {
            expect(log.get('state')).to.eq('pending')
            expect(log.get('$el').get(0)).to.eq($button.get(0))

            done()
          }
        })

        cy.get('button:first').rightclick()
      })

      it('snapshots after clicking', () => {
        cy.get('button:first').rightclick().then(function () {
          const { lastLog } = this

          expect(lastLog.get('snapshots')).to.have.length(2)
          expect(lastLog.get('snapshots')[0]).to.containSubset({ name: 'before' })
          expect(lastLog.get('snapshots')[1]).to.containSubset({ name: 'after' })
        })
      })

      it('returns only the $el for the element of the subject that was rightclicked', () => {
        const rightclicks: any[] = []

        // append two buttons
        const $button = () => {
          return $(`<button class='rightclicks'>rightclick</button`)
        }

        cy.$$('body').append($button()).append($button())

        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'rightclick') {
            rightclicks.push(log)
          }
        })

        cy.get('button.rightclicks').rightclick({ multiple: true }).then(($buttons) => {
          expect($buttons.length).to.eq(2)
          expect(rightclicks.length).to.eq(2)

          expect(rightclicks[1].get('$el').get(0)).to.eq($buttons.last().get(0))
        })
      })

      it('logs only 1 rightclick event', () => {
        const logs: any[] = []

        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'rightclick') {
            logs.push(log)
          }
        })

        cy.get('button:first').rightclick().then(() => {
          expect(logs.length).to.eq(1)
        })
      })

      it('#consoleProps', function () {
        cy.on('log:added', (attrs, log) => {
          this.log = log
        })

        cy.get('button').first().rightclick().then(function ($btn) {
          const { lastLog } = this

          const midpoint = getMidPoint($btn[0])
          const consoleProps = lastLog.invoke('consoleProps')

          expect(consoleProps).to.containSubset({
            name: 'rightclick',
            type: 'command',
            'table': {},
          })

          expect(consoleProps.props).to.containSubset({
            'Applied To': {},
            'Elements': 1,
            'Coords': midpoint,
          })

          const tables = _.map(consoleProps.table, ((x) => x()))

          expect(tables).to.containSubset([
            {
              'name': 'Mouse Events',
              'data': [
                {
                  'Event Type': 'pointerover',
                  'Target Element': {},
                  'Prevented Default': null,
                  'Stopped Propagation': null,
                },
                {
                  'Event Type': 'mouseover',
                  'Target Element': {},
                  'Prevented Default': null,
                  'Stopped Propagation': null,
                },
                {
                  'Event Type': 'pointermove',
                  'Target Element': {},
                  'Prevented Default': null,
                  'Stopped Propagation': null,
                },
                {
                  'Event Type': 'mousemove',
                  'Target Element': {},
                  'Prevented Default': null,
                  'Stopped Propagation': null,
                },

                {
                  'Event Type': 'pointerdown',
                  'Target Element': {},
                  'Prevented Default': null,
                  'Stopped Propagation': null,
                  'Active Modifiers': null,
                },
                {
                  'Event Type': 'mousedown',
                  'Target Element': {},
                  'Prevented Default': null,
                  'Stopped Propagation': null,
                  'Active Modifiers': null,
                },
                {
                  'Event Type': 'pointerup',
                  'Target Element': {},
                  'Prevented Default': null,
                  'Stopped Propagation': null,
                  'Active Modifiers': null,
                },
                {
                  'Event Type': 'mouseup',
                  'Target Element': {},
                  'Prevented Default': null,
                  'Stopped Propagation': null,
                  'Active Modifiers': null,
                },

                {
                  'Event Type': 'contextmenu',
                  'Target Element': {},
                  'Prevented Default': null,
                  'Stopped Propagation': null,
                  'Active Modifiers': null,
                },
              ],
            },
          ])
        })
      })

      it('can print table of keys on rightclick', () => {
        // @ts-expect-error - TODO: console isn't recognized on top for some reason
        const spyTableName = cy.spy(top.console, 'group')
        // @ts-expect-error - TODO: console isn't recognized on top for some reason
        const spyTableData = cy.spy(top.console, 'table')

        cy.get('input:first').rightclick()

        clickCommandLog('click')
        .then(() => {
          expect(spyTableName).calledWith('Mouse Events')
          expect(spyTableData).calledOnce
          expect(spyTableData.lastCall.args[0]).property('8').includes({ 'Event Type': 'contextmenu' })
        })
      })
    })
  })
})

describe('shadow dom', () => {
  beforeEach(() => {
    cy.visit('/fixtures/shadow-dom.html')
  })

  it('composes right click events', (done) => {
    const el = cy.$$('#shadow-element-3')[0].shadowRoot?.querySelector('p')

    cy.$$('#parent-of-shadow-container-0').on('contextmenu', () => {
      done()
    })

    cy
    .get(`.${el?.className}`, { includeShadowDom: true })
    .rightclick()
  })
})
