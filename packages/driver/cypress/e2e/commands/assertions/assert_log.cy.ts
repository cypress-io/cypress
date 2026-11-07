describe('src/cy/commands/assertions', () => {
  beforeEach(function () {
    cy.visit('/fixtures/jquery.html')
  })

  context('#assert', () => {
    beforeEach(function () {
      this.logs = []

      cy.on('log:added', (attrs, log) => {
        this.logs?.push(log)

        if (attrs.name === 'assert') {
          this.lastLog = log
        }
      })

      return null
    })

    it('does not output should logs on failures', { defaultCommandTimeout: 50 }, function (done) {
      cy.on('fail', () => {
        const { length } = this.logs

        expect(length).to.eq(1)

        done()
      })

      cy.noop({}).should('have.property', 'foo')
    })

    it('snapshots immediately and sets child', (done) => {
      cy.on('log:added', (attrs, log) => {
        if (attrs.name !== 'assert') {
          return
        }

        cy.removeAllListeners('log:added')
        expect(log.get('snapshots').length).to.eq(1)
        expect(log.get('snapshots')[0]).to.be.an('object')
        expect(log.get('type')).to.eq('child')

        done()
      })

      cy.get('body').then((subject) => {
        expect(subject).to.match('body')
      })
    })

    it('sets type to child current command had arguments but does not match subject', (done) => {
      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'assert') {
          cy.removeAllListeners('log:added')
          expect(log.get('type')).to.eq('child')

          done()
        }
      })

      cy.get('body').then(($body) => {
        expect($body.length).to.eq(1)
      })
    })

    it('sets type to parent when assertion did not involve current subject and didnt have arguments', (done) => {
      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'assert') {
          cy.removeAllListeners('log:added')
          expect(log.get('type')).to.eq('parent')

          done()
        }
      })

      cy.get('body').then(() => {
        expect(true).to.be.true
      })
    })

    it('removes rest of line when passing assertion includes \', but\' for jQuery subjects', (done) => {
      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'assert') {
          cy.removeAllListeners('log:added')
          expect(log.get('message')).to.eq('expected **<a>** to have attribute **href** with the value **#**')

          done()
        }
      })

      cy.get('a:first').then(($a) => {
        expect($a).to.have.attr('href', '#')
      })
    })

    it('does not replaces instances of word \'but\' with \'and\' for failing assertion', (done) => {
      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'assert') {
          cy.removeAllListeners('log:added')

          expect(log.get('message')).to.eq('expected **<a>** to have attribute **href** with the value **asdf**, but the value was **#**')

          done()
        }
      })

      cy.get('a:first').then(($a) => {
        try {
          expect($a).to.have.attr('href', 'asdf')
        } catch (error) {} // eslint-disable-line no-empty
      })
    })

    it('does not replace \'button\' with \'andton\'', (done) => {
      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'assert') {
          cy.removeAllListeners('log:added')

          expect(log.get('message')).to.eq('expected **<button>** to be **visible**')

          done()
        }
      })

      cy.get('button:first').then(($button) => {
        expect($button).to.be.visible
      })
    })

    // https://github.com/cypress-io/cypress/issues/16570
    it('handles BigInt correctly', (done) => {
      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'assert') {
          cy.removeAllListeners('log:added')
          expect(log.get('message')).to.eq('expected **2n** to equal **2n**')

          done()
        }
      })

      expect(BigInt(2)).to.equal(BigInt(2))
    })

    it('handles non-HTMLElement(s) (e.g. Element)', () => {
      const xml = '<?xml version="1.0" encoding="UTF-8"?><foo><bar>Bar</bar></foo>'
      const parser = new DOMParser()
      const doc = parser.parseFromString(xml, 'application/xml')
      const foo = doc.getElementsByTagName('foo')[0]

      expect(foo).not.to.be.undefined
      expect(foo).to.be.instanceOf(Element)
      expect(foo).not.to.be.instanceOf(HTMLElement)
    })

    it('#consoleProps for regular objects', (done) => {
      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'assert') {
          cy.removeAllListeners('log:added')

          expect(log.invoke('consoleProps')).to.deep.eq({
            name: 'assert',
            type: 'command',
            props: {
              expected: 1,
              actual: 1,
              Message: 'expected 1 to equal 1',
            },
          })

          done()
        }
      })

      cy.then(() => {
        expect(1).to.eq(1)
      })
    })

    it('#consoleProps for DOM objects', (done) => {
      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'assert') {
          cy.removeAllListeners('log:added')

          expect(log.invoke('consoleProps')).to.deep.eq({
            name: 'assert',
            type: 'command',
            props: {
              subject: log.get('subject'),
              Message: 'expected <body> to have property length',
            },
          })

          done()
        }
      })

      cy
      .get('body').then(($body) => {
        expect($body).to.have.property('length')
      })
    })

    it('#consoleProps for errors', (done) => {
      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'assert') {
          cy.removeAllListeners('log:added')
          let err

          try {
            expect(log.invoke('consoleProps')).to.deep.contain({
              name: 'assert',
              type: 'command',
              error: log.get('error').stack,
              props: {
                expected: false,
                actual: true,
                Message: 'expected true to be false',
              },
            })
          } catch (e) {
            err = e
          }

          done(err)
        }
      })

      cy.then(() => {
        try {
          expect(true).to.be.false
        } catch (err) {} // eslint-disable-line no-empty
      })
    })

    describe('#patchAssert', () => {
      it('wraps \#{this} and \#{exp} in \#{b}', (done) => {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'assert') {
            cy.removeAllListeners('log:added')

            expect(log.get('message')).to.eq('expected **foo** to equal **foo**')

            done()
          }
        })

        cy.then(() => {
          expect('foo').to.eq('foo')
        })
      })

      it('doesnt mutate error message', () => {
        cy.then(() => {
          try {
            expect(true).to.eq(false)
          } catch (e) {
            expect(e.message).to.eq('expected true to equal false')
          }
        })
      })

      describe('jQuery elements', () => {
        it('sets _obj to selector', (done) => {
          cy.on('log:added', (attrs, log) => {
            if (attrs.name === 'assert') {
              cy.removeAllListeners('log:added')

              expect(log.get('message')).to.eq('expected **<body>** to exist in the DOM')

              done()
            }
          })

          cy.get('body').then(($body) => {
            expect($body).to.exist
          })
        })

        it('matches empty string attributes', (done) => {
          cy.on('log:added', (attrs, log) => {
            if (attrs.name === 'assert') {
              cy.removeAllListeners('log:added')

              expect(log.get('message')).to.eq('expected **<input>** to have attribute **value** with the value **\'\'**')

              done()
            }
          })

          cy.$$('body').prepend(Cypress.$('<input value=\'\' />'))

          cy.get('input').eq(0).then(($input) => {
            expect($input).to.have.attr('value', '')
          })
        })

        it('can chain off of chai-jquery assertions', () => {
          const $el = cy.$$('ul#list')

          // @ts-expect-error chai-jquery's typings declare `visible` as a method, but at runtime it's a chainable property
          expect($el).to.be.visible.and.have.id('list')
        })

        describe('without selector', () => {
          it('exists', (done) => {
            cy.on('log:added', (attrs, log) => {
              if (attrs.name === 'assert') {
                cy.removeAllListeners('log:added')

                expect(log.get('message')).to.eq('expected **<div>** to exist in the DOM')

                done()
              }
            })

            // prepend an empty div so it has no id or class
            cy.$$('body').prepend(Cypress.$('<div />'))

            // expect($div).to.match("div")
            cy.get('div').eq(0).then(($div) => {
              expect($div).to.exist
            })
          })

          it('uses element name', (done) => {
            cy.on('log:added', (attrs, log) => {
              if (attrs.name === 'assert') {
                cy.removeAllListeners('log:added')

                expect(log.get('message')).to.eq('expected **<input>** to match **input**')

                done()
              }
            })

            // prepend an empty div so it has no id or class
            cy.$$('body').prepend(Cypress.$('<input />'))

            cy.get('input').eq(0).then(($div) => {
              expect($div).to.match('input')
            })
          })
        })

        describe('property assertions', () => {
          it('has property', (done) => {
            cy.on('log:added', (attrs, log) => {
              if (attrs.name === 'assert') {
                cy.removeAllListeners('log:added')

                expect(log.get('message')).to.eq('expected **<button>** to have property **length**')

                done()
              }
            })

            cy.get('button:first').should('have.property', 'length')
          })

          it('passes on expected subjects without changing them', () => {
            cy.state('window').$.fn.foo = 'bar'

            cy
            .get('input:first').then(($input) => {
              expect($input).to.have.property('foo', 'bar')
            })
          })
        })
      })
    })
  })

  context('chai assert', () => {
    beforeEach(function () {
      this.logs = []

      cy.on('log:added', (attrs, log) => {
        this.logs?.push(log)
      })

      return null
    })

    it('equal', function () {
      assert.equal(1, 1, 'one is one')

      expect(this.logs[0].get('message')).to.eq('one is one: expected **1** to equal **1**')
    })

    it('isOk', function () {
      assert.isOk({}, 'is okay')

      expect(this.logs[0].get('message')).to.eq('is okay: expected **{}** to be truthy')
    })

    it('isFalse', function () {
      assert.isFalse(false, 'is false')

      expect(this.logs[0].get('message')).to.eq('is false: expected **false** to be false')
    })
  })

  describe('message formatting', () => {
    const expectMarkdown = (test, message, done) => {
      cy.then(() => {
        test()
      })

      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'assert') {
          cy.removeAllListeners('log:added')

          expect(log.get('message')).to.eq(message)

          done()
        }
      })
    }

    const getAssertionError = (test) => {
      try {
        test()
      } catch (err) {
        return err
      }

      throw new Error('expected the assertion to throw, but it did not')
    }

    // https://github.com/cypress-io/cypress/issues/19116
    it('text with backslashes', (done) => {
      const text = '"<OE_D]dQ\\'

      expectMarkdown(
        () => expect(text).to.equal(text),
        `expected **"<OE_D]dQ\\\\** to equal **"<OE_D]dQ\\\\**`,
        done,
      )
    })

    describe('messages with quotation marks', () => {
      it('preserves quotation marks in number strings', (done) => {
        expectMarkdown(() => {
          try {
            expect(25).to.eq('25')
          } catch (error) {} /* eslint-disable-line no-empty */
        },
        `expected **25** to equal **'25'**`,
        done)
      })

      it('preserves quotation marks in empty string', (done) => {
        expectMarkdown(() => {
          try {
            expect(42).to.eq('')
          } catch (error) {} /* eslint-disable-line no-empty */
        },
        `expected **42** to equal **''**`,
        done)
      })

      it('preserves quotation marks if escaped', (done) => {
        expectMarkdown(
          () => expect(`\'cypress\'`).to.eq(`\'cypress\'`),
          `expected **'cypress'** to equal **'cypress'**`,
          done,
        )
      })

      it('removes quotation marks in DOM elements', (done) => {
        expectMarkdown(
          () => {
            cy.get('body').then(($body) => {
              expect($body).to.contain('div')
            })
          },
          `expected **<body>** to contain **div**`,
          done,
        )
      })

      it('removes quotation marks in strings', (done) => {
        expectMarkdown(() => expect('cypress').to.eq('cypress'), `expected **cypress** to equal **cypress**`, done)
      })

      it('removes quotation marks in objects', (done) => {
        expectMarkdown(
          () => expect({ foo: 'bar' }).to.deep.eq({ foo: 'bar' }),
          `expected **{ foo: bar }** to deeply equal **{ foo: bar }**`,
          done,
        )
      })

      it('formats keys properly for "have.all.keys"', (done) => {
        const person = {
          name: 'Joe',
          age: 20,
        }

        expectMarkdown(
          () => expect(person).to.have.all.keys('name', 'age'),
          `expected **{ name: Joe, age: 20 }** to have keys **name**, and **age**`,
          done,
        )
      })
    })

    describe('formats strings with spaces', () => {
      const tester = (message, done) => {
        const nbspedMsg = message
        .replace(/^\s+/, (match) => {
          return match.replace(/\s/g, '&nbsp;')
        })
        .replace(/\s+$/, (match) => {
          return match.replace(/\s/g, '&nbsp;')
        })

        expectMarkdown(() => expect(message).to.eq(message), `expected **'${nbspedMsg}'** to equal **'${nbspedMsg}'**`, done)
      }

      [' 37:46 ', '   test      ', '  love'].forEach((v) => {
        it(v, (done) => {
          tester(v, done)
        })
      })
    })

    describe('escape markdown', () => {
      // https://github.com/cypress-io/cypress/issues/17357
      it('images', (done) => {
        const text = 'hello world ![JSDoc example](/slides/img/jsdoc.png)'
        const result = 'hello world ``![JSDoc example](/slides/img/jsdoc.png)``'

        expectMarkdown(
          () => expect(text).to.equal(text),
          `expected **${result}** to equal **${result}**`,
          done,
        )
      })
    })

    // Cypress renders and truncates values in assertion messages with its own
    // inspector rather than chai's built-in one. These render differently under
    // chai's inspector (e.g. `[Function foo]`, ISO-8601 dates, and
    // `{ name: 'Joe', …(1) }` instead of `{ Object (name, ...) }` once past the
    // truncateThreshold), so these assertions catch a regression that would
    // change failure messages.
    describe('uses Cypress value inspection', () => {
      it('renders a value whose getter throws something other than an Error', () => {
        const value = {
          get document () {
            throw 'nope'
          },
        }

        const err = getAssertionError(() => expect(value).to.equal(1))

        expect(err.message).to.eq('expected { document: [Getter] } to equal 1')
      })

      it('renders functions as [Function: name]', () => {
        const foo = function foo () {}
        const bar = function bar () {}

        const err = getAssertionError(() => expect(foo).to.equal(bar))

        expect(err.message).to.eq('expected [Function: foo] to equal [Function: bar]')
      })

      it('renders dates with toUTCString', () => {
        const err = getAssertionError(() => expect(new Date(0)).to.equal(new Date(1)))

        expect(err.message).to.eq('expected Thu, 01 Jan 1970 00:00:00 GMT to equal Thu, 01 Jan 1970 00:00:00 GMT')
      })

      it('truncates long objects past the truncateThreshold', () => {
        const err = getAssertionError(() => expect({ name: 'Joe', age: 20, email: 'joe@example.com' }).to.equal(null))

        expect(err.message).to.eq('expected { Object (name, age, ...) } to equal null')
      })

      it('truncates long arrays past the truncateThreshold', () => {
        const err = getAssertionError(() => expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]).to.equal(null))

        expect(err.message).to.eq('expected [ Array(15) ] to equal null')
      })
    })

    describe('template tags inside values', () => {
      it('keeps #{exp} in the subject literal in the error', () => {
        const err = getAssertionError(() => expect('#{exp}').to.equal('x'))

        expect(err.message).to.eq(`expected '#{exp}' to equal 'x'`)
      })

      it('keeps #{act} in the subject literal in the error', () => {
        const err = getAssertionError(() => expect('#{act}').to.equal('x'))

        expect(err.message).to.eq(`expected '#{act}' to equal 'x'`)
      })

      it('keeps #{exp} in the subject literal in the command log', (done) => {
        expectMarkdown(() => {
          try {
            expect('#{exp}').to.equal('x')
          } catch (error) {} /* eslint-disable-line no-empty */
        },
        `expected **#{exp}** to equal **x**`,
        done)
      })

      it('keeps #{this} in the expected value literal in the command log', (done) => {
        expectMarkdown(() => {
          try {
            expect('x').to.equal('#{this}')
          } catch (error) {} /* eslint-disable-line no-empty */
        },
        `expected **x** to equal **#{this}**`,
        done)
      })
    })

    describe('assertion errors', () => {
      it('throws a chai AssertionError with the operator and a diff', () => {
        const err = getAssertionError(() => expect({ a: 1 }).to.deep.equal({ a: 2 }))

        expect(err).to.be.an.instanceof(chai.AssertionError)
        expect(err.message).to.eq('expected { a: 1 } to deeply equal { a: 2 }')
        expect(err.operator).to.eq('deepStrictEqual')
        expect(err.showDiff).to.be.true
        expect(err.actual).to.eq('{ a: 1 }')
        expect(err.expected).to.eq('{ a: 2 }')
      })

      it('serializes diffed values with Cypress value inspection', () => {
        const foo = function foo () {}
        const bar = function bar () {}

        const err = getAssertionError(() => expect(foo).to.equal(bar))

        expect(err.actual).to.eq('[Function: foo]')
        expect(err.expected).to.eq('[Function: bar]')
      })

      it('omits the diff when the assertion has no expected value', () => {
        const err = getAssertionError(() => expect(0).to.be.ok)

        expect(err.message).to.eq('expected 0 to be truthy')
        expect(err).not.to.have.property('showDiff')
        expect(err).not.to.have.property('actual')
        expect(err).not.to.have.property('expected')
      })

      it('omits the diff and shortens DOM subjects', () => {
        const err = getAssertionError(() => expect(document.body).to.equal(document.createElement('span')))

        expect(err.message).to.eq(`expected '<body>' to equal <span></span>`)
        expect(err).not.to.have.property('showDiff')
      })

      it('prefixes the custom message', () => {
        const err = getAssertionError(() => expect(1, 'my message').to.equal(2))

        expect(err.message).to.eq('my message: expected 1 to equal 2')
      })

      it('throws a chai AssertionError from the assert interface', () => {
        const err = getAssertionError(() => assert.equal(1, 2))

        expect(err).to.be.an.instanceof(chai.AssertionError)
        expect(err.message).to.eq('expected 1 to equal 2')
        expect(err.operator).to.eq('strictEqual')
      })
    })

    it('formats messages that plugins build with chai.util.getMessage', () => {
      const assertion = expect(document.body)
      const message = chai.util.getMessage(assertion, [false, 'expected #{this} to be shiny', 'expected #{this} not to be shiny', undefined])

      expect(message).to.eq(`expected '<body>' to be shiny`)
    })

    // Some chai assertions write values into the message themselves, through
    // `chai.util`, rather than through #{this}, #{act} or #{exp}.
    describe('values chai writes into its own messages', () => {
      it('does not truncate a long string', () => {
        const search = 'a much longer search string that exceeds forty characters'
        const err = getAssertionError(() => expect('hello').to.include(search))

        expect(err.message).to.eq(`expected 'hello' to include '${search}'`)
      })

      it('renders a DOM element as HTML', () => {
        const err = getAssertionError(() => expect([]).to.include(document.createElement('div')))

        expect(err.message).to.eq('expected [] to include <div></div>')
      })

      it('renders functions as [Function: name]', () => {
        const isTwo = function isTwo (n) {
          return n === 2
        }
        const err = getAssertionError(() => expect(1).to.satisfy(isTwo))

        expect(err.message).to.eq('expected 1 to satisfy [Function: isTwo]')
      })

      it('renders objects without a type prefix', () => {
        const err = getAssertionError(() => expect({ a: 1 }).to.have.ownPropertyDescriptor('a', { value: 2 }))

        expect(err.message).to.eq(`expected the own property descriptor for 'a' on { a: 1 } to match { value: 2 }, got { value: 1, writable: true, enumerable: true, configurable: true }`)
      })
    })
  })
})
