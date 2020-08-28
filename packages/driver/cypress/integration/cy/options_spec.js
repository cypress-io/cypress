beforeEach(() => {
  cy.visit('/fixtures/command-log.html')
})

describe('last arg can be an object, but not an option', () => {
  beforeEach(() => {
    this.logs = []

    cy.on('log:added', (attrs, log) => {
      this.logs.push(log)
    })
  })

  afterEach(() => {
    cy.removeAllListeners('log:added')
  })

  it('check', () => {
    cy.on('fail', () => {
      expect(this.logs[1].get('options')).to.deep.eq(null)
    })

    cy.get('#b').check(['us', 'ca'])
  })

  it('clearLocalStorage', () => {
    cy.on('log:added', () => {
      cy.removeAllListeners('log:added')
      expect(this.logs[0].get('message')).to.eq('/app-/')
    })

    cy.clearLocalStorage(/app-/)
  })

  it('clock', () => {
    cy.on('fail', () => {
      expect(this.logs[0].get('options')).to.deep.eq(null)
    })

    cy.clock('invoke failure', ['setTimeout', 'clearTimeout'])
  })

  it('contains', () => {
    cy.on('fail', () => {
      expect(this.logs[0].get('options')).to.deep.eq({})
    })

    cy.contains('', /app-/)
  })

  it('invoke', () => {
    cy.on('fail', () => {
      expect(this.logs[1].get('options')).to.deep.eq({
        log: true,
      })
    })

    cy.wrap({}).invoke({ log: true }, 'non-exist')
  })

  it('nextUntil - jquery', () => {
    cy.on('log:added', (attrs, log) => {
      if (log.get('name') === 'nextUntil') {
        cy.removeAllListeners('log:added')
        expect(log.get('options')).to.deep.eq({})
      }
    })

    cy.get('div').nextUntil(cy.$$('.warning'))
  })

  it('nextUntil - DOM', () => {
    cy.on('log:added', (attrs, log) => {
      if (log.get('name') === 'nextUntil') {
        cy.removeAllListeners('log:added')
        expect(log.get('options')).to.deep.eq({})
      }
    })

    cy.get('div').nextUntil(document.getElementsByClassName('warning')[0])
  })

  it('parentsUntil - jquery', () => {
    cy.on('log:added', (attrs, log) => {
      if (log.get('name') === 'parentsUntil') {
        cy.removeAllListeners('log:added')
        expect(log.get('options')).to.deep.eq({})
      }
    })

    cy.get('div').parentsUntil(cy.$$('.warning'))
  })

  it('parentsUntil - DOM', () => {
    cy.on('log:added', (attrs, log) => {
      if (log.get('name') === 'parentsUntil') {
        cy.removeAllListeners('log:added')
        expect(log.get('options')).to.deep.eq({})
      }
    })

    cy.get('div').parentsUntil(document.getElementsByClassName('warning')[0])
  })

  it('prevUntil - jquery', () => {
    cy.on('log:added', (attrs, log) => {
      if (log.get('name') === 'prevUntil') {
        cy.removeAllListeners('log:added')
        expect(log.get('options')).to.deep.eq({})
      }
    })

    cy.get('div').prevUntil(cy.$$('.warning'))
  })

  it('prevUntil - DOM', () => {
    cy.on('log:added', (attrs, log) => {
      if (log.get('name') === 'prevUntil') {
        cy.removeAllListeners('log:added')
        expect(log.get('options')).to.deep.eq({})
      }
    })

    cy.get('div').prevUntil(document.getElementsByClassName('warning')[0])
  })

  it('select', () => {
    cy.on('log:added', (attrs) => {
      if (attrs.name === 'select') {
        expect(this.logs[1].get('options')).to.deep.eq({})
      }
    })

    cy.get('#auto-test').select(['Cypress', 'Jest'])
  })

  it('spread', () => {
    cy.on('fail', () => {
      expect(this.logs[1].get('options')).to.deep.eq({
        timeout: 1000,
      })
    })

    cy.wrap([1, 2, 3]).spread({ timeout: 1000 }, (a, b, c) => {
      throw new Error()
    })
  })

  it('task', () => {
    cy.on('fail', () => {
      expect(this.logs[0].get('options')).to.deep.eq({})
    })

    cy.task('throw', { a: 1, b: 2 })
  })

  it('then', () => {
    cy.on('fail', () => {
      expect(this.logs[1].get('options')).to.deep.eq({
        timeout: 1000,
      })
    })

    cy.wrap('a').then({ timeout: 1000 }, () => {
      throw new Error('hi?')
    })
  })

  it('uncheck', () => {
    cy.on('fail', () => {
      expect(this.logs[1].get('options')).to.deep.eq(null)
    })

    cy.get('#b').uncheck(['us', 'ca'])
  })
})
