import {
  assertLogLength,
  attachListeners,
  attachMouseClickListeners,
  clickCommandLog,
} from '../../../support/utils'

const { _, $, Promise } = Cypress

const attachMouseDblclickListeners = attachListeners(['dblclick'])

describe('src/cy/commands/actions/dblclick', () => {
  beforeEach(() => {
    cy.visit('/fixtures/dom.html')
  })

  context('#dblclick', () => {
    it('sends a dblclick event', (done) => {
      cy.$$('#button').on('dblclick', () => {
        done()
      })

      cy.get('#button').dblclick()
    })

    it('returns the original subject', () => {
      const $btn = cy.$$('#button')

      cy.get('#button').dblclick().then(($button) => {
        expect($button[0]).to.eq($btn[0])
      })
    })

    it('causes focusable elements to receive focus', () => {
      cy.get(':text:first').dblclick().should('have.focus')
    })

    it('silences errors on unfocusable elements', () => {
      cy.get('div:first').dblclick({ force: true })
    })

    it('causes first focused element to receive blur', () => {
      let blurred = false

      cy.$$('input:first').blur(() => {
        blurred = true
      })

      cy
      .get('input:first').focus()
      .get('input:text:last').dblclick()
      .then(() => {
        expect(blurred).to.be.true
      })
    })

    it('inserts artificial delay of 50ms', () => {
      cy.spy(Promise, 'delay')

      cy.get('#button').click().then(() => {
        expect(Promise.delay).to.be.calledWith(50)
      })
    })

    it('can operate on a jquery collection', () => {
      let dblclicks = 0

      const $buttons = cy.$$('button').slice(0, 2)

      $buttons.dblclick(() => {
        dblclicks += 1

        return false
      })

      // make sure we have more than 1 button
      expect($buttons.length).to.be.gt(1)

      // make sure each button received its dblclick event
      cy.get('button').invoke('slice', 0, 2).dblclick().then(($buttons) => {
        expect($buttons.length).to.eq(dblclicks)
      })
    })

    // TODO: fix this once we implement aborting / restoring / reset
    it.skip('can cancel multiple dblclicks', function (done) {
      let dblclicks = 0

      const spy = this.sandbox.spy(() => {
        this.Cypress.abort()
      })

      // abort after the 3rd dblclick
      const dblclicked = _.after(3, spy)

      const anchors = cy.$$('#sequential-clicks a')

      anchors.dblclick(() => {
        dblclicks += 1

        dblclicked()
      })

      // make sure we have at least 5 anchor links
      expect(anchors.length).to.be.gte(5)

      cy.on('cancel', () => {
        // timeout will get called synchronously
        // again during a click if the click function
        // is called
        const timeout = this.sandbox.spy(cy, '_timeout')

        _.delay(() => {
          // abort should only have been called once
          expect(spy.callCount).to.eq(1)

          // and we should have stopped dblclicking after 3
          expect(dblclicks).to.eq(3)

          expect(timeout.callCount).to.eq(0)

          done()
        }
        , 200)
      })

      cy.get('#sequential-clicks a').dblclick()
    })

    it('serially dblclicks a collection of anchors to the top of the page', () => {
      const throttled = cy.stub().as('clickcount')

      // create a throttled click function
      // which proves we are clicking serially
      const handleClick = cy.stub()
      .callsFake(_.throttle(throttled, 5, { leading: false }))
      .as('handleClick')

      const $anchors = cy.$$('#sequential-clicks a')

      $anchors.on('click', handleClick)
      cy.$$('div#dom').on('click', cy.stub().as('topClick'))
      .on('dblclick', cy.stub().as('topDblclick'))

      // make sure we're clicking multiple $anchors
      expect($anchors.length).to.be.gt(1)

      cy.get('#sequential-clicks a').dblclick({ multiple: true }).then(($els) => {
        expect($els).to.have.length(throttled.callCount)
        cy.get('@topDblclick').should('have.property', 'callCount', $els.length)
      })
    })

    it('serially dblclicks a collection', () => {
      const throttled = cy.stub().as('clickcount')

      // create a throttled click function
      // which proves we are clicking serially
      const handleClick = cy.stub()
      .callsFake(_.throttle(throttled, 5, { leading: false }))
      .as('handleClick')

      const $anchors = cy.$$('#three-buttons button')

      $anchors.on('dblclick', handleClick)

      // make sure we're clicking multiple $anchors
      expect($anchors.length).to.be.gt(1)

      cy.get('#three-buttons button').dblclick({ multiple: true }).then(($els) => {
        expect($els).to.have.length(throttled.callCount)
      })
    })

    it('correctly sets the detail property on mouse events', () => {
      const btn = cy.$$('button:first')

      attachMouseClickListeners({ btn })
      attachMouseDblclickListeners({ btn })
      cy.get('button:first').dblclick()
      cy.getAll('btn', 'mousedown mouseup click').each((spy) => {
        expect(spy.firstCall).calledWithMatch({ detail: 1 })
      })

      cy.getAll('btn', 'mousedown mouseup click').each((spy) => {
        expect(spy.lastCall).to.be.calledWithMatch({ detail: 2 })
      })

      cy.getAll('btn', 'dblclick').each((spy) => {
        expect(spy).to.be.calledOnce
        expect(spy.firstCall).to.be.calledWithMatch({ detail: 2 })
      })

      // pointer events do not set change detail prop
      cy.getAll('btn', 'pointerdown pointerup').each((spy) => {
        expect(spy).to.be.calledWithMatch({ detail: 0 })
      })
    })

    it('sends modifiers', () => {
      const btn = cy.$$('button:first')

      attachMouseClickListeners({ btn })
      attachMouseDblclickListeners({ btn })

      cy.get('input:first').type('{ctrl}{shift}', { release: false })
      cy.get('button:first').dblclick()

      cy.getAll('btn', 'pointerdown mousedown pointerup mouseup click dblclick').each((stub) => {
        expect(stub).to.be.calledWithMatch({
          shiftKey: true,
          ctrlKey: true,
          metaKey: false,
          altKey: false,
        })
      })
    })

    it('increases the timeout delta after each dblclick', () => {
      const count = cy.$$('#three-buttons button').length

      cy.spy(cy, 'timeout')

      cy.get('#three-buttons button').dblclick().then(() => {
        const calls = cy.timeout.getCalls()

        const num = _.filter(calls, (call) => _.isEqual(call.args, [50, true]))

        expect(num.length).to.eq(count)
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

        null
      })

      it('throws when not a dom subject', (done) => {
        cy.on('fail', () => {
          done()
        })

        cy.dblclick()
      })

      it('logs once when not dom subject', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.dblclick()
      })

      it('throws when any member of the subject isnt visible', function (done) {
        cy.timeout(600)
        cy.$$('#three-buttons button').show().last().hide()

        cy.on('fail', (err) => {
          const { lastLog } = this

          const logs = _.cloneDeep(this.logs)

          expect(logs).to.have.length(4)
          expect(lastLog.get('error')).to.eq(err)
          expect(err.message).to.include('`cy.dblclick()` failed because this element is not visible')

          done()
        })

        cy.get('#three-buttons button').dblclick()
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

        cy.get('button:first').dblclick({ log: false })

        cy.then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog.get('name'), 'log name').to.not.eq('dblclick')
          expect(hiddenLog).to.be.undefined
        })
      })

      it('can send hidden log when protocol is enabled', function () {
        cy.state('isProtocolEnabled', true)
        cy.on('_log:added', (attrs, log) => {
          this.hiddenLog = log
        })

        cy.get('button:first').dblclick({ log: false })

        cy.then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog.get('name'), 'log name').to.not.eq('dblclick')
          expect(hiddenLog.get('name'), 'log name').to.eq('dblclick')
          expect(hiddenLog.get('hidden'), 'log hidden').to.be.true
          expect(hiddenLog.get('snapshots').length, 'log snapshot length').to.eq(2)
        })
      })

      it('logs immediately before resolving', (done) => {
        const $button = cy.$$('button:first')

        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'dblclick') {
            expect(log.get('state')).to.eq('pending')
            expect(log.get('$el').get(0)).to.eq($button.get(0))

            done()
          }
        })

        cy.get('button:first').dblclick()
      })

      it('snapshots after clicking', () => {
        cy.get('button:first').dblclick().then(function () {
          const { lastLog } = this

          expect(lastLog.get('snapshots')).to.have.length(2)
          expect(lastLog.get('snapshots')[0]).to.containSubset({ name: 'before' })
          expect(lastLog.get('snapshots')[1]).to.containSubset({ name: 'after' })
        })
      })

      it('returns only the $el for the element of the subject that was dblclicked', () => {
        const dblclicks: any[] = []

        // append two buttons
        const $button = () => {
          return $(`<button class='dblclicks'>dblclick</button`)
        }

        cy.$$('body').append($button()).append($button())

        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'dblclick') {
            dblclicks.push(log)
          }
        })

        cy.get('button.dblclicks').dblclick().then(($buttons) => {
          expect($buttons.length).to.eq(2)
          expect(dblclicks.length).to.eq(2)

          expect(dblclicks[1].get('$el').get(0)).to.eq($buttons.last().get(0))
        })
      })

      it('logs only 1 dblclick event', () => {
        const logs: any[] = []

        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'dblclick') {
            logs.push(log)
          }
        })

        cy.get('button:first').dblclick().then(() => {
          expect(logs.length).to.eq(1)
        })
      })

      it('#consoleProps', function () {
        cy.on('log:added', (attrs, log) => {
          this.log = log
        })

        cy.get('button').first().dblclick().then(function () {
          const { lastLog } = this

          const consoleProps = lastLog.invoke('consoleProps')

          expect(consoleProps).to.containSubset({
            name: 'dblclick',
            type: 'command',
            'table': {},
          })

          expect(consoleProps.props).to.containSubset({
            'Applied To': {},
            'Elements': 1,
          })

          const tables = _.map(consoleProps.table, ((x) => x()))

          expect(tables[0]).to.containSubset({
            name: 'Mouse Events',
            data: [
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
                'Event Type': 'click',
                'Target Element': {},
                'Prevented Default': null,
                'Stopped Propagation': null,
                'Active Modifiers': null,
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
                'Event Type': 'click',
                'Target Element': {},
                'Prevented Default': null,
                'Stopped Propagation': null,
                'Active Modifiers': null,
              },
              {
                'Event Type': 'dblclick',
                'Target Element': {},
                'Prevented Default': null,
                'Stopped Propagation': null,
                'Active Modifiers': null,
              },
            ],
          })
        })
      })

      it('can print table of keys on dblclick', () => {
        // @ts-expect-error - TODO: console isn't recognized on top for some reason
        const spyTableName = cy.spy(top.console, 'group')
        // @ts-expect-error - TODO: console isn't recognized on top for some reason
        const spyTableData = cy.spy(top.console, 'table')

        cy.get('input:first').dblclick()

        clickCommandLog('click')
        .then(() => {
          expect(spyTableName).calledWith('Mouse Events')
          expect(spyTableData).calledOnce
          expect(spyTableData.lastCall.args[0]).property('8').includes({ 'Event Type': 'click' })
          expect(spyTableData.lastCall.args[0]).property('13').includes({ 'Event Type': 'click' })
          expect(spyTableData.lastCall.args[0]).property('14').includes({ 'Event Type': 'dblclick' })
        })
      })
    })
  })
})

describe('shadow dom', () => {
  beforeEach(() => {
    cy.visit('/fixtures/shadow-dom.html')
  })

  it('composes dblclick events', (done) => {
    const el = cy.$$('#shadow-element-3')[0].shadowRoot?.querySelector('p')

    cy.$$('#parent-of-shadow-container-0').on('dblclick', () => {
      done()
    })

    cy
    .get(`.${el?.className}`, { includeShadowDom: true })
    .dblclick()
  })
})
