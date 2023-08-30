const { assertLogLength } = require('../../support/utils')

describe('src/cy/commands/popups', () => {
  context('alert', () => {
    beforeEach(function () {
      cy.visit('/fixtures/generic.html')

      this.logs = []

      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'alert') {
          this.logs.push(log)
        }
      })

      return null
    })

    it('logs the alert', () => {
      cy.window().then((win) => {
        win.alert('fooooo')
      })
      .then(function () {
        assertLogLength(this.logs, 1)
        expect(this.logs[0].get('name')).to.eq('alert')
        expect(this.logs[0].get('message')).to.eq('fooooo')

        const consoleProps = this.logs[0].invoke('consoleProps')

        expect(consoleProps).to.deep.eq({
          name: 'alert',
          type: 'event',
          props: {
            Alerted: 'fooooo',
          },
        })
      })
    })
  })

  context('confirm', () => {
    beforeEach(function () {
      cy.visit('/fixtures/generic.html')

      this.logs = []

      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'confirm') {
          this.logs.push(log)
        }
      })

      return null
    })

    it('logs the confirm', () => {
      cy.window().then((win) => {
        win.confirm('Delete hard drive?')
      }).then(function () {
        assertLogLength(this.logs, 1)
        expect(this.logs[0].get('name')).to.eq('confirm')
        expect(this.logs[0].get('message')).to.eq('Delete hard drive?')

        const consoleProps = this.logs[0].invoke('consoleProps')

        expect(consoleProps).to.deep.eq({
          name: 'confirm',
          type: 'event',
          props: {
            Prompted: 'Delete hard drive?',
            Confirmed: true,
          },
        })
      })
    })

    it('can turn on and off confirmation', () => {
      cy.on('window:confirm', (str) => {
        switch (str) {
          case 'foo': return false
          case 'bar': return true
          case 'baz': return undefined
          default: return
        }
      })

      cy.window().then((win) => {
        const confirmedFoo = win.confirm('foo')

        expect(confirmedFoo).to.be.false

        const confirmedBar = win.confirm('bar')

        expect(confirmedBar).to.be.true

        // undefined is not strictly false
        // so the confirmation should be true
        const confirmedBaz = win.confirm('baz')

        expect(confirmedBaz).to.be.true
      })
    })
  })
})
