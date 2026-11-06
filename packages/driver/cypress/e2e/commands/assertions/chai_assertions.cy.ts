describe('src/cypress/chai_assertions', () => {
  const getAssertionError = (test: () => void) => {
    try {
      test()
    } catch (err) {
      return err
    }

    throw new Error('expected the assertion to throw, but it did not')
  }

  const expectLogMessage = (test: () => void, message: string, done: Mocha.Done) => {
    cy.on('log:added', (attrs, log) => {
      if (attrs.name === 'assert') {
        cy.removeAllListeners('log:added')

        expect(log.get('message')).to.eq(message)

        done()
      }
    })

    test()
  }

  context('iterable', () => {
    it('passes for iterable values', () => {
      expect([1, 2]).to.be.iterable
      expect('foo').to.be.iterable
      expect(new Set([1])).to.be.iterable
      expect(new Map([['a', 1]])).to.be.iterable
      expect((function* () {})()).to.be.iterable
    })

    it('passes for a jQuery collection', () => {
      cy.visit('/fixtures/jquery.html')
      cy.get('div').should('be.iterable')
    })

    it('fails for values without an iterator', () => {
      expect(1).not.to.be.iterable
      expect(null).not.to.be.iterable
      expect(undefined).not.to.be.iterable
      expect({ length: 1, 0: 'a' }).not.to.be.iterable

      const err = getAssertionError(() => expect(1).to.be.iterable)

      expect(err).to.be.an.instanceof(chai.AssertionError)
      expect(err.message).to.eq('expected 1 to be an iterable')
    })

    it('fails when negated for an iterable value', () => {
      const err = getAssertionError(() => expect([1, 2]).not.to.be.iterable)

      expect(err.message).to.eq('expected [ 1, 2 ] to not be an iterable')
    })

    it('prefixes the custom message', () => {
      const err = getAssertionError(() => expect(1, 'my message').to.be.iterable)

      expect(err.message).to.eq('my message: expected 1 to be an iterable')
    })

    it('works with should', () => {
      cy.wrap([1, 2]).should('be.iterable')
      cy.wrap(1).should('not.be.iterable')
    })

    it('logs the assertion', (done) => {
      expectLogMessage(() => expect([1, 2]).to.be.iterable, 'expected **[ 1, 2 ]** to be an iterable', done)
    })
  })

  context('containSubset', () => {
    it('matches nested object properties', () => {
      expect({ a: 1, b: { c: 2, d: 3 } }).to.containSubset({ b: { c: 2 } })
      expect({ a: 1, b: { c: 2 } }).not.to.containSubset({ b: { c: 3 } })
      expect({ a: 1 }).not.to.containSubset({ b: 1 })
    })

    it('matches each array element against any element of the target, in any order', () => {
      expect([1, 2, 3]).to.containSubset([3, 1])
      expect([{ id: 1, name: 'a' }, { id: 2, name: 'b' }]).to.containSubset([{ id: 2 }])
      expect([{ id: 1 }]).not.to.containSubset([{ id: 2 }])
    })

    it('calls functions in the subset with the target value', () => {
      expect({ age: 25 }).to.containSubset({ age: (age) => age > 18 })
      expect({ age: 12 }).not.to.containSubset({ age: (age) => age > 18 })
    })

    it('compares dates by timestamp', () => {
      expect({ at: new Date(0) }).to.containSubset({ at: new Date(0) })
      expect({ at: new Date(0) }).not.to.containSubset({ at: new Date(1) })
      expect({ at: 0 }).not.to.containSubset({ at: new Date(0) })
    })

    it('compares primitives strictly', () => {
      expect({ a: 1 }).not.to.containSubset({ a: '1' })
      expect({ a: null }).to.containSubset({ a: null })
      expect({ a: 1 }).not.to.containSubset({ a: null })
      expect({ a: { b: 1 } }).not.to.containSubset({ a: null })
    })

    it('fails with the target, the subset and a diff', () => {
      const err = getAssertionError(() => expect({ a: 1, b: 2 }).to.containSubset({ a: 2 }))

      expect(err).to.be.an.instanceof(chai.AssertionError)
      expect(err.message).to.eq('expected { a: 1, b: 2 } to contain subset { a: 2 }')
      expect(err.showDiff).to.be.true
      expect(err.actual).to.eq('{ a: 1, b: 2 }')
      expect(err.expected).to.eq('{ a: 2 }')
    })

    it('fails when negated for a matching subset', () => {
      const err = getAssertionError(() => expect({ a: 1, b: 2 }).not.to.containSubset({ a: 1 }))

      expect(err.message).to.eq('expected { a: 1, b: 2 } to not contain subset { a: 1 }')
    })

    it('prefixes the custom message', () => {
      const err = getAssertionError(() => expect({ a: 1 }, 'my message').to.containSubset({ a: 2 }))

      expect(err.message).to.eq('my message: expected { a: 1 } to contain subset { a: 2 }')
    })

    it('works with should', () => {
      cy.wrap({ a: 1, b: { c: 2 } }).should('containSubset', { b: { c: 2 } })
      cy.wrap({ a: 1 }).should('not.containSubset', { a: 2 })
    })

    it('retries until the subject contains the subset', () => {
      const user = { name: 'Jane', status: 'pending' }

      setTimeout(() => {
        user.status = 'active'
      }, 100)

      cy.wrap(user).should('containSubset', { status: 'active' })
    })

    it('logs the assertion', (done) => {
      expectLogMessage(
        () => expect({ a: 1, b: 2 }).to.containSubset({ a: 1 }),
        'expected **{ a: 1, b: 2 }** to contain subset **{ a: 1 }**',
        done,
      )
    })
  })

  context('assert interface', () => {
    it('isIterable passes for iterable values and fails otherwise', () => {
      assert.isIterable([1, 2])

      const err = getAssertionError(() => assert.isIterable(1, 'my message'))

      expect(err).to.be.an.instanceof(chai.AssertionError)
      expect(err.message).to.eq('my message: expected 1 to be an iterable')
    })

    it('isIterable logs the assertion', (done) => {
      expectLogMessage(() => assert.isIterable([1, 2]), 'expected **[ 1, 2 ]** to be an iterable', done)
    })

    it('containsSubset and its containSubset alias match a subset', () => {
      assert.containsSubset({ a: 1, b: 2 }, { a: 1 })
      assert.containSubset({ a: 1, b: 2 }, { a: 1 })

      const err = getAssertionError(() => assert.containsSubset({ a: 1 }, { a: 2 }, 'my message'))

      expect(err.message).to.eq('my message: expected { a: 1 } to contain subset { a: 2 }')
    })

    it('doesNotContainSubset fails for a matching subset', () => {
      assert.doesNotContainSubset({ a: 1 }, { a: 2 })

      const err = getAssertionError(() => assert.doesNotContainSubset({ a: 1, b: 2 }, { a: 1 }))

      expect(err.message).to.eq('expected { a: 1, b: 2 } to not contain subset { a: 1 }')
    })
  })
})
