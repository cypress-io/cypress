beforeEach(() => {
  cy.visit('/fixtures/command-log.html')
})

// it('test 2', () => {
//   cy.wrap('a').then({ timeout: 1 }, () => {
//     expect(1).to.eql(1)
//   })
// })

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
      expect(this.logs[0].get('message')).to.eq('app-')
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
      expect(this.logs[0].get('options')).to.deep.eq(null)
    })

    cy.contains('', /app-/)
  })

  it('invoke', () => {
    cy.on('fail', () => {
      expect(this.logs[0].get('options')).to.deep.eq({
        log: true,
      })
    })

    cy.wrap({}).invoke({ log: true }, 'non-exist')
  })

  it('nextUntil', () => {
    cy.on('log:added', () => {
      cy.removeAllListeners('log:added')
      expect(this.logs[0].get('options')).to.eq(null)
    })

    cy.get('div').nextUntil(cy.$$('.warning'))
  })

  it('parentsUntil', () => {
    cy.on('log:added', () => {
      cy.removeAllListeners('log:added')
      expect(this.logs[0].get('options')).to.eq(null)
    })

    cy.get('div').parentsUntil(cy.$$('.warning'))
  })

  it('prevsUntil', () => {
    cy.on('log:added', () => {
      cy.removeAllListeners('log:added')
      expect(this.logs[0].get('options')).to.eq(null)
    })

    cy.get('div').prevUntil(cy.$$('.warning'))
  })

  it('select', () => {
    cy.on('log:added', () => {
      cy.removeAllListeners('log:added')
      expect(this.logs[0].get('options')).to.eq(null)
    })

    cy.get('#auto-test').select(['Cypress', 'Jest'])
  })

  it('spread', () => {
    cy.on('fail', () => {
      expect(this.logs[0].get('options')).to.deep.eq({
        timeout: 1000,
      })
    })

    cy.wrap([1, 2, 3]).spread({ timeout: 1000 }, (a, b, c) => {
      throw new Error()
    })
  })

  it('task', () => {
    cy.on('log:added', () => {
      cy.removeAllListeners('log:added')
      expect(this.logs[0].get('options')).to.eq(null)
    })

    cy.task('throw', { a: 1, b: 2 })
  })

  it('then', () => {
    cy.on('fail', () => {
      expect(this.logs[0].get('options')).to.deep.eq({
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

  it('wait', () => {
    cy.request('POST', 'http://localhost:8080/users', { name: 'brian' })
  })
})
